#!/bin/bash

# Immediate fix for production database
# This will run migrations on your production database right now

echo "🚨 URGENT: Fixing production database now..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set"
    echo "Please set your production database URL:"
    echo "export DATABASE_URL='your-neon-connection-string'"
    exit 1
fi

echo "📊 Using database: ${DATABASE_URL:0:50}..."

# Set environment for production
export NODE_ENV=production

echo "🔄 Running migrations on production database..."
npx drizzle-kit migrate

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully!"
    echo "🎉 Your magic_links table should now exist!"
    echo "💡 Test your magic link authentication now."
else
    echo "❌ Migration failed. Check your database connection."
    exit 1
fi 