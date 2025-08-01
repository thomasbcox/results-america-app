-- Drop all tables in dependency order
DROP TABLE IF EXISTS "user_suggestions" CASCADE;
DROP TABLE IF EXISTS "user_favorites" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "magic_links" CASCADE;
DROP TABLE IF EXISTS "national_averages" CASCADE;
DROP TABLE IF EXISTS "data_points" CASCADE;
DROP TABLE IF EXISTS "import_sessions" CASCADE;
DROP TABLE IF EXISTS "statistics" CASCADE;
DROP TABLE IF EXISTS "data_sources" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "states" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE; 