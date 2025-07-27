#!/bin/bash

echo "🚀 Setting up PostgreSQL Database for Results America App"
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
fi

echo ""
echo "📋 Next Steps:"
echo "1. Go to https://neon.tech and access your account"
echo "2. Create a new project called 'results-america-dev'"
echo "3. Copy the connection string from your Neon dashboard"
echo "4. Update your .env file with the DATABASE_URL"
echo ""
echo "🔗 Your .env file should look like this:"
echo "DATABASE_URL=\"postgresql://username:password@host/results-america-dev?sslmode=require\""
echo ""
echo "💡 For local development, you can use the same cloud database"
echo "   This ensures your local dev matches production exactly!"
echo ""
echo "✅ Once you've updated .env, run: npm run db:setup:dev"
echo ""

# Check if DATABASE_URL is set
if grep -q "DATABASE_URL=" .env; then
    echo "🔍 Current DATABASE_URL found in .env"
    echo "   Make sure it points to your Neon database"
else
    echo "⚠️  No DATABASE_URL found in .env"
    echo "   Please add your Neon connection string"
fi

echo ""
echo "🎯 This setup will work perfectly with Vercel deployment!" 