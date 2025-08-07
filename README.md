# Results America

A data transparency platform that provides state-level statistics with complete provenance tracking and trust-building features.

## ⚠️ Current Status

**Version**: 0.1.0  
**Status**: Core functionality complete, test issues need resolution  
**Test Coverage**: 66% pass rate (337/512 tests passing)

### **Key Features Implemented**
- ✅ Complete service layer architecture with analytics capabilities
- ✅ Comprehensive CSV import system with staging and rollback
- ✅ Admin dashboard with data management
- ✅ User authentication with magic links
- ✅ Database schema with PostgreSQL/Neon and SQLite testing

### **Known Issues**
- ⚠️ 175 failing tests need to be fixed
- ⚠️ Some API endpoints returning 400 errors
- ⚠️ Database connection issues in some services
- ⚠️ Hydration mismatches in frontend components

**For detailed status information, see [CURRENT_STATUS_REPORT.md](./CURRENT_STATUS_REPORT.md)**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended)

### 1. Setup Environment
```bash
# Clone and install dependencies
git clone <repository-url>
cd results-america-app
npm install

# Copy environment template
cp env.example .env
```

### 2. Configure Database
```bash
# Edit .env with your Neon PostgreSQL connection string
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
NODE_ENV=development
```

### 3. Initialize Database
```bash
# Run migrations and seed data
npm run db:setup:dev
```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at:
- **Local**: http://localhost:3050
- **Network**: http://your-ip:3050

## 🧪 Testing

### Current Test Status
```bash
# Run all tests
npm test

# Test results: 512 total, 337 passing, 175 failing
```

### Test Issues to Address
- Database connection problems in service tests
- API route function import errors
- Parameter validation issues in data-points API
- Hydration mismatch issues in frontend tests

### Recommended Test Fixes
1. Fix database connection issues in service tests
2. Resolve API route function import errors
3. Address parameter validation in data-points API
4. Fix hydration mismatch issues

## 🏗️ Project Structure

```
results-america-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── admin/         # Admin endpoints
│   │   │   ├── auth/          # Authentication
│   │   │   ├── categories/    # Categories API
│   │   │   ├── states/        # States API
│   │   │   └── statistics/    # Statistics API
│   │   ├── admin/             # Admin dashboard
│   │   ├── auth/              # Auth pages
│   │   └── ...                # Main app pages
│   ├── components/            # React components
│   ├── lib/                   # Core libraries
│   │   ├── db/               # Database schemas
│   │   ├── services/         # Business logic
│   │   └── middleware/       # API middleware
│   └── types/                # TypeScript types
├── scripts/                   # Utility scripts
├── drizzle/                   # Database migrations
└── public/                    # Static assets
```

## 🗄️ Database

### Current Schema
- **states**: All 50 US states
- **categories**: 7 data categories (Education, Economy, etc.)
- **statistics**: 50 metrics with metadata
- **dataSources**: External data providers
- **dataPoints**: Actual data values (state × statistic × year)
- **importSessions**: Data import tracking
- **csvImports**: CSV import records and status tracking
- **csvImportStaging**: Raw CSV data before processing
- **csvImportTemplates**: Predefined templates for data import
- **csvImportMetadata**: Flexible metadata storage for imports
- **csvImportValidation**: Validation results and error tracking
- **users**: User accounts (magic link auth)
- **sessions**: User sessions
- **magicLinks**: Magic link tokens

### Database Setup
- **Development**: Neon PostgreSQL (`results-america-dev`)
- **Production**: Neon PostgreSQL (`results-america-prod`) 
- **Testing**: File-based SQLite (shared across processes)

## 🔐 Authentication

### Current Implementation
- **Magic Link Authentication**: Passwordless email-based login
- **Session Management**: 24-hour sessions with automatic cleanup
- **Role-Based Access**: User and Admin roles
- **No Authentication Required**: Core features accessible without login

## 📡 API Structure

### Response Format
All API endpoints follow a consistent response structure:

```json
{
  "success": true,
  "data": [...]  // Direct access to data
}
```

### Available Endpoints
- `GET /api/states` - All US states
- `GET /api/categories` - Data categories with statistics
- `GET /api/statistics` - All statistics with metadata
- `GET /api/data-points` - Data points with filtering

See [API_RESPONSE_STRUCTURE.md](./API_RESPONSE_STRUCTURE.md) for detailed documentation.

