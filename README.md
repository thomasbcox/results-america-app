# Results America

A data transparency platform that provides state-level statistics with complete provenance tracking and trust-building features.

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
- `POST /api/auth/magic-link` - Request magic link
- `GET /api/auth/verify` - Verify magic link
- `POST /api/auth/logout` - Logout

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern="states|categories|statistics"

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
- ✅ API route tests (states, categories, statistics)
- ✅ Service layer tests
- ✅ Database integration tests
- ✅ Authentication tests

## 🚀 Deployment

### Vercel Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Environment Variables for Production
```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
NODE_ENV=production
```

## 📚 Documentation

- [Admin Guide](./ADMIN_GUIDE.md) - Admin dashboard and system management
- [Database Setup](./DATABASE_SETUP.md) - Database configuration and migration
- [Roadmap](./ROADMAP.md) - Development roadmap and phases
- [User Authentication](./USER_AUTHENTICATION.md) - Authentication system details

## 🔧 Development

### Available Scripts
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run test             # Run tests
npm run db:studio        # Open database studio
npm run db:seed          # Seed database
npm run deploy:seed      # Deploy seed data
```

### Database Commands
```bash
npm run db:generate      # Generate new migration
npm run db:migrate       # Run migrations
npm run db:setup:dev     # Setup development database
npm run db:setup:prod    # Setup production database
```

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify `DATABASE_URL` in `.env`
- Check Neon database status
- Ensure SSL is enabled for Neon

**API Errors**
- Check server logs for detailed error messages
- Verify database schema matches migrations
- Test individual API endpoints

**Authentication Issues**
- Clear browser cookies
- Check magic link expiration (15 minutes)
- Verify email delivery

## 📄 License

This project is part of the Results America initiative.

---

**Last Updated**: January 2025  
**Version**: 0.1.0 