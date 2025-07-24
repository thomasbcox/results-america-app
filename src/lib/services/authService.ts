import { db } from '../db/index';
import { users, sessions, passwordResetTokens, userActivityLogs } from '../db/schema';
import { eq, and, lt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'user' | 'viewer';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface Session {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly RESET_TOKEN_DURATION = 60 * 60 * 1000; // 1 hour

  // User Management
  static async createUser(data: CreateUserData): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);
    
    const [user] = await db.insert(users).values({
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash,
      role: data.role || 'user',
    }).returning();

    await this.logActivity(user.id, 'user_created', `User ${data.email} created`);

    return user;
  }

  static async getUserById(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return user || null;
  }

  static async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'passwordHash'>>): Promise<User | null> {
    const [user] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (user) {
      await this.logActivity(id, 'user_updated', `User ${user.email} updated`);
    }
    
    return user || null;
  }

  static async deleteUser(id: number): Promise<boolean> {
    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, id)).limit(1);
    
    if (!user) return false;

    await db.delete(users).where(eq(users.id, id));
    await this.logActivity(id, 'user_deleted', `User ${user.email} deleted`);
    
    return true;
  }

  static async listUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  static async changePassword(userId: number, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    
    const [user] = await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    if (user) {
      await this.logActivity(userId, 'password_changed', 'Password changed');
    }
    
    return !!user;
  }

  // Authentication
  static async login(data: LoginData): Promise<{ user: User; session: Session } | null> {
    const user = await this.getUserByEmail(data.email);
    
    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      await this.logActivity(user.id, 'login_failed', 'Invalid password');
      return null;
    }

    // Update last login
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Create session
    const session = await this.createSession(user.id);
    
    await this.logActivity(user.id, 'login_success', 'User logged in successfully');
    
    return { user, session };
  }

  static async logout(sessionToken: string): Promise<boolean> {
    const [session] = await db.select({ userId: sessions.userId }).from(sessions).where(eq(sessions.token, sessionToken)).limit(1);
    
    if (session) {
      await db.delete(sessions).where(eq(sessions.token, sessionToken));
      await this.logActivity(session.userId, 'logout', 'User logged out');
      return true;
    }
    
    return false;
  }

  static async validateSession(token: string): Promise<User | null> {
    const [session] = await db.select({
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
    }).from(sessions).where(eq(sessions.token, token)).limit(1);

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return await this.getUserById(session.userId);
  }

  private static async createSession(userId: number): Promise<Session> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

    const [session] = await db.insert(sessions).values({
      userId,
      token,
      expiresAt,
    }).returning();

    return session;
  }

  // Password Reset
  static async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.RESET_TOKEN_DURATION);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    await this.logActivity(user.id, 'password_reset_requested', 'Password reset requested');
    
    return token;
  }

  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const [resetToken] = await db.select({
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
      used: passwordResetTokens.used,
    }).from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return false;
    }

    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    
    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetToken.userId));

    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));

    await this.logActivity(resetToken.userId, 'password_reset_completed', 'Password reset completed');
    
    return true;
  }

  // Admin Functions
  static async bootstrapAdminUser(email: string, name: string, password: string): Promise<User> {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    
    if (existingAdmin.length > 0) {
      throw new Error('Admin user already exists');
    }

    return await this.createUser({
      email,
      name,
      password,
      role: 'admin',
    });
  }

  static async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'admin')).orderBy(users.createdAt);
  }

  static async deactivateUser(userId: number): Promise<boolean> {
    const [user] = await db.update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    if (user) {
      await this.logActivity(userId, 'user_deactivated', `User ${user.email} deactivated`);
    }
    
    return !!user;
  }

  static async activateUser(userId: number): Promise<boolean> {
    const [user] = await db.update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    if (user) {
      await this.logActivity(userId, 'user_activated', `User ${user.email} activated`);
    }
    
    return !!user;
  }

  // Session Management
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    return result.changes || 0;
  }

  static async cleanupExpiredResetTokens(): Promise<number> {
    const result = await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, new Date()));
    return result.changes || 0;
  }

  // Activity Logging
  static async logActivity(userId: number | null, action: string, details?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await db.insert(userActivityLogs).values({
      userId,
      action,
      details,
      ipAddress,
      userAgent,
    });
  }

  static async getActivityLogs(limit: number = 100): Promise<any[]> {
    return await db.select({
      id: userActivityLogs.id,
      userId: userActivityLogs.userId,
      action: userActivityLogs.action,
      details: userActivityLogs.details,
      ipAddress: userActivityLogs.ipAddress,
      userAgent: userActivityLogs.userAgent,
      createdAt: userActivityLogs.createdAt,
      userEmail: users.email,
      userName: users.name,
    })
    .from(userActivityLogs)
    .leftJoin(users, eq(userActivityLogs.userId, users.id))
    .orderBy(userActivityLogs.createdAt)
    .limit(limit);
  }

  // Utility Functions
  static async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    recentLogins: number;
  }> {
    const [totalUsers] = await db.select({ count: users.id }).from(users);
    const [activeUsers] = await db.select({ count: users.id }).from(users).where(eq(users.isActive, true));
    const [adminUsers] = await db.select({ count: users.id }).from(users).where(eq(users.role, 'admin'));
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [recentLogins] = await db.select({ count: users.id }).from(users).where(and(eq(users.isActive, true), users.lastLoginAt > oneWeekAgo));

    return {
      totalUsers: totalUsers?.count || 0,
      activeUsers: activeUsers?.count || 0,
      adminUsers: adminUsers?.count || 0,
      recentLogins: recentLogins?.count || 0,
    };
  }
} 