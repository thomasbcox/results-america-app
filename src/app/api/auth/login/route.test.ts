import { NextRequest, NextResponse } from 'next/server';
import { POST } from './route';
import { AuthService } from '@/lib/services/authService';
import { db } from '@/lib/db/index';
import { users, sessions, passwordResetTokens, userActivityLogs } from '@/lib/db/schema';

describe('POST /api/auth/login', () => {
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

  it('should login user successfully', async () => {
    // Create a user
    await AuthService.createUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    });

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
    expect(data.message).toBe('Login successful');
    expect(response.cookies.get('session_token')).toBeDefined();
  });

  it('should reject login with missing email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email and password are required');
  });

  it('should reject login with missing password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
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

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email and password are required');
  });

  it('should reject login with invalid credentials', async () => {
    // Create a user
    await AuthService.createUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    });

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid email or password');
  });

  it('should reject login for non-existent user', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid email or password');
  });

  it('should reject login for inactive user', async () => {
    // Create a user
    const user = await AuthService.createUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    });

    // Deactivate the user
    await AuthService.updateUser(user.id, { isActive: false });

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid email or password');
  });

  it('should handle server errors gracefully', async () => {
    // Mock AuthService.login to throw an error
    jest.spyOn(AuthService, 'login').mockRejectedValueOnce(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
}); 