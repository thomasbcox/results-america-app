# Results America - Admin Guide

This guide covers the administration features for the Results America application, including database management, user administration, and system monitoring.

## 🚀 Quick Start

### 1. Access Admin Dashboard

Navigate to `/admin` in your browser to access the main admin dashboard.

**Note**: Admin access requires authentication. You'll need to:
1. Request a magic link via `/auth/login`
2. Verify your email
3. Be promoted to admin role (see "Creating Admin Users" below)

### 2. Database Setup

If your database lacks data, run the seeding script:

```bash
npm run deploy:seed
```

This will:
- Check if data already exists
- Prompt for confirmation if data is found
- Seed the database with all 50 states, 7 categories, and sample statistics
- Verify the seeding was successful

## 🔧 Admin Dashboard Features

### Main Dashboard (`/admin`)

The main admin dashboard provides:

- **System Overview**: Real-time statistics on users, suggestions, and data
- **User Management**: View and manage user accounts
- **Data Statistics**: Overview of categories, statistics, and data points
- **Quick Actions**: Database seeding and system management

### Current Implementation Status

#### ✅ **Implemented Features**
- Basic admin dashboard with system statistics
- User management API endpoints
- Database seeding functionality
- Magic link authentication system
- Role-based access control
- **CSV Import System** - Complete data import workflow with templates and validation
- **Data Management Interface** (`/admin/data`) - Upload, validate, and publish CSV data
- **Import History Tracking** - Full audit trail of all data imports
- **Template System** - Pre-built templates for common data sources (BEA, BLS, Census)
- **Import Sessions Management** (`/admin/sessions`) - Manage data staging and activation
- **Session Status System** - Coherent status tracking for data imports

#### 🚧 **Planned Features** (Not Yet Implemented)
- Analytics dashboard (`/admin/analytics`)
- System settings configuration (`/admin/settings`)
- Export functionality
- Performance monitoring

## 📊 CSV Import System

### Overview

The CSV Import System provides a complete workflow for uploading, validating, staging, and publishing CSV data with full metadata tracking. This system replaces the need for external API integrations and gives you complete control over your data import process.

### Accessing the System

Navigate to `/admin/data` in your browser to access the CSV import interface. You'll see three tabs:

- **Upload Data**: Upload new CSV files with template selection
- **Import History**: View and manage previous imports
- **Templates**: Browse available import templates

### Available Templates

#### BEA GDP Template
- **Columns**: State, Year, GDP_Millions
- **Validation**: State names, years 2010-2030, positive GDP values
- **Sample**: California,2023,3500000

#### BLS Employment Template
- **Columns**: State, Year, Employment_Thousands
- **Validation**: State names, years 2010-2030, reasonable employment values
- **Sample**: California,2023,18500

#### Census Population Template
- **Columns**: State, Year, Population_Thousands
- **Validation**: State names, years 2010-2030, reasonable population values
- **Sample**: California,2023,39000

#### Generic Data Template
- **Columns**: State, Year, Value, Notes
- **Validation**: Flexible validation rules
- **Sample**: California,2023,100.5,Example metric

### Import Workflow

1. **Upload**: Select template and upload CSV file (max 10MB)
2. **Stage**: Data is parsed and stored in staging tables
3. **Validate**: Multi-level validation (schema, business rules, data quality)

## 📊 Import Sessions Management

### Overview

The Import Sessions system provides comprehensive management of data imports with coherent status tracking and data staging capabilities. This system allows you to:

- **Track Data Lineage**: See where each data point came from
- **Stage Data**: Import data without making it visible to users
- **Activate/Deactivate**: Control which data is visible to users
- **Inspect Data**: View actual imported data points
- **Manage Lifecycle**: Delete old or failed imports

### Accessing the System

Navigate to `/admin/sessions` to access the Import Sessions management interface.

### Session Status System

The system uses a coherent status system with four distinct states:

#### 🟢 Active
- **Meaning**: Data is visible to users in charts and comparisons
- **Conditions**: Has data points AND `isActive = 1`
- **Actions**: Deactivate, Delete

