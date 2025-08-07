// Database query result types - these match exactly what Drizzle returns
// These types represent the raw database results before transformation to business logic types

// ============================================================================
// DATA POINT QUERY RESULTS
// ============================================================================

export interface DataPointWithJoins {
  id: number;
  statisticId: number;
  stateId: number;
  year: number;
  value: number;
  importSessionId: number;
  statisticName: string | null;  // From LEFT JOIN
  stateName: string | null;      // From LEFT JOIN
}

export interface DataPointWithStatisticAndState {
  id: number;
  statisticId: number;
  stateId: number;
  year: number;
  value: number;
  importSessionId: number;
  statisticName: string | null;
  stateName: string | null;
}

export interface DataPointWithImportSession {
  id: number;
  statisticId: number;
  stateId: number;
  year: number;
  value: number;
  importSessionId: number;
  importSessionName: string | null;
  importSessionDescription: string | null;
}

// ============================================================================
// STATISTIC QUERY RESULTS
// ============================================================================

export interface StatisticWithJoins {
  id: number;
  raNumber: string | null;
  categoryId: number;
  dataSourceId: number | null;
  name: string;
  description: string | null;
  subMeasure: string | null;
  calculation: string | null;
  unit: string;
  availableSince: string | null;
  dataQuality: 'mock' | 'real';
  provenance: string | null;
  preferenceDirection: 'higher' | 'lower' | 'neutral';
  isActive: number;
  categoryName: string | null;    // From LEFT JOIN
  dataSourceName: string | null;  // From LEFT JOIN
}

export interface StatisticWithCategory {
  id: number;
  raNumber: string | null;
  categoryId: number;
  dataSourceId: number | null;
  name: string;
  description: string | null;
  subMeasure: string | null;
  calculation: string | null;
  unit: string;
  availableSince: string | null;
  dataQuality: 'mock' | 'real';
  provenance: string | null;
  preferenceDirection: 'higher' | 'lower' | 'neutral';
  isActive: number;
  categoryName: string | null;
  categoryDescription: string | null;
  categoryIcon: string | null;
}

export interface StatisticWithDataSource {
  id: number;
  raNumber: string | null;
  categoryId: number;
  dataSourceId: number | null;
  name: string;
  description: string | null;
  subMeasure: string | null;
  calculation: string | null;
  unit: string;
  availableSince: string | null;
  dataQuality: 'mock' | 'real';
  provenance: string | null;
  preferenceDirection: 'higher' | 'lower' | 'neutral';
  isActive: number;
  dataSourceName: string | null;
  dataSourceDescription: string | null;
  dataSourceUrl: string | null;
}

// ============================================================================
// STATE QUERY RESULTS
// ============================================================================

export interface StateWithJoins {
  id: number;
  name: string;
  abbreviation: string;
  isActive: number;
}

export interface StateWithDataCount {
  id: number;
  name: string;
  abbreviation: string;
  isActive: number;
  dataPointCount: number;
}

// ============================================================================
// CATEGORY QUERY RESULTS
// ============================================================================

export interface CategoryWithJoins {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: number;
}

export interface CategoryWithStatisticCount {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: number;
  statisticCount: number;
}

// ============================================================================
// DATA SOURCE QUERY RESULTS
// ============================================================================

export interface DataSourceWithJoins {
  id: number;
  name: string;
  description: string | null;
  url: string | null;
  isActive: number;
}

export interface DataSourceWithStatisticCount {
  id: number;
  name: string;
  description: string | null;
  url: string | null;
  isActive: number;
  statisticCount: number;
}

// ============================================================================
// USER QUERY RESULTS
// ============================================================================

export interface UserWithJoins {
  id: number;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  isActive: number;
  emailVerified: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithFavoriteCount {
  id: number;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  isActive: number;
  emailVerified: number;
  createdAt: Date;
  updatedAt: Date;
  favoriteCount: number;
}

// ============================================================================
// IMPORT SESSION QUERY RESULTS
// ============================================================================

export interface ImportSessionWithJoins {
  id: number;
  name: string;
  description: string | null;
  dataSourceId: number | null;
  importDate: string;
  dataYear: number | null;
  recordCount: number | null;
  isActive: number;
  dataSourceName: string | null;
}

export interface ImportSessionWithDataCount {
  id: number;
  name: string;
  description: string | null;
  dataSourceId: number | null;
  importDate: string;
  dataYear: number | null;
  recordCount: number | null;
  isActive: number;
  actualDataPointCount: number;
}

// ============================================================================
// NATIONAL AVERAGE QUERY RESULTS
// ============================================================================

export interface NationalAverageWithJoins {
  id: number;
  statisticId: number;
  year: number;
  value: number;
  calculationMethod: string;
  stateCount: number;
  lastCalculated: Date;
  statisticName: string | null;
  statisticUnit: string | null;
}

// ============================================================================
// CSV IMPORT QUERY RESULTS
// ============================================================================

export interface CsvImportWithJoins {
  id: number;
  name: string;
  description: string | null;
  filename: string;
  fileSize: number;
  fileHash: string;
  status: 'uploaded' | 'validating' | 'validation_failed' | 'importing' | 'imported' | 'failed';
  uploadedBy: number;
  uploadedAt: Date;
  validatedAt: Date | null;
  publishedAt: Date | null;
  errorMessage: string | null;
  metadata: string | null;
  isActive: number;
  duplicateOf: number | null;
  totalRows: number | null;
  validRows: number | null;
  errorRows: number | null;
  processingTimeMs: number | null;
  uploaderName: string | null;
  uploaderEmail: string | null;
}

// ============================================================================
// AGGREGATION QUERY RESULTS
// ============================================================================

export interface AggregationResult {
  statisticId: number;
  statisticName: string;
  year: number;
  average: number;
  median: number;
  min: number;
  max: number;
  stateCount: number;
  unit: string;
}

export interface StateComparisonResult {
  stateId: number;
  stateName: string;
  statisticId: number;
  statisticName: string;
  year: number;
  value: number;
  rank: number;
  percentile: number;
  unit: string;
}

// ============================================================================
// TYPE GUARDS FOR SAFETY
// ============================================================================

export function isDataPointWithJoins(obj: unknown): obj is DataPointWithJoins {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'statisticId' in obj &&
    'stateId' in obj &&
    'year' in obj &&
    'value' in obj &&
    'importSessionId' in obj
  );
}

export function isStatisticWithJoins(obj: unknown): obj is StatisticWithJoins {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'unit' in obj &&
    'categoryId' in obj
  );
}

export function isStateWithJoins(obj: unknown): obj is StateWithJoins {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'abbreviation' in obj
  );
}

export function isCategoryWithJoins(obj: unknown): obj is CategoryWithJoins {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'sortOrder' in obj
  );
}
