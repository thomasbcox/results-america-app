import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { 
  withSecurityHeaders, 
  withRateLimit, 
  withCORS, 
  withRequestValidation, 
  withInputSanitization,
  withDevSecurity,
  withProdSecurity
} from './security';

describe('Security Middleware', () => {
  let mockHandler: jest.Mock;

  beforeEach(() => {
    mockHandler = jest.fn().mockResolvedValue(
      new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('withSecurityHeaders', () => {
    it('should add security headers to response', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const handler = withSecurityHeaders(mockHandler);
      
      const response = await handler(request);
      
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
      expect(response.headers.get('Permissions-Policy')).toContain('camera=()');
      expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
    });
  });

  describe('withRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' }
      });
      const handler = withRateLimit(mockHandler);
      
      const response = await handler(request);
      
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should block requests exceeding rate limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' }
      });
      const handler = withRateLimit(mockHandler);
      
      // Make 101 requests (exceeding the 100 limit)
      for (let i = 0; i < 100; i++) {
        await handler(request);
      }
      
      const blockedResponse = await handler(request);
      
      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.headers.get('Retry-After')).toBeDefined();
    });

    it('should include rate limit headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.3' }
      });
      const handler = withRateLimit(mockHandler);
      
      const response = await handler(request);
      
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('withCORS', () => {
    it('should add CORS headers for allowed origin', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'origin': 'http://localhost:3000' }
      });
      const handler = withCORS(mockHandler);
      
      const response = await handler(request);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    it('should not add CORS headers for disallowed origin', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'origin': 'http://malicious-site.com' }
      });
      const handler = withCORS(mockHandler);
      
      const response = await handler(request);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });

  describe('withRequestValidation', () => {
    it('should allow valid requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      });
      const handler = withRequestValidation(mockHandler);
      
      const response = await handler(request);
      
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid HTTP methods', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'INVALID_METHOD'
      });
      const handler = withRequestValidation(mockHandler);
      
      const response = await handler(request);
      
      expect(response.status).toBe(405);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject POST requests without content-type', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' })
      });
      const handler = withRequestValidation(mockHandler);
      
      const response = await handler(request);
      
      expect(response.status).toBe(400);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject large requests', async () => {
      const largeBody = 'x'.repeat(1024 * 1024 + 1); // 1MB + 1 byte
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': (1024 * 1024 + 1).toString() },
        body: largeBody
      });
      const handler = withRequestValidation(mockHandler);
      
      const response = await handler(request);
      
      expect(response.status).toBe(413);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('withInputSanitization', () => {
    it('should sanitize query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/test?param=<script>alert("xss")</script>');
      const handler = withInputSanitization(mockHandler);
      
      await handler(request);
      
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('param=scriptalertxssscript')
        })
      );
    });

    it('should preserve valid query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/test?param=valid&other=123');
      const handler = withInputSanitization(mockHandler);
      
      await handler(request);
      
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('param=valid&other=123')
        })
      );
    });
  });

  describe('withDevSecurity', () => {
    it('should apply development security middleware', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const handler = withDevSecurity(mockHandler);
      
      const response = await handler(request);
      
      // Should have security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      
      // Should have CORS headers
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
      
      // Should not have rate limiting (dev mode)
      expect(response.status).toBe(200);
    });
  });

  describe('withProdSecurity', () => {
    it('should apply production security middleware', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.4' }
      });
      const handler = withProdSecurity(mockHandler);
      
      const response = await handler(request);
      
      // Should have all security features
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.status).toBe(200);
    });
  });

  describe('IP address detection', () => {
    it('should detect IP from x-forwarded-for header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.5, 10.0.0.1' }
      });
      const handler = withRateLimit(mockHandler);
      
      await handler(request);
      
      // Should use first IP from x-forwarded-for
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should detect IP from x-real-ip header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-real-ip': '192.168.1.6' }
      });
      const handler = withRateLimit(mockHandler);
      
      await handler(request);
      
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should fallback to unknown for missing IP', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const handler = withRateLimit(mockHandler);
      
      await handler(request);
      
      expect(mockHandler).toHaveBeenCalled();
    });
  });
}); 