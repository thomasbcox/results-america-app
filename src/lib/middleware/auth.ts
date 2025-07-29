import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../services/authService';
import { createUnauthorizedResponse } from '../response';

export interface AuthenticatedRequest extends NextRequest {
  user?: any;
}

/**
 * Middleware to require authentication
 */
export async function withAuth(
  request: AuthenticatedRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return createUnauthorizedResponse('Authentication required');
    }

    const user = await AuthService.getUserBySession(sessionToken);

    if (!user) {
      return createUnauthorizedResponse('Invalid or expired session');
    }

    if (!user.isActive) {
      return createUnauthorizedResponse('Account is deactivated');
    }

    request.user = user;
    return await handler(request);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return createUnauthorizedResponse('Authentication failed');
  }
}

/**
 * Middleware to require admin role
 */
export async function withAdminAuth(
  request: AuthenticatedRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return createUnauthorizedResponse('Authentication required');
    }

    const user = await AuthService.getUserBySession(sessionToken);

    if (!user) {
      return createUnauthorizedResponse('Invalid or expired session');
    }

    if (!user.isActive) {
      return createUnauthorizedResponse('Account is deactivated');
    }

    if (user.role !== 'admin') {
      return createUnauthorizedResponse('Admin access required');
    }

    request.user = user;
    return await handler(request);
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return createUnauthorizedResponse('Authentication failed');
  }
}

/**
 * Helper function to get authenticated admin user
 */
export async function getAdminUser(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return null;
    }

    const user = await AuthService.getUserBySession(sessionToken);

    if (!user || !user.isActive || user.role !== 'admin') {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Get admin user error:', error);
    return null;
  }
}

/**
 * Optional authentication middleware
 */
export async function withOptionalAuth(
  request: AuthenticatedRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (sessionToken) {
      const user = await AuthService.getUserBySession(sessionToken);
      if (user && user.isActive) {
        request.user = user;
      }
    }

    return await handler(request);
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Continue without authentication
    return await handler(request);
  }
} 