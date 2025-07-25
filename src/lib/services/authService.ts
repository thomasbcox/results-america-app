import { db } from '../db/index';
import { users, sessions, passwordResetTokens, userActivityLogs } from '../db/schema';
import { eq, and, lt, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { 
  IAuthService, 
  User, 
  Session, 
  ActivityLog,
  UserStats,
  CreateUserInput, 
  UpdateUserInput, 
  LoginInput 
} from '../types/service-interfaces';

export class AuthService implements IAuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly RESET_TOKEN_DURATION = 60 * 60 * 1000; // 1 hour

  // User Management
  static async createUser(input: CreateUserInput): Promise<User> {
    const passwordHash = await bcrypt.hash(input.password, this.SALT_ROUNDS);
    
    const [user] = await db.insert(users).values({
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
      role: input.role || 'user',
    }).returning();

    await this.logActivity(user.id, 'user_created', `User ${input.email} created`);

    // Convert null to undefined for lastLoginAt
    return {
      ...user,
      lastLoginAt: user.lastLoginAt || undefined
    };
  }

  static async getUserById(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) return null;
    
    // Convert null to undefined for lastLoginAt
    return {
      ...user,
      lastLoginAt: user.lastLoginAt || undefined
    };
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) return null;
    
    // Convert null to undefined for lastLoginAt
    return {
      ...user,
      lastLoginAt: user.lastLoginAt || undefined
    };
  }

  static async updateUser(id: number, input: UpdateUserInput): Promise<User | null> {
    const [user] = await db.update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (user) {
      await this.logActivity(id, 'user_updated', `User ${user.email} updated`);
      // Convert null to undefined for lastLoginAt
      return {
        ...user,
        lastLoginAt: user.lastLoginAt || undefined
      };
    }
    
    return null;
  }

  static async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    if (result.length > 0) {
      await this.logActivity(null, 'user_deleted', `User ${id} deleted`);
      return true;
    }
    return false;
  }

  static async listUsers(): Promise<User[]> {
    const usersList = await db.select().from(users).orderBy(users.createdAt);
    return usersList.map(user => ({
      ...user,
      lastLoginAt: user.lastLoginAt || undefined
    }));
  }

  static async changePassword(userId: number, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    
    const result = await db.update(users)
      .set({ 
        passwordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (result.length > 0) {
      await this.logActivity(userId, 'password_changed', 'Password changed');
      return true;
    }
    
    return false;
  }

  // Authentication
  static async login(input: LoginInput): Promise<{ user: User; session: Session } | null> {
    const user = await this.getUserByEmail(input.email);
    if (!user || !user.isActive) {
      return null;
    }

    const [userWithPassword] = await db.select().from(users).where(eq(users.email, input.email.toLowerCase())).limit(1);
    if (!userWithPassword) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(input.password, userWithPassword.passwordHash);
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
    
    await this.logActivity(user.id, 'login_successful', 'User logged in successfully');

    return { user, session };
  }

  static async logout(sessionToken: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.token, sessionToken)).returning();
    return result.length > 0;
  }

  static async validateSession(token: string): Promise<User | null> {
    const [session] = await db.select()
      .from(sessions)
      .where(and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date())
      ))
      .limit(1);

    if (!session) {
      return null;
    }

    return this.getUserById(session.userId);
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

  // Password Management
  static async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return null;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.RESET_TOKEN_DURATION);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    return token;
  }

  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const [resetToken] = await db.select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, new Date())
      ))
      .limit(1);

    if (!resetToken) {
      return false;
    }

    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await db.update(users)
      .set({ 
        passwordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, resetToken.userId));

    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id));

    await this.logActivity(resetToken.userId, 'password_reset', 'Password reset via token');

    return true;
  }

  // Admin Functions
  static async bootstrapAdminUser(email: string, name: string, password: string): Promise<User> {
    // Check if any admin users exist
    const adminUsers = await this.getAdminUsers();
    if (adminUsers.length > 0) {
      throw new Error('Admin user already exists');
    }

    return this.createUser({
      email,
      name,
      password,
      role: 'admin'
    });
  }

  static async getAdminUsers(): Promise<User[]> {
    const adminUsers = await db.select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .orderBy(users.createdAt);

    return adminUsers.map(user => ({
      ...user,
      lastLoginAt: user.lastLoginAt || undefined
    }));
  }

  static async activateUser(userId: number): Promise<boolean> {
    const result = await db.update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (result.length > 0) {
      await this.logActivity(userId, 'user_activated', 'User account activated');
      return true;
    }
    
    return false;
  }

  static async deactivateUser(userId: number): Promise<boolean> {
    const result = await db.update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (result.length > 0) {
      await this.logActivity(userId, 'user_deactivated', 'User account deactivated');
      return true;
    }
    
    return false;
  }

  // Maintenance
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await db.delete(sessions)
      .where(lt(sessions.expiresAt, new Date()));
    
    return result.changes || 0;
  }

  static async cleanupExpiredResetTokens(): Promise<number> {
    const result = await db.delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, new Date()));
    
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

  static async getActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
    const logs = await db.select({
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

    return logs.map(log => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      userEmail: log.userEmail,
      userName: log.userName,
    }));
  }

  static async getUserStats(): Promise<UserStats> {
    const [totalUsers, activeUsers, adminUsers, recentLogins] = await Promise.all([
      db.select().from(users).then(r => r.length),
      db.select().from(users).where(eq(users.isActive, true)).then(r => r.length),
      db.select().from(users).where(eq(users.role, 'admin')).then(r => r.length),
      db.select().from(users).where(gt(users.lastLoginAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))).then(r => r.length),
    ]);

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      recentLogins,
    };
  }
} 