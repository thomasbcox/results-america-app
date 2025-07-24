import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';
import { AuthService } from './lib/services/authService';
import { db } from './lib/db/index';
import { users, sessions, passwordResetTokens, userActivityLogs } from './lib/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: () => 'mock-token-1234567890abcdef',
  })),
}));

describe('middleware', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.delete(userActivityLogs);
    await db.delete(passwordResetTokens);
    await db.delete(sessions);
    await db.delete(users);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    await db.delete(userActivityLogs);
    await db.delete(passwordResetTokens);
    await db.delete(sessions);
    await db.delete(users);
  });

  it('should allow access to bootstrap page without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/admin/bootstrap');
    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(200);
  });

  it('should redirect to login for admin routes without session', async () => {
    const request = new NextRequest('http://localhost:3000/admin');
    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(302); // Redirect
    expect(response?.headers.get('location')).toContain('/login');
    expect(response?.headers.get('location')).toContain('redirect=/admin');
  });

  it('should allow access to admin routes with valid session', async () => {
    const mockHash = 'hashed-password-123';
    (bcrypt.hash as any).mockResolvedValue(mockHash);
    (bcrypt.compare as any).mockResolvedValue(true);

    // Create admin user and login
    await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');
    const loginResult = await AuthService.login({
      email: 'admin@example.com',
      password: 'password123',
    });

    const request = new NextRequest('http://localhost:3000/admin', {
      headers: {
        'Cookie': `session_token=${loginResult!.session.token}`,
      },
    });

    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(200);
  });

  it('should redirect to login for admin API routes without session', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/users');
    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(302); // Redirect
    expect(response?.headers.get('location')).toContain('/login');
    expect(response?.headers.get('location')).toContain('redirect=/api/admin/users');
  });

  it('should allow access to admin API routes with valid session', async () => {
    const mockHash = 'hashed-password-123';
    (bcrypt.hash as any).mockResolvedValue(mockHash);
    (bcrypt.compare as any).mockResolvedValue(true);

    // Create admin user and login
    await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');
    const loginResult = await AuthService.login({
      email: 'admin@example.com',
      password: 'password123',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      headers: {
        'Cookie': `session_token=${loginResult!.session.token}`,
      },
    });

    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(200);
  });

  it('should redirect to login for invalid session', async () => {
    const request = new NextRequest('http://localhost:3000/admin', {
      headers: {
        'Cookie': 'session_token=invalid-token',
      },
    });

    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(302); // Redirect
    expect(response?.headers.get('location')).toContain('/login');
  });

  it('should allow access to non-admin routes', async () => {
    const request = new NextRequest('http://localhost:3000/');
    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(200);
  });

  it('should allow access to public API routes', async () => {
    const request = new NextRequest('http://localhost:3000/api/states');
    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(200);
  });

  it('should handle expired session', async () => {
    const mockHash = 'hashed-password-123';
    (bcrypt.hash as any).mockResolvedValue(mockHash);
    (bcrypt.compare as any).mockResolvedValue(true);

    // Create admin user and login
    await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');
    const loginResult = await AuthService.login({
      email: 'admin@example.com',
      password: 'password123',
    });

    // Manually expire the session
    await db.update(sessions)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(sessions.token, loginResult!.session.token));

    const request = new NextRequest('http://localhost:3000/admin', {
      headers: {
        'Cookie': `session_token=${loginResult!.session.token}`,
      },
    });

    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(302); // Redirect
    expect(response?.headers.get('location')).toContain('/login');
  });

  it('should handle missing cookie header gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/admin');
    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(302); // Redirect
    expect(response?.headers.get('location')).toContain('/login');
  });

  it('should handle malformed cookie header gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/admin', {
      headers: {
        'Cookie': 'invalid-cookie-format',
      },
    });

    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(302); // Redirect
    expect(response?.headers.get('location')).toContain('/login');
  });
}); 