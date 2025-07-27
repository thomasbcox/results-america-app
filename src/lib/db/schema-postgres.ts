import { pgTable, text, integer, real, timestamp, uniqueIndex, index, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Phase 1: Core Data Display Schema (Normalized)
// Eliminates denormalization for data consistency

export const states = pgTable('states', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  abbreviation: text('abbreviation').notNull().unique(),
  isActive: integer('is_active').default(1),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  isActive: integer('is_active').default(1),
});

// ✅ NORMALIZED: Data sources are now their own table
export const dataSources = pgTable('data_sources', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g., "BEA", "BLS", "US Census Bureau"
  description: text('description'),
  url: text('url'), // Link to source website
  isActive: integer('is_active').default(1),
});

export const statistics = pgTable('statistics', {
  id: serial('id').primaryKey(),
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
export const importSessions = pgTable('import_sessions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g., "2023 Annual Data Import"
  description: text('description'),
  dataSourceId: integer('data_source_id').references(() => dataSources.id),
  importDate: timestamp('import_date').default(sql`CURRENT_TIMESTAMP`),
  dataYear: integer('data_year'), // Year the data represents
  recordCount: integer('record_count'), // Number of records imported
  isActive: integer('is_active').default(1),
});

export const dataPoints = pgTable('data_points', {
  id: serial('id').primaryKey(),
  importSessionId: integer('import_session_id').notNull().references(() => importSessions.id), // ✅ NORMALIZED: FK to import_sessions
  year: integer('year').notNull(),
  stateId: integer('state_id').notNull().references(() => states.id),
  statisticId: integer('statistic_id').notNull().references(() => statistics.id),
  value: real('value').notNull(),
  // ✅ REMOVED: source (now comes from statistics → data_sources)
  // ✅ REMOVED: lastUpdated (now comes from import_sessions.import_date)
});

// ✅ NEW: National averages table for storing pre-computed national averages
export const nationalAverages = pgTable('national_averages', {
  id: serial('id').primaryKey(),
  statisticId: integer('statistic_id').notNull().references(() => statistics.id),
  year: integer('year').notNull(),
  value: real('value').notNull(),
  calculationMethod: text('calculation_method').notNull().default('arithmetic_mean'), // arithmetic_mean, weighted, etc.
  stateCount: integer('state_count').notNull(), // Number of states included in calculation
  lastCalculated: timestamp('last_calculated').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Composite unique constraint to ensure one average per statistic per year
  uniqueConstraint: uniqueIndex('idx_national_average_unique').on(table.statisticId, table.year),
}));

// Phase 2: User Authentication Schema
// Magic link-based authentication system

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  isActive: integer('is_active').notNull().default(1),
  emailVerified: integer('email_verified').notNull().default(0),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIndex: uniqueIndex('idx_users_email').on(table.email),
}));

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const magicLinks = pgTable('magic_links', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: integer('used').notNull().default(0),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Phase 3: User Preferences Schema
// User favorites and suggestions

export const userFavorites = pgTable('user_favorites', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  statisticId: integer('statistic_id').notNull().references(() => statistics.id),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Ensure a user can only favorite a statistic once
  uniqueUserStatistic: uniqueIndex('idx_user_favorites_unique').on(table.userId, table.statisticId),
}));

export const userSuggestions = pgTable('user_suggestions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category'), // Suggested category
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Indexes can be added later if needed 