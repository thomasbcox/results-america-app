#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema-postgres';
import { eq } from 'drizzle-orm';

/**
 * PRODUCTION POSTGRESQL DATABASE SEEDING SCRIPT
 * 
 * This script seeds the production PostgreSQL database with all required data for admin functions.
 * It follows proper dependency order and can be run safely multiple times.
 * 
 * DEPENDENCY ORDER:
 * 1. States (no dependencies)
 * 2. Categories (no dependencies) 
 * 3. Data Sources (no dependencies)
 * 4. Admin User (no dependencies)
 * 5. CSV Import Templates (depends on users)
 * 6. Sample Statistics (depends on categories, data sources)
 * 7. Sample Import Sessions (depends on data sources)
 * 8. Sample Data Points (depends on import sessions, states, statistics)
 */

interface SeedingResult {
  success: boolean;
  message: string;
  details: {
    statesInserted: number;
    categoriesInserted: number;
    dataSourcesInserted: number;
    templatesInserted: number;
    adminUserCreated: boolean;
    statisticsInserted: number;
    importSessionsInserted: number;
    dataPointsInserted: number;
  };
}

export async function seedProductionDatabasePostgres(): Promise<SeedingResult> {
  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });
  
  console.log('🌱 Starting production PostgreSQL database seeding...');
  
  const result = {
    success: true,
    message: 'Database seeded successfully',
    details: {
      statesInserted: 0,
      categoriesInserted: 0,
      dataSourcesInserted: 0,
      templatesInserted: 0,
      adminUserCreated: false,
      statisticsInserted: 0,
      importSessionsInserted: 0,
      dataPointsInserted: 0
    }
  };

  try {
    // PHASE 1: Foundation Data (No Dependencies)
    
    // 1. States
    console.log('📍 Seeding states...');
    const stateData = [
      { name: 'Alabama', abbreviation: 'AL' },
      { name: 'Alaska', abbreviation: 'AK' },
      { name: 'Arizona', abbreviation: 'AZ' },
      { name: 'Arkansas', abbreviation: 'AR' },
      { name: 'California', abbreviation: 'CA' },
      { name: 'Colorado', abbreviation: 'CO' },
      { name: 'Connecticut', abbreviation: 'CT' },
      { name: 'Delaware', abbreviation: 'DE' },
      { name: 'Florida', abbreviation: 'FL' },
      { name: 'Georgia', abbreviation: 'GA' },
      { name: 'Hawaii', abbreviation: 'HI' },
      { name: 'Idaho', abbreviation: 'ID' },
      { name: 'Illinois', abbreviation: 'IL' },
      { name: 'Indiana', abbreviation: 'IN' },
      { name: 'Iowa', abbreviation: 'IA' },
      { name: 'Kansas', abbreviation: 'KS' },
      { name: 'Kentucky', abbreviation: 'KY' },
      { name: 'Louisiana', abbreviation: 'LA' },
      { name: 'Maine', abbreviation: 'ME' },
      { name: 'Maryland', abbreviation: 'MD' },
      { name: 'Massachusetts', abbreviation: 'MA' },
      { name: 'Michigan', abbreviation: 'MI' },
      { name: 'Minnesota', abbreviation: 'MN' },
      { name: 'Mississippi', abbreviation: 'MS' },
      { name: 'Missouri', abbreviation: 'MO' },
      { name: 'Montana', abbreviation: 'MT' },
      { name: 'Nation', abbreviation: 'NA' },
      { name: 'Nebraska', abbreviation: 'NE' },
      { name: 'Nevada', abbreviation: 'NV' },
      { name: 'New Hampshire', abbreviation: 'NH' },
      { name: 'New Jersey', abbreviation: 'NJ' },
      { name: 'New Mexico', abbreviation: 'NM' },
      { name: 'New York', abbreviation: 'NY' },
      { name: 'North Carolina', abbreviation: 'NC' },
      { name: 'North Dakota', abbreviation: 'ND' },
      { name: 'Ohio', abbreviation: 'OH' },
      { name: 'Oklahoma', abbreviation: 'OK' },
      { name: 'Oregon', abbreviation: 'OR' },
      { name: 'Pennsylvania', abbreviation: 'PA' },
      { name: 'Rhode Island', abbreviation: 'RI' },
      { name: 'South Carolina', abbreviation: 'SC' },
      { name: 'South Dakota', abbreviation: 'SD' },
      { name: 'Tennessee', abbreviation: 'TN' },
      { name: 'Texas', abbreviation: 'TX' },
      { name: 'Utah', abbreviation: 'UT' },
      { name: 'Vermont', abbreviation: 'VT' },
      { name: 'Virginia', abbreviation: 'VA' },
      { name: 'Washington', abbreviation: 'WA' },
      { name: 'West Virginia', abbreviation: 'WV' },
      { name: 'Wisconsin', abbreviation: 'WI' },
      { name: 'Wyoming', abbreviation: 'WY' }
    ];

    for (const state of stateData) {
      const existing = await db.select().from(schema.states).where(eq(schema.states.abbreviation, state.abbreviation)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.states).values(state);
        result.details.statesInserted++;
      }
    }
    console.log(`   ✅ ${result.details.statesInserted} new states inserted`);

    // 2. Categories
    console.log('📊 Seeding categories...');
    const categoryData = [
      { name: 'Education', description: 'K-12 and higher education metrics', icon: 'GraduationCap', sortOrder: 1 },
      { name: 'Economy', description: 'Economic indicators and employment', icon: 'TrendingUp', sortOrder: 2 },
      { name: 'Public Safety', description: 'Crime, corrections, and public safety metrics', icon: 'ShieldCheck', sortOrder: 3 },
      { name: 'Health', description: 'Health outcomes and access metrics', icon: 'Heart', sortOrder: 4 },
      { name: 'Environment', description: 'Environmental quality and sustainability', icon: 'Leaf', sortOrder: 5 },
      { name: 'Infrastructure', description: 'Infrastructure quality and development', icon: 'Building2', sortOrder: 6 },
      { name: 'Government', description: 'Government efficiency and transparency', icon: 'Landmark', sortOrder: 7 }
    ];

    for (const category of categoryData) {
      const existing = await db.select().from(schema.categories).where(eq(schema.categories.name, category.name)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.categories).values(category);
        result.details.categoriesInserted++;
      }
    }
    console.log(`   ✅ ${result.details.categoriesInserted} new categories inserted`);

    // 3. Data Sources
    console.log('🔗 Seeding data sources...');
    const dataSourceData = [
      { name: 'US Census Bureau', description: 'Official US Census data', url: 'https://www.census.gov' },
      { name: 'Bureau of Labor Statistics', description: 'Employment and economic data', url: 'https://www.bls.gov' },
      { name: 'Bureau of Economic Analysis', description: 'GDP and economic indicators', url: 'https://www.bea.gov' },
      { name: 'CDC', description: 'Centers for Disease Control and Prevention', url: 'https://www.cdc.gov' },
      { name: 'HHS Children\'s Bureau', description: 'Health and Human Services child welfare data', url: 'https://www.acf.hhs.gov/cb' },
      { name: 'Kaiser Family Foundation', description: 'Healthcare policy and data', url: 'https://www.kff.org' },
      { name: 'CDC BRFSS', description: 'Centers for Disease Control Behavioral Risk Factor Surveillance', url: 'https://www.cdc.gov/brfss' },
      { name: 'United Health Foundation', description: 'Health rankings and outcomes', url: 'https://www.unitedhealthgroup.com' },
      { name: 'USDA', description: 'United States Department of Agriculture', url: 'https://www.usda.gov' },
      { name: 'EIA', description: 'Energy Information Administration', url: 'https://www.eia.gov' },
      { name: 'USGS', description: 'United States Geological Survey', url: 'https://www.usgs.gov' },
      { name: 'EPA', description: 'Environmental Protection Agency', url: 'https://www.epa.gov' },
      { name: 'US Chamber of Commerce', description: 'Infrastructure and business climate data', url: 'https://www.uschamber.com' },
      { name: 'Tax Foundation', description: 'Tax policy and burden analysis', url: 'https://taxfoundation.org' },
      { name: 'Morningstar', description: 'Financial and pension data', url: 'https://www.morningstar.com' },
      { name: 'Standard & Poor\'s', description: 'Credit ratings and financial analysis', url: 'https://www.spglobal.com' },
      { name: 'PIRG', description: 'Public Interest Research Group', url: 'https://pirg.org' },
      { name: 'Center for Digital Government', description: 'Government technology assessments', url: 'https://www.govtech.com' },
      { name: 'State Websites', description: 'Official state government websites', url: '' },
      { name: 'ITEP', description: 'Institute on Taxation and Economic Policy', url: 'https://itep.org' }
    ];

    for (const source of dataSourceData) {
      const existing = await db.select().from(schema.dataSources).where(eq(schema.dataSources.name, source.name)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.dataSources).values(source);
        result.details.dataSourcesInserted++;
      }
    }
    console.log(`   ✅ ${result.details.dataSourcesInserted} new data sources inserted`);

    // PHASE 2: Admin User (Required for templates)
    console.log('👤 Creating admin user...');
    const adminUser = {
      email: 'admin@resultsamerica.org',
      name: 'System Administrator',
      role: 'admin' as const,
      isActive: 1,
      emailVerified: 1
    };

    const existingAdmin = await db.select().from(schema.users).where(eq(schema.users.email, adminUser.email)).limit(1);
    if (existingAdmin.length === 0) {
      await db.insert(schema.users).values(adminUser);
      result.details.adminUserCreated = true;
      console.log('   ✅ Admin user created');
    } else {
      console.log('   ✅ Admin user already exists');
    }

    // PHASE 3: CSV Import Templates (Depends on admin user)
    console.log('📋 Seeding CSV import templates...');
    const templateData = [
      {
        name: 'Multi-Category Data Import',
        description: 'Import data with multiple categories and measures. Each row can have different categories and measures.',
        templateSchema: JSON.stringify({
          expectedHeaders: ['State', 'Year', 'Category', 'Measure', 'Value']
        }),
        sampleData: `State,Year,Category,Measure,Value
California,2023,Economy,GDP,3500000
Texas,2023,Economy,GDP,2200000
California,2023,Education,Graduation Rate,85.2
Texas,2023,Education,Graduation Rate,89.1`,
        isActive: 1,
        createdBy: 1
      },
      {
        name: 'Single-Category Data Import',
        description: 'Import data for one specific category and measure. All rows must be for the same category and measure.',
        templateSchema: JSON.stringify({
          expectedHeaders: ['State', 'Year', 'Value']
        }),
        sampleData: `State,Year,Value
California,2023,3500000
Texas,2023,2200000
New York,2023,1800000
Florida,2023,1200000`,
        isActive: 1,
        createdBy: 1
      },
      {
        name: 'Multi Year Export',
        description: 'Import data from legacy system export format. Includes ID and foreign key columns that will be ignored.',
        templateSchema: JSON.stringify({
          expectedHeaders: ['ID', 'State', 'Year', 'Category', 'Measure Name', 'Value', 'state_id', 'category_id', 'measure_id']
        }),
        sampleData: `ID,State,Year,Category,Measure Name,Value,state_id,category_id,measure_id
1,Nation,2018,Economy,Net Job Growth,149148.6,1,1,15
2,Texas,2023,Economy,Net Job Growth,125000,1,2,15
3,California,2023,Economy,Net Job Growth,98000,2,2,15`,
        isActive: 1,
        createdBy: 1
      }
    ];

    for (const template of templateData) {
      const existing = await db.select().from(schema.csvImportTemplates).where(eq(schema.csvImportTemplates.name, template.name)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.csvImportTemplates).values(template);
        result.details.templatesInserted++;
      }
    }
    console.log(`   ✅ ${result.details.templatesInserted} new templates inserted`);

    // PHASE 4: Sample Statistics (Depends on categories and data sources)
    console.log('📈 Seeding sample statistics...');
    
    // Get category and data source IDs
    const categories = await db.select().from(schema.categories);
    const dataSources = await db.select().from(schema.dataSources);
    
    const categoryMap = new Map(categories.map(c => [c.name, c.id]));
    const sourceMap = new Map(dataSources.map(s => [s.name, s.id]));

    const statisticsData = [
      // Education Statistics
      { categoryId: categoryMap.get('Education')!, dataSourceId: sourceMap.get('US Census Bureau')!, name: 'High School Graduation Rate', description: 'Percentage of students who graduate high school', unit: 'percentage' },
      { categoryId: categoryMap.get('Education')!, dataSourceId: sourceMap.get('US Census Bureau')!, name: 'College Enrollment Rate', description: 'Percentage of high school graduates who enroll in college', unit: 'percentage' },
      { categoryId: categoryMap.get('Education')!, dataSourceId: sourceMap.get('US Census Bureau')!, name: 'Student-Teacher Ratio', description: 'Average number of students per teacher', unit: 'ratio' },
      
      // Economy Statistics
      { categoryId: categoryMap.get('Economy')!, dataSourceId: sourceMap.get('Bureau of Labor Statistics')!, name: 'Unemployment Rate', description: 'Percentage of labor force that is unemployed', unit: 'percentage' },
      { categoryId: categoryMap.get('Economy')!, dataSourceId: sourceMap.get('Bureau of Economic Analysis')!, name: 'GDP per Capita', description: 'Gross Domestic Product per person', unit: 'dollars' },
      { categoryId: categoryMap.get('Economy')!, dataSourceId: sourceMap.get('US Census Bureau')!, name: 'Median Household Income', description: 'Median annual household income', unit: 'dollars' },
      
      // Health Statistics
      { categoryId: categoryMap.get('Health')!, dataSourceId: sourceMap.get('CDC')!, name: 'Life Expectancy', description: 'Average life expectancy at birth', unit: 'years' },
      { categoryId: categoryMap.get('Health')!, dataSourceId: sourceMap.get('CDC')!, name: 'Infant Mortality Rate', description: 'Deaths per 1,000 live births', unit: 'per 1,000' },
      { categoryId: categoryMap.get('Health')!, dataSourceId: sourceMap.get('CDC BRFSS')!, name: 'Obesity Rate', description: 'Percentage of adults classified as obese', unit: 'percentage' }
    ];

    for (const stat of statisticsData) {
      const existing = await db.select().from(schema.statistics).where(eq(schema.statistics.name, stat.name)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.statistics).values(stat);
        result.details.statisticsInserted++;
      }
    }
    console.log(`   ✅ ${result.details.statisticsInserted} new statistics inserted`);

    // PHASE 5: Sample Import Sessions (Depends on data sources)
    console.log('📦 Seeding sample import sessions...');
    const sessionData = [
      { name: '2023 Education Data Import', description: 'Education statistics for 2023', dataSourceId: sourceMap.get('US Census Bureau')!, dataYear: 2023, recordCount: 150 },
      { name: '2023 Economic Data Import', description: 'Economic indicators for 2023', dataSourceId: sourceMap.get('Bureau of Labor Statistics')!, dataYear: 2023, recordCount: 200 }
    ];

    for (const session of sessionData) {
      const existing = await db.select().from(schema.importSessions).where(eq(schema.importSessions.name, session.name)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.importSessions).values(session);
        result.details.importSessionsInserted++;
      }
    }
    console.log(`   ✅ ${result.details.importSessionsInserted} new import sessions inserted`);

    // PHASE 6: Sample Data Points (Depends on import sessions, states, statistics)
    console.log('📊 Seeding sample data points...');
    
    const states = await db.select().from(schema.states);
    const statistics = await db.select().from(schema.statistics);
    const importSessions = await db.select().from(schema.importSessions);
    
    const stateMap = new Map(states.map(s => [s.name, s.id]));
    const statMap = new Map(statistics.map(s => [s.name, s.id]));
    const sessionMap = new Map(importSessions.map(s => [s.name, s.id]));

    const dataPointData = [
      // Education data points
      { importSessionId: sessionMap.get('2023 Education Data Import')!, year: 2023, stateId: stateMap.get('California')!, statisticId: statMap.get('High School Graduation Rate')!, value: 85.2 },
      { importSessionId: sessionMap.get('2023 Education Data Import')!, year: 2023, stateId: stateMap.get('Texas')!, statisticId: statMap.get('High School Graduation Rate')!, value: 89.1 },
      { importSessionId: sessionMap.get('2023 Education Data Import')!, year: 2023, stateId: stateMap.get('New York')!, statisticId: statMap.get('High School Graduation Rate')!, value: 87.3 },
      
      // Economy data points
      { importSessionId: sessionMap.get('2023 Economic Data Import')!, year: 2023, stateId: stateMap.get('California')!, statisticId: statMap.get('Unemployment Rate')!, value: 3.2 },
      { importSessionId: sessionMap.get('2023 Economic Data Import')!, year: 2023, stateId: stateMap.get('Texas')!, statisticId: statMap.get('Unemployment Rate')!, value: 4.1 },
      { importSessionId: sessionMap.get('2023 Economic Data Import')!, year: 2023, stateId: stateMap.get('New York')!, statisticId: statMap.get('Unemployment Rate')!, value: 3.8 }
    ];

    for (const dataPoint of dataPointData) {
      const existing = await db.select().from(schema.dataPoints)
        .where(eq(schema.dataPoints.importSessionId, dataPoint.importSessionId))
        .where(eq(schema.dataPoints.year, dataPoint.year))
        .where(eq(schema.dataPoints.stateId, dataPoint.stateId))
        .where(eq(schema.dataPoints.statisticId, dataPoint.statisticId))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(schema.dataPoints).values(dataPoint);
        result.details.dataPointsInserted++;
      }
    }
    console.log(`   ✅ ${result.details.dataPointsInserted} new data points inserted`);

    console.log('🎉 Production PostgreSQL database seeding completed successfully!');
    return result;

  } catch (error) {
    console.error('❌ Error seeding production database:', error);
    result.success = false;
    result.message = `Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    return result;
  } finally {
    await client.end();
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedProductionDatabasePostgres()
    .then(result => {
      if (result.success) {
        console.log('\n📋 Seeding Summary:');
        console.log(`   States: ${result.details.statesInserted} inserted`);
        console.log(`   Categories: ${result.details.categoriesInserted} inserted`);
        console.log(`   Data Sources: ${result.details.dataSourcesInserted} inserted`);
        console.log(`   Templates: ${result.details.templatesInserted} inserted`);
        console.log(`   Admin User: ${result.details.adminUserCreated ? 'created' : 'already exists'}`);
        console.log(`   Statistics: ${result.details.statisticsInserted} inserted`);
        console.log(`   Import Sessions: ${result.details.importSessionsInserted} inserted`);
        console.log(`   Data Points: ${result.details.dataPointsInserted} inserted`);
        process.exit(0);
      } else {
        console.error('❌ Seeding failed:', result.message);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
} 