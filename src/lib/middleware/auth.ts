// Enhanced Authentication Middleware
// Provides middleware composition and authentication utilities

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../services/authService';
import { ServiceError, createError } from '../errors';

export interface AuthContext {
  user: any;
  session: any;
  request: NextRequest;
}

// Core authentication functions
export async function authenticateUser(request: NextRequest): Promise<AuthContext> {
  const sessionToken = request.cookies.get('session_token')?.value;
  
  if (!sessionToken) {
    throw createError.authentication('Authentication required');
  }

  const user = await AuthService.validateSession(sessionToken);
  
  if (!user) {
    throw createError.sessionExpired('Session expired or invalid');
  }

  if (!user.isActive) {
    throw createError.authorization('User account is deactivated');
  }

  return {
    user,
    session: { token: sessionToken },
    request
  };
}

export async function authenticateAdmin(request: NextRequest): Promise<AuthContext> {
  const authContext = await authenticateUser(request);
  
  if (authContext.user.role !== 'admin') {
    throw createError.authorization('Admin access required');
  }

  return authContext;
}

export async function getOptionalAuth(request: NextRequest): Promise<AuthContext | null> {
  try {
    return await authenticateUser(request);
  } catch (error) {
    return null;
  }
}

// Middleware composition utilities
export function composeMiddleware<T extends unknown[]>(
  ...middlewares: ((handler: any) => any)[]
) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

// Authentication middleware wrappers
export function withAuth<T extends unknown[]>(
  handler: (authContext: AuthContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authContext = await authenticateUser(request);
      return await handler(authContext, ...args);
    } catch (error) {
      if (ServiceError.isServiceError(error)) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            statusCode: error.statusCode,
            timestamp: new Date().toISOString()
          },
          { status: error.statusCode }
        );
      }
      
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Internal server error', statusCode: 500, timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }
  };
}

export function withAdminAuth<T extends unknown[]>(
  handler: (authContext: AuthContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authContext = await authenticateAdmin(request);
      return await handler(authContext, ...args);
    } catch (error) {
      if (ServiceError.isServiceError(error)) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            statusCode: error.statusCode,
            timestamp: new Date().toISOString()
          },
          { status: error.statusCode }
        );
      }
      
      console.error('Admin authentication error:', error);
      return NextResponse.json(
        { error: 'Internal server error', statusCode: 500, timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }
  };
}

export function withOptionalAuth<T extends unknown[]>(
  handler: (authContext: AuthContext | null, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authContext = await getOptionalAuth(request);
      return await handler(authContext, ...args);
    } catch (error) {
      console.error('Optional authentication error:', error);
      return NextResponse.json(
        { error: 'Internal server error', statusCode: 500, timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }
  };
}

// Role-based middleware
export function requireRole(role: string) {
  return function<T extends unknown[]>(
    handler: (authContext: AuthContext, ...args: T) => Promise<NextResponse>
  ) {
    return withAuth(async (authContext: AuthContext, ...args: T) => {
      if (authContext.user.role !== role) {
        throw createError.authorization(`Role '${role}' required`);
      }
      return await handler(authContext, ...args);
    });
  };
}

export function requireAnyRole(roles: string[]) {
  return function<T extends unknown[]>(
    handler: (authContext: AuthContext, ...args: T) => Promise<NextResponse>
  ) {
    return withAuth(async (authContext: AuthContext, ...args: T) => {
      if (!roles.includes(authContext.user.role)) {
        throw createError.authorization(`One of roles [${roles.join(', ')}] required`);
      }
      return await handler(authContext, ...args);
    });
  };
}

// Rate limiting middleware
export function withRateLimit(
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  
  return function<T extends unknown[]>(
    handler: (authContext: AuthContext, ...args: T) => Promise<NextResponse>
  ) {
    return withAuth(async (authContext: AuthContext, ...args: T) => {
      const identifier = authContext.user.id.toString();
      const now = Date.now();
      const key = `${identifier}:${Math.floor(now / windowMs)}`;
      
      const current = rateLimitMap.get(key);
      
      if (!current || now > current.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      } else if (current.count >= limit) {
        throw createError.rateLimit('Rate limit exceeded');
      } else {
        current.count++;
      }
      
      return await handler(authContext, ...args);
    });
  };
}

// Request logging middleware
export function withRequestLogging<T extends unknown[]>(
  handler: (authContext: AuthContext, ...args: T) => Promise<NextResponse>
) {
  return withAuth(async (authContext: AuthContext, ...args: T) => {
    const startTime = Date.now();
    
    try {
      const response = await handler(authContext, ...args);
      
      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] ${authContext.request.method} ${authContext.request.url} - ${response.status} - ${duration}ms - User: ${authContext.user.email}`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${new Date().toISOString()}] ${authContext.request.method} ${authContext.request.url} - ERROR - ${duration}ms - User: ${authContext.user.email}`, error);
      throw error;
    }
  });
}

// Validation middleware
export function withValidation<T>(
  validator: (data: any) => T
) {
  return function<U extends unknown[]>(
    handler: (validatedData: T, authContext: AuthContext, ...args: U) => Promise<NextResponse>
  ) {
    return withAuth(async (authContext: AuthContext, ...args: U) => {
      let validatedData: T;
      
      try {
        const body = await authContext.request.json();
        validatedData = validator(body);
      } catch (error) {
        throw createError.validation('Invalid request body', error);
      }
      
      return await handler(validatedData, authContext, ...args);
    });
  };
}

// Query parameter validation middleware
export function withQueryValidation<T>(
  validator: (params: URLSearchParams) => T
) {
  return function<U extends unknown[]>(
    handler: (validatedParams: T, authContext: AuthContext, ...args: U) => Promise<NextResponse>
  ) {
    return withAuth(async (authContext: AuthContext, ...args: U) => {
      let validatedParams: T;
      
      try {
        const url = new URL(authContext.request.url);
        validatedParams = validator(url.searchParams);
      } catch (error) {
        throw createError.validation('Invalid query parameters', error);
      }
      
      return await handler(validatedParams, authContext, ...args);
    });
  };
}

// Common middleware compositions
export const withAdminAuthAndLogging = composeMiddleware(
  withRequestLogging,
  withAdminAuth
);

export const withAuthAndRateLimit = composeMiddleware(
  withRateLimit(),
  withRequestLogging,
  withAuth
);

export const withAdminAuthAndValidation = <T>(validator: (data: any) => T) =>
  composeMiddleware(
    withValidation(validator),
    withRequestLogging,
    withAdminAuth
  ); 