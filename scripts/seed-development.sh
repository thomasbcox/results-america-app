#!/bin/bash

# Development Database Seeding Script
# This script seeds the local development database with all required data.

set -e  # Exit on any error

echo "🌱 Results America - Development Database Seeding"
echo "================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the project root directory"
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
    echo "⚠️  WARNING: This will seed the development database (dev.db)"
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
    echo "🚀 Starting development database seeding..."
    echo ""
    
    # Run the SQLite seeding script
    npx tsx scripts/production-seed.ts
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Development database seeding completed successfully!"
        echo ""
        echo "🔑 Admin Login Credentials:"
        echo "   Email: admin@resultsamerica.org"
        echo "   Note: Use magic link authentication to login"
        echo ""
        echo "📋 Next Steps:"
        echo "   1. Start the development server: npm run dev"
        echo "   2. Visit http://localhost:3050/auth/login"
        echo "   3. Enter admin@resultsamerica.org"
        echo "   4. Check email for magic link"
        echo "   5. Access admin dashboard at /admin"
        echo ""
    else
        echo ""
        echo "❌ Seeding failed. Please check the error messages above."
        exit 1
    fi
}

# Main execution
echo "🔍 Checking environment..."

# Check if dev.db exists
if [ -f "dev.db" ]; then
    echo "📁 Found existing dev.db file"
    echo "   Size: $(du -h dev.db | cut -f1)"
else
    echo "📁 No existing dev.db file found - will create new database"
fi

# Confirm before proceeding
confirm_action

# Run the seeding
run_seeding 