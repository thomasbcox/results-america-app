import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Phase 1: Core Data Display Schema
// Essential tables for basic state data browsing with source attribution

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

export const statistics = sqliteTable('statistics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  name: text('name').notNull(),
  description: text('description'),
  unit: text('unit').notNull(),
  source: text('source'),
  isActive: integer('is_active').default(1),
});

export const dataPoints = sqliteTable('data_points', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  year: integer('year').notNull(),
  stateId: integer('state_id').notNull().references(() => states.id),
  statisticId: integer('statistic_id').notNull().references(() => statistics.id),
  value: real('value').notNull(),
  source: text('source'),
  lastUpdated: text('last_updated').default(sql`CURRENT_TIMESTAMP`),
});

// Indexes for performance
export const indexes = {
  dataPointsLookup: 'idx_data_points_lookup',
  statesByName: 'idx_states_name',
  categoriesByName: 'idx_categories_name',
  statisticsByCategory: 'idx_statistics_category',
}; 