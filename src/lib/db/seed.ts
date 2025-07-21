import { db } from './index';
import { states, categories, statistics, dataPoints } from './schema';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // Insert states
  const stateData = [
    { name: 'California', abbreviation: 'CA' },
    { name: 'Texas', abbreviation: 'TX' },
    { name: 'Florida', abbreviation: 'FL' },
    { name: 'New York', abbreviation: 'NY' },
    { name: 'Pennsylvania', abbreviation: 'PA' },
    { name: 'Illinois', abbreviation: 'IL' },
    { name: 'Ohio', abbreviation: 'OH' },
    { name: 'Georgia', abbreviation: 'GA' },
    { name: 'North Carolina', abbreviation: 'NC' },
    { name: 'Michigan', abbreviation: 'MI' },
  ];

  console.log('📍 Inserting states...');
  for (const state of stateData) {
    await db.insert(states).values(state);
  }

  // Insert categories
  const categoryData = [
    { name: 'Education', description: 'K-12 and higher education metrics', icon: 'GraduationCap', sortOrder: 1 },
    { name: 'Healthcare', description: 'Health outcomes and access metrics', icon: 'Heart', sortOrder: 2 },
    { name: 'Economy', description: 'Economic indicators and employment', icon: 'TrendingUp', sortOrder: 3 },
    { name: 'Environment', description: 'Environmental quality and sustainability', icon: 'Leaf', sortOrder: 4 },
  ];

  console.log('📊 Inserting categories...');
  for (const category of categoryData) {
    await db.insert(categories).values(category);
  }

  // Get category IDs for statistics
  const educationCategory = await db.select().from(categories).where(eq(categories.name, 'Education')).limit(1);
  const healthcareCategory = await db.select().from(categories).where(eq(categories.name, 'Healthcare')).limit(1);
  const economyCategory = await db.select().from(categories).where(eq(categories.name, 'Economy')).limit(1);
  const environmentCategory = await db.select().from(categories).where(eq(categories.name, 'Environment')).limit(1);

  // Insert statistics
  const statisticData = [
    {
      categoryId: educationCategory[0].id,
      name: 'High School Graduation Rate',
      description: 'Percentage of students who graduate from high school within 4 years',
      unit: '%',
      source: 'National Center for Education Statistics'
    },
    {
      categoryId: educationCategory[0].id,
      name: 'College Enrollment Rate',
      description: 'Percentage of high school graduates who enroll in college',
      unit: '%',
      source: 'National Center for Education Statistics'
    },
    {
      categoryId: healthcareCategory[0].id,
      name: 'Uninsured Rate',
      description: 'Percentage of population without health insurance',
      unit: '%',
      source: 'U.S. Census Bureau'
    },
    {
      categoryId: healthcareCategory[0].id,
      name: 'Life Expectancy',
      description: 'Average life expectancy at birth',
      unit: 'years',
      source: 'Centers for Disease Control and Prevention'
    },
    {
      categoryId: economyCategory[0].id,
      name: 'Unemployment Rate',
      description: 'Percentage of labor force that is unemployed',
      unit: '%',
      source: 'Bureau of Labor Statistics'
    },
    {
      categoryId: economyCategory[0].id,
      name: 'Median Household Income',
      description: 'Median annual household income',
      unit: '$',
      source: 'U.S. Census Bureau'
    },
    {
      categoryId: environmentCategory[0].id,
      name: 'Air Quality Index',
      description: 'Average annual air quality index score',
      unit: 'AQI',
      source: 'Environmental Protection Agency'
    },
    {
      categoryId: environmentCategory[0].id,
      name: 'Renewable Energy Production',
      description: 'Percentage of electricity from renewable sources',
      unit: '%',
      source: 'Energy Information Administration'
    },
  ];

  console.log('📈 Inserting statistics...');
  for (const stat of statisticData) {
    await db.insert(statistics).values(stat);
  }

  // Get all states and statistics for data points
  const allStates = await db.select().from(states);
  const allStatistics = await db.select().from(statistics);

  // Generate sample data points for 2023
  console.log('📊 Inserting data points...');
  for (const state of allStates) {
    for (const stat of allStatistics) {
      // Generate realistic sample data based on statistic type
      let value: number;
      
      switch (stat.name) {
        case 'High School Graduation Rate':
          value = 85 + Math.random() * 10; // 85-95%
          break;
        case 'College Enrollment Rate':
          value = 60 + Math.random() * 20; // 60-80%
          break;
        case 'Uninsured Rate':
          value = 5 + Math.random() * 15; // 5-20%
          break;
        case 'Life Expectancy':
          value = 75 + Math.random() * 5; // 75-80 years
          break;
        case 'Unemployment Rate':
          value = 3 + Math.random() * 4; // 3-7%
          break;
        case 'Median Household Income':
          value = 50000 + Math.random() * 50000; // $50k-$100k
          break;
        case 'Air Quality Index':
          value = 30 + Math.random() * 40; // 30-70 AQI
          break;
        case 'Renewable Energy Production':
          value = 10 + Math.random() * 30; // 10-40%
          break;
        default:
          value = 50 + Math.random() * 50; // Generic 50-100
      }

      await db.insert(dataPoints).values({
        year: 2023,
        stateId: state.id,
        statisticId: stat.id,
        value: Math.round(value * 100) / 100, // Round to 2 decimal places
        source: stat.source,
      });
    }
  }

  console.log('✅ Database seeded successfully!');
}

 