import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { withAdminAuth, withErrorHandling, createSuccessResponse, createNotFoundResponse, createNoContentResponse } from '@/lib/response';

// Get specific user (admin only)
async function handleGetUser(authContext: any, request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = parseInt(id);
  
  const targetUser = await AuthService.getUserById(userId);

  if (!targetUser) {
    throw new Error('User not found');
  }

  return createSuccessResponse({
    user: {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      isActive: targetUser.isActive,
      emailVerified: targetUser.emailVerified,
      lastLoginAt: targetUser.lastLoginAt,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt,
    }
  });
}

// Update user (admin only)
async function handleUpdateUser(authContext: any, request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = parseInt(id);
  const updates = await request.json();

  const updatedUser = await AuthService.updateUser(userId, updates);

  if (!updatedUser) {
    throw new Error('User not found');
  }

  return createSuccessResponse({
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      emailVerified: updatedUser.emailVerified,
      lastLoginAt: updatedUser.lastLoginAt,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    }
  }, 'User updated successfully');
}

// Delete user (admin only)
async function handleDeleteUser(authContext: any, request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = parseInt(id);
  
  const success = await AuthService.deleteUser(userId);

  if (!success) {
    throw new Error('User not found');
  }

  return createSuccessResponse(null, 'User deleted successfully');
}

export const GET = withErrorHandling(withAdminAuth(handleGetUser));
export const PUT = withErrorHandling(withAdminAuth(handleUpdateUser));
export const DELETE = withErrorHandling(withAdminAuth(handleDeleteUser)); 