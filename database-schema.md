# Database Schema Documentation

## 🗄️ Overview

Results America uses a normalized PostgreSQL database schema designed for data transparency, provenance tracking, and scalability. The schema is optimized for serverless deployment on Vercel with Neon PostgreSQL.

## 🏗️ Schema Design Principles

### Normalization
- **Eliminates Denormalization**: Data sources and import sessions are separate tables
- **Referential Integrity**: Foreign key constraints ensure data consistency
- **Audit Trail**: Import sessions track data lineage and provenance

### Performance
- **Indexed Queries**: Automatic indexes on foreign keys and frequently queried columns
- **Connection Pooling**: Optimized for serverless deployment
- **Efficient Joins**: Normalized structure enables fast aggregations

### Scalability
- **PostgreSQL**: Enterprise-grade database with advanced features
- **Cloud-Native**: Designed for Neon PostgreSQL and Vercel deployment
- **Future-Proof**: Schema supports planned features and data growth

---

## 📊 Core Data Tables

### States Table
```sql
CREATE TABLE states (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT NOT NULL UNIQUE,
  is_active INTEGER DEFAULT 1
);
```

**Purpose**: Stores all 50 US states and territories  
**Data**: 50 records (all US states)  
**Usage**: Primary reference for state-level data

### Categories Table
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);
```

**Purpose**: Organizes statistics into logical groups  
**Data**: 7 categories (Education, Economy, Public Safety, Health, Environment, Infrastructure, Government)  
**Usage**: Navigation and filtering of statistics

### Data Sources Table
```sql
CREATE TABLE data_sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  url TEXT,
  is_active INTEGER DEFAULT 1
);
```

**Purpose**: Tracks external data providers and sources  
**Data**: Federal agencies, research organizations, policy groups  
**Usage**: Provenance tracking and source attribution

### Statistics Table
```sql
CREATE TABLE statistics (
  id SERIAL PRIMARY KEY,
  ra_number TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  data_source_id INTEGER REFERENCES data_sources(id),
  name TEXT NOT NULL,
  description TEXT,
  sub_measure TEXT,
  calculation TEXT,
  unit TEXT NOT NULL,
  available_since TEXT,
  data_quality TEXT DEFAULT 'mock',
  provenance TEXT,
  is_active INTEGER DEFAULT 1
);
```

**Purpose**: Defines metrics and their metadata  
**Data**: 50+ statistics across all categories  
**Usage**: Core metric definitions with full provenance

### Import Sessions Table
```sql
CREATE TABLE import_sessions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  data_source_id INTEGER REFERENCES data_sources(id),
  import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_year INTEGER,
  record_count INTEGER,
  is_active INTEGER DEFAULT 1
);
```

**Purpose**: Tracks data import history and lineage  
**Data**: One record per data import operation  
**Usage**: Audit trail and data provenance

### Data Points Table
```sql
CREATE TABLE data_points (
  id SERIAL PRIMARY KEY,
  import_session_id INTEGER NOT NULL REFERENCES import_sessions(id),
  year INTEGER NOT NULL,
  state_id INTEGER NOT NULL REFERENCES states(id),
  statistic_id INTEGER NOT NULL REFERENCES statistics(id),
  value REAL NOT NULL
);
```

**Purpose**: Stores actual data values  
**Data**: State × statistic × year combinations  
**Usage**: Core data storage with full lineage tracking

### National Averages Table
```sql
CREATE TABLE national_averages (
  id SERIAL PRIMARY KEY,
  statistic_id INTEGER NOT NULL REFERENCES statistics(id),
  year INTEGER NOT NULL,
  value REAL NOT NULL,
  calculation_method TEXT NOT NULL DEFAULT 'arithmetic_mean',
  state_count INTEGER NOT NULL,
  last_calculated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(statistic_id, year)
);
```

**Purpose**: Pre-computed national averages for performance  
**Data**: One average per statistic per year  
**Usage**: Fast national comparison queries

---

## 🔐 Authentication Tables

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_active INTEGER NOT NULL DEFAULT 1,
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: User account management  
**Features**: Magic link authentication, role-based access  
**Usage**: Authentication and authorization

### Sessions Table
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Session management for authenticated users  
**Features**: 24-hour session duration, automatic cleanup  
**Usage**: Maintains user login state

### Magic Links Table
```sql
CREATE TABLE magic_links (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Passwordless authentication tokens  
**Features**: 15-minute expiration, one-time use  
**Usage**: Secure email-based login

---

## 👥 User Features Tables

### User Favorites Table
```sql
CREATE TABLE user_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  statistic_id INTEGER NOT NULL REFERENCES statistics(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, statistic_id)
);
```

**Purpose**: User's favorite statistics  
**Features**: One favorite per user per statistic  
**Usage**: Personalized user experience

### User Suggestions Table
```sql
CREATE TABLE user_suggestions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: User feedback and feature requests  
**Features**: Anonymous and authenticated suggestions  
**Usage**: Community feedback collection

---

## 🔗 Relationships

### Core Data Relationships
```
categories (1) ←→ (N) statistics
data_sources (1) ←→ (N) statistics
data_sources (1) ←→ (N) import_sessions
import_sessions (1) ←→ (N) data_points
states (1) ←→ (N) data_points
statistics (1) ←→ (N) data_points
statistics (1) ←→ (N) national_averages
```

### Authentication Relationships
```
users (1) ←→ (N) sessions
users (1) ←→ (N) magic_links
users (1) ←→ (N) user_favorites
users (1) ←→ (N) user_suggestions
```

### Data Flow
```
data_sources → import_sessions → data_points → national_averages
categories → statistics → data_points
states → data_points
```

---

## 📈 Performance Optimizations

### Indexes
- **Primary Keys**: All tables have SERIAL primary keys
- **Foreign Keys**: Automatic indexes on all foreign key columns
- **Unique Constraints**: Email addresses, state abbreviations, etc.
- **Composite Indexes**: National averages (statistic_id, year)

### Query Optimization
- **Normalized Structure**: Efficient joins and aggregations
- **Pre-computed Averages**: Fast national comparison queries
- **Connection Pooling**: Optimized for serverless deployment
- **Selective Queries**: Only fetch required data

### Data Integrity
- **Foreign Key Constraints**: Ensures referential integrity
- **Unique Constraints**: Prevents duplicate data
- **Check Constraints**: Validates data ranges and formats
- **Cascade Deletes**: Maintains consistency on deletions

---

## 🔒 Security Features

### Data Protection
- **SSL Encryption**: All database connections use SSL
- **Environment Variables**: Sensitive data stored securely
- **Access Control**: Database-level user permissions
- **Audit Trail**: Full data lineage tracking

### Authentication Security
- **Magic Links**: No password storage
- **Session Tokens**: Secure random generation
- **Token Expiration**: Automatic cleanup of expired tokens
- **Rate Limiting**: Prevents abuse of authentication endpoints

---

## 🚀 Migration Strategy

### Schema Evolution
- **Drizzle Migrations**: Version-controlled schema changes
- **Backward Compatibility**: Maintains existing functionality
- **Data Preservation**: Safe migration of existing data
- **Rollback Support**: Ability to revert schema changes

### Deployment Process
1. **Development**: Test migrations locally
2. **Staging**: Apply to staging database
3. **Production**: Deploy with zero downtime
4. **Verification**: Confirm data integrity

---

## 📊 Data Statistics

### Current Data Volume
- **States**: 50 records
- **Categories**: 7 records
- **Statistics**: 50+ records
- **Data Points**: 2,500+ records
- **Users**: Variable (grows with usage)
- **Sessions**: Variable (cleaned up automatically)

### Growth Projections
- **Data Points**: 10,000+ by end of year
- **Users**: 1,000+ active users
- **Statistics**: 100+ metrics
- **Categories**: 10+ categories

---

## 🔧 Maintenance

### Regular Tasks
- **Session Cleanup**: Remove expired sessions daily
- **Magic Link Cleanup**: Remove expired tokens
- **Data Validation**: Check for orphaned records
- **Performance Monitoring**: Monitor query performance

### Backup Strategy
- **Automatic Backups**: Neon provides daily backups
- **Point-in-Time Recovery**: 7-day recovery window
- **Manual Backups**: pg_dump for additional safety
- **Export Functionality**: Admin dashboard exports (planned)

---

**Last Updated**: January 2025  
**Version**: 0.1.0  
**Database**: PostgreSQL (Neon)  
**ORM**: Drizzle ORM 