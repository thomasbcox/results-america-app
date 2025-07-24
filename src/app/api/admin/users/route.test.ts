import { NextRequest } from 'next/server';
import { GET, POST } from './route';
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

describe('GET /api/admin/users', () => {
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

  it('should return users list for admin user', async () => {
    const mockHash = 'hashed-password-123';
    (bcrypt.hash as any).mockResolvedValue(mockHash);
    (bcrypt.compare as any).mockResolvedValue(true);

    // Create admin user
    const admin = await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');
    
    // Create regular user
    await AuthService.createUser({
      email: 'user@example.com',
      name: 'Regular User',
      password: 'password123',
    });

    // Login admin and get session
    const loginResult = await AuthService.login({
      email: 'admin@example.com',
      password: 'password123',
    });

    // Create request with session cookie
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
    expect(data.users).toHaveLength(2);
    expect(data.stats).toBeDefined();
    expect(data.stats.totalUsers).toBe(2);
    expect(data.stats.adminUsers).toBe(1);
    expect(data.stats.activeUsers).toBe(2);
  });

  it('should reject request without session token', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Not authenticated');
  });

  it('should reject request for non-admin user', async () => {
    const mockHash = 'hashed-password-123';
    (bcrypt.hash as any).mockResolvedValue(mockHash);
    (bcrypt.compare as any).mockResolvedValue(true);

    // Create regular user
    await AuthService.createUser({
      email: 'user@example.com',
      name: 'Regular User',
      password: 'password123',
    });

    // Login user and get session
    const loginResult = await AuthService.login({
      email: 'user@example.com',
      password: 'password123',
    });

    // Create request with session cookie
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

  it('should handle server errors gracefully', async () => {
    // Mock AuthService.validateSession to throw an error
    jest.spyOn(AuthService, 'validateSession').mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'GET',
      headers: {
        'Cookie': 'session_token=valid-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('POST /api/admin/users', () => {
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

  it('should create user successfully for admin', async () => {
    const mockHash = 'hashed-password-123';
    (bcrypt.hash as any).mockResolvedValue(mockHash);
    (bcrypt.compare as any).mockResolvedValue(true);

    // Create admin user
    await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');

    // Login admin and get session
    const loginResult = await AuthService.login({
      email: 'admin@example.com',
      password: 'password123',
    });

    // Create request
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

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('newuser@example.com');
    expect(data.user.name).toBe('New User');
    expect(data.user.role).toBe('user');
    expect(data.message).toBe('User created successfully');
  });

  it('should reject user creation without required fields', async () => {
    const mockHash = 'hashed-password-123';
    (bcrypt.hash as any).mockResolvedValue(mockHash);
    (bcrypt.compare as any).mockResolvedValue(true);

    // Create admin user
    await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');

    // Login admin and get session
    const loginResult = await AuthService.login({
      email: 'admin@example.com',
      password: 'password123',
    });

    // Create request without email
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
    const mockHash = 'hashed-password-123';
    (bcrypt.hash as any).mockResolvedValue(mockHash);
    (bcrypt.compare as any).mockResolvedValue(true);

    // Create regular user
    await AuthService.createUser({
      email: 'user@example.com',
      name: 'Regular User',
      password: 'password123',
    });

    // Login user and get session
    const loginResult = await AuthService.login({
      email: 'user@example.com',
      password: 'password123',
    });

    // Create request
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
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Admin access required');
  });

  it('should handle duplicate email error', async () => {
    const mockHash = 'hashed-password-123';
    (bcrypt.hash as any).mockResolvedValue(mockHash);
    (bcrypt.compare as any).mockResolvedValue(true);

    // Create admin user
    await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');

    // Create existing user
    await AuthService.createUser({
      email: 'existing@example.com',
      name: 'Existing User',
      password: 'password123',
    });

    // Login admin and get session
    const loginResult = await AuthService.login({
      email: 'admin@example.com',
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
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('User with this email already exists');
  });

  it('should handle server errors gracefully', async () => {
    // Mock AuthService.createUser to throw an error
    jest.spyOn(AuthService, 'createUser').mockRejectedValue(new Error('Database error'));

    const mockHash = 'hashed-password-123';
    (bcrypt.hash as any).mockResolvedValue(mockHash);
    (bcrypt.compare as any).mockResolvedValue(true);

    // Create admin user
    await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');

    // Login admin and get session
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
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
}); 