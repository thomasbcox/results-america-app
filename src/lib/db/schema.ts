import { sqliteTable, text, integer, real, blob, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Phase 1: Core Data Display Schema (Normalized)
// Eliminates denormalization for data consistency

export const states = sqliteTable('states', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  abbreviation: text('abbreviation').notNull().unique(),
  isActive: integer('is_active').default(1),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  isActive: integer('is_active').default(1),
});

// ✅ NORMALIZED: Data sources are now their own table
export const dataSources = sqliteTable('data_sources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(), // e.g., "BEA", "BLS", "US Census Bureau"
  description: text('description'),
  url: text('url'), // Link to source website
  isActive: integer('is_active').default(1),
});

export const statistics = sqliteTable('statistics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  raNumber: text('ra_number'), // Reference number like 1001, 2001, etc.
  categoryId: integer('category_id').notNull().references(() => categories.id),
  dataSourceId: integer('data_source_id').references(() => dataSources.id), // ✅ NORMALIZED: FK to data_sources
  name: text('name').notNull(),
  description: text('description'),
  subMeasure: text('sub_measure'), // Sub-category information
  calculation: text('calculation'), // How the measure is calculated
  unit: text('unit').notNull(),
  availableSince: text('available_since'), // When data became available
  dataQuality: text('data_quality', { enum: ['mock', 'real'] }).default('mock'), // Data quality indicator
  provenance: text('provenance'), // Data source and methodology information
  isActive: integer('is_active').default(1),
});

// ✅ NORMALIZED: Import sessions for data lineage
export const importSessions = sqliteTable('import_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // e.g., "2023 Annual Data Import"
  description: text('description'),
  dataSourceId: integer('data_source_id').references(() => dataSources.id),
  importDate: text('import_date').default(sql`CURRENT_TIMESTAMP`),
  dataYear: integer('data_year'), // Year the data represents
  recordCount: integer('record_count'), // Number of records imported
  isActive: integer('is_active').default(1),
});

export const dataPoints = sqliteTable('data_points', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  importSessionId: integer('import_session_id').notNull().references(() => importSessions.id), // ✅ NORMALIZED: FK to import_sessions
  year: integer('year').notNull(),
  stateId: integer('state_id').notNull().references(() => states.id),
  statisticId: integer('statistic_id').notNull().references(() => statistics.id),
  value: real('value').notNull(),
  // ✅ REMOVED: source (now comes from statistics → data_sources)
  // ✅ REMOVED: lastUpdated (now comes from import_sessions.import_date)
});

// ✅ NEW: National averages table for storing pre-computed national averages
export const nationalAverages = sqliteTable('national_averages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  statisticId: integer('statistic_id').notNull().references(() => statistics.id),
  year: integer('year').notNull(),
  value: real('value').notNull(),
  calculationMethod: text('calculation_method').notNull().default('arithmetic_mean'), // arithmetic_mean, weighted, etc.
  stateCount: integer('state_count').notNull(), // Number of states included in calculation
  lastCalculated: integer('last_calculated', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Composite unique constraint to ensure one average per statistic per year
  uniqueConstraint: uniqueIndex('idx_national_average_unique').on(table.statisticId, table.year),
}));

// Phase 2: User Authentication Schema
// Magic link-based authentication system

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  isActive: integer('is_active').notNull().default(1),
  emailVerified: integer('email_verified').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIndex: uniqueIndex('idx_users_email').on(table.email),
}));

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const magicLinks = sqliteTable('magic_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  used: integer('used').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Phase 3: User Preferences Schema
// User favorites and suggestions

export const userFavorites = sqliteTable('user_favorites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  statisticId: integer('statistic_id').notNull().references(() => statistics.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Ensure a user can only favorite a statistic once
  uniqueUserStatistic: uniqueIndex('idx_user_favorites_unique').on(table.userId, table.statisticId),
}));

export const userSuggestions = sqliteTable('user_suggestions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  email: text('email').notNull(), // User's email for contact
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category'), // Suggested category
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'implemented'] }).notNull().default('pending'),
  adminNotes: text('admin_notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Phase 3: CSV Import System Schema
// Comprehensive data import workflow with staging, validation, and publishing

export const csvImports = sqliteTable('csv_imports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // e.g., "2023 GDP Data Import"
  description: text('description'),
  filename: text('filename').notNull(), // Original uploaded filename
  fileSize: integer('file_size').notNull(), // File size in bytes
  fileHash: text('file_hash').notNull(), // SHA256 hash for deduplication
  status: text('status', { enum: ['uploaded', 'validating', 'validation_failed', 'importing', 'imported', 'failed'] }).notNull().default('uploaded'),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  validatedAt: integer('validated_at', { mode: 'timestamp' }),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  errorMessage: text('error_message'), // Error details if import failed
  metadata: text('metadata'), // JSON string with import metadata
  isActive: integer('is_active').default(1),
  duplicateOf: integer('duplicate_of'), // Points to original import if this is a duplicate
  totalRows: integer('total_rows'),
  validRows: integer('valid_rows'),
  errorRows: integer('error_rows'),
  processingTimeMs: integer('processing_time_ms'),
});

