#!/bin/bash

# Production Database Seeding Script
# This script seeds the production database with all required data for admin functions.

set -e  # Exit on any error

echo "🌱 Results America - Production Database Seeding"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is required"
    echo "Please set DATABASE_URL to your production database connection string"
    echo "Example: export DATABASE_URL='postgresql://user:pass@host:port/database'"
    exit 1
fi

# Check if required dependencies are installed
if ! command -v tsx &> /dev/null; then
    echo "📦 Installing tsx..."
    npm install -g tsx
fi

# Function to confirm action
confirm_action() {
    echo ""
    echo "⚠️  WARNING: This will seed the production database at:"
    echo "   $DATABASE_URL"
    echo ""
    echo "This will add:"
    echo "   • All 50 US states + Nation"
    echo "   • 7 core categories (Education, Economy, etc.)"
    echo "   • 20+ data sources (Census, BLS, CDC, etc.)"
    echo "   • 3 CSV import templates"
    echo "   • Admin user (admin@resultsamerica.org)"
    echo "   • Sample statistics and data points"
    echo ""
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Seeding cancelled"
        exit 0
    fi
}

# Function to run seeding
run_seeding() {
    echo "🚀 Starting production database seeding..."
    echo ""
    
    # Run the PostgreSQL seeding script
    npx tsx scripts/production-seed-postgres.ts
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Production database seeding completed successfully!"
        echo ""
        echo "🔑 Admin Login Credentials:"
        echo "   Email: admin@resultsamerica.org"
        echo "   Note: Use magic link authentication to login"
        echo ""
        echo "📋 Next Steps:"
        echo "   1. Visit your app's login page"
        echo "   2. Enter admin@resultsamerica.org"
        echo "   3. Check email for magic link"
        echo "   4. Access admin dashboard at /admin"
        echo ""
    else
        echo ""
        echo "❌ Seeding failed. Please check the error messages above."
        exit 1
    fi
}

# Main execution
echo "🔍 Checking environment..."

# Show database URL (masked for security)
DB_URL_MASKED=$(echo "$DATABASE_URL" | sed 's/:[^:]*@/:***@/')
echo "   Database: $DB_URL_MASKED"

# Check if we can connect to the database
echo "🔗 Testing database connection..."
if npx tsx -e "
import postgres from 'postgres';
const client = postgres(process.env.DATABASE_URL!);
await client\`SELECT 1\`;
await client.end();
console.log('✅ Database connection successful');
" 2>/dev/null; then
    echo "✅ Database connection successful"
else
    echo "❌ Error: Cannot connect to database"
    echo "Please check your DATABASE_URL and ensure the database is accessible"
    exit 1
fi

# Confirm before proceeding
confirm_action

# Run the seeding
run_seeding 