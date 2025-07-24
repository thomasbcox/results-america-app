import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from './route';
import { AuthService } from '@/lib/services/authService';
import { db } from '@/lib/db/index';
import { users, sessions, passwordResetTokens, userActivityLogs } from '@/lib/db/schema';

describe('GET /api/admin/users', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.delete(userActivityLogs);
    await db.delete(passwordResetTokens);
    await db.delete(sessions);
    await db.delete(users);
  });

  afterEach(async () => {
    // Clean up after each test
    await db.delete(userActivityLogs);
    await db.delete(passwordResetTokens);
    await db.delete(sessions);
    await db.delete(users);
  });

  it('should return users list for admin user', async () => {
    // Create admin user
    const admin = await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');

    // Create a session for the admin
    const loginResult = await AuthService.login({
      email: 'admin@example.com',
      password: 'password123',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'GET',
      headers: {
        'Cookie': `session_token=${loginResult!.session.token}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toBeDefined();
    expect(Array.isArray(data.users)).toBe(true);
    expect(data.users).toHaveLength(1);
    expect(data.users[0].email).toBe('admin@example.com');
    expect(data.stats).toBeDefined();
    expect(data.stats.totalUsers).toBe(1);
  });

  it('should reject request for non-admin user', async () => {
    // Create regular user
    await AuthService.createUser({
      email: 'user@example.com',
      name: 'Regular User',
      password: 'password123',
      role: 'user',
    });

    const loginResult = await AuthService.login({
      email: 'user@example.com',
      password: 'password123',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'GET',
      headers: {
        'Cookie': `session_token=${loginResult!.session.token}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Admin access required');
  });

  it('should reject request without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });
});

describe('POST /api/admin/users', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.delete(userActivityLogs);
    await db.delete(passwordResetTokens);
    await db.delete(sessions);
    await db.delete(users);
  });

  afterEach(async () => {
    // Clean up after each test
    await db.delete(userActivityLogs);
    await db.delete(passwordResetTokens);
    await db.delete(sessions);
    await db.delete(users);
  });

  it('should create user successfully for admin', async () => {
    // Create admin user
    await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');

    const loginResult = await AuthService.login({
      email: 'admin@example.com',
      password: 'password123',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session_token=${loginResult!.session.token}`,
      },
      body: JSON.stringify({
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
        role: 'user',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('newuser@example.com');
    expect(data.user.name).toBe('New User');
    expect(data.user.role).toBe('user');
  });

  it('should reject user creation without required fields', async () => {
    // Create admin user
    await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');

    const loginResult = await AuthService.login({
      email: 'admin@example.com',
      password: 'password123',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session_token=${loginResult!.session.token}`,
      },
      body: JSON.stringify({
        name: 'New User',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email, name, and password are required');
  });

  it('should reject user creation for non-admin user', async () => {
    // Create regular user
    await AuthService.createUser({
      email: 'user@example.com',
      name: 'Regular User',
      password: 'password123',
      role: 'user',
    });

    const loginResult = await AuthService.login({
      email: 'user@example.com',
      password: 'password123',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session_token=${loginResult!.session.token}`,
      },
      body: JSON.stringify({
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
        role: 'user',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Admin access required');
  });

  it('should handle duplicate email error', async () => {
    // Create admin user
    await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');

    const loginResult = await AuthService.login({
      email: 'admin@example.com',
      password: 'password123',
    });

    // Create first user
    await AuthService.createUser({
      email: 'existing@example.com',
      name: 'Existing User',
      password: 'password123',
    });

    // Try to create user with same email
    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session_token=${loginResult!.session.token}`,
      },
      body: JSON.stringify({
        email: 'existing@example.com',
        name: 'New User',
        password: 'password123',
        role: 'user',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('User with this email already exists');
  });

  it('should handle server errors gracefully', async () => {
    // Create admin user
    await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');

    const loginResult = await AuthService.login({
      email: 'admin@example.com',
      password: 'password123',
    });

    // Mock AuthService.createUser to throw an error
    jest.spyOn(AuthService, 'createUser').mockRejectedValueOnce(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session_token=${loginResult!.session.token}`,
      },
      body: JSON.stringify({
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
        role: 'user',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
}); 