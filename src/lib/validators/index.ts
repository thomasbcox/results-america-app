import { z } from 'zod';

// Common validation schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const YearSchema = z.coerce.number().min(2000).max(2030).default(2023);

// Aggregation validators
export const AggregationTypeSchema = z.enum([
  'statistic-comparison',
  'state-comparison', 
  'top-performers',
  'bottom-performers',
  'trend-data'
]);

export const StatisticComparisonSchema = z.object({
  type: z.literal('statistic-comparison'),
  statisticId: z.coerce.number().positive(),
  year: YearSchema,
});

export const StateComparisonSchema = z.object({
  type: z.literal('state-comparison'),
  stateId: z.coerce.number().positive(),
  year: YearSchema,
});

export const TopBottomPerformersSchema = z.object({
  type: z.enum(['top-performers', 'bottom-performers']),
  statisticId: z.coerce.number().positive(),
  limit: z.coerce.number().min(1).max(50).default(10),
  year: YearSchema,
});

export const TrendDataSchema = z.object({
  type: z.literal('trend-data'),
  statisticId: z.coerce.number().positive(),
  stateId: z.coerce.number().positive(),
});

export const AggregationQuerySchema = z.discriminatedUnion('type', [
  StatisticComparisonSchema,
  StateComparisonSchema,
  TopBottomPerformersSchema,
  TrendDataSchema,
]);

// Auth validators
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const BootstrapAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const ValidateTokenSchema = z.object({
  token: z.string().min(1),
});

// External data validators
export const ExternalDataImportSchema = z.object({
  source: z.enum(['BEA_GDP', 'BLS_EMPLOYMENT', 'CENSUS_POPULATION']),
  action: z.literal('import'),
});

export const ExternalDataQuerySchema = z.object({
  action: z.literal('sources'),
});

// Admin validators
export const UserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8),
  role: z.enum(['user', 'admin']).default('user'),
});

export const UserUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

export const StatisticUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  unit: z.string().max(50).optional(),
  dataQuality: z.enum(['mock', 'real']).optional(),
  provenance: z.string().max(2000).optional(),
});

// Generic validators
export const IdParamSchema = z.object({
  id: z.coerce.number().positive(),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1).optional(),
  category: z.string().optional(),
  source: z.string().optional(),
  hasData: z.coerce.boolean().optional(),
});

// Validation helper functions
export function validateQueryParams<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  const params = Object.fromEntries(searchParams.entries());
  return schema.parse(params);
}

export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return schema.parse(body);
}

// Error handling for validation
export class ValidationError extends Error {
  constructor(message: string, public errors: z.ZodError) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleValidationError(error: unknown): { error: string; details?: unknown } {
  if (error instanceof z.ZodError) {
    return {
      error: 'Validation failed',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
    };
  }
  
  if (error instanceof ValidationError) {
    return {
      error: error.message,
      details: error.errors.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
    };
  }
  
  return { error: 'Unknown validation error' };
} 