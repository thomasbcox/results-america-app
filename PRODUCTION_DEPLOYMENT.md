# 🚀 Production Deployment Guide

## Overview
This guide walks you through deploying the Results America App to production on Vercel with a separate production database.

## 📋 Prerequisites
- ✅ GitHub repository connected to Vercel
- ✅ Neon account with development database working
- ✅ Resend email service configured

## 🔧 Step 1: Create Production Database

1. **Go to Neon Console**: https://console.neon.tech
2. **Create New Project**: `results-america-prod`
3. **Copy Connection String**: Save the PostgreSQL connection string

## ⚙️ Step 2: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard**: Your project settings
2. **Navigate to**: Settings → Environment Variables
3. **Add these variables**:

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:YOUR_PROD_PASSWORD@ep-holy-wave-afw6mqji-pooler.c-2.us-west-2.aws.neon.tech/results-america-prod?sslmode=require&channel_binding=require

# Environment
NODE_ENV=production

# Authentication
ADMIN_RECOVERY_TOKEN=YhMvkRoZFTtGMgZHQfh4MuO4a7xrJLWfQ6or1ZG1pf0=
NEXTAUTH_SECRET=your-nextauth-secret-9318453
NEXTAUTH_URL=https://your-app.vercel.app

# Email (Resend)
RESEND_API_KEY=re_77LyBWeN_Nk9Mz9Dk3oKPfJ73jMo3EaRB
EMAIL_FROM=thomas@eudae.us

# App URL (same as NEXTAUTH_URL for Next.js apps)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🗄️ Step 3: Initialize Production Database

After setting up Vercel environment variables, initialize the production database:

```bash
# This will run migrations and seed data on the production database
npm run db:setup:prod
```

## 👤 Step 4: Create Admin User

Create the first admin user for production:

```bash
npm run create-admin
```

## 🚀 Step 5: Deploy

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Vercel will auto-deploy** when it detects the push

## 🔍 Step 6: Verify Deployment

1. **Check Vercel deployment logs** for any errors
2. **Test the application** at your Vercel URL
3. **Test magic link authentication**
4. **Test admin panel access**

## 📊 Environment Summary

| Environment | Database | Purpose |
|-------------|----------|---------|
| **Development** | `results-america-dev` | Local development |
| **Production** | `results-america-prod` | Live application |
| **Test** | In-memory SQLite | Automated tests |

## 🛠️ Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct in Vercel
- Check Neon database is active
- Ensure SSL is enabled

### Email Issues
- Verify `RESEND_API_KEY` is correct
- Check domain verification on Resend
- Test email sending manually

### Build Issues
- Check all environment variables are set
- Verify `NODE_ENV=production` is set
- Check Vercel build logs

## 🔐 Security Notes

- ✅ Production database is separate from development
- ✅ Environment variables are encrypted in Vercel
- ✅ SSL is required for all database connections
- ✅ Admin recovery token is configured
- ✅ Email authentication is secured

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables
3. Test database connection manually
4. Check Neon database status 