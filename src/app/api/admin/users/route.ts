import { NextRequest } from 'next/server';
import { UserCreateSchema } from '@/lib/validators';
import { AuthService } from '@/lib/services/authService';
import { withAdminAuth, withErrorHandling, createSuccessResponse, createCreatedResponse } from '@/lib/response';
import { withValidation } from '@/lib/middleware/validation';
import type { UserCreateSchema as UserCreateType } from '@/lib/validators';

async function handleGetUsers(request: NextRequest) {
  const users = await AuthService.getAllUsers();
  return createSuccessResponse(users, 'Users retrieved successfully');
}

async function handleCreateUser(request: NextRequest, data: UserCreateType) {
  const { email, name, password, role } = data;
  
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();
  
  const user = await AuthService.createUser({
    email: normalizedEmail,
    name,
    password,
    role: role || 'user'
  });
  
  return createCreatedResponse(user, 'User created successfully');
}

export const GET = withErrorHandling(withAdminAuth(handleGetUsers));
export const POST = withErrorHandling(withAdminAuth(withValidation(UserCreateSchema)(handleCreateUser))); 