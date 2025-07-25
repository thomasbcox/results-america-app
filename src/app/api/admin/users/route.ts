import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { withAdminAuth, withErrorHandling, createSuccessResponse, createCreatedResponse } from '@/lib/response';

// Get all users (admin only)
async function handleGetUsers(authContext: any, request: NextRequest) {
  const users = await AuthService.listUsers();
  const stats = await AuthService.getUserStats();

  return createSuccessResponse({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      emailVerified: u.emailVerified,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
    stats
  });
}

// Create new user (admin only)
async function handleCreateUser(authContext: any, request: NextRequest) {
  const { email, name, password, role } = await request.json();

  if (!email || !name || !password) {
    throw new Error('Email, name, and password are required');
  }

  const newUser = await AuthService.createUser({
    email,
    name,
    password,
    role: role || 'user',
  });

  return createCreatedResponse({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isActive: newUser.isActive,
      emailVerified: newUser.emailVerified,
      lastLoginAt: newUser.lastLoginAt,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    }
  }, 'User created successfully');
}

export const GET = withErrorHandling(withAdminAuth(handleGetUsers));
export const POST = withErrorHandling(withAdminAuth(handleCreateUser)); 