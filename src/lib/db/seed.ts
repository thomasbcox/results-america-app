import { getDb } from './index';
import { states, categories, statistics, dataPoints } from './schema';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  const db = getDb();
  console.log('🌱 Seeding database...');

  // Insert states (all 50 states in alphabetical order)
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
    { name: 'Wyoming', abbreviation: 'WY' },
  ];

  console.log('📍 Inserting states...');
  for (const state of stateData) {
    await db.insert(states).values(state);
  }

  // Insert categories (matching the actual data source)
  const categoryData = [
    { name: 'Education', description: 'K-12 and higher education metrics', icon: 'GraduationCap', sortOrder: 1 },
    { name: 'Economy', description: 'Economic indicators and employment', icon: 'TrendingUp', sortOrder: 2 },
    { name: 'Public Safety', description: 'Crime, corrections, and public safety metrics', icon: 'ShieldCheck', sortOrder: 3 },
    { name: 'Health', description: 'Health outcomes and access metrics', icon: 'Heart', sortOrder: 4 },
    { name: 'Environment', description: 'Environmental quality and sustainability', icon: 'Leaf', sortOrder: 5 },
    { name: 'Infrastructure', description: 'Infrastructure quality and development', icon: 'Building2', sortOrder: 6 },
    { name: 'Government', description: 'Government efficiency and transparency', icon: 'Landmark', sortOrder: 7 },
  ];

  console.log('📊 Inserting categories...');
  for (const category of categoryData) {
    await db.insert(categories).values(category);
  }

  // Get category IDs for statistics
  const educationCategory = await db.select().from(categories).where(eq(categories.name, 'Education')).limit(1);
  const economyCategory = await db.select().from(categories).where(eq(categories.name, 'Economy')).limit(1);
  const publicSafetyCategory = await db.select().from(categories).where(eq(categories.name, 'Public Safety')).limit(1);
  const healthCategory = await db.select().from(categories).where(eq(categories.name, 'Health')).limit(1);
  const environmentCategory = await db.select().from(categories).where(eq(categories.name, 'Environment')).limit(1);
  const infrastructureCategory = await db.select().from(categories).where(eq(categories.name, 'Infrastructure')).limit(1);
  const governmentCategory = await db.select().from(categories).where(eq(categories.name, 'Government')).limit(1);

  // Insert statistics (matching the actual data source)
  const statisticData = [
    // Education (6 measures)
    {
      categoryId: educationCategory[0].id,
      raNumber: '1001',
      name: 'K-8 Testing',
      description: 'Reading, Writing, and Math Skills at Grades 4 and 8',
      subMeasure: 'Reading, Writing, and Math Skills at Grades 4 and 8',
      calculation: 'Scale Score from NAEP',
      unit: 'Scale Score',
      source: 'Department of Education',
      availableSince: '1992'
    },
    {
      categoryId: educationCategory[0].id,
      raNumber: '1002',
      name: 'HS Graduation Rate',
      description: 'Averaged Freshman Graduation Rate',
      subMeasure: '',
      calculation: '% Averaged Freshman Graduation Rate',
      unit: '%',
      source: 'Department of Education',
      availableSince: '1986'
    },
    {
      categoryId: educationCategory[0].id,
      name: 'SAT/ACT Mean',
      description: 'Mean ACT Score by State',
      unit: 'Score',
      source: 'College Board, Inc.'
    },
    {
      categoryId: educationCategory[0].id,
      name: '2-Year Degree Graduation Rate',
      description: 'Attaining degree after 150% of 2-year period',
      unit: '%',
      source: 'NCES/IPEDS'
    },
    {
      categoryId: educationCategory[0].id,
      name: '4-Year Degree Graduation Rate',
      description: 'Attaining degree after 150% of 4-year period',
      unit: '%',
      source: 'NCES/IPEDS'
    },
    {
      categoryId: educationCategory[0].id,
      name: 'Professional/Advanced Degrees',
      description: 'Percentage of Total Adult Population',
      unit: '%',
      source: 'NCES'
    },
    
    // Economy (10 measures)
    {
      categoryId: economyCategory[0].id,
      name: 'Real GDP',
      description: 'Gross State Product in Current Year Dollars',
      unit: '$',
      source: 'BEA'
    },
    {
      categoryId: economyCategory[0].id,
      name: 'Economic Diversity',
      description: 'Simpson index',
      unit: 'Index',
      source: 'BEA'
    },
    {
      categoryId: economyCategory[0].id,
      name: 'Business Competitiveness Index',
      description: 'American Legislative Exchange Council',
      unit: 'Index',
      source: 'ALEC'
    },
    {
      categoryId: economyCategory[0].id,
      name: 'Household Income',
      description: 'Household Income Per Capita',
      unit: '$',
      source: 'US Census Bureau'
    },
    {
      categoryId: economyCategory[0].id,
      name: 'Unemployment Rate',
      description: 'Mean percentage of Labor Force Unemployed',
      unit: '%',
      source: 'BLS'
    },
    {
      categoryId: economyCategory[0].id,
      name: 'Net Job Growth',
      description: 'Jobs Gained minus Jobs Lost in a Year',
      unit: 'Jobs',
      source: 'BLS'
    },
    {
      categoryId: economyCategory[0].id,
      name: 'Income Inequality',
      description: 'Gini Coefficient',
      unit: 'Index',
      source: 'US Census Bureau'
    },
    {
      categoryId: economyCategory[0].id,
      name: 'New Firms',
      description: 'Number of new firms registered in previous year',
      unit: 'Count',
      source: 'Small Business Administration'
    },
    {
      categoryId: economyCategory[0].id,
      name: 'Venture Capital Investment',
      description: 'Number of Deals or Total Investment in Dollars',
      unit: '$',
      source: 'PwC'
    },
    {
      categoryId: economyCategory[0].id,
      name: 'Rate of Poverty',
      description: 'Percentage of population 18+ below poverty line',
      unit: '%',
      source: 'US Census Bureau'
    },
    
    // Public Safety (7 measures)
    {
      categoryId: publicSafetyCategory[0].id,
      name: 'Violent Crimes',
      description: 'FBI Violent Crime Index per 1,000 persons',
      unit: 'per 1,000',
      source: 'BJS'
    },
    {
      categoryId: publicSafetyCategory[0].id,
      name: 'Property Crimes',
      description: 'FBI Property Crime Index per 1,000 persons',
      unit: 'per 1,000',
      source: 'BJS'
    },
    {
      categoryId: publicSafetyCategory[0].id,
      name: 'Recidivism Rate',
      description: 'Percentage reoffending within 3 years of release',
      unit: '%',
      source: 'BJS'
    },
    {
      categoryId: publicSafetyCategory[0].id,
      name: 'Rate of Incarceration',
      description: 'Prisoners per 100,000',
      unit: 'per 100,000',
      source: 'BJS'
    },
    {
      categoryId: publicSafetyCategory[0].id,
      name: 'Cost of Corrections System',
      description: 'Dollars spent on corrections annually per capita',
      unit: '$',
      source: 'US Census Bureau'
    },
    {
      categoryId: publicSafetyCategory[0].id,
      name: 'Traffic Fatalities',
      description: 'Deaths per 100 million vehicle miles travelled',
      unit: 'per 100M miles',
      source: 'US Census Bureau'
    },
    {
      categoryId: publicSafetyCategory[0].id,
      name: 'Child Maltreatment',
      description: 'Number of Child Abuse/Neglect Cases per capita',
      unit: 'per capita',
      source: 'HHS Children\'s Bureau'
    },
    
    // Health (9 measures)
    {
      categoryId: healthCategory[0].id,
      name: 'Cost of Healthcare',
      description: 'Spending per capita in real dollars',
      unit: '$',
      source: 'Kaiser Family Foundation'
    },
    {
      categoryId: healthCategory[0].id,
      name: 'Rate of Obesity',
      description: 'Percentage of Total Adult Population',
      unit: '%',
      source: 'CDC BRFSS'
    },
    {
      categoryId: healthCategory[0].id,
      name: 'Quality of Health',
      description: 'America\'s Health Rankings Index',
      unit: 'Index',
      source: 'United Health Foundation'
    },
    {
      categoryId: healthCategory[0].id,
      name: 'Infant Mortality Rate',
      description: 'Rate per 1,000 births annually',
      unit: 'per 1,000',
      source: 'US Census Bureau'
    },
    {
      categoryId: healthCategory[0].id,
      name: 'Uninsured',
      description: 'Percentage of population uninsured',
      unit: '%',
      source: 'US Census Bureau'
    },
    {
      categoryId: healthCategory[0].id,
      name: 'Smokers',
      description: 'Percentage of Adult population who smoke',
      unit: '%',
      source: 'CDC'
    },
    {
      categoryId: healthCategory[0].id,
      name: 'Workplace Injuries',
      description: 'Number of injuries per 100 employees',
      unit: 'per 100',
      source: 'BLS'
    },
    {
      categoryId: healthCategory[0].id,
      name: 'Quality of Life / Happiness Index',
      description: 'Gallup-Healthways Wellness Survey',
      unit: 'Index',
      source: 'CDC'
    },
    {
      categoryId: healthCategory[0].id,
      name: 'Food Insecurity',
      description: 'Percentage of households in low/very low security',
      unit: '%',
      source: 'USDA'
    },
    
    // Environment (4 measures)
    {
      categoryId: environmentCategory[0].id,
      name: 'Renewable Energy',
      description: 'Percentage Green Megawatts / Total Generated',
      unit: '%',
      source: 'EIA'
    },
    {
      categoryId: environmentCategory[0].id,
      name: 'Carbon Dioxide Emissions',
      description: 'Millions of Metric Tons Produced',
      unit: 'MMT',
      source: 'EIA'
    },
    {
      categoryId: environmentCategory[0].id,
      name: 'Water Quality Index',
      description: 'Water quality assessment',
      unit: 'Index',
      source: 'USGS'
    },
    {
      categoryId: environmentCategory[0].id,
      name: 'Air Quality',
      description: 'National Ambient Air Quality Standards',
      unit: 'AQI',
      source: 'EPA'
    },
    
    // Infrastructure (1 measure)
    {
      categoryId: infrastructureCategory[0].id,
      name: 'Infrastructure Index',
      description: 'Index created from 2007 data',
      unit: 'Index',
      source: 'US Chamber of Commerce'
    },
    
    // Government (13 measures)
    {
      categoryId: governmentCategory[0].id,
      name: 'State Debt',
      description: 'Percentage total state debt / GDP',
      unit: '%',
      source: 'US Census Bureau'
    },
    {
      categoryId: governmentCategory[0].id,
      name: 'Citizen Tax Burden',
      description: 'Tax revenue per capita',
      unit: '$',
      source: 'Tax Foundation'
    },
    {
      categoryId: governmentCategory[0].id,
      name: 'Unfunded Pension Liabilities',
      description: 'Percentage of pension liabilities unfunded',
      unit: '%',
      source: 'Morningstar'
    },
    {
      categoryId: governmentCategory[0].id,
      name: 'Federal Dependency',
      description: 'Percentage of revenue from federal grants',
      unit: '%',
      source: 'US Census Bureau'
    },
    {
      categoryId: governmentCategory[0].id,
      name: 'Credit Rating',
      description: 'State Government Credit Rating',
      unit: 'Rating',
      source: 'Standard & Poor\'s'
    },
    {
      categoryId: governmentCategory[0].id,
      name: 'State Employees',
      description: 'Percentage Full-time Employees / Population',
      unit: '%',
      source: 'US Census Bureau'
    },
    {
      categoryId: governmentCategory[0].id,
      name: 'Financial Records Online',
      description: 'Online financial transparency',
      unit: 'Binary',
      source: 'PIRG'
    },
    {
      categoryId: governmentCategory[0].id,
      name: 'Government Use of Technology',
      description: 'Grade from Center for Digital Government',
      unit: 'Grade',
      source: 'Center for Digital Government'
    },
    {
      categoryId: governmentCategory[0].id,
      name: 'Governor\'s Goals Online',
      description: 'Binary (Yes/No)',
      unit: 'Binary',
      source: 'State Websites'
    },
    {
      categoryId: governmentCategory[0].id,
      name: 'Citizen Customer Satisfaction',
      description: 'Polling Data',
      unit: 'Score',
      source: 'State Websites'
    },
    {
      categoryId: governmentCategory[0].id,
      name: 'Government Open Data',
      description: 'Number of Performance Measures and Data online',
      unit: 'Count',
      source: 'State Websites'
    },
    {
      categoryId: governmentCategory[0].id,
      name: 'Government Spending as % of GDP',
      description: 'Dollar Expenditures / State GDP',
      unit: '%',
      source: 'US Census Bureau'
    },
    {
      categoryId: governmentCategory[0].id,
      name: 'Tax Inequality Index',
      description: 'Effective state/local taxes by income group',
      unit: 'Index',
      source: 'ITEP'
    },
  ];

  console.log('📈 Inserting statistics...');
  for (const stat of statisticData) {
    await db.insert(statistics).values(stat);
  }

  // Get all states and statistics for data points
  const allStates = await db.select().from(states);
  const allStatistics = await db.select().from(statistics);

  // Generate sample data points for 2023 (all 50 states)
  console.log('📊 Inserting data points...');
  for (const state of allStates) {
    for (const stat of allStatistics) {
      // Generate realistic sample data based on statistic type
      let value: number;
      
      switch (stat.name) {
        // Education
        case 'HS Graduation Rate':
          value = 85 + Math.random() * 10; // 85-95%
          break;
        case '2-Year Degree Graduation Rate':
          value = 30 + Math.random() * 20; // 30-50%
          break;
        case '4-Year Degree Graduation Rate':
          value = 50 + Math.random() * 20; // 50-70%
          break;
        case 'Professional/Advanced Degrees':
          value = 10 + Math.random() * 10; // 10-20%
          break;
        case 'SAT/ACT Mean':
          value = 20 + Math.random() * 6; // 20-26
          break;
        case 'K-8 Testing':
          value = 200 + Math.random() * 50; // 200-250 scale score
          break;
        
        // Economy
        case 'Unemployment Rate':
          value = 3 + Math.random() * 4; // 3-7%
          break;
        case 'Household Income':
          value = 50000 + Math.random() * 50000; // $50k-$100k
          break;
        case 'Real GDP':
          value = 100000 + Math.random() * 900000; // $100k-$1M
          break;
        case 'Rate of Poverty':
          value = 8 + Math.random() * 12; // 8-20%
          break;
        case 'Net Job Growth':
          value = -50000 + Math.random() * 100000; // -50k to +50k
          break;
        case 'Economic Diversity':
          value = 0.3 + Math.random() * 0.4; // 0.3-0.7 index
          break;
        case 'Business Competitiveness Index':
          value = 50 + Math.random() * 50; // 50-100 index
          break;
        case 'Income Inequality':
          value = 0.3 + Math.random() * 0.2; // 0.3-0.5 Gini
          break;
        case 'New Firms':
          value = 1000 + Math.random() * 9000; // 1k-10k
          break;
        case 'Venture Capital Investment':
          value = 1000000 + Math.random() * 9000000; // $1M-$10M
          break;
        
        // Public Safety
        case 'Violent Crimes':
          value = 2 + Math.random() * 6; // 2-8 per 1,000
          break;
        case 'Property Crimes':
          value = 15 + Math.random() * 25; // 15-40 per 1,000
          break;
        case 'Recidivism Rate':
          value = 30 + Math.random() * 30; // 30-60%
          break;
        case 'Rate of Incarceration':
          value = 200 + Math.random() * 400; // 200-600 per 100k
          break;
        case 'Cost of Corrections System':
          value = 100 + Math.random() * 200; // $100-$300 per capita
          break;
        case 'Traffic Fatalities':
          value = 0.8 + Math.random() * 1.2; // 0.8-2.0 per 100M miles
          break;
        case 'Child Maltreatment':
          value = 5 + Math.random() * 15; // 5-20 per capita
          break;
        
        // Health
        case 'Uninsured':
          value = 5 + Math.random() * 15; // 5-20%
          break;
        case 'Cost of Healthcare':
          value = 8000 + Math.random() * 4000; // $8k-$12k per capita
          break;
        case 'Rate of Obesity':
          value = 20 + Math.random() * 15; // 20-35%
          break;
        case 'Quality of Health':
          value = 50 + Math.random() * 50; // 50-100 index
          break;
        case 'Infant Mortality Rate':
          value = 4 + Math.random() * 4; // 4-8 per 1,000
          break;
        case 'Smokers':
          value = 10 + Math.random() * 10; // 10-20%
          break;
        case 'Workplace Injuries':
          value = 2 + Math.random() * 3; // 2-5 per 100
          break;
        case 'Quality of Life / Happiness Index':
          value = 60 + Math.random() * 40; // 60-100 index
          break;
        case 'Food Insecurity':
          value = 8 + Math.random() * 12; // 8-20%
          break;
        
        // Environment
        case 'Renewable Energy':
          value = 10 + Math.random() * 30; // 10-40%
          break;
        case 'Carbon Dioxide Emissions':
          value = 50 + Math.random() * 150; // 50-200 MMT
          break;
        case 'Water Quality Index':
          value = 60 + Math.random() * 40; // 60-100 index
          break;
        case 'Air Quality':
          value = 30 + Math.random() * 40; // 30-70 AQI
          break;
        
        // Infrastructure
        case 'Infrastructure Index':
          value = 50 + Math.random() * 50; // 50-100 index
          break;
        
        // Government
        case 'State Debt':
          value = 5 + Math.random() * 15; // 5-20% of GDP
          break;
        case 'Citizen Tax Burden':
          value = 2000 + Math.random() * 3000; // $2k-$5k per capita
          break;
        case 'Unfunded Pension Liabilities':
          value = 20 + Math.random() * 40; // 20-60%
          break;
        case 'Federal Dependency':
          value = 20 + Math.random() * 30; // 20-50%
          break;
        case 'Credit Rating':
          value = 70 + Math.random() * 30; // 70-100 rating
          break;
        case 'State Employees':
          value = 2 + Math.random() * 3; // 2-5% of population
          break;
        case 'Financial Records Online':
          value = Math.random() > 0.5 ? 1 : 0; // Binary 0 or 1
          break;
        case 'Government Use of Technology':
          value = 60 + Math.random() * 40; // 60-100 grade
          break;
        case 'Governor\'s Goals Online':
          value = Math.random() > 0.5 ? 1 : 0; // Binary 0 or 1
          break;
        case 'Citizen Customer Satisfaction':
          value = 60 + Math.random() * 40; // 60-100 score
          break;
        case 'Government Open Data':
          value = 10 + Math.random() * 40; // 10-50 count
          break;
        case 'Government Spending as % of GDP':
          value = 10 + Math.random() * 10; // 10-20%
          break;
        case 'Tax Inequality Index':
          value = 0.3 + Math.random() * 0.4; // 0.3-0.7 index
          break;
        
        default:
          value = 50 + Math.random() * 50; // Generic 50-100
      }

      await db.insert(dataPoints).values({
        importSessionId: 1, // Default import session
        year: 2023,
        stateId: state.id,
        statisticId: stat.id,
        value: Math.round(value * 100) / 100, // Round to 2 decimal places
      });
    }
  }

  console.log('✅ Database seeded successfully!');
}

 