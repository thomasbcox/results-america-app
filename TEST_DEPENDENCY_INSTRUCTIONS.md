# Test Dependency Instructions
## Mandatory Database Population and Cleanup Order

**⚠️ CRITICAL: All tests and seeding code MUST follow this dependency order to avoid foreign key constraint violations.**

---

## 📋 **DEPENDENCY GROUPS**

### **GROUP 1: Foundation Tables (No Foreign Keys)**
*Populate FIRST - These have no dependencies*

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | User authentication and management | `id` (PK), `email`, `name`, `role` |
| `states` | US states and territories | `id` (PK), `name`, `abbreviation` |
| `categories` | Data categories (Education, Economy, etc.) | `id` (PK), `name`, `description` |
| `data_sources` | External data providers (BEA, BLS, Census) | `id` (PK), `name`, `description`, `url` |

### **GROUP 2: First-Level Dependencies**
*Populate SECOND - These depend only on Group 1*

| Table | Dependencies | Description | Key Fields |
|-------|-------------|-------------|------------|
| `sessions` | `users.id` | User session management | `id` (PK), `user_id` (FK), `token` |
| `password_reset_tokens` | `users.id` | Password reset functionality | `id` (PK), `user_id` (FK), `token` |
| `user_activity_logs` | `users.id` | User activity tracking | `id` (PK), `user_id` (FK), `action` |
| `statistics` | `categories.id`, `data_sources.id` | Data metrics and measures | `id` (PK), `category_id` (FK), `data_source_id` (FK) |
| `import_sessions` | `data_sources.id` | Data import tracking | `id` (PK), `data_source_id` (FK), `name` |

### **GROUP 3: Second-Level Dependencies**
*Populate LAST - These depend on Group 2*

| Table | Dependencies | Description | Key Fields |
|-------|-------------|-------------|------------|
| `data_points` | `import_sessions.id`, `states.id`, `statistics.id` | Actual data values | `id` (PK), `import_session_id` (FK), `state_id` (FK), `statistic_id` (FK) |

---

## 🔄 **MANDATORY OPERATION ORDER**

### **POPULATION ORDER (Forward Dependencies)**
```typescript
// 1. GROUP 1: Foundation Tables (No Foreign Keys)
await createUsers();
await createStates();
await createCategories();
await createDataSources();

// 2. GROUP 2: First-Level Dependencies
await createSessions();
await createPasswordResetTokens();
await createUserActivityLogs();
await createStatistics();
await createImportSessions();

// 3. GROUP 3: Second-Level Dependencies
await createDataPoints();
```

### **CLEANUP ORDER (Reverse Dependencies)**
```typescript
// 3. GROUP 3: Second-Level Dependencies (clear first)
await deleteDataPoints();

// 2. GROUP 2: First-Level Dependencies
await deleteSessions();
await deletePasswordResetTokens();
await deleteUserActivityLogs();
await deleteStatistics();
await deleteImportSessions();

// 1. GROUP 1: Foundation Tables (clear last)
await deleteUsers();
await deleteStates();
await deleteCategories();
await deleteDataSources();
```

---

## 🧪 **TEST IMPLEMENTATION**

### **Using the Test Utilities (RECOMMENDED)**

```typescript
import { createTestDatabase } from '@/lib/testUtils';

describe('Your Test Suite', () => {
  let testDb: any;

  beforeEach(async () => {
    // Setup test database with proper dependency order
    const testDatabase = createTestDatabase();
    testDb = testDatabase.db;
    
    // Clear any existing data in reverse dependency order
    await testDatabase.clearAllData();
    
    // Populate foundation data in dependency order
    await testDatabase.populateFoundationData();
  });

  afterEach(async () => {
    // Clean up in reverse dependency order
    if (testDb) {
      const testDatabase = createTestDatabase();
      await testDatabase.clearAllData();
    }
  });

  it('should work correctly', async () => {
    // Your test logic here
    // Foundation data is already populated in dependency order
  });
});
```

### **Manual Implementation (If Needed)**

```typescript
import { db } from '@/lib/db/index';
import { 
  dataPoints, sessions, passwordResetTokens, userActivityLogs,
  statistics, importSessions, users, states, categories, dataSources 
} from '@/lib/db/schema';

describe('Manual Test Setup', () => {
  beforeEach(async () => {
    // CLEANUP: Reverse dependency order
    await db.delete(dataPoints);
    await db.delete(sessions);
    await db.delete(passwordResetTokens);
    await db.delete(userActivityLogs);
    await db.delete(statistics);
    await db.delete(importSessions);
    await db.delete(users);
    await db.delete(states);
    await db.delete(categories);
    await db.delete(dataSources);

    // POPULATION: Forward dependency order
    await createFoundationData(); // Group 1
    await createFirstLevelDependencies(); // Group 2
    await createSecondLevelDependencies(); // Group 3
  });

  afterEach(async () => {
    // CLEANUP: Reverse dependency order
    await db.delete(dataPoints);
    await db.delete(sessions);
    await db.delete(passwordResetTokens);
    await db.delete(userActivityLogs);
    await db.delete(statistics);
    await db.delete(importSessions);
    await db.delete(users);
    await db.delete(states);
    await db.delete(categories);
    await db.delete(dataSources);
  });
});
```

---

## 🌱 **SEEDING IMPLEMENTATION**

### **Database Seeding (Production/Development)**

The seeding script in `src/lib/db/seed-normalized.ts` already follows the correct dependency order:

1. **Group 1**: States, Categories, Data Sources
2. **Group 2**: Statistics, Import Sessions  
3. **Group 3**: Data Points

**DO NOT MODIFY** the seeding order without updating this documentation.

---

## ⚠️ **COMMON MISTAKES TO AVOID**

### **❌ WRONG - Creating dependent records before foundation records**
```typescript
// DON'T DO THIS
await createUserActivityLogs(); // ❌ Depends on users
await createUsers(); // ❌ Should be first
```

### **❌ WRONG - Clearing foundation records before dependent records**
```typescript
// DON'T DO THIS
await deleteUsers(); // ❌ Will fail due to foreign key constraints
await deleteUserActivityLogs(); // ❌ Should be cleared first
```

### **✅ CORRECT - Follow dependency order**
```typescript
// DO THIS
await createUsers(); // ✅ Foundation first
await createUserActivityLogs(); // ✅ Dependencies after

// Cleanup
await deleteUserActivityLogs(); // ✅ Dependencies first
await deleteUsers(); // ✅ Foundation last
```

---

## 🔧 **ENFORCEMENT**

### **Code Review Checklist**
- [ ] Tests populate data in dependency order (Group 1 → Group 2 → Group 3)
- [ ] Tests clean up data in reverse dependency order (Group 3 → Group 2 → Group 1)
- [ ] Seeding scripts follow dependency order
- [ ] No foreign key constraint violations in test logs
- [ ] Unique identifiers used to avoid conflicts

### **Automated Checks**
- ESLint rules check for proper import order
- Test utilities enforce dependency order
- Database constraints prevent violations

---

## 📚 **RESOURCES**

- **Database Schema**: `src/lib/db/schema.ts`
- **Test Utilities**: `src/lib/testUtils.ts`
- **Test Setup**: `src/lib/test-setup.ts`
- **Seeding Script**: `src/lib/db/seed-normalized.ts`
- **Dependency Report**: `DATABASE_DEPENDENCY_REPORT.md`

---

**Remember: When in doubt, use the test utilities. They handle the dependency order automatically!** 