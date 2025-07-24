import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { createTestDatabase } from '@/lib/testUtils';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';

describe('POST /api/auth/validate-reset-token', () => {
  let testDb: any;

  beforeEach(async () => {
    testDb = await createTestDatabase();
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  it('should return 400 for missing token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/validate-reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token is required');
  });

  it('should return 400 for invalid token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/validate-reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid-token' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid or expired reset token');
  });

  it('should return 400 for expired token', async () => {
    // Create a test user with unique email
    const uniqueEmail = `test-${Date.now()}-${Math.random()}@example.com`;
    const [user] = await db.insert(users).values({
      email: uniqueEmail,
      name: 'Test User',
      passwordHash: 'hashedpassword',
      role: 'admin',
    }).returning();

    // Create an expired token with unique token
    const expiredDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    const uniqueExpiredToken = `expired-${Date.now()}-${Math.random()}`;
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: uniqueExpiredToken,
      expiresAt: expiredDate,
      used: false,
    });

    const request = new NextRequest('http://localhost:3000/api/auth/validate-reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: uniqueExpiredToken }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid or expired reset token');
  });

  it('should return 400 for used token', async () => {
    // Create a test user with unique email
    const uniqueEmail = `test-${Date.now()}-${Math.random()}@example.com`;
    const [user] = await db.insert(users).values({
      email: uniqueEmail,
      name: 'Test User',
      passwordHash: 'hashedpassword',
      role: 'admin',
    }).returning();

    // Create a used token with unique token
    const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const uniqueUsedToken = `used-${Date.now()}-${Math.random()}`;
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: uniqueUsedToken,
      expiresAt: futureDate,
      used: true,
    });

    const request = new NextRequest('http://localhost:3000/api/auth/validate-reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: uniqueUsedToken }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid or expired reset token');
  });

  it('should return 200 for valid token', async () => {
    // Create a test user with unique email
    const uniqueEmail = `test-${Date.now()}-${Math.random()}@example.com`;
    const [user] = await db.insert(users).values({
      email: uniqueEmail,
      name: 'Test User',
      passwordHash: 'hashedpassword',
      role: 'admin',
    }).returning();

    // Create a valid token with unique token
    const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const uniqueValidToken = `valid-${Date.now()}-${Math.random()}`;
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: uniqueValidToken,
      expiresAt: futureDate,
      used: false,
    });

    const request = new NextRequest('http://localhost:3000/api/auth/validate-reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: uniqueValidToken }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Token is valid');
  });

  it('should handle server errors gracefully', async () => {
    // Mock a database error by passing invalid data
    const request = new NextRequest('http://localhost:3000/api/auth/validate-reset-token', {
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