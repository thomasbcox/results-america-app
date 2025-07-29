#!/usr/bin/env tsx

import { getDb } from '../src/lib/db/index';
import { csvImportTemplates, categories, dataSources } from '../src/lib/db/schema-postgres';
import { eq } from 'drizzle-orm';

async function setupCSVTemplates() {
  const db = getDb();  console.log('📋 Setting up CSV import templates...');

  try {
    // Get or create categories and data sources
    const [economyCategory] = await db.select().from(categories).where(eq(categories.name, 'Economy')).limit(1);
    const [beaDataSource] = await db.select().from(dataSources).where(eq(dataSources.name, 'Bureau of Economic Analysis')).limit(1);

    const templates = [
      {
        name: 'BEA GDP Template',
        description: 'Template for importing GDP data from Bureau of Economic Analysis',
        categoryId: economyCategory?.id,
        dataSourceId: beaDataSource?.id,
        templateSchema: {
          columns: [
            { name: 'State', type: 'string', required: true, mapping: 'stateName' },
            { name: 'Year', type: 'number', required: true, mapping: 'year' },
            { name: 'GDP_Millions', type: 'number', required: true, mapping: 'value' }
          ],
          expectedHeaders: ['State', 'Year', 'GDP_Millions']
        },
        validationRules: {
          stateName: [
            { type: 'regex', value: '^[A-Za-z\\s]+$', message: 'State name must contain only letters and spaces' }
          ],
          year: [
            { type: 'range', value: { min: 2010, max: 2030 }, message: 'Year must be between 2010 and 2030' }
          ],
          value: [
            { type: 'range', value: { min: 0, max: 10000000 }, message: 'GDP value must be positive and reasonable' }
          ]
        },
        sampleData: `State,Year,GDP_Millions
California,2023,3500000
Texas,2023,2200000
New York,2023,1800000
Florida,2023,1200000
Illinois,2023,900000`
      },
      {
        name: 'BLS Employment Template',
        description: 'Template for importing employment data from Bureau of Labor Statistics',
        categoryId: economyCategory?.id,
        dataSourceId: beaDataSource?.id,
        templateSchema: {
          columns: [
            { name: 'State', type: 'string', required: true, mapping: 'stateName' },
            { name: 'Year', type: 'number', required: true, mapping: 'year' },
            { name: 'Employment_Thousands', type: 'number', required: true, mapping: 'value' }
          ],
          expectedHeaders: ['State', 'Year', 'Employment_Thousands']
        },
        validationRules: {
          stateName: [
            { type: 'regex', value: '^[A-Za-z\\s]+$', message: 'State name must contain only letters and spaces' }
          ],
          year: [
            { type: 'range', value: { min: 2010, max: 2030 }, message: 'Year must be between 2010 and 2030' }
          ],
          value: [
            { type: 'range', value: { min: 0, max: 20000 }, message: 'Employment value must be positive and reasonable' }
          ]
        },
        sampleData: `State,Year,Employment_Thousands
California,2023,18500
Texas,2023,14500
New York,2023,9500
Florida,2023,9800
Illinois,2023,6000`
      },
      {
        name: 'Census Population Template',
        description: 'Template for importing population data from US Census Bureau',
        categoryId: economyCategory?.id,
        dataSourceId: beaDataSource?.id,
        templateSchema: {
          columns: [
            { name: 'State', type: 'string', required: true, mapping: 'stateName' },
            { name: 'Year', type: 'number', required: true, mapping: 'year' },
            { name: 'Population_Thousands', type: 'number', required: true, mapping: 'value' }
          ],
          expectedHeaders: ['State', 'Year', 'Population_Thousands']
        },
        validationRules: {
          stateName: [
            { type: 'regex', value: '^[A-Za-z\\s]+$', message: 'State name must contain only letters and spaces' }
          ],
          year: [
            { type: 'range', value: { min: 2010, max: 2030 }, message: 'Year must be between 2010 and 2030' }
          ],
          value: [
            { type: 'range', value: { min: 0, max: 50000 }, message: 'Population value must be positive and reasonable' }
          ]
        },
        sampleData: `State,Year,Population_Thousands
California,2023,39000
Texas,2023,30000
Florida,2023,22000
New York,2023,20000
Pennsylvania,2023,13000`
      },
      {
        name: 'Generic Data Template',
        description: 'Generic template for importing any state-level data',
        categoryId: economyCategory?.id,
        dataSourceId: beaDataSource?.id,
        templateSchema: {
          columns: [
            { name: 'State', type: 'string', required: true, mapping: 'stateName' },
            { name: 'Year', type: 'number', required: true, mapping: 'year' },
            { name: 'Value', type: 'number', required: true, mapping: 'value' },
            { name: 'Notes', type: 'string', required: false, mapping: 'notes' }
          ],
          expectedHeaders: ['State', 'Year', 'Value', 'Notes']
        },
        validationRules: {
          stateName: [
            { type: 'regex', value: '^[A-Za-z\\s]+$', message: 'State name must contain only letters and spaces' }
          ],
          year: [
            { type: 'range', value: { min: 2010, max: 2030 }, message: 'Year must be between 2010 and 2030' }
          ],
          value: [
            { type: 'range', value: { min: -1000000, max: 10000000 }, message: 'Value must be within reasonable range' }
          ]
        },
        sampleData: `State,Year,Value,Notes
California,2023,100.5,Example metric
Texas,2023,85.2,Example metric
New York,2023,92.1,Example metric
Florida,2023,78.9,Example metric
Illinois,2023,65.4,Example metric`
      }
    ];

    for (const template of templates) {
      // Check if template already exists
      const existing = await db.select()
        .from(csvImportTemplates)
        .where(eq(csvImportTemplates.name, template.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(csvImportTemplates).values({
          ...template,
          templateSchema: JSON.stringify(template.templateSchema),
          validationRules: JSON.stringify(template.validationRules),
          sampleData: template.sampleData,
          createdBy: 3, // Admin user
          isActive: 1
        });
        console.log(`✅ Created template: ${template.name}`);
      } else {
        console.log(`⏭️  Template already exists: ${template.name}`);
      }
    }

    console.log('🎉 CSV templates setup completed!');
    console.log(`📊 Created ${templates.length} templates for data import`);

  } catch (error) {
    console.error('❌ Error setting up CSV templates:', error);
    process.exit(1);
  }
}

// Run the script
setupCSVTemplates()
  .then(() => {
    console.log('🎉 CSV templates setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  }); 