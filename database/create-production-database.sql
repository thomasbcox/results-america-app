-- ============================================================================
-- RESULTS AMERICA PRODUCTION DATABASE - COMPLETE DDL
-- ============================================================================
-- 
-- This file contains all DDL statements to create the production database
-- from scratch, including all tables, constraints, indexes, and foreign keys.
--
-- Usage: Run this file against a fresh PostgreSQL database to set up
-- the complete schema for the Results America application.
--
-- Generated from: src/lib/db/schema-postgres.ts
-- ============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PHASE 1: CORE DATA DISPLAY SCHEMA (NORMALIZED)
-- ============================================================================

-- States table
CREATE TABLE "states" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL UNIQUE,
    "abbreviation" text NOT NULL UNIQUE,
    "is_active" integer DEFAULT 1
);

-- Categories table
CREATE TABLE "categories" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL UNIQUE,
    "description" text,
    "icon" text,
    "sort_order" integer DEFAULT 0,
    "is_active" integer DEFAULT 1
);

-- Data sources table (NORMALIZED)
CREATE TABLE "data_sources" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL UNIQUE,
    "description" text,
    "url" text,
    "is_active" integer DEFAULT 1
);

-- Statistics table
CREATE TABLE "statistics" (
    "id" serial PRIMARY KEY NOT NULL,
    "ra_number" text,
    "category_id" integer NOT NULL,
    "data_source_id" integer,
    "name" text NOT NULL,
    "description" text,
    "sub_measure" text,
    "calculation" text,
    "unit" text NOT NULL,
    "available_since" text,
    "data_quality" text DEFAULT 'mock',
    "provenance" text,
    "is_active" integer DEFAULT 1,
    CONSTRAINT "statistics_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "statistics_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Import sessions table (NORMALIZED)
CREATE TABLE "import_sessions" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "data_source_id" integer,
    "import_date" timestamp DEFAULT CURRENT_TIMESTAMP,
    "data_year" integer,
    "record_count" integer,
    "is_active" integer DEFAULT 1,
    CONSTRAINT "import_sessions_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Data points table
CREATE TABLE "data_points" (
    "id" serial PRIMARY KEY NOT NULL,
    "import_session_id" integer NOT NULL,
    "year" integer NOT NULL,
    "state_id" integer NOT NULL,
    "statistic_id" integer NOT NULL,
    "value" real NOT NULL,
    CONSTRAINT "data_points_import_session_id_import_sessions_id_fk" FOREIGN KEY ("import_session_id") REFERENCES "import_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "data_points_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "data_points_statistic_id_statistics_id_fk" FOREIGN KEY ("statistic_id") REFERENCES "statistics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- National averages table
CREATE TABLE "national_averages" (
    "id" serial PRIMARY KEY NOT NULL,
    "statistic_id" integer NOT NULL,
    "year" integer NOT NULL,
    "value" real NOT NULL,
    "calculation_method" text DEFAULT 'arithmetic_mean' NOT NULL,
    "state_count" integer NOT NULL,
    "last_calculated" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "national_averages_statistic_id_statistics_id_fk" FOREIGN KEY ("statistic_id") REFERENCES "statistics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- ============================================================================
-- PHASE 2: USER AUTHENTICATION SCHEMA
-- ============================================================================

-- Users table
CREATE TABLE "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "email" text NOT NULL UNIQUE,
    "name" text,
    "role" text DEFAULT 'user' NOT NULL,
    "is_active" integer DEFAULT 1 NOT NULL,
    "email_verified" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Sessions table
CREATE TABLE "sessions" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "token" text NOT NULL UNIQUE,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Magic links table
CREATE TABLE "magic_links" (
    "id" serial PRIMARY KEY NOT NULL,
    "email" text NOT NULL,
    "token" text NOT NULL UNIQUE,
    "expires_at" timestamp NOT NULL,
    "used" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- PHASE 3: USER PREFERENCES SCHEMA
-- ============================================================================

-- User favorites table
CREATE TABLE "user_favorites" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "statistic_id" integer NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "user_favorites_statistic_id_statistics_id_fk" FOREIGN KEY ("statistic_id") REFERENCES "statistics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- User suggestions table
CREATE TABLE "user_suggestions" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "email" text NOT NULL,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "category" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "admin_notes" text,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "user_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- ============================================================================
-- PHASE 4: CSV IMPORT SYSTEM SCHEMA
-- ============================================================================

-- CSV imports table
CREATE TABLE "csv_imports" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "filename" text NOT NULL,
    "file_size" integer NOT NULL,
    "file_hash" text NOT NULL,
    "status" text DEFAULT 'uploaded' NOT NULL,
    "uploaded_by" integer NOT NULL,
    "uploaded_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "validated_at" timestamp,
    "published_at" timestamp,
    "error_message" text,
    "metadata" text,
    "is_active" integer DEFAULT 1,
    "duplicate_of" integer,
    "total_rows" integer,
    "valid_rows" integer,
    "error_rows" integer,
    "processing_time_ms" integer,
    CONSTRAINT "csv_imports_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CSV import metadata table
CREATE TABLE "csv_import_metadata" (
    "id" serial PRIMARY KEY NOT NULL,
    "csv_import_id" integer NOT NULL,
    "key" text NOT NULL,
    "value" text NOT NULL,
    "data_type" text DEFAULT 'string' NOT NULL,
    "is_required" integer DEFAULT 0 NOT NULL,
    "validation_rule" text,
    CONSTRAINT "csv_import_metadata_csv_import_id_csv_imports_id_fk" FOREIGN KEY ("csv_import_id") REFERENCES "csv_imports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CSV import staging table
CREATE TABLE "csv_import_staging" (
    "id" serial PRIMARY KEY NOT NULL,
    "csv_import_id" integer NOT NULL,
    "row_number" integer NOT NULL,
    "state_name" text,
    "state_id" integer,
    "year" integer,
    "statistic_name" text,
    "statistic_id" integer,
    "value" real,
    "raw_data" text NOT NULL,
    "validation_status" text DEFAULT 'pending' NOT NULL,
    "validation_errors" text,
    "is_processed" integer DEFAULT 0 NOT NULL,
    "processed_at" timestamp,
    CONSTRAINT "csv_import_staging_csv_import_id_csv_imports_id_fk" FOREIGN KEY ("csv_import_id") REFERENCES "csv_imports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "csv_import_staging_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "csv_import_staging_statistic_id_statistics_id_fk" FOREIGN KEY ("statistic_id") REFERENCES "statistics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CSV import templates table
CREATE TABLE "csv_import_templates" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL UNIQUE,
    "description" text,
    "category_id" integer,
    "data_source_id" integer,
    "template_schema" text NOT NULL,
    "validation_rules" text,
    "sample_data" text,
    "is_active" integer DEFAULT 1,
    "created_by" integer NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "csv_import_templates_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "csv_import_templates_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "csv_import_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CSV import validation table
CREATE TABLE "csv_import_validation" (
    "id" serial PRIMARY KEY NOT NULL,
    "csv_import_id" integer NOT NULL,
    "validation_type" text NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "message" text,
    "details" text,
    "started_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completed_at" timestamp,
    "error_count" integer DEFAULT 0,
    "warning_count" integer DEFAULT 0,
    CONSTRAINT "csv_import_validation_csv_import_id_csv_imports_id_fk" FOREIGN KEY ("csv_import_id") REFERENCES "csv_imports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Import logs table
CREATE TABLE "import_logs" (
    "id" serial PRIMARY KEY NOT NULL,
    "csv_import_id" integer NOT NULL,
    "log_level" text NOT NULL,
    "row_number" integer,
    "field_name" text,
    "field_value" text,
    "expected_value" text,
    "failure_category" text NOT NULL,
    "message" text NOT NULL,
    "details" text,
    "timestamp" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "import_logs_csv_import_id_csv_imports_id_fk" FOREIGN KEY ("csv_import_id") REFERENCES "csv_imports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Import validation summary table
CREATE TABLE "import_validation_summary" (
    "id" serial PRIMARY KEY NOT NULL,
    "csv_import_id" integer NOT NULL,
    "total_rows" integer NOT NULL,
    "valid_rows" integer NOT NULL,
    "error_rows" integer NOT NULL,
    "failure_breakdown" text,
    "validation_time_ms" integer,
    "status" text NOT NULL,
    "completed_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "import_validation_summary_csv_import_id_csv_imports_id_fk" FOREIGN KEY ("csv_import_id") REFERENCES "csv_imports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users table indexes
CREATE UNIQUE INDEX "idx_users_email" ON "users" USING btree ("email");

-- Sessions table indexes
CREATE UNIQUE INDEX "idx_sessions_token" ON "sessions" USING btree ("token");

-- Magic links table indexes
CREATE UNIQUE INDEX "idx_magic_links_token" ON "magic_links" USING btree ("token");

-- National averages table indexes
CREATE UNIQUE INDEX "idx_national_average_unique" ON "national_averages" USING btree ("statistic_id", "year");

-- User favorites table indexes
CREATE UNIQUE INDEX "idx_user_favorites_unique" ON "user_favorites" USING btree ("user_id", "statistic_id");

-- CSV import metadata table indexes
CREATE UNIQUE INDEX "idx_csv_import_metadata_unique" ON "csv_import_metadata" USING btree ("csv_import_id", "key");

-- CSV import staging table indexes
CREATE INDEX "idx_csv_import_staging_import" ON "csv_import_staging" USING btree ("csv_import_id");
CREATE INDEX "idx_csv_import_staging_row" ON "csv_import_staging" USING btree ("csv_import_id", "row_number");

-- Data points table indexes (for performance)
CREATE INDEX "idx_data_points_lookup" ON "data_points" USING btree ("statistic_id", "state_id", "year");
CREATE INDEX "idx_data_points_import" ON "data_points" USING btree ("import_session_id");

-- ============================================================================
-- INITIAL DATA (OPTIONAL)
-- ============================================================================

-- Insert default categories
INSERT INTO "categories" ("name", "description", "icon", "sort_order") VALUES
('Economy', 'Economic indicators and metrics', 'chart-line', 1),
('Education', 'Educational statistics and outcomes', 'graduation-cap', 2),
('Health', 'Healthcare and public health data', 'heart', 3),
('Infrastructure', 'Transportation and infrastructure metrics', 'road', 4),
('Environment', 'Environmental and sustainability data', 'leaf', 5);

-- Insert default data sources
INSERT INTO "data_sources" ("name", "description", "url") VALUES
('Bureau of Economic Analysis (BEA)', 'Federal agency providing economic statistics', 'https://www.bea.gov'),
('Bureau of Labor Statistics (BLS)', 'Federal agency providing labor market data', 'https://www.bls.gov'),
('US Census Bureau', 'Federal agency providing demographic and economic data', 'https://www.census.gov'),
('Results America', 'Custom data collection and analysis', 'https://resultsamerica.org');

-- Insert default states (all 50 states + DC)
INSERT INTO "states" ("name", "abbreviation") VALUES
('Alabama', 'AL'), ('Alaska', 'AK'), ('Arizona', 'AZ'), ('Arkansas', 'AR'), ('California', 'CA'),
('Colorado', 'CO'), ('Connecticut', 'CT'), ('Delaware', 'DE'), ('Florida', 'FL'), ('Georgia', 'GA'),
('Hawaii', 'HI'), ('Idaho', 'ID'), ('Illinois', 'IL'), ('Indiana', 'IN'), ('Iowa', 'IA'),
('Kansas', 'KS'), ('Kentucky', 'KY'), ('Louisiana', 'LA'), ('Maine', 'ME'), ('Maryland', 'MD'),
('Massachusetts', 'MA'), ('Michigan', 'MI'), ('Minnesota', 'MN'), ('Mississippi', 'MS'), ('Missouri', 'MO'),
('Montana', 'MT'), ('Nebraska', 'NE'), ('Nevada', 'NV'), ('New Hampshire', 'NH'), ('New Jersey', 'NJ'),
('New Mexico', 'NM'), ('New York', 'NY'), ('North Carolina', 'NC'), ('North Dakota', 'ND'), ('Ohio', 'OH'),
('Oklahoma', 'OK'), ('Oregon', 'OR'), ('Pennsylvania', 'PA'), ('Rhode Island', 'RI'), ('South Carolina', 'SC'),
('South Dakota', 'SD'), ('Tennessee', 'TN'), ('Texas', 'TX'), ('Utah', 'UT'), ('Vermont', 'VT'),
('Virginia', 'VA'), ('Washington', 'WA'), ('West Virginia', 'WV'), ('Wisconsin', 'WI'), ('Wyoming', 'WY'),
('District of Columbia', 'DC');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that all tables were created
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('magic_links', 'users', 'sessions') THEN '✅ Authentication'
        WHEN table_name LIKE 'csv_%' THEN '✅ CSV Import'
        WHEN table_name IN ('states', 'categories', 'statistics', 'data_points') THEN '✅ Core Data'
        ELSE '✅ Other'
    END as category
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Count records in key tables
SELECT 
    'states' as table_name, COUNT(*) as record_count FROM states
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'data_sources', COUNT(*) FROM data_sources
UNION ALL
SELECT 'users', COUNT(*) FROM users;

-- ============================================================================
-- END OF DDL SCRIPT
-- ============================================================================
--
-- Database setup complete! 
-- Your Results America application should now work with this database. 