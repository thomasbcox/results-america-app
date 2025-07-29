# 🗄️ Production Database Configuration Guide

## Overview

This guide walks you through setting up and verifying your production database configuration for the Results America app.

## 🔧 **Step 1: Database Provider Setup**

### Neon Database (Recommended)
1. **Create Neon Account**: https://neon.tech
2. **Create Project**: 
   - Project name: `results-america-prod`
   - Region: Choose closest to your users
   - Compute: Free tier (or paid for production)

### Get Connection String
```bash
# From Neon dashboard, copy the connection string
# Format: postgresql://username:password@hostname/database
```

## 🔐 **Step 2: Environment Variables**

### Vercel Environment Setup
1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add these variables:**

```bash
# Required for production
DATABASE_URL=postgresql://username:password@hostname/database

# Optional (for development)
DEV_DATABASE_URL=postgresql://username:password@hostname/dev-database
```

### Verify Environment Variables
```bash
# Check if DATABASE_URL is set in Vercel
# Go to your project → Settings → Environment Variables
# Should see DATABASE_URL with your Neon connection string
```

## 🚀 **Step 3: Database Schema Setup**

### Run Initial Migrations
```bash
# This will create all tables including magic_links
npm run db:migrate:prod
```

### Verify Tables Exist
```sql
-- Run this in Neon SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Tables:**
- `categories`
- `csv_imports`
- `csv_import_metadata`
- `csv_import_staging`
- `csv_import_templates`
- `csv_import_validation`
- `data_points`
- `data_sources`
- `import_logs`
- `import_sessions`
- `import_validation_summary`
- `magic_links` ← **This was missing!**
- `national_averages`
- `sessions`
- `states`
- `statistics`
- `user_favorites`
- `user_suggestions`
- `users`

## 🔍 **Step 4: Verification Steps**

### 1. **Test Database Connection**
```bash
# Create a test script
echo 'const { getDb } = require("./src/lib/db");
getDb().then(db => {
  console.log("✅ Database connected successfully");
  process.exit(0);
}).catch(err => {
  console.error("❌ Database connection failed:", err);
  process.exit(1);
});' > test-db.js

# Run test
NODE_ENV=production DATABASE_URL="your-connection-string" node test-db.js
```

### 2. **Test Magic Links Table**
```sql
-- Run in Neon SQL Editor
SELECT * FROM magic_links LIMIT 1;
-- Should return empty result (no error)
```

### 3. **Test User Creation**
```sql
-- Run in Neon SQL Editor
INSERT INTO users (email, name, role) 
VALUES ('test@example.com', 'Test User', 'user')
RETURNING id, email, role;
```

## 🛠️ **Step 5: Automated Migration Setup**

### Current Build Process
Your `package.json` now includes:
```json
{
  "build": "npm run db:migrate:prod && next build --no-lint",
  "db:migrate:prod": "NODE_ENV=production drizzle-kit migrate"
}
```

### What This Does
1. **Pre-build migration**: Runs before Next.js build
2. **Environment-specific**: Uses `NODE_ENV=production`
3. **Fail-safe**: If migration fails, deployment fails

## 🔧 **Step 6: Troubleshooting**

### Problem: "magic_links table doesn't exist"
**Solution:**
```bash
# Run migrations manually (if automated migration fails)
NODE_ENV=production DATABASE_URL="your-connection-string" npx drizzle-kit migrate
```

### Problem: "DATABASE_URL not set"
**Solution:**
1. Check Vercel environment variables
2. Verify connection string format
3. Test connection locally

### Problem: "SSL connection required"
**Solution:**
- Neon requires SSL
- Your connection string should include `?sslmode=require`
- Example: `postgresql://user:pass@host/db?sslmode=require`

### Problem: "Permission denied"
**Solution:**
1. Check Neon user permissions
2. Verify database name exists
3. Check connection string credentials

## 📊 **Step 7: Monitoring**

### Vercel Deployment Logs
1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Deployments**
4. **Click on latest deployment**
5. **Check Build Logs**

**Look for:**
```
✅ PostgreSQL database connected: PRODUCTION (PostgreSQL)
✅ Migrations completed successfully
```

### Neon Database Logs
1. **Go to Neon Dashboard**
2. **Select your project**
3. **Go to Logs**
4. **Check for connection errors**

## 🎯 **Step 8: Testing Production**

### Test Magic Link Flow
1. **Go to your production app**
2. **Navigate to `/admin`**
3. **Enter your email**
4. **Check for magic link email**
5. **Click the link**
6. **Should redirect to admin dashboard**

### Test Database Operations
```bash
# Create a test script to verify all operations
echo '
const { getDb } = require("./src/lib/db");
const { AuthService } = require("./src/lib/services/authService");

async function testProductionDB() {
  try {
    const db = getDb();
    console.log("✅ Database connected");
    
    // Test magic link creation
    const magicLink = await AuthService.createMagicLink("test@example.com");
    console.log("✅ Magic link created:", magicLink.token);
    
    console.log("✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testProductionDB();
' > test-production.js

# Run test
NODE_ENV=production DATABASE_URL="your-connection-string" node test-production.js
```

## 🚨 **Emergency Procedures**

### If Production Database is Broken
1. **Create Neon database branch** (instant backup)
2. **Revert to previous migration**
3. **Run rollback migration**
4. **Test thoroughly before re-deploying**

### If Environment Variables are Wrong
1. **Update Vercel environment variables**
2. **Redeploy application**
3. **Verify connection works**

## ✅ **Success Checklist**

- [ ] Neon database created and accessible
- [ ] DATABASE_URL set in Vercel environment variables
- [ ] All migrations run successfully
- [ ] All tables exist in database
- [ ] Magic link authentication works
- [ ] Admin dashboard accessible
- [ ] Database operations work correctly
- [ ] Monitoring and logging configured

## 📞 **Support**

If you encounter issues:
1. **Check Vercel deployment logs**
2. **Check Neon database logs**
3. **Verify environment variables**
4. **Test database connection locally**
5. **Review this guide for troubleshooting steps** 