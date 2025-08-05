# Bulletproof Test Infrastructure

This document describes the bulletproof test infrastructure designed to eliminate foreign key constraint errors, orphaned records, and inconsistent data state between tests, while ensuring compatibility across our **SQLite in-memory** test environment and **PostgreSQL** development/production environments. It also addresses recurring confusion about differences between the two engines—especially around type handling for date vs. number fields—and ensures tests enforce identical behavior.

## 🎯 **Goals Achieved**

- ✅ **Complete test isolation** – No test data persists between tests
- ✅ **Foreign key safety** – Proper constraint handling during setup/teardown
- ✅ **Deterministic state** – Every test starts with a known, clean database
- ✅ **Fast performance** – Optimized setup/teardown for quick test execution
- ✅ **Parallel execution** – Tests can run in parallel without conflicts
- ✅ **Environment consistency** – Test DB schema matches production exactly
- ✅ **Cross-environment correctness** – Services and queries must work with SQLite in-memory (test) and PostgreSQL (dev/prod)
- ✅ **Type consistency** – Explicit handling of date and number fields to behave identically in SQLite and PostgreSQL

## 🏗️ **Architecture Overview**

### Core Components

1. **BulletproofTestDatabase** – Manages test database lifecycle.
2. **TestDatabaseFactory** – Creates databases with consistent configurations.
3. **TestDatabaseManager** – Manages database instances during tests.
4. **JestTestHelpers** – Utilities for API and component testing.

### Database Lifecycle

```
Test Start → Create Fresh DB → Seed Data → Run Test → Clear Data → Destroy DB → Test End
```

### Environment Mapping

- **Test** – SQLite in-memory for speed, with schema, constraints, and type definitions (dates, numbers, text) matching PostgreSQL.
- **Development/Production** – PostgreSQL for real-world performance and advanced features.

## 🔧 **Database Configurations**

### SQLite In-Memory (Test)

- WAL disabled for speed.
- Synchronous mode NORMAL.
- Foreign keys enforced.
- Explicit date/number column handling to mirror PostgreSQL types.
- Must behave identically to PostgreSQL in queries and services.

### PostgreSQL (Dev/Prod)

- Real-world environment.
- Schema parity with SQLite tests enforced.
- Full support for production-level features.
- Date/time and numeric precision consistent with test environment.

## 🌱 **Seeding Options**

- Fine-grained seeding: specify exactly which tables are populated.
- Seed only what is required for each test to minimize setup time.
- Maintain seed data parity between SQLite and PostgreSQL.
- Ensure seeded date fields use a consistent, ISO-compliant format.

## 🧹 **Data Clearing**

- Data is cleared in dependency order.
- FK constraints temporarily disabled for teardown, then re-enabled.
- Handles clearing for all relevant tables, including:
  1. import logs & validation
  2. staging & imports
  3. data points & related measures
  4. supporting reference data (categories, states, etc.)

## 🔒 **Foreign Key Safety**

1. **Setup** – Enable FK constraints; insert in dependency order.
2. **Teardown** – Disable FK constraints, clear data in reverse dependency order, re-enable.
3. **Failure Recovery** – Always restore FK enforcement even after errors.

## ⚡ **Performance Optimizations**

- Use SQLite in-memory for unit and service tests.
- Use PostgreSQL in dev/prod for realistic validation.
- Minimize seeded data.
- Disable WAL in test mode for speed.

## 📚 **Usage Examples**

**Basic Service Test**

```typescript
beforeEach(async () => {
  await TestDatabaseManager.createTestDatabase({ seed: true, seedOptions: { states: true } });
});
afterEach(() => {
  TestDatabaseManager.cleanupTestDatabase();
});
```

**API Route Test**

```typescript
beforeEach(async () => {
  await TestDatabaseManager.createTestDatabase({ seed: true, seedOptions: { categories: true } });
});
```

**Component Test**

```typescript
beforeEach(async () => {
  await TestDatabaseManager.createTestDatabase({ seed: true });
});
```

## 📋 **Best Practices**

1. Always use `beforeEach` and `afterEach` for DB lifecycle.
2. Keep test queries DB-agnostic.
3. Validate schema and type parity often, especially for date and number fields.
4. Use verbose logging when debugging.
5. Never share DB instances between tests.

## 🔍 **Debugging**

- Enable verbose mode to trace operations.
- Inspect table contents mid-test if needed.
- Log seed data and teardown actions.
- For date/number mismatches, log both raw and parsed values in SQLite and PostgreSQL.

## 🛠️ **Troubleshooting**

- **FK Errors** – Verify teardown order, FK enable/disable steps.
- **Data Persistence** – Ensure cleanup is always called.
- **Type Mismatches** – Adjust schema or casting logic to ensure date/number consistency across DB engines.
- **Slow Tests** – Use in-memory SQLite and minimal seeding.

## 🎉 **Benefits**

- Zero FK errors.
- Consistent results and types across environments.
- Complete test isolation.
- High-speed test execution.
- Confidence that tests reflect production behavior and data types.

