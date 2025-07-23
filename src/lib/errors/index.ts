// Custom error classes for better error handling and classification

export class DatabaseError extends Error {
  constructor(message: string, public readonly code: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field: string, public readonly value?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CacheMissError extends Error {
  constructor(message: string, public readonly key: string) {
    super(message);
    this.name = 'CacheMissError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public readonly statusCode?: number, public readonly url?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string, public readonly resource: string, public readonly id?: string | number) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string, public readonly reason: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Error utility functions
export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
} 