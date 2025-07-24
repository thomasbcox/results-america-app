import { NextResponse } from 'next/server';
import { createErrorResponse, getStatusCode, AppError } from '../errors';

// Response interfaces
export interface SuccessResponse<T = unknown> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

// Response helper functions
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = {
    data,
    message,
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(response, { status });
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / limit);
  
  const response: PaginatedResponse<T> = {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(response);
}

export function createErrorResponseHandler(error: unknown): NextResponse {
  const errorResponse = createErrorResponse(error);
  const statusCode = getStatusCode(error);
  
  console.error('API Error:', {
    error: errorResponse,
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  return NextResponse.json(errorResponse, { status: statusCode });
}

// Common response patterns
export function createCreatedResponse<T>(data: T, message?: string): NextResponse<SuccessResponse<T>> {
  return createSuccessResponse(data, message, 201);
}

export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function createNotFoundResponse(resource: string): NextResponse {
  return createErrorResponseHandler(new AppError(`${resource} not found`, 404));
}

export function createConflictResponse(message: string): NextResponse {
  return createErrorResponseHandler(new AppError(message, 409));
}

export function createValidationErrorResponse(message: string, details?: unknown): NextResponse {
  return createErrorResponseHandler(new AppError(message, 400, 'VALIDATION_ERROR'));
}

export function createAuthenticationErrorResponse(): NextResponse {
  return createErrorResponseHandler(new AppError('Authentication required', 401));
}

export function createAuthorizationErrorResponse(): NextResponse {
  return createErrorResponseHandler(new AppError('Insufficient permissions', 403));
}

// Response wrapper for async route handlers
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponseHandler(error);
    }
  };
}

// Response wrapper for validation + error handling
export function withValidation<T, R>(
  validator: (data: unknown) => T,
  handler: (validatedData: T, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (data: unknown, ...args: unknown[]): Promise<NextResponse> => {
    try {
      const validatedData = validator(data);
      return await handler(validatedData, ...args);
    } catch (error) {
      return createErrorResponseHandler(error);
    }
  };
} 