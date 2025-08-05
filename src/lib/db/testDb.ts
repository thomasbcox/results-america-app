import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';

export function createTestDb() {
  // Create an in-memory SQLite DB
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  
  // Create tables directly from schema
  const createTablesSQL = `
    CREATE TABLE IF NOT EXISTS states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      abbreviation TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1
    );
    
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );
    
    CREATE TABLE IF NOT EXISTS data_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      url TEXT,
      is_active INTEGER DEFAULT 1
    );
    
    CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ra_number TEXT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      data_source_id INTEGER REFERENCES data_sources(id),
      name TEXT NOT NULL,
      description TEXT,
      sub_measure TEXT,
      calculation TEXT,
      unit TEXT NOT NULL,
      available_since TEXT,
      is_active INTEGER DEFAULT 1,
      data_quality TEXT DEFAULT 'mock',
      provenance TEXT
    );
    
    CREATE TABLE IF NOT EXISTS import_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      data_source_id INTEGER REFERENCES data_sources(id),
      import_date TEXT DEFAULT CURRENT_TIMESTAMP,
      data_year INTEGER,
      record_count INTEGER,
      is_active INTEGER DEFAULT 1
    );
    
    CREATE TABLE IF NOT EXISTS data_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      import_session_id INTEGER NOT NULL REFERENCES import_sessions(id),
      year INTEGER NOT NULL,
      state_id INTEGER NOT NULL REFERENCES states(id),
      statistic_id INTEGER NOT NULL REFERENCES statistics(id),
      value REAL NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS national_averages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      statistic_id INTEGER NOT NULL REFERENCES statistics(id),
      year INTEGER NOT NULL,
      value REAL NOT NULL,
      calculation_method TEXT NOT NULL DEFAULT 'arithmetic_mean',
      state_count INTEGER NOT NULL,
      last_calculated INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      UNIQUE(statistic_id, year)
    );
  `;
  
  // Execute the SQL to create tables
  sqlite.exec(createTablesSQL);
  
  return db;
}

export function clearTestDb(db: ReturnType<typeof createTestDb>) {
  // Clear all data from tables in reverse dependency order
  const clearTables = [
    'DELETE FROM national_averages',
    'DELETE FROM data_points', 
    'DELETE FROM import_sessions',
    'DELETE FROM statistics',
    'DELETE FROM data_sources',
    'DELETE FROM categories',
    'DELETE FROM states'
  ];
  
  clearTables.forEach(sql => {
    db.run(sql);
  });
}

export function closeTestDb(db: ReturnType<typeof createTestDb>) {
  // Close the database connection
  db.$client.close();
} 