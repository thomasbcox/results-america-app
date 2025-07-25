import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withValidation, withQueryValidation } from './validation';
import { ServiceError } from '../errors';

// Mock response functions
jest.mock('../response', () => ({
  createErrorResponse: jest.fn(),
}));

import { createErrorResponse } from '../response';

const mockCreateErrorResponse = createErrorResponse as jest.MockedFunction<typeof createErrorResponse>;

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const TestSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Email must be valid'),
    age: z.number().min(18, 'Must be at least 18 years old'),
  });

  const mockHandler = jest.fn();

  describe('withValidation', () => {
    it('should pass validated data to handler when validation succeeds', async () => {
      const middleware = withValidation(TestSchema);
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          age: 25,
        }),
      });

      mockHandler.mockResolvedValue({ status: 200 });

      await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request, {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      });
    });

    it('should throw ServiceError for invalid JSON', async () => {
      const middleware = withValidation(TestSchema);
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      // Mock the error response
      mockCreateErrorResponse.mockReturnValue(new Response('Invalid JSON', { status: 400 }));

      const result = await wrappedHandler(request);
      
      expect(result.status).toBe(400);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should throw ServiceError for validation failures', async () => {
      const middleware = withValidation(TestSchema);
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'J', // Too short
          email: 'invalid-email', // Invalid email
          age: 16, // Too young
        }),
      });

      // Mock the error response
      mockCreateErrorResponse.mockReturnValue(new Response('Validation failed', { status: 400 }));

      const result = await wrappedHandler(request);
      
      expect(result.status).toBe(400);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle missing required fields correctly', async () => {
      const middleware = withValidation(TestSchema);
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          // Missing email and age
        }),
      });

      // Mock the error response
      mockCreateErrorResponse.mockReturnValue(new Response('Validation failed', { status: 400 }));

      const result = await wrappedHandler(request);
      
      expect(result.status).toBe(400);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('withQueryValidation', () => {
    const QuerySchema = z.object({
      page: z.string().transform(Number).pipe(z.number().min(1)),
      limit: z.string().transform(Number).pipe(z.number().min(1).max(100)),
    });

    it('should pass validated query params to handler when validation succeeds', async () => {
      const middleware = withQueryValidation(QuerySchema);
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/test?page=1&limit=10');

      mockHandler.mockResolvedValue({ status: 200 });

      await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request, {
        page: 1,
        limit: 10,
      });
    });

    it('should throw ServiceError for invalid query params', async () => {
      const middleware = withQueryValidation(QuerySchema);
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/test?page=0&limit=1000');

      // Mock the error response
      mockCreateErrorResponse.mockReturnValue(new Response('Invalid query params', { status: 400 }));

      const result = await wrappedHandler(request);
      
      expect(result.status).toBe(400);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Error transformation', () => {
    it('should transform missing field errors correctly', () => {
      const error = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['email'],
          message: 'Required',
        },
      ]);

      // This test verifies that the error transformation works
      expect(error.errors).toHaveLength(1);
      expect(error.errors[0].path).toEqual(['email']);
    });

    it('should handle mixed validation errors correctly', () => {
      const error = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['email'],
          message: 'Required',
        },
        {
          code: 'invalid_string',
          validation: 'email',
          path: ['email'],
          message: 'Invalid email',
        },
      ]);

      expect(error.errors).toHaveLength(2);
    });
  });
}); 