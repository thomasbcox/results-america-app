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
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER NOT NULL DEFAULT 1,
      email_verified INTEGER NOT NULL DEFAULT 0,
      last_login_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
    
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
    
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
    
    CREATE TABLE IF NOT EXISTS user_activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
    
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
  
  sqlite.exec(createTablesSQL);
  
  return db;
} 