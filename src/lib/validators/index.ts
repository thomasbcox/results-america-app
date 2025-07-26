import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const YearSchema = z.coerce.number().min(2000).max(2030).default(2023);

export const AggregationTypeSchema = z.enum([
  'statistic-comparison',
  'state-comparison',
  'top-performers',
  'bottom-performers',
  'trend-data',
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

export const ExternalDataImportSchema = z.object({
  source: z.enum(['BEA_GDP', 'BLS_EMPLOYMENT', 'CENSUS_POPULATION']),
  action: z.literal('import'),
});

export const ExternalDataQuerySchema = z.object({
  action: z.literal('sources'),
});

export const CategoryCreateSchema = z.object({
  name: z.string({ error: 'Name is required' }).min(2).max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.coerce.number().min(0).default(0),
});

export const StatisticCreateSchema = z.object({
  raNumber: z.string().optional(),
  categoryId: z.coerce.number().positive({ error: 'Category ID is required' }),
  dataSourceId: z.coerce.number().positive().optional(),
  name: z.string({ error: 'Name is required' }).min(2).max(200),
  description: z.string().optional(),
  subMeasure: z.string().optional(),
  calculation: z.string().optional(),
  unit: z.string({ error: 'Unit is required' }).min(1),
  availableSince: z.string().optional(),
  dataQuality: z.enum(['mock', 'real']).default('mock'),
  provenance: z.string().optional(),
});

export const DataPointCreateSchema = z.object({
  importSessionId: z.coerce.number().positive({ error: 'Import session ID is required' }),
  year: z.coerce.number().min(2000).max(2030, { error: 'Year must be between 2000 and 2030' }),
  stateId: z.coerce.number().positive({ error: 'State ID is required' }),
  statisticId: z.coerce.number().positive({ error: 'Statistic ID is required' }),
  value: z.coerce.number({ error: 'Value is required' }),
});

export const StateCreateSchema = z.object({
  name: z.string({ error: 'Name is required' }).min(2).max(100),
  abbreviation: z.string({ error: 'Abbreviation is required' }).length(2),
});

export const DataSourceCreateSchema = z.object({
  name: z.string({ error: 'Name is required' }).min(2).max(100),
  description: z.string().optional(),
  url: z.string().url('URL must be valid').optional(),
});

export const ImportSessionCreateSchema = z.object({
  name: z.string({ error: 'Name is required' }).min(2).max(200),
  description: z.string().optional(),
  dataSourceId: z.coerce.number().positive().optional(),
  dataYear: z.coerce.number().min(2000).max(2030).optional(),
  recordCount: z.coerce.number().min(0).optional(),
});

export const IdParamSchema = z.object({
  id: z.coerce.number().positive({ error: 'ID must be a positive number' }),
});

// Modern validation helpers
export async function validateRequestBody<T>(request: Request, schema: z.ZodSchema<T>): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

export async function validateQueryParams<T>(request: Request, schema: z.ZodSchema<T>): Promise<T> {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  return schema.parse(params);
} 