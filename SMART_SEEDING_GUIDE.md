# Smart Seeding Guide

## 🎯 Overview

The Smart Seeding system provides **idempotent** and **incremental** database seeding that works whether tables are empty, partly populated, or fully populated. It uses **name-based foreign key lookups** instead of hardcoded IDs.

## ✅ Key Features

- **🔄 Idempotent**: Can run multiple times safely
- **📈 Incremental**: Works with partly populated tables
- **🔗 Dependency-aware**: Handles FK relationships properly
- **📝 Name-based**: No hardcoded IDs
- **🛡️ Error-resistant**: Clear error messages for missing dependencies
- **🎯 Flexible**: Easy to add new data or modify existing data

## 🚀 Usage

### Seed Everything (Recommended)

```bash
# Seed all tables in dependency order
npm run db:seed:smart

# Or run the script directly
tsx scripts/smart-seed.ts
```

### Seed Specific Tables

```bash
# Seed individual tables
npm run db:seed:states
npm run db:seed:categories
npm run db:seed:data-sources
npm run db:seed:statistics
npm run db:seed:data-points
npm run db:seed:national-averages

# Or run with arguments
tsx scripts/smart-seed.ts states
tsx scripts/smart-seed.ts categories
```

### Setup Database (Migration + Seeding)

```bash
# Development setup
npm run db:setup:dev

# Production setup
npm run db:setup:prod

# Local setup
npm run db:setup:local
```

## 📊 Seeding Process

### Phase 1: Foundation Tables (No Dependencies)
- **States**: All 50 US states
- **Categories**: 7 data categories (Education, Economy, etc.)
- **Data Sources**: 15 federal agencies and organizations

### Phase 2: Statistics (Depends on Categories & Data Sources)
- **Statistics**: 20+ metrics with proper FK relationships
- Uses name-based lookups for `categoryName` and `dataSourceName`

### Phase 3: Data Points & National Averages
- **Data Points**: Sample data with name-based FK lookups
- **National Averages**: Pre-computed averages for statistics

## 🔧 How It Works

### Name-Based FK Lookups

Instead of hardcoded IDs:
```typescript
// ❌ OLD: Hardcoded IDs
await db.insert(statistics).values({
  categoryId: 1, // Hardcoded!
  dataSourceId: 2, // Hardcoded!
  name: 'K-8 Testing',
});

// ✅ NEW: Name-based lookups
const category = await db
  .select()
  .from(categories)
  .where(eq(categories.name, 'Education'))
  .limit(1);

await db.insert(statistics).values({
  categoryId: category[0].id, // Looked up by name!
  dataSourceId: dataSource[0].id, // Looked up by name!
  name: 'K-8 Testing',
});
```

### Upsert Pattern

The system uses upsert (insert or update) pattern:

```typescript
// Check if record exists
const existing = await db
  .select()
  .from(states)
  .where(eq(states.name, 'California'))
  .limit(1);

if (existing.length === 0) {
  // Insert new record
  await db.insert(states).values({ name: 'California', abbreviation: 'CA' });
  console.log('✅ Created state: California');
} else {
  // Update existing record
  await db
    .update(states)
    .set({ abbreviation: 'CA' })
    .where(eq(states.id, existing[0].id));
  console.log('🔄 Updated state: California');
}
```

### Dependency Order

The system seeds in proper dependency order:

1. **Foundation Tables** (no dependencies)
   - States
   - Categories  
   - Data Sources

2. **First-Level Dependencies** (need foundation tables)
   - Statistics (depends on categories and data sources)

3. **Second-Level Dependencies** (need everything above)
   - Data Points (depends on states, statistics, import sessions)
   - National Averages (depends on statistics)

## 📋 Data Structure

### States
```typescript
const stateData = [
  { name: 'California', abbreviation: 'CA' },
  { name: 'Texas', abbreviation: 'TX' },
  // ... all 50 states
];
```

### Categories
```typescript
const categoryData = [
  { name: 'Education', description: 'K-12 and higher education metrics', icon: 'GraduationCap', sortOrder: 1 },
  { name: 'Economy', description: 'Economic indicators and employment', icon: 'TrendingUp', sortOrder: 2 },
  // ... 7 categories
];
```

