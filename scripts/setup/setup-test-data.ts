import { getDb } from '../../src/lib/db';
import { states, categories, statistics, dataSources } from '../../src/lib/db/schema-postgres';
import { eq } from 'drizzle-orm';

async function setupTestData() {
  const db = getDb();
  if (!db) {
    throw new Error('Database not available');
  }
  try {
    console.log('🔧 Setting up test data...');
    
    // Create test data source (or get existing)
    let dataSource;
    try {
      [dataSource] = await db
        .insert(dataSources)
        .values({
          name: 'Test Data Source',
          description: 'Test data source for CSV import testing',
          url: 'https://example.com',
          isActive: 1,
        })
        .returning();
      console.log('✅ Created data source:', dataSource.name);
    } catch (error) {
      // Data source already exists, get it
      const existingDataSource = await db
        .select()
        .from(dataSources)
        .where(eq(dataSources.name, 'Test Data Source'))
        .limit(1);
      dataSource = existingDataSource[0];
      console.log('✅ Using existing data source:', dataSource.name);
    }
    
    // Create test states
    const testStates = [
      { name: 'California', abbreviation: 'CA' },
      { name: 'Texas', abbreviation: 'TX' },
      { name: 'New York', abbreviation: 'NY' },
      { name: 'Florida', abbreviation: 'FL' },
      { name: 'Illinois', abbreviation: 'IL' },
    ];
    
    for (const state of testStates) {
      await db
        .insert(states)
        .values({
          name: state.name,
          abbreviation: state.abbreviation,
          isActive: 1,
        })
        .onConflictDoNothing();
    }
    
    console.log('✅ Created test states');
    
    // Create test category (or get existing)
    let category;
    try {
      [category] = await db
        .insert(categories)
        .values({
          name: 'Economy',
          description: 'Economic indicators and metrics',
          icon: 'chart-line',
          sortOrder: 1,
          isActive: 1,
        })
        .returning();
      console.log('✅ Created category:', category.name);
    } catch (error) {
      // Category already exists, get it
      const existingCategory = await db
        .select()
        .from(categories)
        .where(eq(categories.name, 'Economy'))
        .limit(1);
      category = existingCategory[0];
      console.log('✅ Using existing category:', category.name);
    }
    
    // Create test statistic (or get existing)
    let statistic;
    try {
      [statistic] = await db
        .insert(statistics)
        .values({
          raNumber: '1001',
          categoryId: category.id,
          dataSourceId: dataSource.id,
          name: 'GDP',
          description: 'Gross Domestic Product',
          unit: 'millions of dollars',
          dataQuality: 'mock',
          isActive: 1,
        })
        .returning();
      console.log('✅ Created statistic:', statistic.name);
    } catch (error) {
      // Statistic already exists, get it
      const existingStatistic = await db
        .select()
        .from(statistics)
        .where(eq(statistics.name, 'GDP'))
        .limit(1);
      statistic = existingStatistic[0];
      console.log('✅ Using existing statistic:', statistic.name);
    }
    
    console.log('\n🎉 Test data setup complete!');
    console.log('States: California, Texas, New York, Florida, Illinois');
    console.log('Category: Economy');
    console.log('Statistic: GDP');
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  }
}

setupTestData(); 