import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { DRIZZLE } from '../../database/database.module';
import { DrizzleDB } from '../../database/drizzle';
import { users, refreshTokens, User } from '../../database/schema';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { COOKIE_CONFIG } from '../../common/constants/cookie.config';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { name, email, password } = signupDto;

    // Check if user already exists
    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const [user] = await this.db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'USER',
      })
      .returning();

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async login(loginDto: LoginDto, req: Request, res: Response) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store refresh token in database
    await this.storeRefreshToken(
      tokens.refreshToken,
      user.id,
      req.headers['user-agent'] || 'unknown',
      req.ip || 'unknown',
    );

    // Set cookies
    this.setTokenCookies(res, tokens);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: tokens.accessToken,
    };
  }

  async logout(userId: string, refreshToken: string, res: Response) {
    // Revoke the refresh token
    await this.db
      .update(refreshTokens)
      .set({ isRevoked: true, updatedAt: new Date() })
      .where(and(eq(refreshTokens.token, refreshToken), eq(refreshTokens.userId, userId)));

    // Clear cookies
    this.clearTokenCookies(res);

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string, res: Response) {
    // Revoke all refresh tokens for this user
    await this.db
      .update(refreshTokens)
      .set({ isRevoked: true, updatedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.isRevoked, false)));

    // Clear cookies
    this.clearTokenCookies(res);

    return { message: 'Logged out from all devices successfully' };
  }

  async refreshTokens(refreshToken: string, req: Request, res: Response) {
    // Find the refresh token
    const tokenRecord = await this.db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.token, refreshToken),
        eq(refreshTokens.isRevoked, false),
      ),
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      await this.db
        .update(refreshTokens)
        .set({ isRevoked: true, updatedAt: new Date() })
        .where(eq(refreshTokens.id, tokenRecord.id));
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Find the user
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, tokenRecord.userId),
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke old refresh token (token rotation)
    await this.db
      .update(refreshTokens)
      .set({ isRevoked: true, updatedAt: new Date() })
      .where(eq(refreshTokens.id, tokenRecord.id));

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Store new refresh token
    await this.storeRefreshToken(
      tokens.refreshToken,
      user.id,
      req.headers['user-agent'] || 'unknown',
      req.ip || 'unknown',
    );

    // Set new cookies
    this.setTokenCookies(res, tokens);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: tokens.accessToken,
    };
  }

  async getActiveSessions(userId: string) {
    const tokens = await this.db.query.refreshTokens.findMany({
      where: and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.isRevoked, false),
      ),
      orderBy: (refreshTokens, { desc }) => [desc(refreshTokens.createdAt)],
    });

    return tokens
      .filter((token) => new Date() < token.expiresAt)
      .map((token) => ({
        id: token.id,
        userAgent: token.userAgent,
        ipAddress: token.ipAddress,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
      }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const result = await this.db
      .update(refreshTokens)
      .set({ isRevoked: true, updatedAt: new Date() })
      .where(and(eq(refreshTokens.id, sessionId), eq(refreshTokens.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new UnauthorizedException('Session not found');
    }

    return { message: 'Session revoked successfully' };
  }

  // Private helper methods

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    token: string,
    userId: string,
    userAgent: string,
    ipAddress: string,
  ) {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d';
    const expiresAt = this.calculateExpiry(expiresIn);

    await this.db.insert(refreshTokens).values({
      token,
      userId,
      userAgent,
      ipAddress,
      expiresAt,
    });
  }

  private calculateExpiry(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }

  private setTokenCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    res.cookie('access_token', tokens.accessToken, COOKIE_CONFIG.ACCESS_TOKEN);
    res.cookie('refresh_token', tokens.refreshToken, COOKIE_CONFIG.REFRESH_TOKEN);
  }

  private clearTokenCookies(res: Response) {
    res.clearCookie('access_token', COOKIE_CONFIG.ACCESS_TOKEN);
    res.clearCookie('refresh_token', COOKIE_CONFIG.REFRESH_TOKEN);
  }
}
