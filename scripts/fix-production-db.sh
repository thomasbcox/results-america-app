#!/bin/bash

# Quick fix for production database
# This runs migrations to create missing tables like magic_links

echo "🔧 Fixing production database..."

# Set environment for production
export NODE_ENV=production

# Run migrations
echo "🔄 Running migrations..."
npx drizzle-kit migrate

echo "✅ Production database fixed!"
echo "The magic_links table and other missing tables should now be created." 