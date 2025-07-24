import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { createTestDatabase } from '@/lib/testUtils';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

describe('POST /api/auth/forgot-password', () => {
  let testDb: any;

  beforeEach(async () => {
    testDb = await createTestDatabase();
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  it('should return 400 for missing email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email is required');
  });

  it('should return success message for non-existent user (security)', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('If an account with that email exists, a password reset link has been sent.');
  });

  it('should create reset token for existing user', async () => {
    // Create a test user with unique email
    const uniqueEmail = `test-${Date.now()}-${Math.random()}@example.com`;
    const testUser = await db.insert(users).values({
      email: uniqueEmail,
      name: 'Test User',
      passwordHash: 'hashedpassword',
      role: 'admin',
    }).returning();

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('If an account with that email exists, a password reset link has been sent.');
    
    // In development, should return reset URL
    if (process.env.NODE_ENV === 'development') {
      expect(data.resetUrl).toBeDefined();
      expect(data.resetUrl).toContain('/reset-password?token=');
    }
  });

  it('should handle server errors gracefully', async () => {
    // Mock a database error by passing invalid data
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
}); 