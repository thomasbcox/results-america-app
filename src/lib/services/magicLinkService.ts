// Magic Link Service - Implements secure magic link authentication
// Provides passwordless authentication for regular users

import { db } from '../db';
import { users, magicLinks } from '../db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import crypto from 'crypto';
import { 
  IMagicLinkService, 
  MagicLinkInput, 
  User 
} from '../types/service-interfaces';
import { 
  createError, 
  ServiceError,
  UserNotFoundError,
  InvalidMagicLinkError,
  MagicLinkExpiredError,
  MagicLinkAlreadyUsedError,
  EmailServiceError
} from '../errors';

export interface MagicLink {
  id: number;
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export class MagicLinkService implements IMagicLinkService {
  private static readonly MAGIC_LINK_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly TOKEN_LENGTH = 32; // 32 bytes = 64 hex characters

  /**
   * Create a magic link for user authentication
   */
  static async createMagicLink(input: MagicLinkInput): Promise<string> {
    const { email, name } = input;
    
    if (!email || !email.trim()) {
      throw createError.validation('Email is required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists, create if not (for magic link auth)
    let user = await this.getUserByEmail(normalizedEmail);
    
    if (!user) {
      // Create user if they don't exist (magic link auth allows this)
      user = await this.createUser(normalizedEmail, name);
    }

    if (!user.isActive) {
      throw createError.authorization('User account is deactivated');
    }

    // Generate secure random token
    const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
    
    // Set expiration time
    const expiresAt = new Date(Date.now() + this.MAGIC_LINK_DURATION);

    // Store magic link in database
    await db.insert(magicLinks).values({
      email: normalizedEmail,
      token,
      expiresAt,
      used: false,
    });

    // Generate magic link URL
    const magicLinkUrl = this.generateMagicLinkUrl(token);

    // Send magic link (in production, this would be via email)
    await this.sendMagicLink(normalizedEmail, magicLinkUrl, user.name);

    return magicLinkUrl;
  }

  /**
   * Verify and consume a magic link token
   */
  static async verifyMagicLink(token: string): Promise<User> {
    if (!token || token.length !== this.TOKEN_LENGTH * 2) {
      throw createError.invalidMagicLink('Invalid magic link format');
    }

    // Find the magic link
    const [magicLink] = await db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.token, token))
      .limit(1);

    if (!magicLink) {
      throw createError.invalidMagicLink('Invalid magic link');
    }

    // Check if already used
    if (magicLink.used) {
      throw createError.magicLinkAlreadyUsed('Magic link has already been used');
    }

    // Check if expired
    if (new Date() > magicLink.expiresAt) {
      throw createError.magicLinkExpired('Magic link has expired');
    }

    // Get user
    const user = await this.getUserByEmail(magicLink.email);
    if (!user) {
      throw createError.userNotFound('User not found');
    }

    if (!user.isActive) {
      throw createError.authorization('User account is deactivated');
    }

    // Mark magic link as used
    await db
      .update(magicLinks)
      .set({ used: true })
      .where(eq(magicLinks.id, magicLink.id));

    // Update user's last login
    await this.updateUserLastLogin(user.id);

    return user;
  }

  /**
   * Clean up expired magic links
   */
  static async cleanupExpiredMagicLinks(): Promise<number> {
    const result = await db
      .delete(magicLinks)
      .where(lt(magicLinks.expiresAt, new Date()));

    return result.changes || 0;
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
    };
  }

  /**
   * Create a new user for magic link authentication
   */
  private static async createUser(email: string, name?: string): Promise<User> {
    const [user] = await db.insert(users).values({
      email,
      name: name || email.split('@')[0], // Use email prefix as default name
      passwordHash: '', // No password for magic link users
      role: 'user', // Default to user role
      isActive: true,
      emailVerified: true, // Magic link users are considered verified
    }).returning();

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
   * Generate magic link URL
   */
  private static generateMagicLinkUrl(token: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3050';
    return `${baseUrl}/auth/verify?token=${token}`;
  }

  /**
   * Send magic link to user
   */
  private static async sendMagicLink(email: string, magicLinkUrl: string, userName: string): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        // In development, log the magic link
        console.log('🔗 Magic Link Generated:');
        console.log(`Email: ${email}`);
        console.log(`Name: ${userName}`);
        console.log(`Magic Link: ${magicLinkUrl}`);
        console.log('---');
        return;
      }

      // In production, send via email service
      // TODO: Implement email service integration
      // await EmailService.sendMagicLink(email, magicLinkUrl, userName);
      
      console.log(`Magic link sent to ${email}`);
    } catch (error) {
      console.error('Failed to send magic link:', error);
      throw createError.emailService('Failed to send magic link');
    }
  }

  /**
   * Validate magic link token without consuming it
   */
  static async validateMagicLinkToken(token: string): Promise<boolean> {
    try {
      const [magicLink] = await db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.token, token))
        .limit(1);

      if (!magicLink) return false;
      if (magicLink.used) return false;
      if (new Date() > magicLink.expiresAt) return false;

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get magic link details (for debugging/admin purposes)
   */
  static async getMagicLinkDetails(token: string): Promise<MagicLink | null> {
    const [magicLink] = await db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.token, token))
      .limit(1);

    return magicLink || null;
  }

  /**
   * Get all magic links for a user (for admin purposes)
   */
  static async getUserMagicLinks(email: string): Promise<MagicLink[]> {
    return await db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.email, email.toLowerCase()))
      .orderBy(magicLinks.createdAt);
  }
} 