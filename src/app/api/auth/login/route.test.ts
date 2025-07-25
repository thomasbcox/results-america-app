import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { getTestDb, createTestAdmin, clearTestData } from '@/lib/test-setup';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

describe('/api/auth/login', () => {
  let adminUser: any;
  let db: any;
  let adminEmail: string;

  beforeEach(async () => {
    db = getTestDb();
    await clearTestData();
    
    // Create a test admin user with unique email
    adminEmail = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    adminUser = await createTestAdmin({
      email: adminEmail,
      password: 'password123',
      name: 'Admin User'
    });
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate admin user successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: adminEmail,
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe(adminEmail);
      expect(data.data.user.role).toBe('admin');
      expect(data.data.authMethod).toBe('password');
      expect(data.message).toBe('Login successful');

      // Check that session cookie is set
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toBeTruthy();
      expect(setCookieHeader).toContain('session_token=');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('Path=/');
    });

    it('should return 400 for missing email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('email is required');
    });

    it('should return 400 for missing password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: adminEmail,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('password is required');
    });

    it('should return 400 for empty email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: '',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email must be valid');
    });

    it('should return 400 for empty password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: adminEmail,
          password: '',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Password must be at least 8 characters long');
    });

    it('should return 401 for invalid credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: adminEmail,
          password: 'wrongpassword',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid email or password');
    });

    it('should return 403 for non-admin user', async () => {
      // Create a regular user with unique email
      const userEmail = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
      await createTestAdmin({
        email: userEmail,
        password: 'password123',
        name: 'Regular User',
        role: 'user'
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Admin access required');
    });

    it('should return 403 for deactivated account', async () => {
      // Deactivate the admin user
      await db.update(users)
        .set({ isActive: 0 })
        .where(eq(users.email, adminEmail));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: adminEmail,
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Admin account is deactivated');
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should normalize email case', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: adminEmail.toUpperCase(),
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe(adminEmail);
    });
  });
}); 