### Features
- ✅ Magic link email authentication
- ✅ Session persistence
- ✅ Admin role protection
- ✅ Zero-friction access to core data
- ✅ Progressive enhancement with authentication

## 📊 API Endpoints

### Public APIs (No Auth Required)
- `GET /api/states` - List all states with pagination
- `GET /api/categories` - List all categories with stats
- `GET /api/statistics` - List all statistics with filtering
- `GET /api/data-points` - Get data points with filtering

### Protected APIs (Auth Required)
- `GET /api/admin/stats` - System statistics (Admin only)
- `GET /api/admin/users` - User management (Admin only)
- `POST /api/admin/csv-upload` - Upload CSV files (Admin only)
- `GET /api/admin/csv-imports` - Import history (Admin only)
- `POST /api/admin/csv-imports/{id}/validate` - Validate data (Admin only)
- `POST /api/admin/csv-imports/{id}/publish` - Publish data (Admin only)
- `GET /api/admin/csv-templates` - Import templates (Admin only)
- `POST /api/auth/magic-link` - Request magic link
- `GET /api/auth/verify` - Verify magic link
- `POST /api/auth/logout` - Logout

## 🚀 Deployment

### Pre-Deployment Checklist
- [ ] Fix all failing tests
- [ ] Verify all API endpoints return 200 status
- [ ] Test database connections in all services
- [ ] Resolve hydration mismatches
- [ ] Run full integration tests

### Deployment Options
- **Vercel**: Recommended for automatic deployments
- **Neon PostgreSQL**: Database hosting
- **Resend**: Email service for magic links

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📊 Analytics Features

### Implemented Analytics
- **Trend Analysis**: Year-over-year changes with percentage calculations
- **State Comparisons**: Rankings, percentiles, national averages
- **Statistical Analysis**: Mean, median, correlation coefficients
- **Data Quality**: Completeness metrics, coverage percentages
- **Export Functionality**: JSON, CSV, and PDF export formats

### Service Layer Architecture
- **DataPointsService**: Core data point operations with 8+ analytics methods
- **StatisticsService**: Statistics management with 7+ analytics methods
- **CategoriesService**: Category management with 6+ analytics methods
- **AnalyticsService**: Dedicated analytics service with 8 comprehensive methods
- **AdminService**: System administration and user management

## 📚 Documentation

### Current Documentation
- [CURRENT_STATUS_REPORT.md](./CURRENT_STATUS_REPORT.md) - Detailed project status
- [ROADMAP.md](./ROADMAP.md) - Development roadmap and phases
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database setup instructions
- [CSV_IMPORT_SYSTEM.md](./CSV_IMPORT_SYSTEM.md) - CSV import system guide

### API Documentation
- API endpoints are documented in the codebase
- Response structures are defined in TypeScript interfaces
- Test files provide usage examples

## 🤝 Contributing

### Development Guidelines
1. **Test Coverage**: Ensure all new code has tests
2. **Type Safety**: Use TypeScript strict mode
3. **Service Layer**: Follow the established service pattern
4. **Error Handling**: Implement proper error handling
5. **Documentation**: Update documentation for new features

### Code Quality Standards
- TypeScript strict mode enabled
- ESLint and Prettier configuration
- Comprehensive test coverage (target: >90%)
- Systematic debugging guidelines

## 📈 Roadmap

### Current Phase: Core Analytics & Reporting ✅
- Complete service layer architecture
- Comprehensive analytics capabilities
- Data import and management system
- Admin dashboard and user interface

### Next Phase: Advanced Analytics & Visualization
- Predictive analytics and machine learning
- Advanced visualization features
- Custom dashboards and reporting
- Performance optimizations

For detailed roadmap information, see [ROADMAP.md](./ROADMAP.md)

## 🐛 Known Issues

### High Priority
- Test failures affecting code reliability
- API endpoint errors (400 status codes)
- Database connection issues in some services
- Hydration mismatches in frontend components

### Medium Priority
- Performance optimization for large datasets
- Enhanced error handling and user feedback
- Improved test infrastructure
- Documentation updates

## 📞 Support

For issues and questions:
1. Check the [CURRENT_STATUS_REPORT.md](./CURRENT_STATUS_REPORT.md) for known issues
2. Review the [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
3. Examine test files for usage examples
4. Check API route implementations for endpoint details

---

**Last Updated**: January 2025  
**Version**: 0.1.0  
**Status**: Core functionality complete, test issues need resolution # Test automatic deployment - Thu Aug  7 10:50:27 PDT 2025
