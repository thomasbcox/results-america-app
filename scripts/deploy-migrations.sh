#!/bin/bash

# Deploy Database Migrations to Production
# This script runs all pending migrations on the production database

set -e

echo "🚀 Deploying database migrations to production..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL to your production database connection string"
    exit 1
fi

echo "📊 Database URL: ${DATABASE_URL:0:50}..."

# Set NODE_ENV to production for this script
export NODE_ENV=production

# Run migrations
echo "🔄 Running database migrations..."
npx drizzle-kit migrate

echo "✅ Migrations completed successfully!"

# Optional: Run seed data if needed
read -p "Do you want to run seed data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Running seed data..."
    npm run db:seed
    echo "✅ Seed data completed!"
fi

echo "🎉 Database deployment completed!" 