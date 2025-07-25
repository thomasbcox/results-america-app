import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { MagicLinkService } from '@/lib/services/magicLinkService';

// Mock the services
jest.mock('@/lib/services/magicLinkService');

describe('/api/auth/magic-link', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/magic-link', () => {
    it('should create magic link successfully', async () => {
      const mockMagicLinkUrl = 'http://localhost:3000/auth/verify?token=abc123';
      (MagicLinkService.createMagicLink as jest.Mock).mockResolvedValue(mockMagicLinkUrl);

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          name: 'Test User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.magicLinkUrl).toBe(mockMagicLinkUrl);
      expect(data.message).toBe('Magic link sent to your email');

      expect(MagicLinkService.createMagicLink).toHaveBeenCalledWith({
        email: 'user@example.com',
        name: 'Test User',
      });
    });

    it('should create magic link with email only', async () => {
      const mockMagicLinkUrl = 'http://localhost:3000/auth/verify?token=abc123';
      (MagicLinkService.createMagicLink as jest.Mock).mockResolvedValue(mockMagicLinkUrl);

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.magicLinkUrl).toBe(mockMagicLinkUrl);

      expect(MagicLinkService.createMagicLink).toHaveBeenCalledWith({
        email: 'user@example.com',
        name: undefined,
      });
    });

    it('should return 400 for missing email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email is required');
    });

    it('should return 400 for empty email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: '',
          name: 'Test User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email is required');
    });

    it('should return 400 for whitespace-only email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: '   ',
          name: 'Test User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email is required');
    });

    it('should handle service errors gracefully', async () => {
      (MagicLinkService.createMagicLink as jest.Mock).mockRejectedValue(
        new Error('Failed to send magic link')
      );

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          name: 'Test User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to send magic link');
    });

    it('should handle validation errors from service', async () => {
      (MagicLinkService.createMagicLink as jest.Mock).mockRejectedValue(
        new Error('Invalid email format')
      );

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          name: 'Test User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid email format');
    });

    it('should handle deactivated user account', async () => {
      (MagicLinkService.createMagicLink as jest.Mock).mockRejectedValue(
        new Error('User account is deactivated')
      );

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'deactivated@example.com',
          name: 'Deactivated User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User account is deactivated');
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should normalize email case', async () => {
      const mockMagicLinkUrl = 'http://localhost:3000/auth/verify?token=abc123';
      (MagicLinkService.createMagicLink as jest.Mock).mockResolvedValue(mockMagicLinkUrl);

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'USER@EXAMPLE.COM',
          name: 'Test User',
        }),
      });

      await POST(request);

      expect(MagicLinkService.createMagicLink).toHaveBeenCalledWith({
        email: 'user@example.com', // Should be normalized to lowercase
        name: 'Test User',
      });
    });

    it('should handle email service errors', async () => {
      (MagicLinkService.createMagicLink as jest.Mock).mockRejectedValue(
        new Error('Failed to send magic link')
      );

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          name: 'Test User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to send magic link');
    });

    it('should handle database errors', async () => {
      (MagicLinkService.createMagicLink as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com',
          name: 'Test User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle missing content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          name: 'Test User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid JSON');
    });
  });
}); 