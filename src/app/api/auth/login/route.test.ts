import { NextRequest } from 'next/server';
import { POST } from './route';
import { AuthService } from '@/lib/services/authService';
import { db } from '@/lib/db/index';
import { users, sessions, passwordResetTokens, userActivityLogs } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';

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

describe('POST /api/auth/login', () => {
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

  it('should login user successfully', async () => {
    const mockHash = 'hashed-password-123';
    (bcrypt.hash as any).mockResolvedValue(mockHash);
    (bcrypt.compare as any).mockResolvedValue(true);

    // Create a user
    await AuthService.createUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    });

    // Create request
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
    expect(data.user.name).toBe('Test User');
    expect(data.message).toBe('Login successful');

    // Check that session cookie is set
    const cookies = response.headers.get('set-cookie');
    expect(cookies).toContain('session_token=');
    expect(cookies).toContain('HttpOnly');
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
    const mockHash = 'hashed-password-123';
    (bcrypt.hash as any).mockResolvedValue(mockHash);
    (bcrypt.compare as any).mockResolvedValue(false);

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
    const mockHash = 'hashed-password-123';
    (bcrypt.hash as any).mockResolvedValue(mockHash);

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
    jest.spyOn(AuthService, 'login').mockRejectedValue(new Error('Database error'));

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