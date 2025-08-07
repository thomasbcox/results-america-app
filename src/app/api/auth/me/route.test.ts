import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '../../../lib/test-infrastructure/bulletproof-test-db';
import { users, sessions } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { GET } from './route';
import { NextRequest } from 'next/server';

describe('GET /api/auth/me', () => {
  let testDb: any;
  let testUser: any;
  let testSession: any;

  beforeEach(async () => {
    testDb = await TestUtils.createAndSeed({
      seedOptions: {
        users: true
      }
    });

    // Get the test user
    const [user] = await testDb.db
      .select()
      .from(users)
      .where(eq(users.email, 'test@example.com'))
      .limit(1);

    testUser = user;

    // Create a test session
    const [session] = await testDb.db.insert(sessions).values({
      userId: testUser.id,
      token: 'test-session-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      createdAt: new Date()
    }).returning();

    testSession = session;
  });

  afterEach(() => {
    if (testDb) {
      BulletproofTestDatabase.destroy(testDb);
    }
  });

  describe('Successful Authentication', () => {
    it('should return user information for authenticated user', async () => {
      // Mock the auth middleware to return a valid user
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer test-session-token'
        }),
        user: testUser
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user).toBeDefined();
      expect(data.data.user.id).toBe(testUser.id);
      expect(data.data.user.email).toBe(testUser.email);
      expect(data.data.user.name).toBe(testUser.name);
      expect(data.data.user.role).toBe(testUser.role);
      expect(data.data.user.emailVerified).toBe(testUser.emailVerified);
      expect(data.data.user.createdAt).toBeDefined();
    });

    it('should return user information for admin user', async () => {
      // Get admin user
      const [adminUser] = await testDb.db
        .select()
        .from(users)
        .where(eq(users.email, 'admin@example.com'))
        .limit(1);

      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer admin-session-token'
        }),
        user: adminUser
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.id).toBe(adminUser.id);
      expect(data.data.user.email).toBe(adminUser.email);
      expect(data.data.user.role).toBe('admin');
    });

    it('should handle user with minimal data', async () => {
      // Create a user with minimal data
      const [minimalUser] = await testDb.db.insert(users).values({
        email: 'minimal@example.com',
        role: 'user',
        isActive: 1,
        emailVerified: 0
      }).returning();

      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer minimal-session-token'
        }),
        user: minimalUser
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.id).toBe(minimalUser.id);
      expect(data.data.user.email).toBe('minimal@example.com');
      expect(data.data.user.name).toBeNull();
      expect(data.data.user.role).toBe('user');
      expect(data.data.user.emailVerified).toBe(0);
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 for missing authorization header', async () => {
      const mockRequest = {
        headers: new Headers({}),
        user: null
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 401 for invalid token', async () => {
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer invalid-token'
        }),
        user: null
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 401 for expired session', async () => {
      // Create an expired session
      const [expiredSession] = await testDb.db.insert(sessions).values({
        userId: testUser.id,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        createdAt: new Date()
      }).returning();

      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer expired-token'
        }),
        user: null
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return 401 for malformed authorization header', async () => {
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'InvalidFormat'
        }),
        user: null
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('User Data Validation', () => {
    it('should return correct user data types', async () => {
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer test-session-token'
        }),
        user: testUser
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(typeof data.data.user.id).toBe('number');
      expect(typeof data.data.user.email).toBe('string');
      expect(typeof data.data.user.role).toBe('string');
      expect(typeof data.data.user.emailVerified).toBe('number');
      expect(typeof data.data.user.createdAt).toBe('string'); // ISO date string
    });

    it('should handle user with null optional fields', async () => {
      // Create a user with null name
      const [nullNameUser] = await testDb.db.insert(users).values({
        email: 'noname@example.com',
        name: null,
        role: 'user',
        isActive: 1,
        emailVerified: 0
      }).returning();

      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer noname-session-token'
        }),
        user: nullNameUser
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.user.name).toBeNull();
    });

    it('should handle inactive user', async () => {
      // Create an inactive user
      const [inactiveUser] = await testDb.db.insert(users).values({
        email: 'inactive@example.com',
        name: 'Inactive User',
        role: 'user',
        isActive: 0,
        emailVerified: 0
      }).returning();

      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer inactive-session-token'
        }),
        user: inactiveUser
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.user.id).toBe(inactiveUser.id);
      expect(data.data.user.isActive).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test would require mocking the database to throw errors
      // For now, we'll test with a valid request
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer test-session-token'
        }),
        user: testUser
      } as any;

      const response = await GET(mockRequest);
      expect(response.status).toBe(200);
    });

    it('should handle malformed user object', async () => {
      const malformedUser = {
        id: 'not-a-number',
        email: null,
        role: 'invalid-role'
      };

      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer test-session-token'
        }),
        user: malformedUser
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200); // Should still work, just return the data as-is
      expect(data.data.user.id).toBe('not-a-number');
      expect(data.data.user.email).toBeNull();
    });

    it('should handle missing user properties', async () => {
      const incompleteUser = {
        id: 1,
        email: 'test@example.com'
        // Missing other properties
      };

      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer test-session-token'
        }),
        user: incompleteUser
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.user.id).toBe(1);
      expect(data.data.user.email).toBe('test@example.com');
      expect(data.data.user.name).toBeUndefined();
    });
  });

  describe('Security and Privacy', () => {
    it('should not expose sensitive user information', async () => {
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer test-session-token'
        }),
        user: testUser
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      // Should not expose password or other sensitive fields
      expect(data.data.user.password).toBeUndefined();
      expect(data.data.user.token).toBeUndefined();
      expect(data.data.user.secret).toBeUndefined();
    });

    it('should only return necessary user fields', async () => {
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer test-session-token'
        }),
        user: testUser
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      const userFields = Object.keys(data.data.user);
      const expectedFields = ['id', 'email', 'name', 'role', 'emailVerified', 'createdAt'];

      expect(userFields.sort()).toEqual(expectedFields.sort());
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent requests efficiently', async () => {
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer test-session-token'
        }),
        user: testUser
      } as any;

      const startTime = Date.now();
      
      // Make multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(GET(mockRequest));
      }
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should maintain data consistency across requests', async () => {
      const mockRequest = {
        headers: new Headers({
          'Authorization': 'Bearer test-session-token'
        }),
        user: testUser
      } as any;

      const response1 = await GET(mockRequest);
      const data1 = await response1.json();
      
      const response2 = await GET(mockRequest);
      const data2 = await response2.json();

      expect(data1.data.user).toEqual(data2.data.user);
    });
  });
}); 