#### 🟡 Inactive
- **Meaning**: Data is imported but hidden from users
- **Conditions**: Has data points AND `isActive = 0`
- **Actions**: Activate, Delete

#### 🔴 Failed
- **Meaning**: Import failed - no data was stored despite expecting data
- **Conditions**: Expected data points > 0, but actual data points = 0
- **Actions**: Delete only

#### ⚪ Empty
- **Meaning**: No data expected or imported
- **Conditions**: Expected data points = 0, actual data points = 0
- **Actions**: Delete only

### Data Point Information

Each session displays:
- **Data Points**: Actual count of data points in database
- **Expected**: Expected count from import metadata (shown if different)
- **View Button**: Click to inspect actual data rows in a modal

### Available Actions

#### Activate ▶️
- **Purpose**: Make data visible to users
- **Available**: Only for "inactive" sessions
- **Effect**: Sets `isActive = 1`

#### Deactivate ⏸️
- **Purpose**: Hide data from users (preserves data)
- **Available**: Only for "active" sessions
- **Effect**: Sets `isActive = 0`

#### Delete 🗑️
- **Purpose**: Permanently remove data and session
- **Available**: All sessions
- **Effect**: Deletes all data points and session record
- **Confirmation**: Shows count of data points to be deleted

### User Impact

- **Active Sessions**: Data appears in charts and comparisons
- **Inactive Sessions**: Data is preserved but hidden from users
- **Failed/Empty Sessions**: No impact on user experience

For detailed technical documentation, see [Session Status Guide](./docs/SESSION_STATUS_GUIDE.md).
4. **Publish**: Move validated data to production tables
5. **Track**: Complete audit trail in import history

### Validation System

The system performs multiple levels of validation:

- **Schema Validation**: Column presence, types, and required fields
- **Business Rule Validation**: State name matching, year ranges, value ranges
- **Data Quality Validation**: Duplicate detection, outlier detection, negative value warnings
- **Custom Validation**: Template-specific rules and regex patterns

### Best Practices

1. **Data Preparation**: Use consistent state names, validate years and values
2. **Template Selection**: Choose the most specific template for your data
3. **Validation Review**: Always review validation results before publishing
4. **Metadata**: Provide clear import names and data source attribution

For detailed usage instructions, see `CSV_IMPORT_SYSTEM.md`.

## 👥 User Management

### Creating Admin Users

1. **Create a regular user account**:
   ```bash
   # Use the magic link authentication system
   # Go to /auth/login and request a magic link
   ```

2. **Promote to admin** (via API or database):
   ```bash
   # Using the API (requires existing admin)
   curl -X POST /api/admin/users/{userId}/promote
   
   # Or directly in database
   UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
   ```

### User Roles

- **user**: Standard application access
- **admin**: Full system access and user management

## 📊 API Endpoints

### Admin APIs

