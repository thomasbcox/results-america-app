import { NextRequest } from 'next/server';
import { AuthService } from '../services/authService';
import { 
  requireAuthentication, 
  requireAdminRole, 
  AuthenticationError, 
  AuthorizationError 
} from '../errors';

// Authentication middleware types
export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
}

export interface AuthContext {
  user: AuthenticatedUser;
  sessionToken: string;
}

// Authentication middleware functions
export async function authenticateUser(request: NextRequest): Promise<AuthContext> {
  const sessionToken = request.cookies.get('session_token')?.value;
  
  requireAuthentication(sessionToken);
  
  const user = await AuthService.getUserFromSession(sessionToken);
  
  if (!user) {
    throw new AuthenticationError('Invalid session');
  }
  
  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated');
  }
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
    },
    sessionToken,
  };
}

export async function authenticateAdmin(request: NextRequest): Promise<AuthContext> {
  const authContext = await authenticateUser(request);
  
  requireAdminRole(authContext.user.role);
  
  return authContext;
}

// Middleware wrapper functions
export function withAuth<T extends unknown[]>(
  handler: (authContext: AuthContext, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const authContext = await authenticateUser(request);
    return handler(authContext, ...args);
  };
}

export function withAdminAuth<T extends unknown[]>(
  handler: (authContext: AuthContext, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const authContext = await authenticateAdmin(request);
    return handler(authContext, ...args);
  };
}

// Optional authentication (doesn't throw if no auth)
export async function getOptionalAuth(request: NextRequest): Promise<AuthContext | null> {
  try {
    return await authenticateUser(request);
  } catch {
    return null;
  }
} 