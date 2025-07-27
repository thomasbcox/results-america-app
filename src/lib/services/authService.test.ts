import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getTestDb, clearTestData, setupTestDatabase } from '../test-setup';
import { users, sessions, magicLinks } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('AuthService Database Tests', () => {
  let db: any;

  beforeEach(async () => {
    db = await setupTestDatabase();
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('Database Setup', () => {
    it('should have all required tables', async () => {
      // Test that we can insert and query from each table
      const [user] = await db.insert(users).values({
        email: 'test@example.com',
        role: 'user',
        isActive: 1,
        emailVerified: 1,
      }).returning();

      expect(user).toBeTruthy();
      expect(user.email).toBe('test@example.com');

      const [session] = await db.insert(sessions).values({
        userId: user.id,
        token: 'test-token',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      }).returning();

      expect(session).toBeTruthy();
      expect(session.token).toBe('test-token');

      const [magicLink] = await db.insert(magicLinks).values({
        email: 'test@example.com',
        token: 'magic-token',
        expiresAt: new Date(Date.now() + 900000), // 15 minutes from now
        used: 0,
      }).returning();

      expect(magicLink).toBeTruthy();
      expect(magicLink.token).toBe('magic-token');
    });

    it('should handle user queries correctly', async () => {
      // Create a user
      const [user] = await db.insert(users).values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        isActive: 1,
        emailVerified: 1,
      }).returning();

      // Query by ID
      const foundUser = await db.select().from(users).where(eq(users.id, user.id));
      expect(foundUser).toHaveLength(1);
      expect(foundUser[0].email).toBe('test@example.com');

      // Query by email
      const foundByEmail = await db.select().from(users).where(eq(users.email, 'test@example.com'));
      expect(foundByEmail).toHaveLength(1);
      expect(foundByEmail[0].name).toBe('Test User');
    });

    it('should handle session management', async () => {
      // Create a user
      const [user] = await db.insert(users).values({
        email: 'test@example.com',
        role: 'user',
        isActive: 1,
        emailVerified: 1,
      }).returning();

      // Create a session
      const [session] = await db.insert(sessions).values({
        userId: user.id,
        token: 'session-token',
        expiresAt: new Date(Date.now() + 3600000),
      }).returning();

      // Query session
      const foundSession = await db.select().from(sessions).where(eq(sessions.token, 'session-token'));
      expect(foundSession).toHaveLength(1);
      expect(foundSession[0].userId).toBe(user.id);

      // Delete session
      await db.delete(sessions).where(eq(sessions.token, 'session-token'));
      const deletedSession = await db.select().from(sessions).where(eq(sessions.token, 'session-token'));
      expect(deletedSession).toHaveLength(0);
    });

    it('should handle magic link operations', async () => {
      // Create a magic link
      const [magicLink] = await db.insert(magicLinks).values({
        email: 'test@example.com',
        token: 'magic-token',
        expiresAt: new Date(Date.now() + 900000),
        used: 0,
      }).returning();

      // Query magic link
      const foundLink = await db.select().from(magicLinks).where(eq(magicLinks.token, 'magic-token'));
      expect(foundLink).toHaveLength(1);
      expect(foundLink[0].used).toBe(0);

      // Mark as used
      await db.update(magicLinks).set({ used: 1 }).where(eq(magicLinks.token, 'magic-token'));
      const updatedLink = await db.select().from(magicLinks).where(eq(magicLinks.token, 'magic-token'));
      expect(updatedLink[0].used).toBe(1);
    });

    it('should handle user updates', async () => {
      // Create a user
      const [user] = await db.insert(users).values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        isActive: 1,
        emailVerified: 0,
      }).returning();

      // Update user
      await db.update(users).set({ 
        name: 'Updated User',
        emailVerified: 1,
        role: 'admin'
      }).where(eq(users.id, user.id));

      // Verify update
      const updatedUser = await db.select().from(users).where(eq(users.id, user.id));
      expect(updatedUser[0].name).toBe('Updated User');
      expect(updatedUser[0].emailVerified).toBe(1);
      expect(updatedUser[0].role).toBe('admin');
    });
  });
}); 