# 🌱 Production Database Seeding Guide

This guide covers the comprehensive seeding system for the Results America application, ensuring all admin functions work correctly in production.

## 📋 Overview

The seeding system provides a complete foundation for the application, including:

- **Foundation Data**: States, categories, data sources
- **Admin Access**: Admin user account
- **CSV Import System**: Templates for data import
- **Sample Data**: Statistics and data points for demonstration

## 🚀 Quick Start

### Development Environment
```bash
# Seed local development database
./scripts/seed-development.sh
```

### Production Environment
```bash
# Set your production database URL
export DATABASE_URL="postgresql://user:pass@host:port/database"

# Seed production database
./scripts/seed-production.sh
```

## 📊 Seeding Data Structure

### Phase 1: Foundation Data (No Dependencies)

#### 1. States (51 total)
- All 50 US states in alphabetical order
- Plus "Nation" for national-level data
- Required for: Data points, state selection, filtering

#### 2. Categories (7 total)
- **Education**: K-12 and higher education metrics
- **Economy**: Economic indicators and employment
- **Public Safety**: Crime, corrections, and public safety
- **Health**: Health outcomes and access metrics
- **Environment**: Environmental quality and sustainability
- **Infrastructure**: Infrastructure quality and development
- **Government**: Government efficiency and transparency

#### 3. Data Sources (20+ total)
- **US Census Bureau**: Official US Census data
- **Bureau of Labor Statistics**: Employment and economic data
- **Bureau of Economic Analysis**: GDP and economic indicators
- **CDC**: Centers for Disease Control and Prevention
- **HHS Children's Bureau**: Health and Human Services data
- **Kaiser Family Foundation**: Healthcare policy and data
- **CDC BRFSS**: Behavioral Risk Factor Surveillance
- **United Health Foundation**: Health rankings and outcomes
- **USDA**: United States Department of Agriculture
- **EIA**: Energy Information Administration
- **USGS**: United States Geological Survey
- **EPA**: Environmental Protection Agency
- **US Chamber of Commerce**: Infrastructure and business climate
- **Tax Foundation**: Tax policy and burden analysis
- **Morningstar**: Financial and pension data
- **Standard & Poor's**: Credit ratings and financial analysis
- **PIRG**: Public Interest Research Group
- **Center for Digital Government**: Government technology assessments
- **State Websites**: Official state government websites
- **ITEP**: Institute on Taxation and Economic Policy

### Phase 2: Admin Access

#### 4. Admin User
- **Email**: admin@resultsamerica.org
- **Name**: System Administrator
- **Role**: admin
- **Status**: Active, email verified
- **Authentication**: Magic link system

### Phase 3: CSV Import System

#### 5. CSV Import Templates (3 total)

**Multi-Category Data Import**
- **Purpose**: Import data with multiple categories and measures
- **Headers**: State, Year, Category, Measure, Value
- **Use Case**: Complex datasets with varied categories

**Single-Category Data Import**
- **Purpose**: Import data for one specific category and measure
- **Headers**: State, Year, Value
- **Use Case**: Focused datasets for specific metrics

**Multi Year Export**
- **Purpose**: Import legacy system export format
- **Headers**: ID, State, Year, Category, Measure Name, Value, state_id, category_id, measure_id
- **Use Case**: Migration from existing systems

### Phase 4: Sample Data (Optional)

#### 6. Sample Statistics (9 total)
**Education Statistics**
- High School Graduation Rate
- College Enrollment Rate
- Student-Teacher Ratio

**Economy Statistics**
- Unemployment Rate
- GDP per Capita
- Median Household Income

**Health Statistics**
- Life Expectancy
- Infant Mortality Rate
- Obesity Rate

#### 7. Sample Import Sessions (2 total)
- 2023 Education Data Import
- 2023 Economic Data Import

#### 8. Sample Data Points (6 total)
- Education data points for California, Texas, New York
- Economy data points for California, Texas, New York

## 🔧 Technical Implementation

### Database Dependencies

The seeding follows strict dependency order to avoid foreign key violations:

```
1. States (no dependencies)
2. Categories (no dependencies)
3. Data Sources (no dependencies)
4. Admin User (no dependencies)
5. CSV Import Templates (depends on users)
6. Sample Statistics (depends on categories, data sources)
7. Sample Import Sessions (depends on data sources)
8. Sample Data Points (depends on import sessions, states, statistics)
```

