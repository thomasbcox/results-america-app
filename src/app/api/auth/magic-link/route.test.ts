import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { getTestDb, clearTestData, setupTestDatabase } from '../../../lib/test-setup';
import { magicLinks } from '../../../lib/db/schema';

// Mock the database for tests
jest.mock('@/lib/db', () => {
  const { getTestDb } = require('@/lib/test-setup');
  return { getDb: () => getTestDb() };
});

describe('/api/auth/magic-link', () => {
  let db: any;

  beforeEach(async () => {
    db = await setupTestDatabase();
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('POST', () => {
    it('should create magic link successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('message');
      expect(data.data).toHaveProperty('expiresAt');
      expect(data.data).toHaveProperty('magicLink');
    });

    it('should return 400 for invalid email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid email address');
    });

    it('should return 400 for missing email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid email address');
    });

    it('should prevent duplicate magic links for same email', async () => {
      const email = 'test@example.com';
      
      // Create first magic link
      const request1 = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      await POST(request1);

      // Try to create second magic link
      const request2 = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const response = await POST(request2);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('A magic link was recently sent to this email');
    });

    it('should store magic link in database', async () => {
      const email = 'test@example.com';
      
      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      await POST(request);

      const storedLinks = await db.select().from(magicLinks);
      expect(storedLinks).toHaveLength(1);
      expect(storedLinks[0].email).toBe(email);
      expect(storedLinks[0].used).toBe(0);
    });

    it('should return development magic link in development mode', async () => {
      // Set development mode
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3050';

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveProperty('magicLink');
      expect(data.data.magicLink).toContain('http://localhost:3050/auth/verify?token=');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });
}); 