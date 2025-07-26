import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ServiceError } from '../errors';

export function withBodyValidation<T>(schema: z.ZodSchema<T>) {
  return (handler: (req: NextRequest, body: T) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      try {
        const body = await request.json();
        const validatedBody = schema.parse(body);
        return await handler(request, validatedBody);
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new ServiceError('Invalid JSON format', 'VALIDATION_ERROR', 400);
        }
        if (error instanceof z.ZodError) {
          const issues = error.issues || [];
          const errorMessage = issues.map(issue => issue.message).join(', ');
          throw new ServiceError(errorMessage, 'VALIDATION_ERROR', 400, { zod: issues });
        }
        throw error;
      }
    };
  };
}

export function withQueryValidation<T>(schema: z.ZodSchema<T>) {
  return (handler: (req: NextRequest, query: T) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      try {
        const searchParams = request.nextUrl.searchParams;
        const params = Object.fromEntries(searchParams.entries());
        const validatedQuery = schema.parse(params);
        return await handler(request, validatedQuery);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const issues = error.issues || [];
          const errorMessage = issues.map(issue => issue.message).join(', ');
          throw new ServiceError(errorMessage, 'VALIDATION_ERROR', 400, { zod: issues });
        }
        throw error;
      }
    };
  };
} 