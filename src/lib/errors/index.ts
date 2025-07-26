// Enhanced Error Handling System
// Provides consistent error patterns across all services

export class ServiceError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;
  public isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
  }

  static isServiceError(error: any): error is ServiceError {
    return error instanceof ServiceError;
  }
}

// Validation Errors
export class ValidationError extends ServiceError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class NotFoundError extends ServiceError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

export class RequiredFieldError extends ServiceError {
  constructor(field: string, details?: any) {
    super(`Required field missing: ${field}`, 'REQUIRED_FIELD_MISSING', 400, details);
  }
}

export class InvalidEmailError extends ServiceError {
  constructor(message: string = 'Invalid email format', details?: any) {
    super(message, 'INVALID_EMAIL', 400, details);
  }
}

// Database Errors
export class DatabaseError extends ServiceError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

export class ConstraintViolationError extends ServiceError {
  constructor(message: string = 'Database constraint violation', details?: any) {
    super(message, 'CONSTRAINT_VIOLATION', 400, details);
  }
}

// External Service Errors
export class ExternalServiceError extends ServiceError {
  constructor(message: string = 'External service error', details?: any) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, details);
  }
}

export class EmailServiceError extends ServiceError {
  constructor(message: string = 'Email service error', details?: any) {
    super(message, 'EMAIL_SERVICE_ERROR', 500, details);
  }
}

// Cache Errors
export class CacheMissError extends ServiceError {
  constructor(message: string = 'Cache miss', key?: string, details?: any) {
    super(message, 'CACHE_MISS', 404, details);
  }
}

export class CacheExpiredError extends ServiceError {
  constructor(message: string = 'Cache expired', key?: string, details?: any) {
    super(message, 'CACHE_EXPIRED', 404, details);
  }
}

// System Errors
export class RateLimitError extends ServiceError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
  }
}

export class SystemError extends ServiceError {
  constructor(message: string = 'System error', details?: any) {
    super(message, 'SYSTEM_ERROR', 500, details);
  }
}

export class ConfigurationError extends ServiceError {
  constructor(message: string = 'Configuration error', details?: any) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
  }
}

// ============================================================================
// ERROR FACTORY
// ============================================================================

export const ErrorFactory = {
  // Validation Errors
  validation: (message?: string, details?: any) => new ValidationError(message, details),
  notFound: (message?: string, details?: any) => new NotFoundError(message, details),
  requiredField: (field: string, details?: any) => new RequiredFieldError(field, details),
  invalidEmail: (message?: string, details?: any) => new InvalidEmailError(message, details),

  // Database Errors
  database: (message?: string, details?: any) => new DatabaseError(message, details),
  constraintViolation: (message?: string, details?: any) => new ConstraintViolationError(message, details),

  // External Service Errors
  externalService: (message?: string, details?: any) => new ExternalServiceError(message, details),
  emailService: (message?: string, details?: any) => new EmailServiceError(message, details),

  // Cache Errors
  cacheMiss: (message?: string, key?: string, details?: any) => new CacheMissError(message, key, details),
  cacheExpired: (message?: string, key?: string, details?: any) => new CacheExpiredError(message, key, details),

  // System Errors
  rateLimit: (message?: string, details?: any) => new RateLimitError(message, details),
  system: (message?: string, details?: any) => new SystemError(message, details),
  configuration: (message?: string, details?: any) => new ConfigurationError(message, details),
};

// ============================================================================
// ERROR RESPONSE UTILITIES
// ============================================================================

export interface ErrorResponse {
  error: string;
  code: string;
  statusCode: number;
  details?: any;
  timestamp: string;
}

export const createErrorResponse = (error: ServiceError): ErrorResponse => ({
  error: error.message,
  code: error.code,
  statusCode: error.statusCode,
  details: error.details,
  timestamp: new Date().toISOString(),
});

export const logError = (error: Error, context?: any) => {
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
  });
}; 