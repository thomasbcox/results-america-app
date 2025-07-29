import { getDb } from '../db';
import { users, sessions, magicLinks } from '../db/schema-postgres';
import { eq, and, lt, gt, sql } from 'drizzle-orm';
import { randomBytes, randomUUID } from 'crypto';
import { ServiceError, ValidationError } from '../errors';
import type { User, Session, MagicLink } from '../../types/api';

export class AuthService {
  /**
   * Generate a secure random token
   */
  private static generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create a magic link for email authentication
   */
  static async createMagicLink(email: string): Promise<{ token: string; expiresAt: Date }> {
    const db = getDb();
    // Clean up expired magic links
    await this.cleanupExpiredMagicLinks();

    // Check if there's already an active magic link for this email
    const now = new Date().toISOString();
    const existingLink = await db
      .select()
      .from(magicLinks)
      .where(
        and(
          eq(magicLinks.email, email),
          eq(magicLinks.used, 0),
          sql`${magicLinks.expiresAt} > ${now}`
        )
      )
      .limit(1);

    if (existingLink.length > 0) {
      throw new ValidationError('A magic link was recently sent to this email. Please check your inbox or wait a few minutes before requesting another.');
    }

    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.insert(magicLinks).values({
      email,
      token,
      expiresAt: expiresAt, // Use Date object directly
      used: 0,
    });

    return { token, expiresAt };
  }

  /**
   * Verify and consume a magic link
   */
  static async verifyMagicLink(token: string): Promise<User> {
    const db = getDb();
    const magicLink = await db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.token, token))
      .limit(1);

    if (magicLink.length === 0) {
      throw new ValidationError('Invalid magic link');
    }

    const link = magicLink[0];

    if (link.used) {
      throw new ValidationError('Magic link has already been used');
    }

    if (new Date() > link.expiresAt) {
      throw new ValidationError('Magic link has expired');
    }

    // Mark the magic link as used
    await db
      .update(magicLinks)
      .set({ used: 1 })
      .where(eq(magicLinks.id, link.id));

    // Find or create user
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, link.email))
      .limit(1);

    if (user.length === 0) {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          email: link.email,
          role: 'user',
          isActive: 1,
          emailVerified: 1,
        })
        .returning();
      user = [newUser];
    } else {
      // Update existing user's email verification status
      await db
        .update(users)
        .set({ emailVerified: 1, updatedAt: new Date() })
        .where(eq(users.id, user[0].id));
    }

    return {
      ...user[0],
      name: user[0].name || undefined,
      isActive: Boolean(user[0].isActive),
      emailVerified: Boolean(user[0].emailVerified),
    };
  }

  /**
   * Create a session for a user
   */
  static async createSession(userId: number): Promise<Session> {
    const db = getDb();
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Clean up expired sessions for this user
    await db
      .delete(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          lt(sessions.expiresAt, new Date())
        )
      );

    const [session] = await db
      .insert(sessions)
      .values({
        userId,
        token,
        expiresAt: expiresAt, // Use Date object directly
      })
      .returning();

    return session;
  }

  /**
   * Get user by session token
   */
  static async getUserBySession(token: string): Promise<User | null> {
    const db = getDb();
    const session = await db
      .select({
        session: sessions,
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.token, token),
          gt(sessions.expiresAt, new Date()), // Session should not be expired
          eq(users.isActive, 1)
        )
      )
      .limit(1);

    if (session.length === 0) {
      return null;
    }

    return {
      ...session[0].user,
      name: session[0].user.name || undefined,
      isActive: Boolean(session[0].user.isActive),
      emailVerified: Boolean(session[0].user.emailVerified),
    };
  }

  /**
   * Delete a session (logout)
   */
  static async deleteSession(token: string): Promise<void> {
    const db = getDb();
    await db
      .delete(sessions)
      .where(eq(sessions.token, token));
  }

  /**
   * Clean up expired magic links
   */
  private static async cleanupExpiredMagicLinks(): Promise<void> {
    const db = getDb();
    try {
      const now = new Date().toISOString();
      await db
        .delete(magicLinks)
        .where(
          and(
            sql`${magicLinks.expiresAt} < ${now}`,
            eq(magicLinks.used, 0)
          )
        );
    } catch (error) {
      // Log error but don't fail the magic link creation
      console.warn('Failed to cleanup expired magic links:', error);
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    const db = getDb();
    await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()));
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: number): Promise<User | null> {
    const db = getDb();
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user.length > 0 ? {
      ...user[0],
      name: user[0].name || undefined,
      isActive: Boolean(user[0].isActive),
      emailVerified: Boolean(user[0].emailVerified),
    } : null;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const db = getDb();
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user.length > 0 ? {
      ...user[0],
      name: user[0].name || undefined,
      isActive: Boolean(user[0].isActive),
      emailVerified: Boolean(user[0].emailVerified),
    } : null;
  }

  /**
   * Update user profile
   */
  static async updateUser(id: number, updates: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
    const db = getDb();
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return {
      ...user,
      name: user.name || undefined,
      isActive: Boolean(user.isActive),
      emailVerified: Boolean(user.emailVerified),
    };
  }

  /**
   * Promote user to admin (admin only)
   */
  static async promoteToAdmin(userId: number): Promise<User> {
    const db = getDb();
    const [user] = await db
      .update(users)
      .set({
        role: 'admin',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return {
      ...user,
      name: user.name || undefined,
      isActive: Boolean(user.isActive),
      emailVerified: Boolean(user.emailVerified),
    };
  }

  /**
   * Deactivate user (admin only)
   */
  static async deactivateUser(userId: number): Promise<User> {
    const db = getDb();
    const [user] = await db
      .update(users)
      .set({
        isActive: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return {
      ...user,
      name: user.name || undefined,
      isActive: Boolean(user.isActive),
      emailVerified: Boolean(user.emailVerified),
    };
  }
} 