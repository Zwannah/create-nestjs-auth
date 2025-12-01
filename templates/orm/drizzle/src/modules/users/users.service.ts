import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, ne, and, desc, count } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE } from '../../database/database.module';
import { DrizzleDB } from '../../database/drizzle';
import { users, refreshTokens, Role } from '../../database/schema';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async findById(id: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findAll(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const [userList, totalResult] = await Promise.all([
      this.db.query.users.findMany({
        offset,
        limit,
        orderBy: [desc(users.createdAt)],
      }),
      this.db.select({ count: count() }).from(users),
    ]);

    const total = totalResult[0].count;

    return {
      data: userList.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProfile(userId: string) {
    return this.findById(userId);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.db.query.users.findFirst({
        where: and(
          eq(users.email, updateProfileDto.email.toLowerCase()),
          ne(users.id, userId),
        ),
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    // Hash new password if provided
    let hashedPassword: string | undefined;
    if (updateProfileDto.password) {
      hashedPassword = await bcrypt.hash(updateProfileDto.password, SALT_ROUNDS);
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (updateProfileDto.name) updateData.name = updateProfileDto.name;
    if (updateProfileDto.email) updateData.email = updateProfileDto.email.toLowerCase();
    if (hashedPassword) updateData.password = hashedPassword;

    const [updatedUser] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async updateUser(
    adminId: string,
    userId: string,
    updateUserDto: UpdateUserDto,
  ) {
    // Check if user exists
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admin from demoting themselves
    if (userId === adminId && updateUserDto.role && updateUserDto.role !== 'ADMIN') {
      throw new ForbiddenException('Cannot change your own role');
    }

    // Check if email is being changed and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.db.query.users.findFirst({
        where: and(
          eq(users.email, updateUserDto.email.toLowerCase()),
          ne(users.id, userId),
        ),
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    // Hash new password if provided
    let hashedPassword: string | undefined;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, SALT_ROUNDS);
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (updateUserDto.name) updateData.name = updateUserDto.name;
    if (updateUserDto.email) updateData.email = updateUserDto.email.toLowerCase();
    if (updateUserDto.role) updateData.role = updateUserDto.role as Role;
    if (hashedPassword) updateData.password = hashedPassword;

    const [updatedUser] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async deleteUser(adminId: string, userId: string) {
    // Prevent admin from deleting themselves
    if (userId === adminId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete user's refresh tokens first
    await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

    // Delete user
    await this.db.delete(users).where(eq(users.id, userId));

    return { message: 'User deleted successfully' };
  }
}
