# Results America - Admin Guide

This guide covers the administration features for the Results America application, including database seeding, monitoring, and maintenance.

## Quick Start

### 1. Access Admin Dashboard

Navigate to `/admin` in your browser to access the main admin dashboard.

### 2. Seed Production Database

If your production database lacks data, run the seeding script:

```bash
npm run deploy:seed
```

This will:
- Check if data already exists
- Prompt for confirmation if data is found
- Seed the database with all 50 states, 7 categories, 50 statistics, and 2,500 data points
- Verify the seeding was successful

## Admin Dashboard Features

### Main Dashboard (`/admin`)

The main admin dashboard provides:

- **System Overview**: Real-time statistics on states, categories, statistics, and data points
- **Data Integrity**: Automated checks for orphaned data, missing sources, and duplicates
- **Quick Actions**: One-click database seeding and cache rebuilding
- **System Health**: Status indicators for all system components

### Data Management (`/admin/data`)

Manage your application's data:

- **Data Points Table**: View, search, and filter all data points
- **Statistics Overview**: Browse available statistics and their metadata
- **Export Functionality**: Download all data as CSV
- **Data Integrity**: Identify and resolve data issues

### Analytics (`/admin/analytics`)

Monitor system usage and performance:

- **Request Metrics**: Total requests, daily activity, response times
- **Performance Alerts**: Automatic detection of performance issues
- **Usage Patterns**: Most accessed endpoints, states, and categories
- **Hourly Activity**: Visual charts of system usage

### System Settings (`/admin/settings`)

Configure system behavior:

- **Cache Configuration**: Enable/disable caching and set TTL
- **Rate Limiting**: Configure request limits
- **Analytics Settings**: Enable/disable usage tracking
- **Maintenance Mode**: Restrict access during updates
- **Dangerous Actions**: Clear data, reset settings (use with caution)

## API Endpoints

### Admin APIs

- `POST /api/admin/seed` - Seed the database
- `POST /api/admin/cache` - Rebuild cache
- `DELETE /api/admin/cache` - Clear cache
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/analytics` - Get analytics data
- `POST /api/admin/export` - Export data as CSV

### Data Management APIs

- `GET /api/data-points` - List data points with filtering
- `DELETE /api/data-points/[id]` - Delete specific data point
- `GET /api/statistics` - List all statistics
- `GET /api/categories` - List all categories
- `GET /api/states` - List all states

## Database Schema

The application uses a normalized database schema with the following main tables:

### Core Tables
- **states**: All 50 US states
- **categories**: 7 data categories (Education, Economy, etc.)
- **statistics**: 50 metrics with metadata
- **dataSources**: External data providers
- **dataPoints**: Actual data values (state × statistic × year)
- **importSessions**: Data import tracking

### Relationships
- Each statistic belongs to a category and data source
- Each data point links a state, statistic, and year
- Import sessions track data loading history

## Production Deployment

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
DATABASE_URL=file:./prod.db
NODE_ENV=production
```

### 3. Database Backup

The application uses SQLite, so backup the database file:

```bash
# Backup database
cp dev.db backup-$(date +%Y%m%d).db

# Or use the admin dashboard export feature
```

## Monitoring and Maintenance

### Regular Tasks

1. **Daily**: Check admin dashboard for data integrity issues
2. **Weekly**: Review analytics for performance trends
3. **Monthly**: Export data backup and review system settings

### Troubleshooting

#### Database Issues
- Check data integrity on admin dashboard
- Use "Rebuild Cache" if data seems stale
- Clear and reseed if corruption is detected

#### Performance Issues
- Monitor response times in analytics
- Check cache hit rates
- Review rate limiting settings

#### Data Issues
- Verify data sources are accessible
- Check for orphaned data points
- Validate data ranges and formats

## Security Considerations

### Admin Access
- The admin dashboard is currently unprotected
- Consider adding authentication for production use
- Implement IP whitelisting for admin routes

### Data Protection
- Regular backups of the database file
- Validate all data inputs
- Monitor for unusual access patterns

### Rate Limiting
- Configure appropriate request limits
- Monitor for abuse patterns
- Adjust limits based on usage

## Data Sources

The application includes data from various sources:

- **Federal Agencies**: Department of Education, Census Bureau, BLS, CDC
- **Research Organizations**: College Board, Kaiser Family Foundation
- **Policy Groups**: ALEC, Tax Foundation, PIRG
- **Private Sector**: PwC, Morningstar, Standard & Poor's

## Support

For issues with the admin system:

1. Check the admin dashboard for error messages
2. Review the application logs
3. Verify database connectivity
4. Test with the development environment

## Development

### Adding New Features

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

---

**Last Updated**: January 2025
**Version**: 1.0.0 