# 🚀 Automated Database Migration Workflow

## Overview

This document outlines the automated database migration workflow that ensures your production database schema stays in sync with your deployed code.

## 🔧 Current Setup

### Build Process
- **Pre-build migrations**: Database schema is updated before the app builds
- **Environment-specific**: Uses `NODE_ENV=production` for production migrations
- **Atomic deployments**: If migration fails, deployment fails

### Package.json Scripts
```json
{
  "build": "npm run db:migrate:prod && next build --no-lint",
  "db:migrate:prod": "NODE_ENV=production drizzle-kit migrate"
}
```

## 📋 Workflow Steps

### 1. **Local Development**
```bash
# Make schema changes in src/lib/db/schema-postgres.ts
# Test locally
npm run dev
```

### 2. **Generate Migration**
```bash
# Generate migration file
npm run db:generate:postgres

# This creates a new file in drizzle/ directory
# Review the generated SQL before committing
```

### 3. **Test Migration Locally**
```bash
# Apply migration to local database
npm run db:migrate

# Test the changes work as expected
npm run dev
```

### 4. **Commit and Deploy**
```bash
# Commit both code and migration files
git add .
git commit -m "feat: add user profile fields"
git push origin main
```

### 5. **Automatic Production Migration**
- Vercel runs `npm run build`
- This executes `npm run db:migrate:prod` first
- Then builds the Next.js app
- If migration fails, deployment fails

## 🛡️ Safety Measures

### Database Backups
```bash
# Before major migrations, create a database branch in Neon
# This provides instant rollback capability
```

### Preview Deployments
- Configure Vercel to use staging database for preview deployments
- Test migrations in isolation before production

### Migration Validation
```bash
# Validate migration files before committing
npm run validate
```

## 🔍 Troubleshooting

### Migration Fails in Production
1. Check Neon database logs
2. Verify DATABASE_URL is correct in Vercel
3. Check if migration conflicts with existing data
4. Use Neon's rollback feature if needed

### Schema Drift
```bash
# If schema is out of sync
npm run db:generate:postgres
# Review and commit the new migration
```

## 📊 Environment Configuration

### Development
- Uses local PostgreSQL or SQLite
- `NODE_ENV=development`

### Test
- Uses in-memory SQLite
- `NODE_ENV=test`

### Production
- Uses Neon PostgreSQL
- `NODE_ENV=production`
- `DATABASE_URL` from Vercel environment variables

## 🎯 Best Practices

1. **Always test migrations locally first**
2. **Review generated SQL before committing**
3. **Use descriptive migration names**
4. **Keep migrations small and focused**
5. **Backup before major schema changes**
6. **Use preview deployments for testing**

## 🚨 Emergency Procedures

### Rollback Migration
```bash
# If migration breaks production
# 1. Revert the git commit
# 2. Create a new migration to undo changes
# 3. Deploy the rollback migration
```

### Manual Database Fix
```bash
# Only in emergencies
# Connect to Neon console and run SQL manually
# Then create a migration to match the current state
```

## 📈 Monitoring

### Migration Success
- Check Vercel deployment logs
- Verify tables exist in Neon console
- Test affected functionality

### Migration Failure
- Check Vercel build logs
- Review Neon database logs
- Verify environment variables
- Test database connectivity 