### Statistics (with name-based FK lookups)
```typescript
const statisticData = [
  {
    raNumber: '1001',
    name: 'K-8 Testing',
    categoryName: 'Education', // ✅ Name lookup
    dataSourceName: 'Department of Education', // ✅ Name lookup
    description: 'Reading, Writing, and Math Skills at Grades 4 and 8',
    unit: 'Scale Score',
    availableSince: '1992'
  },
  // ... more statistics
];
```

### Data Points (with name-based FK lookups)
```typescript
const dataPointData = [
  {
    stateName: 'California', // ✅ Name lookup
    statisticName: 'K-8 Testing', // ✅ Name lookup
    year: 2023,
    value: 85.2
  },
  // ... more data points
];
```

## 🛠️ Adding New Data

### Adding New States
```typescript
// In SmartSeeder.seedStates()
const stateData = [
  // ... existing states
  { name: 'New State', abbreviation: 'NS' }, // Add here
];
```

### Adding New Categories
```typescript
// In SmartSeeder.seedCategories()
const categoryData = [
  // ... existing categories
  { name: 'New Category', description: 'New category description', icon: 'Icon', sortOrder: 8 },
];
```

### Adding New Statistics
```typescript
// In SmartSeeder.seedStatistics()
const statisticData = [
  // ... existing statistics
  {
    raNumber: '9999',
    name: 'New Statistic',
    categoryName: 'Education', // Must exist in categories table
    dataSourceName: 'Department of Education', // Must exist in data_sources table
    description: 'Description of new statistic',
    unit: 'Unit',
    availableSince: '2024'
  },
];
```

## 🔍 Error Handling

The system provides detailed error reporting:

```
🌱 Starting smart seeding in dependency order...

📋 Phase 1: Foundation tables
  ✅ Created state: Alabama
  ✅ Created state: Alaska
  🔄 Updated state: California

📊 Phase 2: Statistics (depends on categories and data sources)
  ✅ Created statistic: K-8 Testing
  ❌ Category 'Invalid Category' not found for statistic New Statistic

📈 Phase 3: Data points and national averages
  ✅ Created data point: California - K-8 Testing (2023)

📊 Seeding Summary:
===================
states:
  ✅ Created: 50
  🔄 Updated: 0
  ❌ Errors: 0

statistics:
  ✅ Created: 19
  🔄 Updated: 0
  ❌ Errors: 1
  - Category 'Invalid Category' not found for statistic New Statistic

📈 Totals:
  ✅ Total Created: 69
  🔄 Total Updated: 0
  ❌ Total Errors: 1
```

## 🎯 Benefits

### For Development
- **Safe to run multiple times** during development
- **Easy to add new data** without breaking existing data
- **Clear error messages** when dependencies are missing

### For Production
- **Incremental updates** without losing existing data
- **Data integrity** through proper FK relationships
- **Audit trail** of what was created vs updated

### For Maintenance
- **No hardcoded IDs** to maintain
- **Name-based relationships** are more readable
- **Flexible data structure** easy to modify

## 🔄 Migration from Old Seeding

If you have existing hardcoded seeding, you can gradually migrate:

```typescript
// Old approach (hardcoded IDs)
await db.insert(statistics).values({
  categoryId: 1, // ❌ Hardcoded
  dataSourceId: 2, // ❌ Hardcoded
  name: 'K-8 Testing',
});

// New approach (name-based lookups)
await SmartSeeder.upsertStatistic({
  name: 'K-8 Testing',
  categoryName: 'Education', // ✅ Name lookup
  dataSourceName: 'Department of Education', // ✅ Name lookup
  raNumber: '1001',
  description: 'Reading, Writing, and Math Skills at Grades 4 and 8',
  unit: 'Scale Score',
  availableSince: '1992'
});
```

## 🚨 Important Notes

1. **Dependency Order**: Always run foundation tables first
2. **Name Matching**: Names must match exactly (case-sensitive)
3. **Error Handling**: Check error output for missing dependencies
4. **Incremental**: Can run on partly populated databases
5. **Safe**: Won't duplicate data or break existing relationships

This smart seeding system makes your database seeding much more robust and maintainable! 