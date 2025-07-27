# Database Setup Guide

## 🚀 Quick Setup (Recommended)

### 1. Create Free Cloud Database
- Go to [Neon](https://neon.tech) and access your account
- Create a new project called "results-america-dev"
- Copy the connection string from your dashboard

### 2. Configure Environment
```bash
# Copy environment template
cp env.example .env

# Edit your .env file with the Neon connection string
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
NODE_ENV=development
```

### 3. Initialize Database
```bash
# Run migrations and seed data
npm run db:setup:dev
```

## 🎯 Database Environment Strategy

✅ **Development**: `results-america-dev` (Neon PostgreSQL)  
✅ **Production**: `results-america-prod` (Neon PostgreSQL)  
✅ **Testing**: File-based SQLite (shared across processes)  
✅ **Perfect for Vercel** - Same cloud database for dev and prod  
✅ **No Local Setup Issues** - No permission problems or sudo required  
✅ **Free Tier Available** - Neon offers generous free PostgreSQL hosting  
✅ **Automatic Backups** - Your data is safe and backed up  
✅ **Scalable** - Easy to upgrade as your app grows  

## 🔧 Alternative: Local PostgreSQL

If you prefer local development:

1. Install PostgreSQL locally
2. Create a database: `createdb results_america_dev`
3. Set `DATABASE_URL="postgresql://localhost:5432/results_america_dev"`

## 🚀 Vercel Deployment

When deploying to Vercel:

1. Add your `DATABASE_URL` as an environment variable in Vercel
2. The same database will be used for production
3. No additional configuration needed!

## 📊 Database Schema

The app uses a normalized PostgreSQL schema with these tables:

### Core Data Tables
- `states` - All 50 US states
- `categories` - 7 data categories (Education, Economy, etc.)
- `statistics` - 50 metrics with metadata
- `data_sources` - External data providers
- `data_points` - Actual data values (state × statistic × year)
- `import_sessions` - Data import tracking
- `national_averages` - Pre-computed national averages

### Authentication Tables
- `users` - User accounts and authentication
- `sessions` - User sessions for magic link auth
- `magic_links` - Magic link tokens

### User Features Tables
- `user_favorites` - User's favorite statistics
- `user_suggestions` - User suggestions and feedback

## 🔐 Admin Setup

After database setup, create your first admin:

```bash
# 1. Start the development server
npm run dev

# 2. Go to /auth/login and request a magic link
# 3. Verify your email and create account
# 4. Promote to admin via database or API
```

### Promoting to Admin via Database
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Promoting to Admin via API
```bash
# Requires existing admin access
curl -X POST /api/admin/users/{userId}/promote
```

## 🧪 Testing

Tests use a file-based SQLite database automatically:

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern="states|categories|statistics"
```

### Test Database Configuration
- **Type**: File-based SQLite
- **Location**: Temporary directory (shared across processes)
- **Isolation**: Each test gets a clean database
- **Performance**: Fast, no network latency

## 🔄 Database Commands

### Development
```bash
npm run db:setup:dev      # Setup development database
npm run db:seed           # Seed with sample data
npm run db:studio         # Open database studio
```

### Production
```bash
npm run db:setup:prod     # Setup production database
npm run deploy:seed       # Deploy seed data
```

### Migrations
```bash
npm run db:generate       # Generate new migration
npm run db:migrate        # Run migrations
```

## 📈 Database Performance

### Optimizations
- **Indexes**: Automatic indexes on foreign keys
- **Connection Pooling**: Optimized for serverless deployment
- **Query Optimization**: Efficient joins and aggregations

### Monitoring
- Check query performance in database studio
- Monitor connection pool usage
- Review slow query logs

## 🔒 Security

### Connection Security
- **SSL Required**: All connections use SSL encryption
- **Connection String**: Secure environment variable storage
- **Access Control**: Database-level user permissions

### Data Protection
- **Backups**: Automatic daily backups (Neon)
- **Encryption**: Data encrypted at rest and in transit
- **Audit Trail**: Import sessions track data lineage

## 🐛 Troubleshooting

### Common Issues

**Connection Errors**
```bash
# Check environment variables
echo $DATABASE_URL

# Test connection
npm run db:studio
```

**Migration Errors**
```bash
# Reset database
npm run db:setup:dev

# Check migration status
npm run db:migrate
```

**Permission Errors**
- Ensure database user has proper permissions
- Check SSL configuration for Neon
- Verify connection string format

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

---

**Last Updated**: January 2025  
**Version**: 0.1.0 