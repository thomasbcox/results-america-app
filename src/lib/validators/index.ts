import { z } from 'zod';

// Helper function to create required fields with consistent error messages
const createRequiredField = (fieldName: string, validations: z.ZodString[]) => {
  let field = z.string({ required_error: `${fieldName} is required` });
  validations.forEach(validation => {
    field = field.pipe(validation);
  });
  return field;
};

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

// Auth validators with improved error messages
export const LoginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Email must be valid'),
  password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters long'),
});

export const BootstrapAdminSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Email must be valid'),
  name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters long'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Email must be valid'),
});

export const ResetPasswordSchema = z.object({
  token: z.string({ required_error: 'Token is required' }).min(1, 'Token is required'),
  password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters long'),
});

export const ValidateTokenSchema = z.object({
  token: z.string({ required_error: 'Token is required' }).min(1, 'Token is required'),
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
  email: z.string({ required_error: 'Email is required' }).email('Email must be valid'),
  name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters long'),
  role: z.enum(['user', 'admin']).default('user'),
});

export const UserUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters').optional(),
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

export const StatisticUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  unit: z.string().max(50, 'Unit must be less than 50 characters').optional(),
  dataQuality: z.enum(['mock', 'real']).optional(),
  provenance: z.string().max(2000, 'Provenance must be less than 2000 characters').optional(),
});

// Generic validators
export const IdParamSchema = z.object({
  id: z.coerce.number().positive('ID must be a positive number'),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').optional(),
  category: z.string().optional(),
  source: z.string().optional(),
  hasData: z.coerce.boolean().optional(),
});

// Legacy function for backward compatibility (deprecated)
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
  
  return { error: 'Unknown validation error' };
} 