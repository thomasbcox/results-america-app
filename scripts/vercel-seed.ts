#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema-postgres';
import { eq } from 'drizzle-orm';

/**
 * VERCEL + NEON PRODUCTION SEEDING
 * 
 * Optimized for Vercel serverless deployment with Neon database.
 * 
 * Key features:
 * - Single connection with proper timeouts
 * - Essential data only (no demo data)
 * - Idempotent operations
 * - Clear error messages
 * - Minimal dependencies
 */

interface SeedResult {
  success: boolean;
  message: string;
  details: {
    statesInserted: number;
    categoriesInserted: number;
    dataSourcesInserted: number;
    adminUserCreated: boolean;
    templatesInserted: number;
    statisticsInserted: number;
  };
}

export async function seedVercelDatabase(): Promise<SeedResult> {
  // Get database URL with fallbacks for different environments
  const dbUrl = process.env.POSTGRES_URL || 
                process.env.DATABASE_URL || 
                process.env.NEON_DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error(
      'Database URL not found. Set POSTGRES_URL, DATABASE_URL, or NEON_DATABASE_URL'
    );
  }

  // Create connection with Neon-optimized settings
  const client = postgres(dbUrl, {
    max: 1, // Single connection for seeding
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: 'require' // Required for Neon
  });

  const db = drizzle(client, { schema });
  
  const result: SeedResult = {
    success: true,
    message: 'Database seeded successfully',
    details: {
      statesInserted: 0,
      categoriesInserted: 0,
      dataSourcesInserted: 0,
      adminUserCreated: false,
      templatesInserted: 0,
      statisticsInserted: 0
    }
  };

  try {
    console.log('🌱 Seeding Vercel production database...');
    console.log(`📊 Database: ${dbUrl.replace(/:[^:]*@/, ':***@')}`);

    // PHASE 1: Essential Foundation Data
    
    // 1. States (51 total)
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
      const existing = await db.select().from(schema.states)
        .where(eq(schema.states.abbreviation, state.abbreviation))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(schema.states).values(state);
        result.details.statesInserted++;
      }
    }
    console.log(`   ✅ ${result.details.statesInserted} states inserted`);

    // 2. Categories (7 essential)
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
      const existing = await db.select().from(schema.categories)
        .where(eq(schema.categories.name, category.name))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(schema.categories).values(category);
        result.details.categoriesInserted++;
      }
    }
    console.log(`   ✅ ${result.details.categoriesInserted} categories inserted`);

    // 3. Essential Data Sources (10 core)
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
      { name: 'EPA', description: 'Environmental Protection Agency', url: 'https://www.epa.gov' }
    ];

    for (const source of dataSourceData) {
      const existing = await db.select().from(schema.dataSources)
        .where(eq(schema.dataSources.name, source.name))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(schema.dataSources).values(source);
        result.details.dataSourcesInserted++;
      }
    }
    console.log(`   ✅ ${result.details.dataSourcesInserted} data sources inserted`);

    // PHASE 2: Admin User
    console.log('👤 Creating admin user...');
    const adminUser = {
      email: 'admin@resultsamerica.org',
      name: 'System Administrator',
      role: 'admin' as const,
      isActive: 1,
      emailVerified: 1
    };

    const existingAdmin = await db.select().from(schema.users)
      .where(eq(schema.users.email, adminUser.email))
      .limit(1);
    if (existingAdmin.length === 0) {
      await db.insert(schema.users).values(adminUser);
      result.details.adminUserCreated = true;
      console.log('   ✅ Admin user created');
    } else {
      console.log('   ✅ Admin user already exists');
    }

    // PHASE 3: CSV Import Templates
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
      const existing = await db.select().from(schema.csvImportTemplates)
        .where(eq(schema.csvImportTemplates.name, template.name))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(schema.csvImportTemplates).values(template);
        result.details.templatesInserted++;
      }
    }
    console.log(`   ✅ ${result.details.templatesInserted} templates inserted`);

    // PHASE 4: Essential Statistics
    console.log('📈 Seeding essential statistics...');
    
    // Get category and data source IDs
    const categoriesResult = await db.select().from(schema.categories);
    const dataSourcesResult = await db.select().from(schema.dataSources);
    
    const categoryMap = new Map(categoriesResult.map((c: { name: string; id: number }) => [c.name, c.id]));
    const sourceMap = new Map(dataSourcesResult.map((s: { name: string; id: number }) => [s.name, s.id]));

    const statisticsData = [
      // Education Statistics
      { 
        categoryId: categoryMap.get('Education')!, 
        dataSourceId: sourceMap.get('US Census Bureau')!, 
        name: 'High School Graduation Rate', 
        description: 'Percentage of students who graduate high school', 
        unit: 'percentage',
        preferenceDirection: 'higher' as const,
        isActive: 1
      },
      { 
        categoryId: categoryMap.get('Education')!, 
        dataSourceId: sourceMap.get('US Census Bureau')!, 
        name: 'College Enrollment Rate', 
        description: 'Percentage of high school graduates who enroll in college', 
        unit: 'percentage',
        preferenceDirection: 'higher' as const,
        isActive: 1
      },
      
      // Economy Statistics
      { 
        categoryId: categoryMap.get('Economy')!, 
        dataSourceId: sourceMap.get('Bureau of Labor Statistics')!, 
        name: 'Unemployment Rate', 
        description: 'Percentage of labor force that is unemployed', 
        unit: 'percentage',
        preferenceDirection: 'lower' as const,
        isActive: 1
      },
      { 
        categoryId: categoryMap.get('Economy')!, 
        dataSourceId: sourceMap.get('Bureau of Economic Analysis')!, 
        name: 'GDP per Capita', 
        description: 'Gross Domestic Product per person', 
        unit: 'dollars',
        preferenceDirection: 'higher' as const,
        isActive: 1
      },
      
      // Health Statistics
      { 
        categoryId: categoryMap.get('Health')!, 
        dataSourceId: sourceMap.get('CDC')!, 
        name: 'Life Expectancy', 
        description: 'Average life expectancy at birth', 
        unit: 'years',
        preferenceDirection: 'higher' as const,
        isActive: 1
      }
    ];

    for (const stat of statisticsData) {
      const existing = await db.select().from(schema.statistics).where(eq(schema.statistics.name, stat.name)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.statistics).values(stat);
        result.details.statisticsInserted++;
      }
    }
    console.log(`   ✅ ${result.details.statisticsInserted} statistics inserted`);

    console.log('🎉 Vercel production seeding completed successfully!');
    return result;

  } catch (error) {
    console.error('❌ Error seeding Vercel database:', error);
    result.success = false;
    result.message = `Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    return result;
  } finally {
    // Always close the connection
    await client.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seedVercelDatabase()
    .then(result => {
      if (result.success) {
        console.log('\n📋 Seeding Summary:');
        console.log(`   States: ${result.details.statesInserted} inserted`);
        console.log(`   Categories: ${result.details.categoriesInserted} inserted`);
        console.log(`   Data Sources: ${result.details.dataSourcesInserted} inserted`);
        console.log(`   Templates: ${result.details.templatesInserted} inserted`);
        console.log(`   Statistics: ${result.details.statisticsInserted} inserted`);
        console.log(`   Admin User: ${result.details.adminUserCreated ? 'created' : 'already exists'}`);
        console.log('\n👤 Admin Login: admin@resultsamerica.org');
        console.log('📋 Next: Visit /auth/login and use magic link authentication');
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