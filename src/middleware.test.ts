import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';
import { AuthService } from './lib/services/authService';
import { db } from './lib/db/index';
import { users, sessions, passwordResetTokens, userActivityLogs } from './lib/db/schema';
import { eq } from 'drizzle-orm';
import { setupAuthTest, cleanupDatabase } from './lib/test-setup';

describe('middleware', () => {
  setupAuthTest();

  beforeEach(async () => {
    await cleanupDatabase(db);
  });

  afterEach(async () => {
    await cleanupDatabase(db);
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

  it('should redirect to login for invalid session token', async () => {
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

  it('should redirect to login for expired session', async () => {
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

  it('should allow access to non-admin routes', async () => {
    const request = new NextRequest('http://localhost:3000/api/states');
    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(200);
  });

  it('should allow access to public routes', async () => {
    const request = new NextRequest('http://localhost:3000/');
    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(200);
  });

  it('should handle malformed cookies gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/admin', {
      headers: {
        'Cookie': 'malformed-cookie',
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
}); 