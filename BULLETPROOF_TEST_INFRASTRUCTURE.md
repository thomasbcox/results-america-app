# Bulletproof Test Infrastructure

This document describes the bulletproof test infrastructure designed to eliminate foreign key constraint errors, orphaned records, and inconsistent data state between tests.

## 🎯 **Goals Achieved**

- ✅ **Complete test isolation** - No test data persists between tests
- ✅ **Foreign key safety** - Proper constraint handling during setup/teardown
- ✅ **Deterministic state** - Every test starts with a known, clean database
- ✅ **Fast performance** - Optimized setup/teardown for quick test execution
- ✅ **Parallel execution** - Tests can run in parallel without conflicts
- ✅ **Environment consistency** - Test DB schema matches production exactly

## 🏗️ **Architecture Overview**

### Core Components

1. **BulletproofTestDatabase** - Manages test database lifecycle
2. **TestDatabaseFactory** - Creates databases with common configurations
3. **TestDatabaseManager** - Manages database instances during tests
4. **JestTestHelpers** - Utilities for API and component testing

### Database Lifecycle

```
Test Start → Create Fresh DB → Seed Data → Run Test → Clear Data → Destroy DB → Test End
```

## 📚 **Usage Guide**

### Basic Service Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TestDatabaseManager, BulletproofTestDatabase } from '@/lib/test-infrastructure/bulletproof-test-db';
import { YourService } from '@/lib/services/yourService';

describe('YourService', () => {
  let testDb: any;

  beforeEach(async () => {
    // Create fresh test database with seeded data
    testDb = await TestDatabaseManager.createTestDatabase({
      seed: true,
      seedOptions: {
        states: true,
        categories: true,
        dataSources: true,
        statistics: true,
        // Only seed what you need for this test
      }
    });
  });

  afterEach(() => {
    // Clean up test database
    TestDatabaseManager.cleanupTestDatabase();
  });

  it('should perform some operation', async () => {
    // Your test logic here
    const result = await YourService.someMethod();
    expect(result).toBeDefined();
  });
});
```

### API Route Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TestDatabaseManager, JestTestHelpers } from '@/lib/test-infrastructure/jest-setup';
import { GET } from '@/app/api/your-endpoint/route';

describe('GET /api/your-endpoint', () => {
  beforeEach(async () => {
    await TestDatabaseManager.createTestDatabase({
      seed: true,
      seedOptions: { states: true, categories: true }
    });
  });

  afterEach(() => {
    TestDatabaseManager.cleanupTestDatabase();
  });

  it('should return data', async () => {
    const request = JestTestHelpers.createMockRequest('/api/your-endpoint');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

### Component Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { TestDatabaseManager } from '@/lib/test-infrastructure/jest-setup';
import { YourComponent } from '@/components/YourComponent';

describe('YourComponent', () => {
  beforeEach(async () => {
    await TestDatabaseManager.createTestDatabase({
      seed: true,
      seedOptions: { states: true }
    });
  });

  afterEach(() => {
    TestDatabaseManager.cleanupTestDatabase();
  });

  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## 🔧 **Database Configurations**

### Fast In-Memory Database (Default)
```typescript
const testDb = BulletproofTestDatabase.create({
  inMemory: true,
  enableForeignKeys: true,
  enableWAL: false, // Faster for tests
  verbose: false
});
```

### Persistent File-Based Database
```typescript
const testDb = BulletproofTestDatabase.create({
  inMemory: false,
  enableForeignKeys: true,
  enableWAL: true,
  verbose: false
});
```

### Debug Database
```typescript
const testDb = BulletproofTestDatabase.create({
  inMemory: true,
  enableForeignKeys: true,
  enableWAL: false,
  verbose: true // Shows detailed logs
});
```

## 🌱 **Seeding Options**

Control what data gets seeded:

```typescript
const seedOptions = {
  states: true,           // Seed states table
  categories: true,       // Seed categories table
  dataSources: true,      // Seed data sources table
  statistics: true,       // Seed statistics table
  importSessions: true,   // Seed import sessions table
  dataPoints: true,       // Seed data points table
  users: true,           // Seed users table
  csvTemplates: true     // Seed CSV import templates table
};
```

## 🧹 **Data Clearing**

The system clears data in the correct dependency order:

1. `import_logs`
2. `import_validation_summary`
3. `csv_import_validation`
4. `csv_import_metadata`
5. `csv_import_staging`
6. `csv_imports`
7. `csv_import_templates`
8. `data_points`
9. `national_averages`
10. `magic_links`
11. `sessions`
12. `user_favorites`
13. `user_suggestions`
14. `users`
15. `import_sessions`
16. `statistics`
17. `data_sources`
18. `categories`
19. `states`

## 🔒 **Foreign Key Safety**

The system ensures foreign key constraints are respected:

1. **During setup**: Foreign keys are enabled and data is inserted in dependency order
2. **During teardown**: Foreign keys are temporarily disabled, data is cleared in reverse dependency order, then foreign keys are re-enabled
3. **Error handling**: If any operation fails, foreign keys are re-enabled to prevent database corruption

## ⚡ **Performance Optimizations**

- **In-memory databases**: Used by default for fastest performance
- **Optimized SQLite settings**: WAL disabled, synchronous mode set to NORMAL
- **Efficient clearing**: Single DELETE statements per table
- **Minimal seeding**: Only seed data that's actually needed for the test

## 🧪 **Test Utilities**

### JestTestHelpers

```typescript
// Create mock requests for API testing
const request = JestTestHelpers.createMockRequest('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: { key: 'value' }
});