#### ✅ **Implemented**
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/[id]` - Get specific user
- `POST /api/admin/users/[id]/promote` - Promote user to admin
- `DELETE /api/admin/users/[id]` - Deactivate user

#### ✅ **Implemented**
- `POST /api/admin/csv-upload` - Upload CSV files for import
- `GET /api/admin/csv-imports` - List import history
- `POST /api/admin/csv-imports/{id}/validate` - Validate staged data
- `POST /api/admin/csv-imports/{id}/publish` - Publish validated data
- `GET /api/admin/csv-templates` - List available templates

#### ✅ **Import Sessions Management**
- `GET /api/admin/import-sessions` - List all import sessions with status
- `PATCH /api/admin/import-sessions` - Activate/deactivate/delete sessions
- `GET /api/admin/import-sessions/[id]/data-points` - View session data points

#### 🚧 **Planned** (Not Yet Implemented)
- `POST /api/admin/seed` - Seed the database
- `POST /api/admin/cache` - Rebuild cache
- `DELETE /api/admin/cache` - Clear cache
- `GET /api/admin/analytics` - Get analytics data
- `POST /api/admin/export` - Export data as CSV

### Data Management APIs

#### ✅ **Implemented**
- `GET /api/states` - List all states with pagination
- `GET /api/categories` - List all categories with stats
- `GET /api/statistics` - List all statistics with filtering
- `GET /api/data-points` - List data points with filtering

## 🗄️ Database Schema

The application uses a normalized PostgreSQL schema with the following main tables:

### Core Tables
- **states**: All 50 US states
- **categories**: 7 data categories (Education, Economy, etc.)
- **statistics**: 50 metrics with metadata
- **dataSources**: External data providers
- **dataPoints**: Actual data values (state × statistic × year)
- **importSessions**: Data import tracking

### CSV Import System Tables
- **csvImports**: Main import records with status tracking
- **csvImportStaging**: Raw CSV data before processing
- **csvImportTemplates**: Predefined templates for different data types
- **csvImportMetadata**: Flexible metadata storage for imports
- **csvImportValidation**: Validation results and error tracking

### Authentication Tables
- **users**: User accounts and authentication
- **sessions**: User sessions for magic link auth
- **magicLinks**: Magic link tokens

### Relationships
- Each statistic belongs to a category and data source
- Each data point links a state, statistic, and year
- Import sessions track data loading history
- Users can have multiple sessions and magic links

## 🚀 Production Deployment

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Run database migrations
npm run db:migrate

# Seed the database
npm run deploy:seed
```

### 2. Environment Variables

Ensure these environment variables are set in production:

```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
NODE_ENV=production
```

### 3. Database Backup

The application uses PostgreSQL (Neon), so backup strategies include:

```bash
# Using Neon's built-in backups (recommended)
# Neon provides automatic daily backups

# Manual backup via pg_dump
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Or use the admin dashboard export feature (when implemented)
```

## 🔍 Monitoring and Maintenance

### Regular Tasks

1. **Daily**: Check admin dashboard for system health
2. **Weekly**: Review user activity and system usage
3. **Monthly**: Review database performance and backup status

### Troubleshooting

#### Database Issues
- Check database connectivity in admin dashboard
- Verify migrations are up to date
- Check for data integrity issues

#### Authentication Issues
- Verify magic link delivery
- Check session cleanup is working
- Monitor for failed login attempts

#### Performance Issues
- Monitor API response times
- Check database query performance
- Review server logs for errors

## 🔐 Security Considerations

### Admin Access
- Admin dashboard requires authentication and admin role
- Magic link authentication provides secure access
- Session tokens expire after 24 hours

### Data Protection
- All database connections use SSL
- User passwords are not stored (magic link system)
- Session tokens are securely generated

### Rate Limiting
- Magic link requests are rate limited
- API endpoints have basic rate limiting
- Monitor for abuse patterns

## 📊 Data Sources

The application includes data from various sources:

- **Federal Agencies**: Department of Education, Census Bureau, BLS, CDC
- **Research Organizations**: College Board, Kaiser Family Foundation
- **Policy Groups**: ALEC, Tax Foundation, PIRG
- **Private Sector**: PwC, Morningstar, Standard & Poor's

## 🛠️ Development

### Adding New Admin Features

1. Create new admin pages in `/src/app/admin/`
2. Add corresponding API endpoints in `/src/app/api/admin/`
3. Update the admin service in `/src/lib/services/adminService.ts`
4. Test thoroughly before deployment

### Customizing the UI

The admin interface uses:
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Custom UI components** in `/src/components/ui/`

### Database Changes

For schema changes:
1. Create new migration: `npm run db:generate`
2. Apply migration: `npm run db:migrate`
3. Update seed data if needed
4. Test thoroughly

## 📞 Support

For issues with the admin system:

1. Check the admin dashboard for error messages
2. Review the application logs
3. Verify database connectivity
4. Test with the development environment

---

**Last Updated**: January 2025  
**Version**: 0.1.0  
**Status**: Core features implemented, additional features planned 