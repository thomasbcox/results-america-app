// Admin Authentication Service - Implements password-based authentication for admins
// Provides secure admin login and password reset functionality

import { db } from '../db';
import { users, sessions, passwordResetTokens } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { 
  IAdminAuthService, 
  User, 
  Session 
} from '../types/service-interfaces';
import { 
  createError, 
  ServiceError,
  UserNotFoundError,
  InvalidCredentialsError,
  AuthorizationError,
  InvalidResetTokenError,
  WeakPasswordError
} from '../errors';

export class AdminAuthService implements IAdminAuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly RESET_TOKEN_DURATION = 60 * 60 * 1000; // 1 hour
  private static readonly TOKEN_LENGTH = 32; // 32 bytes = 64 hex characters

  /**
   * Login admin user with email and password
   */
  static async loginAdmin(email: string, password: string): Promise<{ user: User; session: Session }> {
    if (!email || !password) {
      throw createError.validation('Email and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get user by email
    const user = await this.getUserByEmail(normalizedEmail);
    if (!user) {
      throw createError.invalidCredentials('Invalid email or password');
    }

    // Verify admin role
    if (user.role !== 'admin') {
      throw createError.authorization('Admin access required');
    }

    // Check if user is active
    if (!user.isActive) {
      throw createError.authorization('Admin account is deactivated');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw createError.invalidCredentials('Invalid email or password');
    }

    // Create session
    const session = await this.createSession(user.id);

    // Update last login
    await this.updateUserLastLogin(user.id);

    return { user, session };
  }

  /**
   * Reset admin password via email
   */
  static async resetAdminPassword(email: string): Promise<string> {
    if (!email) {
      throw createError.validation('Email is required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get user by email
    const user = await this.getUserByEmail(normalizedEmail);
    if (!user) {
      // Don't reveal if user exists for security
      return 'If an admin account with that email exists, a password reset link has been sent.';
    }

    // Verify admin role
    if (user.role !== 'admin') {
      // Don't reveal if user exists for security
      return 'If an admin account with that email exists, a password reset link has been sent.';
    }

    // Check if user is active
    if (!user.isActive) {
      // Don't reveal if user exists for security
      return 'If an admin account with that email exists, a password reset link has been sent.';
    }

    // Generate secure reset token
    const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
    
    // Set expiration time
    const expiresAt = new Date(Date.now() + this.RESET_TOKEN_DURATION);

    // Store reset token
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
      used: false,
    });

    // Generate reset URL
    const resetUrl = this.generatePasswordResetUrl(token);

    // Send reset email
    await this.sendPasswordResetEmail(normalizedEmail, resetUrl, user.name);

    return 'If an admin account with that email exists, a password reset link has been sent.';
  }

  /**
   * Validate admin session
   */
  static async validateAdminSession(token: string): Promise<User | null> {
    if (!token) {
      return null;
    }

    // Find session
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (!session) {
      return null;
    }

    // Check if session expired
    if (new Date() > session.expiresAt) {
      // Clean up expired session
      await this.deleteSession(token);
      return null;
    }

    // Get user
    const user = await this.getUserById(session.userId);
    if (!user) {
      return null;
    }

    // Verify admin role
    if (user.role !== 'admin') {
      return null;
    }

    // Check if user is active
    if (!user.isActive) {
      return null;
    }

    return user;
  }

  /**
   * Reset password with token
   */
  static async resetPasswordWithToken(token: string, newPassword: string): Promise<string> {
    if (!token || !newPassword) {
      throw createError.validation('Token and new password are required');
    }

    // Validate password strength
    if (newPassword.length < 8) {
      throw createError.weakPassword('Password must be at least 8 characters long');
    }

    // Find reset token
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!resetToken) {
      throw createError.invalidResetToken('Invalid or expired reset token');
    }

    // Get user
    const user = await this.getUserById(resetToken.userId);
    if (!user) {
      throw createError.userNotFound('User not found');
    }

    // Verify admin role
    if (user.role !== 'admin') {
      throw createError.authorization('Admin access required');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update user password
    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Mark reset token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return 'Password reset successfully';
  }

  /**
   * Logout admin user
   */
  static async logoutAdmin(sessionToken: string): Promise<boolean> {
    if (!sessionToken) {
      return false;
    }

    return await this.deleteSession(sessionToken);
  }

  /**
   * Get user by email
   */
  private static async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'user' | 'viewer',
      isActive: Boolean(user.isActive),
      emailVerified: Boolean(user.emailVerified),
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      passwordHash: user.passwordHash, // Include for password verification
    };
  }

  /**
   * Get user by ID
   */
  private static async getUserById(id: number): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'user' | 'viewer',
      isActive: Boolean(user.isActive),
      emailVerified: Boolean(user.emailVerified),
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Verify password against hash
   */
  private static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Create session for user
   */
  private static async createSession(userId: number): Promise<Session> {
    const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

    const [session] = await db.insert(sessions).values({
      userId,
      token,
      expiresAt,
    }).returning();

    return {
      id: session.id,
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    };
  }

  /**
   * Delete session
   */
  private static async deleteSession(token: string): Promise<boolean> {
    const result = await db
      .delete(sessions)
      .where(eq(sessions.token, token));

    return (result.changes || 0) > 0;
  }

  /**
   * Update user's last login time
   */
  private static async updateUserLastLogin(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  /**
   * Generate password reset URL
   */
  private static generatePasswordResetUrl(token: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3050';
    return `${baseUrl}/admin/reset-password?token=${token}`;
  }

  /**
   * Send password reset email
   */
  private static async sendPasswordResetEmail(email: string, resetUrl: string, userName: string): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        // In development, log the reset link
        console.log('🔐 Admin Password Reset Link:');
        console.log(`Email: ${email}`);
        console.log(`Name: ${userName}`);
        console.log(`Reset Link: ${resetUrl}`);
        console.log('---');
        return;
      }

      // In production, send via email service
      // TODO: Implement email service integration
      // await EmailService.sendPasswordReset(email, resetUrl, userName);
      
      console.log(`Password reset link sent to admin ${email}`);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw createError.emailService('Failed to send password reset email');
    }
  }

  /**
   * Validate reset token without consuming it
   */
  static async validateResetToken(token: string): Promise<boolean> {
    try {
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, token),
            eq(passwordResetTokens.used, false),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!resetToken) return false;

      // Verify it's for an admin user
      const user = await this.getUserById(resetToken.userId);
      return user?.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()));

    return result.changes || 0;
  }

  /**
   * Clean up expired reset tokens
   */
  static async cleanupExpiredResetTokens(): Promise<number> {
    const result = await db
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, new Date()));

    return result.changes || 0;
  }
} 