// Create mock responses
const response = JestTestHelpers.createMockResponse({ data: 'test' }, {
  status: 200,
  headers: { 'Content-Type': 'application/json' }
});

// Wait for async operations
await JestTestHelpers.waitFor(() => condition(), 5000);

// Mock environment variables
const cleanup = JestTestHelpers.mockEnv({ NODE_ENV: 'test' });
// ... test code ...
cleanup(); // Restore original env
```

## 🚀 **Running Tests**

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- src/lib/services/yourService.test.ts
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests in Parallel
```bash
npm test -- --maxWorkers=4
```

## 📋 **Best Practices**

### 1. **Test Isolation**
- Always use `beforeEach` to create fresh databases
- Always use `afterEach` to clean up databases
- Never share database instances between tests

### 2. **Seeding Strategy**
- Only seed data that's actually needed for the test
- Use specific seed options to minimize setup time
- Consider creating custom seed functions for complex test scenarios

### 3. **Database Configuration**
- Use in-memory databases for unit tests (faster)
- Use file-based databases for integration tests (more realistic)
- Enable verbose logging only when debugging

### 4. **Error Handling**
- Tests should clean up even if they fail
- Use try-catch blocks in test setup/teardown
- Don't let cleanup errors fail tests

### 5. **Performance**
- Keep tests focused and minimal
- Avoid seeding unnecessary data
- Use appropriate database configurations for test type

## 🔍 **Debugging Tests**

### Enable Verbose Logging
```typescript
const testDb = BulletproofTestDatabase.create({
  verbose: true // Shows detailed database operations
});
```

### Check Database State
```typescript
// Get current test database
const db = TestDatabaseManager.getCurrentTestDatabase();

// Check table contents
const states = await db.db.select().from(schema.states);
console.log('States:', states);
```

### Manual Database Operations
```typescript
// Clear specific data
BulletproofTestDatabase.clearData(testDb);

// Seed specific data
await BulletproofTestDatabase.seedData(testDb, { states: true });
```

## 🛠️ **Troubleshooting**

### Common Issues

1. **Foreign Key Constraint Errors**
   - Ensure you're using the bulletproof test infrastructure
   - Check that data is being cleared in the correct order
   - Verify that foreign keys are being re-enabled after clearing

2. **Test Data Persistence**
   - Make sure you're calling `TestDatabaseManager.cleanupTestDatabase()` in `afterEach`
   - Verify that each test creates a fresh database in `beforeEach`

3. **Slow Test Performance**
   - Use in-memory databases for unit tests
   - Only seed necessary data
   - Disable WAL mode for faster in-memory tests

4. **API Test Failures**
   - Ensure Next.js globals are properly mocked
   - Use `JestTestHelpers.createMockRequest()` for API testing
   - Check that the database is properly mocked for API routes

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debugging
npm test -- --testNamePattern="Your Test Name" --verbose

# Run tests with coverage and watch
npm test -- --coverage --watch
```

## 📈 **Monitoring and Metrics**

The test infrastructure provides built-in monitoring:

- **Database creation/destruction logs** (when verbose mode is enabled)
- **Data clearing logs** (when verbose mode is enabled)
- **Performance metrics** (test execution time)
- **Coverage reports** (code coverage statistics)

## 🔄 **Migration from Old Test System**

If you have existing tests using the old test setup:

1. **Replace imports**:
   ```typescript
   // Old
   import { createTestDb, clearTestDb, closeTestDb } from '../db/testDb';
   
   // New
   import { TestDatabaseManager } from '@/lib/test-infrastructure/jest-setup';
   ```

2. **Update test structure**:
   ```typescript
   // Old
   beforeEach(() => {
     db = createTestDb();
   });
   
   afterEach(() => {
     clearTestDb(db);
     closeTestDb(db);
   });
   
   // New
   beforeEach(async () => {
     await TestDatabaseManager.createTestDatabase({ seed: true });
   });
   
   afterEach(() => {
     TestDatabaseManager.cleanupTestDatabase();
   });
   ```

3. **Update API tests**:
   ```typescript
   // Old
   import { NextRequest } from 'next/server';
   
   // New
   import { JestTestHelpers } from '@/lib/test-infrastructure/jest-setup';
   const request = JestTestHelpers.createMockRequest('/api/endpoint');
   ```

## 🎉 **Benefits Achieved**

- **Zero foreign key errors** - Proper constraint handling
- **Complete test isolation** - No data leakage between tests
- **Fast test execution** - Optimized database operations
- **Reliable test results** - Deterministic test state
- **Easy debugging** - Comprehensive logging and utilities
- **Parallel execution** - Tests can run simultaneously
- **Production parity** - Test schema matches production exactly

This bulletproof test infrastructure ensures your tests are reliable, fast, and maintainable. 