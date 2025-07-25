import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { AuthService } from '@/lib/services/authService';
import { db } from '@/lib/db';
import { users, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Mock the services
jest.mock('@/lib/services/authService');
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('/api/admin/users', () => {
  let mockAdminUser: any;
  let mockSession: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock admin user
    mockAdminUser = {
      id: 1,
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      isActive: true,
      emailVerified: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock session
    mockSession = {
      id: 1,
      userId: 1,
      token: 'valid-session-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    // Mock AuthService methods
    (AuthService.validateSession as jest.Mock).mockResolvedValue(mockAdminUser);
    (AuthService.listUsers as jest.Mock).mockResolvedValue([
      mockAdminUser,
      {
        id: 2,
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        isActive: true,
        emailVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    (AuthService.getUserStats as jest.Mock).mockResolvedValue({
      totalUsers: 2,
      activeUsers: 2,
      adminUsers: 1,
      recentLogins: 1,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should return users list and stats for authenticated admin', async () => {
      // Create mock request with valid session
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {
          cookie: 'session_token=valid-session-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.users).toHaveLength(2);
      expect(data.data.stats).toEqual({
        totalUsers: 2,
        activeUsers: 2,
        adminUsers: 1,
        recentLogins: 1,
      });
      expect(AuthService.validateSession).toHaveBeenCalledWith('valid-session-token');
      expect(AuthService.listUsers).toHaveBeenCalled();
      expect(AuthService.getUserStats).toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated request', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const mockRegularUser = { ...mockAdminUser, role: 'user' };
      (AuthService.validateSession as jest.Mock).mockResolvedValue(mockRegularUser);

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {
          cookie: 'session_token=valid-session-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Admin access required');
    });

    it('should return 401 for invalid session', async () => {
      (AuthService.validateSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {
          cookie: 'session_token=invalid-session-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid session');
    });

    it('should handle service errors gracefully', async () => {
      const { ServiceError } = await import('@/lib/errors');
      (AuthService.listUsers as jest.Mock).mockRejectedValue(new ServiceError('Database error', 'DATABASE_ERROR', 500));

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {
          cookie: 'session_token=valid-session-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error');
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create new user for authenticated admin', async () => {
      const newUser = {
        id: 3,
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user',
        isActive: true,
        emailVerified: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (AuthService.createUser as jest.Mock).mockResolvedValue(newUser);

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: {
          cookie: 'session_token=valid-session-token',
          'content-type': 'application/json',
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
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('newuser@example.com');
      expect(data.message).toBe('User created successfully');
      expect(AuthService.createUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
        role: 'user',
      });
    });

    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: {
          cookie: 'session_token=valid-session-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          // Missing name and password
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email, name, and password are required');
    });

    it('should return 401 for unauthenticated request', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const mockRegularUser = { ...mockAdminUser, role: 'user' };
      (AuthService.validateSession as jest.Mock).mockResolvedValue(mockRegularUser);

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: {
          cookie: 'session_token=valid-session-token',
          'content-type': 'application/json',
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
      expect(data.success).toBe(false);
      expect(data.error).toBe('Admin access required');
    });

    it('should handle service errors gracefully', async () => {
      const { ServiceError } = await import('@/lib/errors');
      (AuthService.createUser as jest.Mock).mockRejectedValue(new ServiceError('User already exists', 'USER_ALREADY_EXISTS', 409));

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: {
          cookie: 'session_token=valid-session-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'existing@example.com',
          name: 'Existing User',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User already exists');
    });
  });
}); 