export const importLogs = sqliteTable('import_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  csvImportId: integer('csv_import_id').notNull().references(() => csvImports.id),
  logLevel: text('log_level', { enum: ['info', 'validation_error', 'system_error'] }).notNull(),
  rowNumber: integer('row_number'), // CSV row number (1-based)
  fieldName: text('field_name'), // Which field had the problem
  fieldValue: text('field_value'), // The problematic value
  expectedValue: text('expected_value'), // What it should have been
  failureCategory: text('failure_category', { 
    enum: ['missing_required', 'invalid_reference', 'data_type', 'business_rule', 'database_error', 'csv_parsing']
  }).notNull(),
  message: text('message').notNull(),
  details: text('details'), // JSON string with additional context
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const importValidationSummary = sqliteTable('import_validation_summary', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  csvImportId: integer('csv_import_id').notNull().references(() => csvImports.id),
  totalRows: integer('total_rows').notNull(),
  validRows: integer('valid_rows').notNull(),
  errorRows: integer('error_rows').notNull(),
  failureBreakdown: text('failure_breakdown'), // JSON: { "missing_required": 15, "invalid_reference": 8, ... }
  validationTimeMs: integer('validation_time_ms'),
  status: text('status', { enum: ['validated_failed', 'validated_passed', 'imported_success', 'imported_failed'] }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const csvImportMetadata = sqliteTable('csv_import_metadata', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  csvImportId: integer('csv_import_id').notNull().references(() => csvImports.id),
  key: text('key').notNull(), // e.g., "data_source", "data_year", "statistic_name"
  value: text('value').notNull(), // e.g., "BEA", "2023", "Real GDP"
  dataType: text('data_type', { enum: ['string', 'number', 'date', 'boolean'] }).notNull().default('string'),
  isRequired: integer('is_required').notNull().default(0),
  validationRule: text('validation_rule'), // JSON string with validation rules
}, (table) => ({
  uniqueConstraint: uniqueIndex('idx_csv_import_metadata_unique').on(table.csvImportId, table.key),
}));

export const csvImportValidation = sqliteTable('csv_import_validation', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  csvImportId: integer('csv_import_id').notNull().references(() => csvImports.id),
  validationType: text('validation_type', { enum: ['schema', 'data_quality', 'business_rules', 'duplicate_check'] }).notNull(),
  status: text('status', { enum: ['pending', 'running', 'passed', 'failed', 'warning'] }).notNull().default('pending'),
  message: text('message'), // Validation result message
  details: text('details'), // JSON string with detailed validation results
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  errorCount: integer('error_count').default(0),
  warningCount: integer('warning_count').default(0),
});

export const csvImportStaging = sqliteTable('csv_import_staging', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  csvImportId: integer('csv_import_id').notNull().references(() => csvImports.id),
  rowNumber: integer('row_number').notNull(), // Original CSV row number (1-based)
  stateName: text('state_name'), // Extracted state name
  stateId: integer('state_id').references(() => states.id), // Resolved state ID
  year: integer('year'), // Extracted year
  statisticName: text('statistic_name'), // Extracted statistic name
  statisticId: integer('statistic_id').references(() => statistics.id), // Resolved statistic ID
  value: real('value'), // Extracted numeric value
  rawData: text('raw_data').notNull(), // JSON string with all original row data
  validationStatus: text('validation_status', { enum: ['pending', 'valid', 'invalid', 'warning'] }).notNull().default('pending'),
  validationErrors: text('validation_errors'), // JSON string with validation errors
  isProcessed: integer('is_processed').notNull().default(0), // Whether this row was processed into dataPoints
  processedAt: integer('processed_at', { mode: 'timestamp' }),
}, (table) => ({
  csvImportIndex: index('idx_csv_import_staging_import').on(table.csvImportId),
  rowNumberIndex: index('idx_csv_import_staging_row').on(table.csvImportId, table.rowNumber),
}));

export const csvImportTemplates = sqliteTable('csv_import_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(), // e.g., "BEA GDP Template"
  description: text('description'),
  categoryId: integer('category_id').references(() => categories.id),
  dataSourceId: integer('data_source_id').references(() => dataSources.id),
  templateSchema: text('template_schema').notNull(), // JSON string defining expected CSV structure
  validationRules: text('validation_rules'), // JSON string with validation rules
  sampleData: text('sample_data'), // JSON string with sample CSV data
  isActive: integer('is_active').default(1),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Indexes for performance
export const indexes = {
  dataPointsLookup: 'idx_data_points_lookup',
  statesByName: 'idx_states_name',
  categoriesByName: 'idx_categories_name',
  statisticsByCategory: 'idx_statistics_category',
  statisticsBySource: 'idx_statistics_source',
  dataPointsByImport: 'idx_data_points_import',
  nationalAveragesByStatistic: 'idx_national_averages_statistic',
  nationalAveragesByYear: 'idx_national_averages_year',
  usersByEmail: 'idx_users_email',
  sessionsByToken: 'idx_sessions_token',
  magicLinksByToken: 'idx_magic_links_token',
  userFavoritesByUser: 'idx_user_favorites_user',
  userSuggestionsByStatus: 'idx_user_suggestions_status',
}; 