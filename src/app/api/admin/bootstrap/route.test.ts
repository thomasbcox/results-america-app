import { NextRequest, NextResponse } from 'next/server';
import { POST } from './route';
import { AuthService } from '@/lib/services/authService';
import { db } from '@/lib/db/index';
import { users, sessions, passwordResetTokens, userActivityLogs } from '@/lib/db/schema';

describe('POST /api/admin/bootstrap', () => {
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

  it('should create admin user successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'admin123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('admin@example.com');
    expect(data.user.name).toBe('Admin User');
    expect(data.user.role).toBe('admin');
    expect(data.message).toBe('Admin user created successfully');
  });

  it('should reject request with missing email', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Admin User',
        password: 'admin123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email, name, and password are required');
  });

  it('should reject request with missing name', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email, name, and password are required');
  });

  it('should reject request with missing password', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        name: 'Admin User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email, name, and password are required');
  });

  it('should reject request with weak password', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        name: 'Admin User',
        password: '123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Password must be at least 8 characters long');
  });

  it('should prevent creating multiple admin users', async () => {
    // Create first admin
    const firstRequest = new NextRequest('http://localhost:3000/api/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin1@example.com',
        name: 'Admin 1',
        password: 'admin123',
      }),
    });

    const firstResponse = await POST(firstRequest);
    expect(firstResponse.status).toBe(201);

    // Try to create second admin
    const secondRequest = new NextRequest('http://localhost:3000/api/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin2@example.com',
        name: 'Admin 2',
        password: 'admin123',
      }),
    });

    const secondResponse = await POST(secondRequest);
    const data = await secondResponse.json();

    expect(secondResponse.status).toBe(409);
    expect(data.error).toBe('Admin user already exists');
  });

  it('should handle duplicate email error', async () => {
    // Create a regular user first
    await AuthService.createUser({
      email: 'existing@example.com',
      name: 'Existing User',
      password: 'password123',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'existing@example.com',
        name: 'Admin User',
        password: 'admin123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('User with this email already exists');
  });

  it('should handle server errors gracefully', async () => {
    // Mock AuthService.bootstrapAdminUser to throw an error
    jest.spyOn(AuthService, 'bootstrapAdminUser').mockRejectedValueOnce(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'admin123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid JSON');
  });
}); 