import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GET } from './route';
import { createSuccessResponse, createBadRequestResponse } from '@/lib/response';

// Mock dependencies
jest.mock('@/lib/response');
jest.mock('@/lib/middleware/auth');

const mockCreateSuccessResponse = createSuccessResponse as jest.MockedFunction<typeof createSuccessResponse>;
const mockCreateBadRequestResponse = createBadRequestResponse as jest.MockedFunction<typeof createBadRequestResponse>;

// Mock fetch globally
global.fetch = jest.fn();

describe('Debug Session API Route', () => {
  let mockRequest: any;
  let mockCookies: any;
  let mockHeaders: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock cookies
    mockCookies = {
      getAll: jest.fn().mockReturnValue([
        { name: 'session_token', value: 'test-session-token' },
        { name: 'other_cookie', value: 'other-value' }
      ]),
      get: jest.fn().mockImplementation((name: string) => {
        if (name === 'session_token') {
          return { value: 'test-session-token' };
        }
        return undefined;
      })
    };

    // Setup mock headers
    mockHeaders = {
      get: jest.fn().mockImplementation((name: string) => {
        switch (name) {
          case 'user-agent':
            return 'Mozilla/5.0 (Test Browser)';
          case 'referer':
            return 'https://test.com/referer';
          case 'origin':
            return 'https://test.com';
          default:
            return null;
        }
      })
    };

    // Setup mock request
    mockRequest = {
      cookies: mockCookies,
      headers: mockHeaders,
      nextUrl: {
        origin: 'https://test.com'
      }
    };

    // Setup default mock implementations
    mockCreateSuccessResponse.mockReturnValue({
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true })
    });

    mockCreateBadRequestResponse.mockReturnValue({
      status: 400,
      json: jest.fn().mockResolvedValue({ success: false, error: 'Bad request' })
    });

    // Mock fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' }
      })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/debug-session', () => {
    it('should return debug info with session token', async () => {
      const response = await GET(mockRequest);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        cookies: [
          { name: 'session_token', value: 'test-session-token' },
          { name: 'other_cookie', value: 'other-value' }
        ],
        sessionToken: 'test-session-token',
        hasSessionToken: true,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        referer: 'https://test.com/referer',
        origin: 'https://test.com',
        userData: {
          success: true,
          user: { id: 1, email: 'test@example.com' }
        }
      });
      expect(response.status).toBe(200);
    });

    it('should handle request without session token', async () => {
      mockCookies.getAll.mockReturnValue([
        { name: 'other_cookie', value: 'other-value' }
      ]);
      mockCookies.get.mockReturnValue(undefined);

      const response = await GET(mockRequest);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        cookies: [
          { name: 'other_cookie', value: 'other-value' }
        ],
        sessionToken: 'not found',
        hasSessionToken: false,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        referer: 'https://test.com/referer',
        origin: 'https://test.com'
      });
      expect(response.status).toBe(200);
    });

    it('should handle user data fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const response = await GET(mockRequest);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        cookies: [
          { name: 'session_token', value: 'test-session-token' },
          { name: 'other_cookie', value: 'other-value' }
        ],
        sessionToken: 'test-session-token',
        hasSessionToken: true,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        referer: 'https://test.com/referer',
        origin: 'https://test.com',
        userDataError: 'Network error'
      });
      expect(response.status).toBe(200);
    });

    it('should handle user data fetch with non-Error exception', async () => {
      (global.fetch as jest.Mock).mockRejectedValue('String error');

      const response = await GET(mockRequest);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        cookies: [
          { name: 'session_token', value: 'test-session-token' },
          { name: 'other_cookie', value: 'other-value' }
        ],
        sessionToken: 'test-session-token',
        hasSessionToken: true,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        referer: 'https://test.com/referer',
        origin: 'https://test.com',
        userDataError: 'Unknown error'
      });
      expect(response.status).toBe(200);
    });

    it('should handle missing headers gracefully', async () => {
      mockHeaders.get.mockReturnValue(null);

      const response = await GET(mockRequest);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        cookies: [
          { name: 'session_token', value: 'test-session-token' },
          { name: 'other_cookie', value: 'other-value' }
        ],
        sessionToken: 'test-session-token',
        hasSessionToken: true,
        userAgent: null,
        referer: null,
        origin: null,
        userData: {
          success: true,
          user: { id: 1, email: 'test@example.com' }
        }
      });
      expect(response.status).toBe(200);
    });

    it('should handle empty cookies', async () => {
      mockCookies.getAll.mockReturnValue([]);
      mockCookies.get.mockReturnValue(undefined);

      const response = await GET(mockRequest);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        cookies: [],
        sessionToken: 'not found',
        hasSessionToken: false,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        referer: 'https://test.com/referer',
        origin: 'https://test.com'
      });
      expect(response.status).toBe(200);
    });

    it('should handle user data fetch with error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Authentication failed'
        })
      });

      const response = await GET(mockRequest);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        cookies: [
          { name: 'session_token', value: 'test-session-token' },
          { name: 'other_cookie', value: 'other-value' }
        ],
        sessionToken: 'test-session-token',
        hasSessionToken: true,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        referer: 'https://test.com/referer',
        origin: 'https://test.com',
        userData: {
          success: false,
          error: 'Authentication failed'
        }
      });
      expect(response.status).toBe(200);
    });

    it('should handle general error in debug session', async () => {
      // Mock cookies.getAll to throw an error
      mockCookies.getAll.mockImplementation(() => {
        throw new Error('Cookie error');
      });

      const response = await GET(mockRequest);

      expect(mockCreateBadRequestResponse).toHaveBeenCalledWith('Failed to debug session');
      expect(response.status).toBe(400);
    });

    it('should handle malformed cookie data', async () => {
      mockCookies.getAll.mockReturnValue([
        { name: 'session_token', value: 'test-session-token' },
        { name: 'malformed_cookie' } // Missing value
      ]);

      const response = await GET(mockRequest);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        cookies: [
          { name: 'session_token', value: 'test-session-token' },
          { name: 'malformed_cookie', value: undefined }
        ],
        sessionToken: 'test-session-token',
        hasSessionToken: true,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        referer: 'https://test.com/referer',
        origin: 'https://test.com',
        userData: {
          success: true,
          user: { id: 1, email: 'test@example.com' }
        }
      });
      expect(response.status).toBe(200);
    });

    it('should handle fetch timeout', async () => {
      // Mock fetch to simulate timeout
      (global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 0);
        });
      });

      const response = await GET(mockRequest);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        cookies: [
          { name: 'session_token', value: 'test-session-token' },
          { name: 'other_cookie', value: 'other-value' }
        ],
        sessionToken: 'test-session-token',
        hasSessionToken: true,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        referer: 'https://test.com/referer',
        origin: 'https://test.com',
        userDataError: 'Timeout'
      });
      expect(response.status).toBe(200);
    });

    it('should handle different origin URLs', async () => {
      mockRequest.nextUrl.origin = 'https://production.com';

      const response = await GET(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://production.com/api/auth/me',
        expect.objectContaining({
          headers: {
            'Cookie': 'session_token=test-session-token'
          }
        })
      );
      expect(response.status).toBe(200);
    });
  });
}); 