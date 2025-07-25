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

// Authentication Errors
export class AuthenticationError extends ServiceError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 'AUTHENTICATION_REQUIRED', 401, details);
  }
}

export class AuthorizationError extends ServiceError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 'ACCESS_DENIED', 403, details);
  }
}

export class InvalidCredentialsError extends ServiceError {
  constructor(message: string = 'Invalid email or password', details?: any) {
    super(message, 'INVALID_CREDENTIALS', 401, details);
  }
}

export class SessionExpiredError extends ServiceError {
  constructor(message: string = 'Session expired', details?: any) {
    super(message, 'SESSION_EXPIRED', 401, details);
  }
}

// User Management Errors
export class UserNotFoundError extends ServiceError {
  constructor(message: string = 'User not found', details?: any) {
    super(message, 'USER_NOT_FOUND', 404, details);
  }
}

export class UserAlreadyExistsError extends ServiceError {
  constructor(message: string = 'User already exists', details?: any) {
    super(message, 'USER_ALREADY_EXISTS', 409, details);
  }
}

export class InvalidUserRoleError extends ServiceError {
  constructor(message: string = 'Invalid user role', details?: any) {
    super(message, 'INVALID_USER_ROLE', 400, details);
  }
}

// Password Reset Errors
export class InvalidResetTokenError extends ServiceError {
  constructor(message: string = 'Invalid or expired reset token', details?: any) {
    super(message, 'INVALID_RESET_TOKEN', 400, details);
  }
}

export class PasswordResetTokenExpiredError extends ServiceError {
  constructor(message: string = 'Password reset token expired', details?: any) {
    super(message, 'RESET_TOKEN_EXPIRED', 400, details);
  }
}

export class WeakPasswordError extends ServiceError {
  constructor(message: string = 'Password is too weak', details?: any) {
    super(message, 'WEAK_PASSWORD', 400, details);
  }
}

// Magic Link Errors
export class InvalidMagicLinkError extends ServiceError {
  constructor(message: string = 'Invalid magic link', details?: any) {
    super(message, 'INVALID_MAGIC_LINK', 400, details);
  }
}

export class MagicLinkExpiredError extends ServiceError {
  constructor(message: string = 'Magic link expired', details?: any) {
    super(message, 'MAGIC_LINK_EXPIRED', 400, details);
  }
}

export class MagicLinkAlreadyUsedError extends ServiceError {
  constructor(message: string = 'Magic link already used', details?: any) {
    super(message, 'MAGIC_LINK_ALREADY_USED', 400, details);
  }
}

// Validation Errors
export class ValidationError extends ServiceError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class RequiredFieldError extends ServiceError {
  constructor(field: string, details?: any) {
    super(`${field} is required`, 'REQUIRED_FIELD', 400, details);
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
    super(message, 'DATABASE_ERROR', 500, details, false);
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
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, details, false);
  }
}

export class EmailServiceError extends ServiceError {
  constructor(message: string = 'Email service error', details?: any) {
    super(message, 'EMAIL_SERVICE_ERROR', 502, details, false);
  }
}

// Rate Limiting Errors
export class RateLimitError extends ServiceError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
  }
}

// System Errors
export class SystemError extends ServiceError {
  constructor(message: string = 'System error', details?: any) {
    super(message, 'SYSTEM_ERROR', 500, details, false);
  }
}

export class ConfigurationError extends ServiceError {
  constructor(message: string = 'Configuration error', details?: any) {
    super(message, 'CONFIGURATION_ERROR', 500, details, false);
  }
}

// Error Factory Functions
export const createError = {
  authentication: (message?: string, details?: any) => new AuthenticationError(message, details),
  authorization: (message?: string, details?: any) => new AuthorizationError(message, details),
  invalidCredentials: (message?: string, details?: any) => new InvalidCredentialsError(message, details),
  sessionExpired: (message?: string, details?: any) => new SessionExpiredError(message, details),
  userNotFound: (message?: string, details?: any) => new UserNotFoundError(message, details),
  userAlreadyExists: (message?: string, details?: any) => new UserAlreadyExistsError(message, details),
  invalidUserRole: (message?: string, details?: any) => new InvalidUserRoleError(message, details),
  invalidResetToken: (message?: string, details?: any) => new InvalidResetTokenError(message, details),
  passwordResetTokenExpired: (message?: string, details?: any) => new PasswordResetTokenExpiredError(message, details),
  weakPassword: (message?: string, details?: any) => new WeakPasswordError(message, details),
  invalidMagicLink: (message?: string, details?: any) => new InvalidMagicLinkError(message, details),
  magicLinkExpired: (message?: string, details?: any) => new MagicLinkExpiredError(message, details),
  magicLinkAlreadyUsed: (message?: string, details?: any) => new MagicLinkAlreadyUsedError(message, details),
  validation: (message?: string, details?: any) => new ValidationError(message, details),
  requiredField: (field: string, details?: any) => new RequiredFieldError(field, details),
  invalidEmail: (message?: string, details?: any) => new InvalidEmailError(message, details),
  database: (message?: string, details?: any) => new DatabaseError(message, details),
  constraintViolation: (message?: string, details?: any) => new ConstraintViolationError(message, details),
  externalService: (message?: string, details?: any) => new ExternalServiceError(message, details),
  emailService: (message?: string, details?: any) => new EmailServiceError(message, details),
  rateLimit: (message?: string, details?: any) => new RateLimitError(message, details),
  system: (message?: string, details?: any) => new SystemError(message, details),
  configuration: (message?: string, details?: any) => new ConfigurationError(message, details),
};

// Error Response Helper
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

// Error Logging Helper
export const logError = (error: Error, context?: any) => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  if (ServiceError.isServiceError(error)) {
    errorInfo['code'] = error.code;
    errorInfo['statusCode'] = error.statusCode;
    errorInfo['isOperational'] = error.isOperational;
  }

  console.error('Application Error:', errorInfo);
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error tracking service (Sentry, etc.)
  }
}; 