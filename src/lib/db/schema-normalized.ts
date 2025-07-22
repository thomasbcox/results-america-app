import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
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

// Indexes for performance
export const indexes = {
  dataPointsLookup: 'idx_data_points_lookup',
  statesByName: 'idx_states_name',
  categoriesByName: 'idx_categories_name',
  statisticsByCategory: 'idx_statistics_category',
  statisticsBySource: 'idx_statistics_source',
  dataPointsByImport: 'idx_data_points_import',
}; 