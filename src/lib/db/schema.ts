import { sqliteTable, text, integer, real, blob, uniqueIndex } from 'drizzle-orm/sqlite-core';
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
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  tokenIndex: uniqueIndex('idx_sessions_token').on(table.token),
  userIndex: uniqueIndex('idx_sessions_user').on(table.userId),
}));

export const magicLinks = sqliteTable('magic_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  used: integer('used').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  tokenIndex: uniqueIndex('idx_magic_links_token').on(table.token),
  emailIndex: uniqueIndex('idx_magic_links_email').on(table.email),
}));

// Phase 3: User Preferences and Suggestions
export const userFavorites = sqliteTable('user_favorites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  statisticId: integer('statistic_id').notNull().references(() => statistics.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userStatisticIndex: uniqueIndex('idx_user_favorites_unique').on(table.userId, table.statisticId),
}));

export const userSuggestions = sqliteTable('user_suggestions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category'), // Suggested category
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  adminNotes: text('admin_notes'),
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