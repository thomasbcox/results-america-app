// Custom error types
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, public originalError?: unknown) {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

// Error response interface
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}

// Error handling utilities
export function createErrorResponse(error: unknown): ErrorResponse {
  const timestamp = new Date().toISOString();
  
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      details: error instanceof ValidationError ? error.details : undefined,
      timestamp,
    };
  }
  
  if (error instanceof Error) {
    return {
      error: error.message,
      timestamp,
    };
  }
  
  return {
    error: 'An unexpected error occurred',
    timestamp,
  };
}

export function getStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  
  return 500;
}

// Database error handling
export function handleDatabaseError(error: unknown): never {
  if (error instanceof Error) {
    // Handle SQLite unique constraint errors
    if (error.message.includes('SQLITE_CONSTRAINT_UNIQUE') || 
        error.message.includes('UNIQUE constraint failed')) {
      throw new ConflictError('Resource already exists');
    }
    
    // Handle foreign key constraint errors
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      throw new ValidationError('Referenced resource does not exist');
    }
  }
  
  throw new DatabaseError('Database operation failed', error);
}

// Authentication error handling
export function requireAuthentication(sessionToken?: string): void {
  if (!sessionToken) {
    throw new AuthenticationError();
  }
}

export function requireAdminRole(userRole?: string): void {
  if (userRole !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }
}

// Common error messages
export const ErrorMessages = {
  INVALID_JSON: 'Invalid JSON in request body',
  MISSING_REQUIRED_FIELD: (field: string) => `Missing required field: ${field}`,
  INVALID_EMAIL: 'Invalid email format',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  USER_NOT_FOUND: 'User not found',
  STATISTIC_NOT_FOUND: 'Statistic not found',
  STATE_NOT_FOUND: 'State not found',
  CATEGORY_NOT_FOUND: 'Category not found',
  DATA_SOURCE_NOT_FOUND: 'Data source not found',
  DUPLICATE_EMAIL: 'User with this email already exists',
  DUPLICATE_STATISTIC: 'Statistic with this RA number already exists',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_ALREADY_USED: 'Token has already been used',
  IMPORT_FAILED: 'Data import failed',
  EXTERNAL_API_ERROR: 'External API request failed',
} as const; 