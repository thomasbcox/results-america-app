#!/usr/bin/env tsx

import { db } from '../src/lib/db/index';
import { csvImportTemplates, categories, dataSources } from '../src/lib/db/schema-postgres';
import { eq } from 'drizzle-orm';

async function setupFlexibleCSVTemplate() {
  console.log('📋 Setting up flexible CSV import template...');

  try {
    // Get or create categories and data sources
    const [economyCategory] = await db.select().from(categories).where(eq(categories.name, 'Economy')).limit(1);
    const [beaDataSource] = await db.select().from(dataSources).where(eq(dataSources.name, 'Bureau of Economic Analysis')).limit(1);

    // Check if flexible template already exists
    const existingTemplate = await db.select()
      .from(csvImportTemplates)
      .where(eq(csvImportTemplates.name, 'Flexible Data Template'))
      .limit(1);

    if (existingTemplate.length > 0) {
      console.log('✅ Flexible template already exists');
      return;
    }

    const flexibleTemplate = {
      name: 'Flexible Data Template',
      description: 'Flexible template for importing data with variable columns. Supports State, Year, Category, Measure, Value format and can handle multiple years.',
      categoryId: economyCategory?.id,
      dataSourceId: beaDataSource?.id,
      templateSchema: {
        columns: [
          { name: 'State', type: 'string', required: true, mapping: 'stateName' },
          { name: 'Year', type: 'number', required: true, mapping: 'year' },
          { name: 'Category', type: 'string', required: false, mapping: 'category' },
          { name: 'Measure', type: 'string', required: false, mapping: 'measure' },
          { name: 'Value', type: 'number', required: true, mapping: 'value' }
        ],
        expectedHeaders: ['State', 'Year', 'Category', 'Measure', 'Value'],
        flexibleColumns: true, // Allow additional columns
        multiYearSupport: true // Support multiple years in one file
      },
      validationRules: {
        stateName: [
          { type: 'regex', value: '^[A-Za-z\\s]+$', message: 'State name must contain only letters and spaces' }
        ],
        year: [
          { type: 'range', value: { min: 1990, max: 2030 }, message: 'Year must be between 1990 and 2030' }
        ],
        value: [
          { type: 'range', value: { min: -999999999, max: 999999999 }, message: 'Value must be a reasonable number' }
        ],
        category: [
          { type: 'enum', value: ['Economy', 'Demographics', 'Education', 'Health', 'Environment', 'Infrastructure', 'Government'], message: 'Category must be one of the predefined categories' }
        ]
      },
      sampleData: `State,Year,Category,Measure,Value
California,2020,Economy,GDP,3500000
California,2021,Economy,GDP,3700000
California,2022,Economy,GDP,3900000
California,2023,Economy,GDP,4100000
Texas,2020,Economy,GDP,2200000
Texas,2021,Economy,GDP,2300000
Texas,2022,Economy,GDP,2400000
Texas,2023,Economy,GDP,2500000
New York,2020,Demographics,Population,19500
New York,2021,Demographics,Population,19700
New York,2022,Demographics,Population,19900
New York,2023,Demographics,Population,20100`
    };

    await db.insert(csvImportTemplates).values({
      ...flexibleTemplate,
      templateSchema: JSON.stringify(flexibleTemplate.templateSchema),
      validationRules: JSON.stringify(flexibleTemplate.validationRules),
      sampleData: flexibleTemplate.sampleData,
      createdBy: 1, // Assuming admin user ID is 1
      isActive: 1
    });

    console.log('✅ Flexible CSV template created successfully');
  } catch (error) {
    console.error('❌ Error setting up flexible CSV template:', error);
    throw error;
  }
}

setupFlexibleCSVTemplate()
  .then(() => {
    console.log('🎉 Flexible CSV template setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Flexible CSV template setup failed:', error);
    process.exit(1);
  }); 