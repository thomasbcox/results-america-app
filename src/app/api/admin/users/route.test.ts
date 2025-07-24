import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from './route';
import { AuthService } from '@/lib/services/authService';
import { createTestDatabase } from '@/lib/testUtils';

describe('GET /api/admin/users', () => {
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

  it('should return users list for admin user', async () => {
    // Create admin user with unique email
    const uniqueEmail = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    const admin = await AuthService.bootstrapAdminUser(uniqueEmail, 'Admin', 'password123');

    // Create a session for the admin
    const loginResult = await AuthService.login({
      email: uniqueEmail,
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
    expect(data.users[0].email).toBe(uniqueEmail);
    expect(data.stats).toBeDefined();
    expect(data.stats.totalUsers).toBe(1);
  });

  it('should reject request for non-admin user', async () => {
    // Create regular user with unique email
    const uniqueEmail = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    await AuthService.createUser({
      email: uniqueEmail,
      name: 'Regular User',
      password: 'password123',
      role: 'user',
    });

    const loginResult = await AuthService.login({
      email: uniqueEmail,
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

  it('should create user successfully for admin', async () => {
    // Create admin user with unique email
    const adminEmail = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    await AuthService.bootstrapAdminUser(adminEmail, 'Admin', 'password123');

    const loginResult = await AuthService.login({
      email: adminEmail,
      password: 'password123',
    });

    const uniqueEmail = `newuser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session_token=${loginResult!.session.token}`,
      },
      body: JSON.stringify({
        email: uniqueEmail,
        name: 'New User',
        password: 'password123',
        role: 'user',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(uniqueEmail);
    expect(data.user.name).toBe('New User');
    expect(data.user.role).toBe('user');
    expect(data.message).toBe('User created successfully');
  });

  it('should handle duplicate email error', async () => {
    // Create admin user with unique email
    const adminEmail = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    await AuthService.bootstrapAdminUser(adminEmail, 'Admin', 'password123');

    const loginResult = await AuthService.login({
      email: adminEmail,
      password: 'password123',
    });

    const duplicateEmail = `duplicate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    
    // Create the same user twice
    await AuthService.createUser({
      email: duplicateEmail,
      name: 'First User',
      password: 'password123',
      role: 'user',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session_token=${loginResult!.session.token}`,
      },
      body: JSON.stringify({
        email: duplicateEmail,
        name: 'Second User',
        password: 'password123',
        role: 'user',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('User with this email already exists');
  });

  it('should reject request for non-admin user', async () => {
    // Create regular user with unique email
    const userEmail = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    await AuthService.createUser({
      email: userEmail,
      name: 'Regular User',
      password: 'password123',
      role: 'user',
    });

    const loginResult = await AuthService.login({
      email: userEmail,
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

  it('should reject request without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should reject request with missing required fields', async () => {
    // Create admin user with unique email
    const adminEmail = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    await AuthService.bootstrapAdminUser(adminEmail, 'Admin', 'password123');

    const loginResult = await AuthService.login({
      email: adminEmail,
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
        role: 'user',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email, name, and password are required');
  });
}); 