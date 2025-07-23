# 🚀 Vercel Deployment Guide

This guide will help you deploy your Results America app to Vercel.

## Prerequisites

- [Vercel account](https://vercel.com)
- [GitHub repository](https://github.com/thomasbcox/results-america-app) (already done!)

## Step 1: Deploy to Vercel

### Method 1: GitHub Integration (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `thomasbcox/results-america-app`
4. Configure project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `results-america-app`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project directory
vercel

# Follow the prompts to link to your Vercel account
```

## Step 2: Configure Environment Variables

In your Vercel project dashboard:

1. Go to "Settings" → "Environment Variables"
2. Add the following variables:

```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_TELEMETRY_DISABLED=1
```

3. Make sure to set them for **Production**, **Preview**, and **Development** environments

## Step 3: Database Setup

Your app uses SQLite for the database, which is included in the repository. The database file (`dev.db`) contains all the necessary data and will be deployed with your app.

### Important Notes:

- **SQLite Database:** The app uses a local SQLite database file (`dev.db`) that's included in the repository
- **Read-Only in Production:** Vercel's file system is read-only in production, so the database won't be writable
- **Data Persistence:** For a production app with user data, you'll want to migrate to a cloud database later

## Step 4: Verify Deployment

1. Visit your Vercel app URL
2. Check that all pages load correctly
3. Test the API endpoints
4. Verify the app displays data correctly

## Step 5: Future Database Migration (Optional)

For a production app with user data, consider migrating to a cloud database:

### Option A: PlanetScale (MySQL)
1. Go to [planetscale.com](https://planetscale.com)
2. Create free account and database
3. Update database configuration to use MySQL

### Option B: Neon (PostgreSQL)
1. Go to [neon.tech](https://neon.tech)
2. Create free account and project
3. Update database configuration to use PostgreSQL

## Troubleshooting

### Common Issues:

1. **Build Errors:**
   - Check Vercel build logs
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation

2. **Database Issues:**
   - The SQLite database is read-only in production
   - All data is pre-loaded in the `dev.db` file
   - No additional database setup required

3. **Environment Variables:**
   - Make sure all required env vars are set in Vercel
   - Check that they're set for all environments

### Debug Commands:

```bash
# Check build locally
npm run build

# Test database locally
npm run deploy:setup

# Run development server
npm run dev
```

## Production Checklist

- [ ] App deployed to Vercel
- [ ] Environment variables configured
- [ ] All pages loading correctly
- [ ] API endpoints working
- [ ] Database data displaying
- [ ] Error handling working
- [ ] Performance optimized

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Test locally with `npm run dev`
3. Verify all files are committed to GitHub
4. Check this guide for common solutions

Your app should now be live at `https://your-app.vercel.app`! 🎉

## Next Steps

Once your app is deployed and working:

1. **Custom Domain:** Add a custom domain in Vercel settings
2. **Analytics:** Set up Vercel Analytics
3. **Monitoring:** Configure error monitoring
4. **Database Migration:** Consider migrating to a cloud database for user data 