import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { createTestDatabase } from '@/lib/testUtils';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

describe('POST /api/auth/reset-password', () => {
  let testDb: any;

  beforeEach(async () => {
    testDb = await createTestDatabase();
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  it('should return 400 for missing token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'newpassword123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token and password are required');
  });

  it('should return 400 for missing password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token and password are required');
  });

  it('should return 400 for password too short', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token', password: 'short' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Password must be at least 8 characters long');
  });

  it('should return 400 for invalid token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid-token', password: 'newpassword123' }),
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

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: uniqueExpiredToken, password: 'newpassword123' }),
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

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: uniqueUsedToken, password: 'newpassword123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid or expired reset token');
  });

  it('should successfully reset password with valid token', async () => {
    // Create a test user with unique email
    const uniqueEmail = `test-${Date.now()}-${Math.random()}@example.com`;
    const [user] = await db.insert(users).values({
      email: uniqueEmail,
      name: 'Test User',
      passwordHash: 'oldhashedpassword',
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

    const newPassword = 'newpassword123';
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: uniqueValidToken, password: newPassword }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Password reset successfully');

    // Verify password was updated
    const updatedUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    expect(updatedUser[0]).toBeDefined();
    
    // Verify new password hash is different from old one
    expect(updatedUser[0].passwordHash).not.toBe('oldhashedpassword');
    
    // Verify new password hash is valid
    const isValidPassword = await bcrypt.compare(newPassword, updatedUser[0].passwordHash);
    expect(isValidPassword).toBe(true);

    // Verify token was marked as used
    const usedToken = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, uniqueValidToken)).limit(1);
    expect(usedToken[0].used).toBe(true);
  });

  it('should handle server errors gracefully', async () => {
    // Mock a database error by passing invalid data
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
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