### Idempotent Design

All seeding operations are idempotent:
- Check for existing records before insertion
- Use unique constraints to prevent duplicates
- Safe to run multiple times
- No data loss or corruption

### Error Handling

- Comprehensive error catching and reporting
- Detailed logging of each operation
- Graceful failure with clear error messages
- Database connection validation

## 📁 File Structure

```
scripts/
├── production-seed.ts              # SQLite development seeding
├── production-seed-postgres.ts     # PostgreSQL production seeding
├── seed-production.sh              # Production shell wrapper
└── seed-development.sh             # Development shell wrapper
```

## 🛠️ Usage Examples

### Development Setup
```bash
# First time setup
./scripts/seed-development.sh

# Start development server
npm run dev

# Access admin dashboard
# Visit http://localhost:3050/auth/login
# Login with admin@resultsamerica.org
```

### Production Deployment
```bash
# Set production database URL
export DATABASE_URL="postgresql://user:pass@host:port/database"

# Seed production database
./scripts/seed-production.sh

# Verify seeding
# Check admin dashboard functionality
```

### Manual Seeding (Advanced)
```bash
# SQLite development
npx tsx scripts/production-seed.ts

# PostgreSQL production
npx tsx scripts/production-seed-postgres.ts
```

## 🔍 Verification

After seeding, verify the following:

### Admin Dashboard Access
1. Visit `/auth/login`
2. Enter `admin@resultsamerica.org`
3. Check email for magic link
4. Access `/admin` dashboard

### CSV Import System
1. Navigate to `/admin/data`
2. Verify templates are available
3. Test CSV upload functionality

### Data Management
1. Check `/admin/sessions` for import sessions
2. Verify categories and states are populated
3. Test data filtering and search

## 🚨 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check DATABASE_URL environment variable
echo $DATABASE_URL

# Test connection manually
npx tsx -e "
import postgres from 'postgres';
const client = postgres(process.env.DATABASE_URL!);
await client\`SELECT 1\`;
await client.end();
"
```

**Permission Denied**
```bash
# Make scripts executable
chmod +x scripts/seed-*.sh
```

**Missing Dependencies**
```bash
# Install tsx globally
npm install -g tsx

# Or use npx
npx tsx scripts/production-seed.ts
```

### Error Messages

**"DATABASE_URL environment variable is required"**
- Set the DATABASE_URL environment variable
- Format: `postgresql://user:pass@host:port/database`

**"Cannot connect to database"**
- Verify database is running
- Check connection string format
- Ensure network connectivity

**"Foreign key constraint failed"**
- This should not happen with proper dependency order
- Check if database schema is correct
- Verify all required tables exist

## 🔄 Updating Seed Data

To add new seed data:

1. **Edit the appropriate script**:
   - `production-seed.ts` for SQLite development
   - `production-seed-postgres.ts` for PostgreSQL production

2. **Follow dependency order**:
   - Add foundation data first (states, categories, sources)
   - Then dependent data (statistics, templates, etc.)

3. **Test thoroughly**:
   - Run in development first
   - Verify all foreign key relationships
   - Test admin functionality

4. **Deploy to production**:
   - Use the shell script for safety
   - Monitor for any errors
   - Verify functionality after deployment

## 📈 Performance Considerations

### Large Datasets
- Seeding is designed for moderate datasets
- For large datasets, consider batch processing
- Monitor database performance during seeding

### Production Considerations
- Run during maintenance windows
- Monitor database load
- Have rollback plan ready
- Test in staging environment first

## 🔐 Security Notes

### Admin Credentials
- Admin user is created with email `admin@resultsamerica.org`
- Uses magic link authentication (no password)
- Change admin email in production if needed

### Database Security
- Use strong database passwords
- Limit database access to necessary users
- Monitor database access logs
- Use SSL connections in production

## 📞 Support

For issues with seeding:

1. **Check logs** for detailed error messages
2. **Verify environment** (DATABASE_URL, dependencies)
3. **Test connection** manually
4. **Review this guide** for common solutions
5. **Check database schema** matches expectations

---

**Last Updated**: 2024-01-XX
**Version**: 1.0.0
**Compatibility**: Next.js 14, Drizzle ORM, PostgreSQL/SQLite 