import { NextRequest, NextResponse } from 'next/server';
import { POST } from './route';
import { AuthService } from '@/lib/services/authService';
import { createTestDatabase, createTestUserData } from '@/lib/testUtils';

describe('POST /api/auth/login', () => {
  let testDb: any;

  beforeEach(async () => {
    // Setup test database with proper dependency order
    const testDatabase = createTestDatabase();
    testDb = testDatabase.db;
    
    // Clear any existing data in reverse dependency order
    await testDatabase.clearAllData();
    
    // Populate foundation data in dependency order
    await testDatabase.populateFoundationData();
  });

  afterEach(async () => {
    // Clean up in reverse dependency order
    if (testDb) {
      const testDatabase = createTestDatabase();
      await testDatabase.clearAllData();
    }
  });

  it('should login user successfully', async () => {
    // Create a user with unique email
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    await AuthService.createUser({
      email: uniqueEmail,
      name: 'Test User',
      password: 'password123',
    });

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(uniqueEmail);
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
    // Create a user with unique email
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    await AuthService.createUser({
      email: uniqueEmail,
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