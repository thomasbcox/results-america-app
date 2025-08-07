// Type Safety Rules for Database Operations
// This file contains rules and utilities to prevent 'any' types from being used

// ============================================================================
// TYPE SAFETY CONSTANTS
// ============================================================================

export const FORBIDDEN_ANY_MESSAGE = 
  "❌ 'any' type is forbidden in database operations. " +
  "Use proper database result types from '../types/database-results' instead.";

export const DATABASE_RESULT_TYPES = {
  DATA_POINT: 'DataPointWithJoins',
  STATISTIC: 'StatisticWithJoins', 
  STATE: 'StateWithJoins',
  CATEGORY: 'CategoryWithJoins',
  DATA_SOURCE: 'DataSourceWithJoins',
  USER: 'UserWithJoins',
  IMPORT_SESSION: 'ImportSessionWithJoins',
  NATIONAL_AVERAGE: 'NationalAverageWithJoins',
  CSV_IMPORT: 'CsvImportWithJoins',
} as const;

// ============================================================================
// TYPE SAFETY UTILITIES
// ============================================================================

/**
 * Type-safe database result mapper
 * Ensures database results are properly typed before transformation
 */
export function createSafeMapper<TDatabase, TBusiness>(
  mapper: (dbResult: TDatabase) => TBusiness
) {
  return (results: TDatabase[]): TBusiness[] => {
    return results.map(mapper);
  };
}

/**
 * Validates that a database result has the expected structure
 */
export function validateDatabaseResult<T>(
  result: unknown,
  expectedKeys: (keyof T)[],
  typeName: string
): result is T {
  if (typeof result !== 'object' || result === null) {
    throw new Error(`Invalid ${typeName}: expected object, got ${typeof result}`);
  }

  for (const key of expectedKeys) {
    if (!(key in result)) {
      throw new Error(`Invalid ${typeName}: missing required key '${String(key)}'`);
    }
  }

  return true;
}

/**
 * Creates a type-safe database query wrapper
 */
export function createTypedQuery<TDatabase, TBusiness>(
  queryFn: () => Promise<TDatabase[]>,
  mapper: (dbResult: TDatabase) => TBusiness,
  typeName: string
) {
  return async (): Promise<TBusiness[]> => {
    const results = await queryFn();
    
    // Validate each result has the expected structure
    for (const result of results) {
      validateDatabaseResult(result, Object.keys(result) as (keyof TDatabase)[], typeName);
    }
    
    return results.map(mapper);
  };
}

// ============================================================================
// ESLINT RULES (for reference)
// ============================================================================

export const ESLINT_DATABASE_RULES = {
  // Add to your .eslintrc.js or eslint.config.mjs:
  rules: {
    // Prevent 'any' in database operations
    '@typescript-eslint/no-explicit-any': [
      'error',
      {
        ignoreRestArgs: false,
        fixToUnknown: false,
      }
    ],
    
    // Custom rule to catch database 'any' usage
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name="map"] > ArrowFunctionExpression > Parameter[typeAnnotation.type="TSAnyKeyword"]',
        message: FORBIDDEN_ANY_MESSAGE
      }
    ]
  }
};

// ============================================================================
// TYPE GUARD UTILITIES
// ============================================================================

/**
 * Type guard to ensure database results are properly typed
 */
export function ensureTypedDatabaseResult<T>(
  result: unknown,
  typeGuard: (obj: unknown) => obj is T,
  typeName: string
): T {
  if (!typeGuard(result)) {
    throw new Error(`Invalid ${typeName}: result does not match expected structure`);
  }
  return result;
}

/**
 * Batch type guard for database results
 */
export function ensureTypedDatabaseResults<T>(
  results: unknown[],
  typeGuard: (obj: unknown) => obj is T,
  typeName: string
): T[] {
  return results.map((result, index) => {
    try {
      return ensureTypedDatabaseResult(result, typeGuard, typeName);
    } catch (error) {
      throw new Error(`Invalid ${typeName} at index ${index}: ${error}`);
    }
  });
}

// ============================================================================
// DEVELOPMENT TOOLS
// ============================================================================

/**
 * Development-only function to log type violations
 */
export function logTypeViolation(
  file: string,
  line: number,
  context: string,
  suggestion: string
) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `🚨 Type Safety Violation in ${file}:${line}\n` +
      `Context: ${context}\n` +
      `Suggestion: ${suggestion}\n`
    );
  }
}

/**
 * Type assertion helper for development
 */
export function assertDatabaseType<T>(
  value: unknown,
  typeName: string
): asserts value is T {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️  Type assertion used for ${typeName}. ` +
      `Consider using proper database result types instead.`
    );
  }
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Helper to migrate from 'any' to proper types
 */
export function migrateFromAny<TDatabase, TBusiness>(
  oldMapper: (result: any) => TBusiness,
  newMapper: (result: TDatabase) => TBusiness,
  typeGuard: (obj: unknown) => obj is TDatabase
) {
  return (results: unknown[]): TBusiness[] => {
    return results.map((result) => {
      if (typeGuard(result)) {
        return newMapper(result);
      } else {
        // Fallback to old mapper during migration
        return oldMapper(result as any);
      }
    });
  };
}

// ============================================================================
// DOCUMENTATION
// ============================================================================

export const TYPE_SAFETY_GUIDE = `
# Database Type Safety Guide

## ✅ DO:
- Use proper database result types from '../types/database-results'
- Use type guards to validate database results
- Transform database results to business logic types
- Use createSafeMapper() for type-safe transformations

## ❌ DON'T:
- Use 'any' type in database operations
- Cast database results without validation
- Skip type checking for database results
- Use untyped database query results

## Examples:

✅ Good:
\`\`\`typescript
import type { DataPointWithJoins } from '../types/database-results';

const results = await db.select({...}).from(dataPoints);
return results.map((result: DataPointWithJoins) => ({
  id: result.id,
  // ... proper mapping
}));
\`\`\`

❌ Bad:
\`\`\`typescript
const results = await db.select({...}).from(dataPoints);
return results.map((result: any) => ({
  id: result.id,
  // ... untyped mapping
}));
\`\`\`
`;
