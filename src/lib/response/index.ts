// Enhanced Response Utilities
// Provides consistent response patterns and error handling

import { NextRequest, NextResponse } from 'next/server';
import { ServiceError, createErrorResponse as createServiceErrorResponse, logError } from '../errors';

// Response wrapper types
export type ApiHandler<T extends unknown[] = []> = (
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
    { 
      success: false,
      error: message, 
      code: 'INTERNAL_SERVER_ERROR', 
      statusCode: 500, 
      timestamp: new Date().toISOString() 
    },
    { status: 500 }
  );
};

// ============================================================================
// MIDDLEWARE HELPERS
// ============================================================================

export const withErrorHandling = <T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
): ApiHandler<T> => {
  return async (request: NextRequest, ...args: T) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      logError(error as Error, { 
        url: request.url, 
        method: request.method,
        args 
      });

      if (ServiceError.isServiceError(error)) {
        return createErrorResponse(error);
      }

      return createInternalServerErrorResponse();
    }
  };
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

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
    const paramObject = Object.fromEntries(params.entries());
    return schema.parse(paramObject);
  } catch (error) {
    throw new ServiceError(
      'Invalid query parameters',
      'VALIDATION_ERROR',
      400,
      error
    );
  }
};

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

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

// ============================================================================
// UTILITY HELPERS
// ============================================================================

export const checkRateLimit = (
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean => {
  // TODO: Implement rate limiting logic
  // This is a placeholder for future rate limiting implementation
  return true;
};

export const addCorsHeaders = (response: NextResponse): NextResponse => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
};

export const addCacheHeaders = (
  response: NextResponse,
  maxAge: number = 300, // 5 minutes
  staleWhileRevalidate: number = 60 // 1 minute
): NextResponse => {
  response.headers.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
  return response;
};

export const addNoCacheHeaders = (response: NextResponse): NextResponse => {
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}; 