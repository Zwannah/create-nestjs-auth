import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { User, UserDocument, Role } from '../../schemas/user.schema';
import { RefreshToken, RefreshTokenDocument } from '../../schemas/refresh-token.schema';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { COOKIE_CONFIG } from '../../common/constants/cookie.config';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { name, email, password } = signupDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.userModel.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: Role.USER,
    });

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async login(loginDto: LoginDto, req: Request, res: Response) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
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
      user._id.toString(),
      req.headers['user-agent'] || 'unknown',
      req.ip || 'unknown',
    );

    // Set cookies
    this.setTokenCookies(res, tokens);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: tokens.accessToken,
    };
  }

  async logout(userId: string, refreshToken: string, res: Response) {
    // Revoke the refresh token
    await this.refreshTokenModel.updateOne(
      { token: refreshToken, userId },
      { isRevoked: true },
    );

    // Clear cookies
    this.clearTokenCookies(res);

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string, res: Response) {
    // Revoke all refresh tokens for this user
    await this.refreshTokenModel.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    // Clear cookies
    this.clearTokenCookies(res);

    return { message: 'Logged out from all devices successfully' };
  }

  async refreshTokens(refreshToken: string, req: Request, res: Response) {
    // Find the refresh token
    const tokenRecord = await this.refreshTokenModel.findOne({
      token: refreshToken,
      isRevoked: false,
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      await this.refreshTokenModel.updateOne(
        { _id: tokenRecord._id },
        { isRevoked: true },
      );
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Find the user
    const user = await this.userModel.findById(tokenRecord.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke old refresh token (token rotation)
    await this.refreshTokenModel.updateOne(
      { _id: tokenRecord._id },
      { isRevoked: true },
    );

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Store new refresh token
    await this.storeRefreshToken(
      tokens.refreshToken,
      user._id.toString(),
      req.headers['user-agent'] || 'unknown',
      req.ip || 'unknown',
    );

    // Set new cookies
    this.setTokenCookies(res, tokens);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: tokens.accessToken,
    };
  }

  async getActiveSessions(userId: string) {
    const tokens = await this.refreshTokenModel.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    return tokens.map((token) => ({
      id: token._id.toString(),
      userAgent: token.userAgent,
      ipAddress: token.ipAddress,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const result = await this.refreshTokenModel.updateOne(
      { _id: sessionId, userId },
      { isRevoked: true },
    );

    if (result.modifiedCount === 0) {
      throw new UnauthorizedException('Session not found');
    }

    return { message: 'Session revoked successfully' };
  }

  // Private helper methods

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
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

    await this.refreshTokenModel.create({
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
