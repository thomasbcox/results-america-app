import { db } from './index';
import { states, categories, dataSources, statistics, importSessions, dataPoints } from './schema';
import { eq } from 'drizzle-orm';

export async function seedDatabaseNormalized() {
  console.log('🌱 Seeding normalized database...');

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

  // ✅ NORMALIZED: Insert data sources
  const dataSourceData = [
    { name: 'Department of Education', description: 'Federal education statistics and data', url: 'https://www.ed.gov/data' },
    { name: 'College Board, Inc.', description: 'SAT and college readiness data', url: 'https://research.collegeboard.org' },
    { name: 'NCES/IPEDS', description: 'National Center for Education Statistics', url: 'https://nces.ed.gov/ipeds' },
    { name: 'BEA', description: 'Bureau of Economic Analysis', url: 'https://www.bea.gov' },
    { name: 'ALEC', description: 'American Legislative Exchange Council', url: 'https://alec.org' },
    { name: 'US Census Bureau', description: 'Federal census and demographic data', url: 'https://www.census.gov' },
    { name: 'BLS', description: 'Bureau of Labor Statistics', url: 'https://www.bls.gov' },
    { name: 'Small Business Administration', description: 'Small business and entrepreneurship data', url: 'https://www.sba.gov' },
    { name: 'PwC', description: 'PricewaterhouseCoopers venture capital data', url: 'https://www.pwc.com' },
    { name: 'BJS', description: 'Bureau of Justice Statistics', url: 'https://bjs.ojp.gov' },
    { name: 'HHS Children\'s Bureau', description: 'Health and Human Services child welfare data', url: 'https://www.acf.hhs.gov/cb' },
    { name: 'Kaiser Family Foundation', description: 'Healthcare policy and data', url: 'https://www.kff.org' },
    { name: 'CDC BRFSS', description: 'Centers for Disease Control Behavioral Risk Factor Surveillance', url: 'https://www.cdc.gov/brfss' },
    { name: 'United Health Foundation', description: 'Health rankings and outcomes', url: 'https://www.unitedhealthgroup.com' },
    { name: 'CDC', description: 'Centers for Disease Control and Prevention', url: 'https://www.cdc.gov' },
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
    { name: 'ITEP', description: 'Institute on Taxation and Economic Policy', url: 'https://itep.org' },
  ];

  console.log('🔗 Inserting data sources...');
  for (const source of dataSourceData) {
    await db.insert(dataSources).values(source);
  }

  // Get category and source IDs for statistics
  const educationCategory = await db.select().from(categories).where(eq(categories.name, 'Education')).limit(1);
  const economyCategory = await db.select().from(categories).where(eq(categories.name, 'Economy')).limit(1);
  const publicSafetyCategory = await db.select().from(categories).where(eq(categories.name, 'Public Safety')).limit(1);
  const healthCategory = await db.select().from(categories).where(eq(categories.name, 'Health')).limit(1);
  const environmentCategory = await db.select().from(categories).where(eq(categories.name, 'Environment')).limit(1);
  const infrastructureCategory = await db.select().from(categories).where(eq(categories.name, 'Infrastructure')).limit(1);
  const governmentCategory = await db.select().from(categories).where(eq(categories.name, 'Government')).limit(1);

  // Get data source IDs
  const deptEdSource = await db.select().from(dataSources).where(eq(dataSources.name, 'Department of Education')).limit(1);
  const collegeBoardSource = await db.select().from(dataSources).where(eq(dataSources.name, 'College Board, Inc.')).limit(1);
  const ncesSource = await db.select().from(dataSources).where(eq(dataSources.name, 'NCES/IPEDS')).limit(1);
  const beaSource = await db.select().from(dataSources).where(eq(dataSources.name, 'BEA')).limit(1);
  const alecSource = await db.select().from(dataSources).where(eq(dataSources.name, 'ALEC')).limit(1);
  const censusSource = await db.select().from(dataSources).where(eq(dataSources.name, 'US Census Bureau')).limit(1);
  const blsSource = await db.select().from(dataSources).where(eq(dataSources.name, 'BLS')).limit(1);
  const sbaSource = await db.select().from(dataSources).where(eq(dataSources.name, 'Small Business Administration')).limit(1);
  const pwcSource = await db.select().from(dataSources).where(eq(dataSources.name, 'PwC')).limit(1);
  const bjsSource = await db.select().from(dataSources).where(eq(dataSources.name, 'BJS')).limit(1);
  const hhsSource = await db.select().from(dataSources).where(eq(dataSources.name, 'HHS Children\'s Bureau')).limit(1);
  const kaiserSource = await db.select().from(dataSources).where(eq(dataSources.name, 'Kaiser Family Foundation')).limit(1);
  const cdcSource = await db.select().from(dataSources).where(eq(dataSources.name, 'CDC')).limit(1);
  const cdcBrfssSource = await db.select().from(dataSources).where(eq(dataSources.name, 'CDC BRFSS')).limit(1);
  const unitedHealthSource = await db.select().from(dataSources).where(eq(dataSources.name, 'United Health Foundation')).limit(1);
  const usdaSource = await db.select().from(dataSources).where(eq(dataSources.name, 'USDA')).limit(1);
  const eiaSource = await db.select().from(dataSources).where(eq(dataSources.name, 'EIA')).limit(1);
  const usgsSource = await db.select().from(dataSources).where(eq(dataSources.name, 'USGS')).limit(1);
  const epaSource = await db.select().from(dataSources).where(eq(dataSources.name, 'EPA')).limit(1);
  const chamberSource = await db.select().from(dataSources).where(eq(dataSources.name, 'US Chamber of Commerce')).limit(1);
  const taxFoundationSource = await db.select().from(dataSources).where(eq(dataSources.name, 'Tax Foundation')).limit(1);
  const morningstarSource = await db.select().from(dataSources).where(eq(dataSources.name, 'Morningstar')).limit(1);
  const spSource = await db.select().from(dataSources).where(eq(dataSources.name, 'Standard & Poor\'s')).limit(1);
  const pirgSource = await db.select().from(dataSources).where(eq(dataSources.name, 'PIRG')).limit(1);
  const digitalGovSource = await db.select().from(dataSources).where(eq(dataSources.name, 'Center for Digital Government')).limit(1);
  const stateWebsitesSource = await db.select().from(dataSources).where(eq(dataSources.name, 'State Websites')).limit(1);
  const itepSource = await db.select().from(dataSources).where(eq(dataSources.name, 'ITEP')).limit(1);

  // Insert statistics (complete data from CSV with normalized sources)
  const statisticData = [
    // Education (6 measures)
    {
      categoryId: educationCategory[0].id,
      dataSourceId: deptEdSource[0].id,
      raNumber: '1001',
      name: 'K-8 Testing',
      description: 'Reading, Writing, and Math Skills at Grades 4 and 8',
      subMeasure: 'Reading, Writing, and Math Skills at Grades 4 and 8',
      calculation: 'Scale Score from NAEP',
      unit: 'Scale Score',
      availableSince: '1992'
    },
    {
      categoryId: educationCategory[0].id,
      dataSourceId: deptEdSource[0].id,
      raNumber: '1002',
      name: 'HS Graduation Rate',
      description: 'Averaged Freshman Graduation Rate',
      subMeasure: '',
      calculation: '% Averaged Freshman Graduation Rate',
      unit: '%',
      availableSince: '1986'
    },
    {
      categoryId: educationCategory[0].id,
      dataSourceId: collegeBoardSource[0].id,
      raNumber: '1003',
      name: 'SAT/ACT Mean',
      description: 'Mean ACT Score by State',
      subMeasure: '',
      calculation: 'Mean ACT Score by State',
      unit: 'Score',
      availableSince: '2013'
    },
    {
      categoryId: educationCategory[0].id,
      dataSourceId: ncesSource[0].id,
      raNumber: '1004',
      name: '2-Year Degree Graduation Rate',
      description: 'Attaining degree after 150% of 2-year period',
      subMeasure: '',
      calculation: '% attaining degree after 150% of 2-year period',
      unit: '%',
      availableSince: '2012'
    },
    {
      categoryId: educationCategory[0].id,
      dataSourceId: ncesSource[0].id,
      raNumber: '1005',
      name: '4-Year Degree Graduation Rate',
      description: 'Attaining degree after 150% of 4-year period',
      subMeasure: '',
      calculation: '% attaining degree after 150% of 4-year period',
      unit: '%',
      availableSince: '2012'
    },
    {
      categoryId: educationCategory[0].id,
      dataSourceId: ncesSource[0].id,
      raNumber: '1006',
      name: 'Professional/Advanced Degrees',
      description: 'Percentage of Total Adult Population',
      subMeasure: '',
      calculation: '% of Total Adult Population',
      unit: '%',
      availableSince: '2012'
    },
    
    // Economy (10 measures)
    {
      categoryId: economyCategory[0].id,
      dataSourceId: beaSource[0].id,
      raNumber: '2001',
      name: 'Real GDP',
      description: 'Gross State Product in Current Year Dollars',
      subMeasure: '',
      calculation: 'Gross State Product in Current Year Dollars',
      unit: '$',
      availableSince: '2003'
    },
    {
      categoryId: economyCategory[0].id,
      dataSourceId: beaSource[0].id,
      raNumber: '2002',
      name: 'Economic Diversity',
      description: 'Simpson index',
      subMeasure: '',
      calculation: 'Simpson index',
      unit: 'Index',
      availableSince: '2007'
    },
    {
      categoryId: economyCategory[0].id,
      dataSourceId: alecSource[0].id,
      raNumber: '2003',
      name: 'Business Competitiveness Index',
      description: 'American Legislative Exchange Council',
      subMeasure: '',
      calculation: 'American Legislative Exchange Council',
      unit: 'Index',
      availableSince: '2012'
    },
    {
      categoryId: economyCategory[0].id,
      dataSourceId: censusSource[0].id,
      raNumber: '2004',
      name: 'Household Income',
      description: 'Household Income Per Capita',
      subMeasure: '',
      calculation: 'Household Income Per Capita',
      unit: '$',
      availableSince: '1984'
    },
    {
      categoryId: economyCategory[0].id,
      dataSourceId: blsSource[0].id,
      raNumber: '2005',
      name: 'Unemployment Rate',
      description: 'Mean percentage of Labor Force Unemployed',
      subMeasure: '',
      calculation: 'Mean % of Labor Force Unemployed',
      unit: '%',
      availableSince: '2012'
    },
    {
      categoryId: economyCategory[0].id,
      dataSourceId: blsSource[0].id,
      raNumber: '2006',
      name: 'Net Job Growth',
      description: 'Jobs Gained minus Jobs Lost in a Year',
      subMeasure: '',
      calculation: '# Jobs Gained - # Jobs Lost in a Year',
      unit: 'Jobs',
      availableSince: '2011'
    },
    {
      categoryId: economyCategory[0].id,
      dataSourceId: censusSource[0].id,
      raNumber: '2007',
      name: 'Income Inequality',
      description: 'Gini Coefficient',
      subMeasure: '',
      calculation: 'Gini Coefficient',
      unit: 'Index',
      availableSince: '1979'
    },
    {
      categoryId: economyCategory[0].id,
      dataSourceId: sbaSource[0].id,
      raNumber: '2008',
      name: 'New Firms',
      description: 'Number of new firms registered in previous year',
      subMeasure: '',
      calculation: '# of new firms registered in previous year',
      unit: 'Count',
      availableSince: '1998'
    },
    {
      categoryId: economyCategory[0].id,
      dataSourceId: pwcSource[0].id,
      raNumber: '2009',
      name: 'Venture Capital Investment',
      description: 'Number of Deals or Total Investment in Dollars',
      subMeasure: '',
      calculation: '# of Deals or Total Investment in Dollars',
      unit: '$',
      availableSince: '2002'
    },
    {
      categoryId: economyCategory[0].id,
      dataSourceId: censusSource[0].id,
      raNumber: '2010',
      name: 'Rate of Poverty',
      description: 'Percentage of population 18+ below poverty line',
      subMeasure: '',
      calculation: '% of population 18+ below poverty line',
      unit: '%',
      availableSince: '2012'
    },
    
    // Public Safety (7 measures)
    {
      categoryId: publicSafetyCategory[0].id,
      dataSourceId: bjsSource[0].id,
      raNumber: '3001',
      name: 'Violent Crimes',
      description: 'FBI Violent Crime Index per 1,000 persons',
      subMeasure: '',
      calculation: 'FBI Violent Crime Index (per 1,000 persons)',
      unit: 'per 1,000',
      availableSince: '1997'
    },
    {
      categoryId: publicSafetyCategory[0].id,
      dataSourceId: bjsSource[0].id,
      raNumber: '3002',
      name: 'Property Crimes',
      description: 'FBI Property Crime Index per 1,000 persons',
      subMeasure: '',
      calculation: 'FBI Property Crime Index (per 1,000 persons)',
      unit: 'per 1,000',
      availableSince: '1997'
    },
    {
      categoryId: publicSafetyCategory[0].id,
      dataSourceId: bjsSource[0].id,
      raNumber: '3003',
      name: 'Recidivism Rate',
      description: 'Percentage reoffending within 3 years of release',
      subMeasure: '',
      calculation: '% reoffending within 3 years of release',
      unit: '%',
      availableSince: ''
    },
    {
      categoryId: publicSafetyCategory[0].id,
      dataSourceId: bjsSource[0].id,
      raNumber: '3004',
      name: 'Rate of Incarceration',
      description: 'Prisoners per 100,000',
      subMeasure: '',
      calculation: 'Prisoners per 100,000',
      unit: 'per 100,000',
      availableSince: ''
    },
    {
      categoryId: publicSafetyCategory[0].id,
      dataSourceId: censusSource[0].id,
      raNumber: '3005',
      name: 'Cost of Corrections System',
      description: 'Dollars spent on corrections annually per capita',
      subMeasure: '',
      calculation: 'Dollars spent on corrections annually per capita',
      unit: '$',
      availableSince: ''
    },
    {
      categoryId: publicSafetyCategory[0].id,
      dataSourceId: censusSource[0].id,
      raNumber: '3006',
      name: 'Traffic Fatalities',
      description: 'Deaths per 100 million vehicle miles travelled',
      subMeasure: '',
      calculation: 'Deaths per 100 million vehicle miles travelled',
      unit: 'per 100M miles',
      availableSince: '1990'
    },
    {
      categoryId: publicSafetyCategory[0].id,
      dataSourceId: hhsSource[0].id,
      raNumber: '3007',
      name: 'Child Maltreatment',
      description: 'Number of Child Abuse/Neglect Cases per capita',
      subMeasure: '',
      calculation: '# of Child Abuse/Neglect Cases per capita',
      unit: 'per capita',
      availableSince: '2003'
    },
    
    // Health (9 measures)
    {
      categoryId: healthCategory[0].id,
      dataSourceId: kaiserSource[0].id,
      raNumber: '5001',
      name: 'Cost of Healthcare',
      description: 'Spending per capita in real dollars',
      subMeasure: '',
      calculation: 'Spending per capita in real dollars',
      unit: '$',
      availableSince: '1991'
    },
    {
      categoryId: healthCategory[0].id,
      dataSourceId: cdcBrfssSource[0].id,
      raNumber: '5002',
      name: 'Rate of Obesity',
      description: 'Percentage of Total Adult Population',
      subMeasure: '',
      calculation: '% of Total Adult Population',
      unit: '%',
      availableSince: '2011'
    },
    {
      categoryId: healthCategory[0].id,
      dataSourceId: unitedHealthSource[0].id,
      raNumber: '5003',
      name: 'Quality of Health',
      description: 'America\'s Health Rankings Index',
      subMeasure: '',
      calculation: 'America\'s Health Rankings Index',
      unit: 'Index',
      availableSince: ''
    },
    {
      categoryId: healthCategory[0].id,
      dataSourceId: censusSource[0].id,
      raNumber: '5004',
      name: 'Infant Mortality Rate',
      description: 'Rate per 1,000 births annually',
      subMeasure: '',
      calculation: 'Rate per 1,000 births annually',
      unit: 'per 1,000',
      availableSince: '1990'
    },
    {
      categoryId: healthCategory[0].id,
      dataSourceId: censusSource[0].id,
      raNumber: '5005',
      name: 'Uninsured',
      description: 'Percentage of population uninsured',
      subMeasure: '',
      calculation: '% of population uninsured',
      unit: '%',
      availableSince: '1990'
    },
    {
      categoryId: healthCategory[0].id,
      dataSourceId: cdcSource[0].id,
      raNumber: '5006',
      name: 'Smokers',
      description: 'Percentage of Adult population who smoke',
      subMeasure: '',
      calculation: '% of Adult population who smoke',
      unit: '%',
      availableSince: '1990'
    },
    {
      categoryId: healthCategory[0].id,
      dataSourceId: blsSource[0].id,
      raNumber: '5007',
      name: 'Workplace Injuries',
      description: 'Number of injuries per 100 employees',
      subMeasure: '',
      calculation: '# injuries per 100 employees',
      unit: 'per 100',
      availableSince: ''
    },
    {
      categoryId: healthCategory[0].id,
      dataSourceId: cdcSource[0].id,
      raNumber: '5008',
      name: 'Quality of Life / Happiness Index',
      description: 'Gallup-Healthways Wellness Survey',
      subMeasure: '',
      calculation: 'Gallup-Healthways Wellness Survey',
      unit: 'Index',
      availableSince: '2008'
    },
    {
      categoryId: healthCategory[0].id,
      dataSourceId: usdaSource[0].id,
      raNumber: '5009',
      name: 'Food Insecurity',
      description: 'Percentage of households in low/very low security',
      subMeasure: '',
      calculation: '% of households in low/very low security',
      unit: '%',
      availableSince: '2010'
    },
    
    // Environment (4 measures)
    {
      categoryId: environmentCategory[0].id,
      dataSourceId: eiaSource[0].id,
      raNumber: '4001',
      name: 'Renewable Energy',
      description: 'Percentage Green Megawatts / Total Generated',
      subMeasure: '',
      calculation: '% Green Megawatts / Total Generated',
      unit: '%',
      availableSince: '2006'
    },
    {
      categoryId: environmentCategory[0].id,
      dataSourceId: eiaSource[0].id,
      raNumber: '4002',
      name: 'Carbon Dioxide Emissions',
      description: 'Millions of Metric Tons Produced',
      subMeasure: '',
      calculation: 'Millions of Metric Tons Produced',
      unit: 'MMT',
      availableSince: '2000'
    },
    {
      categoryId: environmentCategory[0].id,
      dataSourceId: usgsSource[0].id,
      raNumber: '4003',
      name: 'Water Quality Index',
      description: 'Water quality assessment',
      subMeasure: '',
      calculation: '',
      unit: 'Index',
      availableSince: '2002'
    },
    {
      categoryId: environmentCategory[0].id,
      dataSourceId: epaSource[0].id,
      raNumber: '4004',
      name: 'Air Quality',
      description: 'National Ambient Air Quality Standards',
      subMeasure: '',
      calculation: 'National Ambient Air Quality Standards',
      unit: 'AQI',
      availableSince: '2010'
    },
    
    // Infrastructure (1 measure)
    {
      categoryId: infrastructureCategory[0].id,
      dataSourceId: chamberSource[0].id,
      raNumber: '6001',
      name: 'Infrastructure Index',
      description: 'Index created from 2007 data',
      subMeasure: '',
      calculation: 'Index created from 2007 data',
      unit: 'Index',
      availableSince: '2011'
    },
    
    // Government (13 measures)
    {
      categoryId: governmentCategory[0].id,
      dataSourceId: censusSource[0].id,
      raNumber: '7001',
      name: 'State Debt',
      description: 'Percentage total state debt / GDP',
      subMeasure: '',
      calculation: '% total state debt / GDP',
      unit: '%',
      availableSince: '2003'
    },
    {
      categoryId: governmentCategory[0].id,
      dataSourceId: taxFoundationSource[0].id,
      raNumber: '7002',
      name: 'Citizen Tax Burden',
      description: 'Tax revenue per capita',
      subMeasure: '',
      calculation: 'Tax revenue per capita',
      unit: '$',
      availableSince: '1977'
    },
    {
      categoryId: governmentCategory[0].id,
      dataSourceId: morningstarSource[0].id,
      raNumber: '7003',
      name: 'Unfunded Pension Liabilities',
      description: 'Percentage of pension liabilities unfunded',
      subMeasure: '',
      calculation: '% of pension liabilities unfunded',
      unit: '%',
      availableSince: '2007'
    },
    {
      categoryId: governmentCategory[0].id,
      dataSourceId: censusSource[0].id,
      raNumber: '7004',
      name: 'Federal Dependency',
      description: 'Percentage of revenue from federal grants',
      subMeasure: '',
      calculation: '% of revenue from federal grants',
      unit: '%',
      availableSince: ''
    },
    {
      categoryId: governmentCategory[0].id,
      dataSourceId: spSource[0].id,
      raNumber: '7005',
      name: 'Credit Rating',
      description: 'State Government Credit Rating',
      subMeasure: '',
      calculation: 'State Government Credit Rating',
      unit: 'Rating',
      availableSince: '2001'
    },
    {
      categoryId: governmentCategory[0].id,
      dataSourceId: censusSource[0].id,
      raNumber: '7006',
      name: 'State Employees',
      description: 'Percentage Full-time Employees / Population',
      subMeasure: '',
      calculation: '% Full-time Employees / Population',
      unit: '%',
      availableSince: '1997'
    },
    {
      categoryId: governmentCategory[0].id,
      dataSourceId: pirgSource[0].id,
      raNumber: '7007',
      name: 'Financial Records Online',
      description: 'Online financial transparency',
      subMeasure: '',
      calculation: '',
      unit: 'Binary',
      availableSince: ''
    },
    {
      categoryId: governmentCategory[0].id,
      dataSourceId: digitalGovSource[0].id,
      raNumber: '7008',
      name: 'Government Use of Technology',
      description: 'Grade from Center for Digital Government',
      subMeasure: '',
      calculation: 'Grade from Center for Digital Government',
      unit: 'Grade',
      availableSince: '2012'
    },
    {
      categoryId: governmentCategory[0].id,
      dataSourceId: stateWebsitesSource[0].id,
      raNumber: '7009',
      name: 'Governor\'s Goals Online',
      description: 'Binary (Yes/No)',
      subMeasure: '',
      calculation: 'Binary (Yes/No)',
      unit: 'Binary',
      availableSince: '2013'
    },
    {
      categoryId: governmentCategory[0].id,
      dataSourceId: stateWebsitesSource[0].id,
      raNumber: '7010',
      name: 'Citizen Customer Satisfaction',
      description: 'Polling Data',
      subMeasure: '',
      calculation: 'Polling Data',
      unit: 'Score',
      availableSince: '2014'
    },
    {
      categoryId: governmentCategory[0].id,
      dataSourceId: stateWebsitesSource[0].id,
      raNumber: '7011',
      name: 'Government Open Data',
      description: 'Number of Performance Measures and Data online',
      subMeasure: '',
      calculation: '# of Performance Measures and Data online',
      unit: 'Count',
      availableSince: '2013'
    },
    {
      categoryId: governmentCategory[0].id,
      dataSourceId: censusSource[0].id,
      raNumber: '7012',
      name: 'Government Spending as % of GDP',
      description: 'Dollar Expenditures / State GDP',
      subMeasure: '',
      calculation: '$ Expenditures / State GDP',
      unit: '%',
      availableSince: '2003'
    },
    {
      categoryId: governmentCategory[0].id,
      dataSourceId: itepSource[0].id,
      raNumber: '7013',
      name: 'Tax Inequality Index',
      description: 'Effective state/local taxes by income group',
      subMeasure: '',
      calculation: 'Effective state/local taxes by income group',
      unit: 'Index',
      availableSince: ''
    },
  ];

  console.log('📈 Inserting statistics...');
  for (const stat of statisticData) {
    await db.insert(statistics).values(stat);
  }

  // ✅ NORMALIZED: Create import session
  const importSession = await db.insert(importSessions).values({
    name: 'Initial 2023 Data Import',
    description: 'Complete dataset from Results America CSV sources',
    dataSourceId: censusSource[0].id, // Primary source
    dataYear: 2023,
    recordCount: 2500, // 50 states × 50 statistics
  }).returning();

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
        importSessionId: importSession[0].id,
        year: 2023,
        stateId: state.id,
        statisticId: stat.id,
        value: Math.round(value * 100) / 100, // Round to 2 decimal places
      });
    }
  }

  console.log('✅ Normalized database seeded successfully!');
} 