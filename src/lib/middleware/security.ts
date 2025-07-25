// Security Middleware - Adds security headers and implements security checks
// Provides protection against common web vulnerabilities

import { NextRequest, NextResponse } from 'next/server';
import { composeMiddleware } from './auth';

// Security headers configuration
const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),
  
  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '),
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // Max 100 requests per window
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

// IP-based rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Add security headers to response
 */
export function withSecurityHeaders(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const response = await handler(request);
    
    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const clientIP = getClientIP(request);
    const now = Date.now();
    
    // Get or create rate limit entry
    let rateLimit = rateLimitStore.get(clientIP);
    if (!rateLimit || now > rateLimit.resetTime) {
      rateLimit = {
        count: 0,
        resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      };
      rateLimitStore.set(clientIP, rateLimit);
    }
    
    // Check rate limit
    if (rateLimit.count >= RATE_LIMIT_CONFIG.maxRequests) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000).toString(),
          },
        }
      );
    }
    
    // Increment counter
    rateLimit.count++;
    
    const response = await handler(request);
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', (RATE_LIMIT_CONFIG.maxRequests - rateLimit.count).toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());
    
    return response;
  };
}

/**
 * CORS middleware
 */
export function withCORS(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const response = await handler(request);
    
    // Add CORS headers
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3050'];
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    return response;
  };
}

/**
 * Request validation middleware
 */
export function withRequestValidation(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    // Validate request method
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    if (!allowedMethods.includes(request.method)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED',
        }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Validate content type for POST/PUT requests
    if (['POST', 'PUT'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Content-Type must be application/json',
            code: 'INVALID_CONTENT_TYPE',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
    
    // Validate request size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Request too large',
          code: 'REQUEST_TOO_LARGE',
        }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return handler(request);
  };
}

/**
 * Input sanitization middleware
 */
export function withInputSanitization(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    // Sanitize query parameters
    const url = new URL(request.url);
    const sanitizedParams = new URLSearchParams();
    
    for (const [key, value] of url.searchParams.entries()) {
      // Remove potentially dangerous characters
      const sanitizedKey = key.replace(/[<>\"'&]/g, '');
      const sanitizedValue = value.replace(/[<>\"'&]/g, '');
      sanitizedParams.set(sanitizedKey, sanitizedValue);
    }
    
    // Create sanitized URL
    const sanitizedUrl = new URL(request.url);
    sanitizedUrl.search = sanitizedParams.toString();
    
    // Create sanitized request
    const sanitizedRequest = new NextRequest(sanitizedUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    return handler(sanitizedRequest);
  };
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  // Check for forwarded headers (when behind proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Check for real IP header
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to connection remote address
  return request.ip || 'unknown';
}

/**
 * Clean up rate limit store periodically
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [ip, rateLimit] of rateLimitStore.entries()) {
    if (now > rateLimit.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

// Clean up rate limit store every 15 minutes
setInterval(cleanupRateLimitStore, 15 * 60 * 1000);

/**
 * Compose security middleware
 */
export const withSecurity = composeMiddleware([
  withSecurityHeaders,
  withRateLimit,
  withCORS,
  withRequestValidation,
  withInputSanitization,
]);

/**
 * Development-only security middleware (less restrictive)
 */
export const withDevSecurity = composeMiddleware([
  withSecurityHeaders,
  withCORS,
  withRequestValidation,
]);

/**
 * Production security middleware (full security)
 */
export const withProdSecurity = composeMiddleware([
  withSecurityHeaders,
  withRateLimit,
  withCORS,
  withRequestValidation,
  withInputSanitization,
]); 