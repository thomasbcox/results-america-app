#!/bin/bash

# Results America Development Server Launcher
# This script provides convenient access to the Results America app commands

APP_DIR="results-america-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to check if app directory exists
check_app_directory() {
    if [ ! -d "$APP_DIR" ]; then
        print_error "App directory '$APP_DIR' not found!"
        echo "Please ensure you're running this from the correct parent directory."
        exit 1
    fi
    
    if [ ! -f "$APP_DIR/package.json" ]; then
        print_error "package.json not found in $APP_DIR directory!"
        echo "Please ensure the app is properly set up."
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "🚀 Results America Development Commands"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev, start    Start development server (default)"
    echo "  build         Build for production"
    echo "  test          Run tests"
    echo "  lint          Run ESLint"
    echo "  validate      Run pre-build validation"
    echo "  db:studio     Open database studio"
    echo "  db:seed       Seed database"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh              # Start development server"
    echo "  ./dev.sh dev          # Start development server"
    echo "  ./dev.sh build        # Build for production"
    echo "  ./dev.sh test         # Run tests"
    echo ""
    echo "🌐 Development server will be available at: http://localhost:3050"
}

# Main script logic
main() {
    local command=${1:-dev}
    
    case $command in
        "dev"|"start")
            print_info "Starting Results America development server..."
            check_app_directory
            cd "$APP_DIR"
            print_status "Found package.json, starting development server..."
            print_info "🌐 Server will be available at: http://localhost:3050"
            echo ""
            npm run dev
            ;;
        "build")
            print_info "Building Results America for production..."
            check_app_directory
            cd "$APP_DIR"
            npm run build
            ;;
        "test")
            print_info "Running tests..."
            check_app_directory
            cd "$APP_DIR"
            npm run test
            ;;
        "lint")
            print_info "Running ESLint..."
            check_app_directory
            cd "$APP_DIR"
            npm run lint
            ;;
        "validate")
            print_info "Running pre-build validation..."
            check_app_directory
            cd "$APP_DIR"
            npm run validate
            ;;
        "db:studio")
            print_info "Opening database studio..."
            check_app_directory
            cd "$APP_DIR"
            npm run db:studio
            ;;
        "db:seed")
            print_info "Seeding database..."
            check_app_directory
            cd "$APP_DIR"
            npm run db:seed
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run the main function with all arguments
main "$@" 