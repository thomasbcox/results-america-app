# Database Setup Guide

## 🚀 Quick Setup (Recommended)

### 1. Create Free Cloud Database
- Go to [Neon](https://neon.tech) and access your account
- Create a new project called "results-america-dev"
- Copy the connection string from your dashboard

### 2. Configure Environment
```bash
# Run the setup script
./scripts/setup-database.sh

# Edit your .env file with the Neon connection string
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

### 3. Initialize Database
```bash
npm run db:setup:dev
```

## 🎯 Database Environment Strategy

✅ **Development**: `results-america-dev` (Neon PostgreSQL)  
✅ **Production**: `results-america-prod` (Neon PostgreSQL)  
✅ **Testing**: In-memory SQLite (fast, isolated)  
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

The app includes these tables:
- `users` - User accounts and authentication
- `sessions` - User sessions for magic link auth
- `magic_links` - Magic link tokens
- `user_favorites` - User's favorite statistics
- `user_suggestions` - User suggestions and feedback
- `categories` - Data categories
- `statistics` - Statistical measures
- `data_points` - Actual data values
- `states` - US states
- `data_sources` - Data source information
- `import_sessions` - Data import tracking

## 🔐 Admin Setup

After database setup, create your first admin:

```bash
npm run create-admin your-email@example.com
```

## 🧪 Testing

Tests use an in-memory SQLite database automatically:

```bash
npm test
``` 