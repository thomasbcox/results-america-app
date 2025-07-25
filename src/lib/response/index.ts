// Enhanced Response Utilities
// Provides consistent response patterns and error handling

import { NextRequest, NextResponse } from 'next/server';
import { ServiceError, createErrorResponse, logError } from '../errors';

// Response wrapper types
export type ApiHandler<T extends unknown[] = []> = (
  request: NextRequest,
  ...args: T
) => Promise<NextResponse>;

export type AuthenticatedHandler<T extends unknown[] = []> = (
  authContext: { user: any; session: any },
  request: NextRequest,
  ...args: T
) => Promise<NextResponse>;

// Success response helpers
export const createSuccessResponse = (
  data: any,
  message?: string,
  statusCode: number = 200
): NextResponse => {
  const response: any = { success: true, data };
  
  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, { status: statusCode });
};

export const createCreatedResponse = (
  data: any,
  message?: string
): NextResponse => {
  return createSuccessResponse(data, message, 201);
};

export const createNoContentResponse = (): NextResponse => {
  return new NextResponse(null, { status: 204 });
};

// Error response helpers
export const createErrorResponse = (
  error: ServiceError
): NextResponse => {
  const errorResponse = {
    success: false,
    error: error.message,
    code: error.code,
    details: error.details,
  };
  return NextResponse.json(errorResponse, { status: error.statusCode });
};

export const createNotFoundResponse = (
  message: string = 'Resource not found'
): NextResponse => {
  return NextResponse.json(
    { error: message, code: 'NOT_FOUND', statusCode: 404, timestamp: new Date().toISOString() },
    { status: 404 }
  );
};

export const createBadRequestResponse = (
  message: string = 'Bad request',
  details?: any
): NextResponse => {
  return NextResponse.json(
    { error: message, code: 'BAD_REQUEST', statusCode: 400, details, timestamp: new Date().toISOString() },
    { status: 400 }
  );
};

export const createUnauthorizedResponse = (
  message: string = 'Unauthorized'
): NextResponse => {
  return NextResponse.json(
    { error: message, code: 'UNAUTHORIZED', statusCode: 401, timestamp: new Date().toISOString() },
    { status: 401 }
  );
};

export const createForbiddenResponse = (
  message: string = 'Forbidden'
): NextResponse => {
  return NextResponse.json(
    { error: message, code: 'FORBIDDEN', statusCode: 403, timestamp: new Date().toISOString() },
    { status: 403 }
  );
};

export const createInternalServerErrorResponse = (
  message: string = 'Internal server error'
): NextResponse => {
  return NextResponse.json(
    { error: message, code: 'INTERNAL_SERVER_ERROR', statusCode: 500, timestamp: new Date().toISOString() },
    { status: 500 }
  );
};

// Error handling wrapper
export const withErrorHandling = <T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
): ApiHandler<T> => {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      // Log the error
      logError(error as Error, { 
        url: request.url, 
        method: request.method,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      });

      // Handle ServiceError instances
      if (ServiceError.isServiceError(error)) {
        return createErrorResponse(error);
      }

      // Handle other errors
      console.error('Unhandled error:', error);
      return createInternalServerErrorResponse();
    }
  };
};

// Authentication wrapper
export const withAuth = <T extends unknown[]>(
  handler: AuthenticatedHandler<T>
): ApiHandler<T> => {
  return withErrorHandling(async (request: NextRequest, ...args: T) => {
    const sessionToken = request.cookies.get('session_token')?.value;
    
    if (!sessionToken) {
      throw new ServiceError('Authentication required', 'AUTHENTICATION_REQUIRED', 401);
    }

    // TODO: Implement session validation
    // const user = await AuthService.validateSession(sessionToken);
    // if (!user) {
    //   throw new ServiceError('Invalid session', 'INVALID_SESSION', 401);
    // }

    // For now, create a mock auth context
    const authContext = {
      user: { id: 1, email: 'admin@example.com', role: 'admin' },
      session: { token: sessionToken }
    };

    return handler(authContext, request, ...args);
  });
};

// Admin authentication wrapper
export const withAdminAuth = <T extends unknown[]>(
  handler: AuthenticatedHandler<T>
): ApiHandler<T> => {
  return withAuth(async (authContext, request: NextRequest, ...args: T) => {
    if (authContext.user.role !== 'admin') {
      throw new ServiceError('Admin access required', 'ADMIN_ACCESS_REQUIRED', 403);
    }

    return handler(authContext, request, ...args);
  });
};

// Validation helpers
export const validateRequestBody = <T>(
  schema: any,
  body: any
): T => {
  try {
    return schema.parse(body);
  } catch (error) {
    throw new ServiceError(
      'Invalid request body',
      'VALIDATION_ERROR',
      400,
      error
    );
  }
};

export const validateQueryParams = <T>(
  schema: any,
  params: URLSearchParams
): T => {
  try {
    const queryObject = Object.fromEntries(params.entries());
    return schema.parse(queryObject);
  } catch (error) {
    throw new ServiceError(
      'Invalid query parameters',
      'VALIDATION_ERROR',
      400,
      error
    );
  }
};

// Pagination helpers
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number = 1,
  limit: number = 10
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean => {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / windowMs)}`;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
};

// CORS helpers
export const addCorsHeaders = (response: NextResponse): NextResponse => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
};

// Cache control helpers
export const addCacheHeaders = (
  response: NextResponse,
  maxAge: number = 300, // 5 minutes
  staleWhileRevalidate: number = 60 // 1 minute
): NextResponse => {
  response.headers.set(
    'Cache-Control',
    `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  );
  
  return response;
};

export const addNoCacheHeaders = (response: NextResponse): NextResponse => {
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}; 