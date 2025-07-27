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

#### 🚧 **Planned Features** (Not Yet Implemented)
- Data management interface (`/admin/data`)
- Analytics dashboard (`/admin/analytics`)
- System settings configuration (`/admin/settings`)
- Export functionality
- Performance monitoring

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