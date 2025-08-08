import { getDbOrThrow } from '../db';
import { states, categories, dataSources, statistics, dataPoints, importSessions, nationalAverages } from '../db/schema-postgres';
import { eq, and } from 'drizzle-orm';

export interface SeedingResult {
  table: string;
  created: number;
  updated: number;
  errors: string[];
}

export interface SeedingSummary {
  totalCreated: number;
  totalUpdated: number;
  totalErrors: number;
  results: SeedingResult[];
}

export class SmartSeeder {
  /**
   * Seed all tables in dependency order
   */
  static async seedAll(): Promise<SeedingSummary> {
    console.log('🌱 Starting smart seeding in dependency order...');
    
    const summary: SeedingSummary = {
      totalCreated: 0,
      totalUpdated: 0,
      totalErrors: 0,
      results: []
    };

    // Phase 1: Foundation tables (no dependencies)
    console.log('\n📋 Phase 1: Foundation tables');
    summary.results.push(await this.seedStates());
    summary.results.push(await this.seedCategories());
    summary.results.push(await this.seedDataSources());

    // Phase 2: First-level dependencies
    console.log('\n📊 Phase 2: Statistics (depends on categories and data sources)');
    summary.results.push(await this.seedStatistics());

    // Phase 3: Second-level dependencies
    console.log('\n📈 Phase 3: Data points and national averages');
    summary.results.push(await this.seedDataPoints());
    summary.results.push(await this.seedNationalAverages());

    // Calculate totals
    summary.totalCreated = summary.results.reduce((sum, r) => sum + r.created, 0);
    summary.totalUpdated = summary.results.reduce((sum, r) => sum + r.updated, 0);
    summary.totalErrors = summary.results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`\n✅ Seeding complete: ${summary.totalCreated} created, ${summary.totalUpdated} updated, ${summary.totalErrors} errors`);
    return summary;
  }

  /**
   * Seed states - all 50 US states
   */
  static async seedStates(): Promise<SeedingResult> {
    const db = getDbOrThrow();
    const result: SeedingResult = { table: 'states', created: 0, updated: 0, errors: [] };

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
      { name: 'Wyoming', abbreviation: 'WY' },
    ];

    for (const state of stateData) {
      try {
        const existing = await db
          .select()
          .from(states)
          .where(eq(states.name, state.name))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(states).values(state);
          result.created++;
          console.log(`  ✅ Created state: ${state.name}`);
        } else {
          await db
            .update(states)
            .set(state)
            .where(eq(states.id, existing[0].id));
          result.updated++;
          console.log(`  🔄 Updated state: ${state.name}`);
        }
      } catch (error) {
        const errorMsg = `Failed to seed state ${state.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    return result;
  }

  /**
   * Seed categories
   */
  static async seedCategories(): Promise<SeedingResult> {
    const db = getDbOrThrow();
    const result: SeedingResult = { table: 'categories', created: 0, updated: 0, errors: [] };

    const categoryData = [
      { name: 'Education', description: 'K-12 and higher education metrics', icon: 'GraduationCap', sortOrder: 1 },
      { name: 'Economy', description: 'Economic indicators and employment', icon: 'TrendingUp', sortOrder: 2 },
      { name: 'Public Safety', description: 'Crime, corrections, and public safety metrics', icon: 'ShieldCheck', sortOrder: 3 },
      { name: 'Health', description: 'Health outcomes and access metrics', icon: 'Heart', sortOrder: 4 },
      { name: 'Environment', description: 'Environmental quality and sustainability', icon: 'Leaf', sortOrder: 5 },
      { name: 'Infrastructure', description: 'Infrastructure quality and development', icon: 'Building2', sortOrder: 6 },
      { name: 'Government', description: 'Government efficiency and transparency', icon: 'Landmark', sortOrder: 7 },
    ];

    for (const category of categoryData) {
      try {
        const existing = await db
          .select()
          .from(categories)
          .where(eq(categories.name, category.name))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(categories).values(category);
          result.created++;
          console.log(`  ✅ Created category: ${category.name}`);
        } else {
          await db
            .update(categories)
            .set(category)
            .where(eq(categories.id, existing[0].id));
          result.updated++;
          console.log(`  🔄 Updated category: ${category.name}`);
        }
      } catch (error) {
        const errorMsg = `Failed to seed category ${category.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    return result;
  }

  /**
   * Seed data sources
   */
  static async seedDataSources(): Promise<SeedingResult> {
    const db = getDbOrThrow();
    const result: SeedingResult = { table: 'data_sources', created: 0, updated: 0, errors: [] };

    const dataSourceData = [
      { name: 'Bureau of Economic Analysis (BEA)', description: 'Federal agency providing comprehensive economic statistics including GDP, personal income, and industry data', url: 'https://www.bea.gov' },
      { name: 'Bureau of Labor Statistics (BLS)', description: 'Federal agency providing labor market data, employment statistics, and price indexes', url: 'https://www.bls.gov' },
      { name: 'US Census Bureau', description: 'Federal agency providing demographic, economic, and geographic data about the United States', url: 'https://www.census.gov' },
      { name: 'Centers for Disease Control (CDC)', description: 'Federal agency providing public health data, disease statistics, and health outcomes', url: 'https://www.cdc.gov' },
      { name: 'Department of Education', description: 'Federal agency providing educational statistics, outcomes, and policy data', url: 'https://www.ed.gov' },
      { name: 'Federal Bureau of Investigation (FBI)', description: 'Federal agency providing crime statistics and law enforcement data', url: 'https://www.fbi.gov' },
      { name: 'Environmental Protection Agency (EPA)', description: 'Federal agency providing environmental data, air quality, and sustainability metrics', url: 'https://www.epa.gov' },
      { name: 'Department of Transportation (DOT)', description: 'Federal agency providing transportation infrastructure and safety data', url: 'https://www.transportation.gov' },
      { name: 'Department of Housing and Urban Development (HUD)', description: 'Federal agency providing housing market data and affordability metrics', url: 'https://www.hud.gov' },
      { name: 'National Center for Health Statistics (NCHS)', description: 'Federal agency providing detailed health statistics and vital records', url: 'https://www.cdc.gov/nchs' },
      { name: 'Results America', description: 'Custom data collection and analysis for state-level policy outcomes', url: 'https://resultsamerica.org' },
      { name: 'State Data Centers', description: 'Network of state-level data centers providing local statistics and indicators', url: 'https://www.census.gov/about/partners/sdc.html' },
      { name: 'American Community Survey (ACS)', description: 'Census Bureau program providing detailed demographic and economic data', url: 'https://www.census.gov/programs-surveys/acs' },
      { name: 'Current Population Survey (CPS)', description: 'Joint Census Bureau and BLS survey providing labor force and demographic data', url: 'https://www.census.gov/programs-surveys/cps.html' },
      { name: 'National Vital Statistics System', description: 'CDC system providing birth, death, and health statistics', url: 'https://www.cdc.gov/nchs/nvss/index.htm' },
    ];

    for (const dataSource of dataSourceData) {
      try {
        const existing = await db
          .select()
          .from(dataSources)
          .where(eq(dataSources.name, dataSource.name))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(dataSources).values(dataSource);
          result.created++;
          console.log(`  ✅ Created data source: ${dataSource.name}`);
        } else {
          await db
            .update(dataSources)
            .set(dataSource)
            .where(eq(dataSources.id, existing[0].id));
          result.updated++;
          console.log(`  🔄 Updated data source: ${dataSource.name}`);
        }
      } catch (error) {
        const errorMsg = `Failed to seed data source ${dataSource.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    return result;
  }

  /**
   * Seed statistics with name-based FK lookups
   */
  static async seedStatistics(): Promise<SeedingResult> {
    const db = getDbOrThrow();
    const result: SeedingResult = { table: 'statistics', created: 0, updated: 0, errors: [] };

    const statisticData = [
      // Education Statistics
      {
        raNumber: '1001',
        name: 'K-8 Testing',
        categoryName: 'Education',
        dataSourceName: 'Department of Education',
        description: 'Reading, Writing, and Math Skills at Grades 4 and 8',
        subMeasure: 'Reading, Writing, and Math Skills at Grades 4 and 8',
        calculation: 'Scale Score from NAEP',
        unit: 'Scale Score',
        availableSince: '1992',
        dataQuality: 'mock' as const,
        provenance: 'National Assessment of Educational Progress (NAEP) - Reading, Writing, and Math Skills at Grades 4 and 8'
      },
      {
        raNumber: '1002',
        name: 'HS Graduation Rate',
        categoryName: 'Education',
        dataSourceName: 'Department of Education',
        description: 'Averaged Freshman Graduation Rate',
        subMeasure: '',
        calculation: '% Averaged Freshman Graduation Rate',
        unit: '%',
        availableSince: '1986',
        dataQuality: 'mock' as const,
        provenance: 'Department of Education - Averaged Freshman Graduation Rate'
      },
      {
        raNumber: '1003',
        name: 'SAT/ACT Mean',
        categoryName: 'Education',
        dataSourceName: 'College Board, Inc.',
        description: 'Mean ACT Score by State',
        subMeasure: '',
        calculation: 'Mean ACT Score by State',
        unit: 'Score',
        availableSince: '2013',
        dataQuality: 'mock' as const,
        provenance: 'College Board, Inc. - Mean ACT Score by State'
      },
      {
        raNumber: '1004',
        name: 'College Enrollment',
        categoryName: 'Education',
        dataSourceName: 'Department of Education',
        description: 'College Enrollment Rate',
        subMeasure: '',
        calculation: '% College Enrollment Rate',
        unit: '%',
        availableSince: '2014',
        dataQuality: 'mock' as const,
        provenance: 'Department of Education - College Enrollment Rate'
      },
      {
        raNumber: '1005',
        name: 'Teacher Salaries',
        categoryName: 'Education',
        dataSourceName: 'Department of Education',
        description: 'Average Teacher Salary',
        subMeasure: '',
        calculation: 'Average Teacher Salary',
        unit: '$',
        availableSince: '2014',
        dataQuality: 'mock' as const,
        provenance: 'Department of Education - Average Teacher Salary'
      },
      {
        raNumber: '1006',
        name: 'Per-Pupil Spending',
        categoryName: 'Education',
        dataSourceName: 'Department of Education',
        description: 'Per-Pupil Spending',
        subMeasure: '',
        calculation: 'Per-Pupil Spending',
        unit: '$',
        availableSince: '2014',
        dataQuality: 'mock' as const,
        provenance: 'Department of Education - Per-Pupil Spending'
      },

      // Economy Statistics
      {
        raNumber: '2001',
        name: 'GDP',
        categoryName: 'Economy',
        dataSourceName: 'Bureau of Economic Analysis (BEA)',
        description: 'Gross Domestic Product',
        subMeasure: '',
        calculation: 'Real GDP by State',
        unit: 'millions of dollars',
        availableSince: '2017',
        dataQuality: 'mock' as const,
        provenance: 'Bureau of Economic Analysis (BEA) - Real GDP by State'
      },
      {
        raNumber: '2002',
        name: 'Unemployment Rate',
        categoryName: 'Economy',
        dataSourceName: 'Bureau of Labor Statistics (BLS)',
        description: 'Unemployment Rate',
        subMeasure: '',
        calculation: 'Unemployment Rate',
        unit: '%',
        availableSince: '2014',
        dataQuality: 'mock' as const,
        provenance: 'Bureau of Labor Statistics (BLS) - Unemployment Rate'
      },
      {
        raNumber: '2003',
        name: 'Median Household Income',
        categoryName: 'Economy',
        dataSourceName: 'US Census Bureau',
        description: 'Median Household Income',
        subMeasure: '',
        calculation: 'Median Household Income',
        unit: '$',
        availableSince: '2014',
        dataQuality: 'mock' as const,
        provenance: 'US Census Bureau - Median Household Income'
      },

      // Public Safety Statistics
      {
        raNumber: '3001',
        name: 'Violent Crime Rate',
        categoryName: 'Public Safety',
        dataSourceName: 'Federal Bureau of Investigation (FBI)',
        description: 'Violent Crime Rate per 100,000',
        subMeasure: '',
        calculation: 'Violent Crime Rate per 100,000',
        unit: 'per 100,000',
        availableSince: '2014',
        dataQuality: 'mock' as const,
        provenance: 'Federal Bureau of Investigation (FBI) - Violent Crime Rate'
      },
      {
        raNumber: '3002',
        name: 'Property Crime Rate',
        categoryName: 'Public Safety',
        dataSourceName: 'Federal Bureau of Investigation (FBI)',
        description: 'Property Crime Rate per 100,000',
        subMeasure: '',
        calculation: 'Property Crime Rate per 100,000',
        unit: 'per 100,000',
        availableSince: '2014',
        dataQuality: 'mock' as const,
        provenance: 'Federal Bureau of Investigation (FBI) - Property Crime Rate'
      },

      // Health Statistics
      {
        raNumber: '4001',
        name: 'Life Expectancy',
        categoryName: 'Health',
        dataSourceName: 'National Center for Health Statistics (NCHS)',
        description: 'Life Expectancy at Birth',
        subMeasure: '',
        calculation: 'Life Expectancy at Birth',
        unit: 'years',
        availableSince: '2014',
        dataQuality: 'mock' as const,
        provenance: 'National Center for Health Statistics (NCHS) - Life Expectancy at Birth'
      },
      {
        raNumber: '4002',
        name: 'Infant Mortality Rate',
        categoryName: 'Health',
        dataSourceName: 'National Center for Health Statistics (NCHS)',
        description: 'Infant Mortality Rate per 1,000 Live Births',
        subMeasure: '',
        calculation: 'Infant Mortality Rate per 1,000 Live Births',
        unit: 'per 1,000',
        availableSince: '2014',
        dataQuality: 'mock' as const,
        provenance: 'National Center for Health Statistics (NCHS) - Infant Mortality Rate'
      },

      // Environment Statistics
      {
        raNumber: '5001',
        name: 'Air Quality Index',
        categoryName: 'Environment',
        dataSourceName: 'Environmental Protection Agency (EPA)',
        description: 'Air Quality Index',
        subMeasure: '',
        calculation: 'Air Quality Index',
        unit: 'Index',
        availableSince: '2014',
        dataQuality: 'mock' as const,
        provenance: 'Environmental Protection Agency (EPA) - Air Quality Index'
      },

      // Infrastructure Statistics
      {
        raNumber: '6001',
        name: 'Road Quality',
        categoryName: 'Infrastructure',
        dataSourceName: 'Department of Transportation (DOT)',
        description: 'Percentage of Roads in Good Condition',
        subMeasure: '',
        calculation: 'Percentage of Roads in Good Condition',
        unit: '%',
        availableSince: '2014',
        dataQuality: 'mock' as const,
        provenance: 'Department of Transportation (DOT) - Road Quality'
      },

      // Government Statistics
      {
        raNumber: '7001',
        name: 'Government Transparency',
        categoryName: 'Government',
        dataSourceName: 'Results America',
        description: 'Government Transparency Index',
        subMeasure: '',
        calculation: 'Government Transparency Index',
        unit: 'Index',
        availableSince: '2014',
        dataQuality: 'mock' as const,
        provenance: 'Results America - Government Transparency Index'
      },
    ];

    for (const stat of statisticData) {
      try {
        // Look up category by name
        const category = await db
          .select()
          .from(categories)
          .where(eq(categories.name, stat.categoryName))
          .limit(1);

        if (category.length === 0) {
          const errorMsg = `Category '${stat.categoryName}' not found for statistic ${stat.name}`;
          result.errors.push(errorMsg);
          console.error(`  ❌ ${errorMsg}`);
          continue;
        }

        // Look up data source by name
        let dataSourceId = null;
        if (stat.dataSourceName) {
          const dataSource = await db
            .select()
            .from(dataSources)
            .where(eq(dataSources.name, stat.dataSourceName))
            .limit(1);

          if (dataSource.length > 0) {
            dataSourceId = dataSource[0].id;
          }
        }

        // Check if statistic exists by RA number
        const existing = await db
          .select()
          .from(statistics)
          .where(eq(statistics.raNumber, stat.raNumber))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(statistics).values({
            raNumber: stat.raNumber,
            categoryId: category[0].id,
            dataSourceId,
            name: stat.name,
            description: stat.description,
            subMeasure: stat.subMeasure,
            calculation: stat.calculation,
            unit: stat.unit,
            availableSince: stat.availableSince,
            dataQuality: stat.dataQuality,
            provenance: stat.provenance,
          });
          result.created++;
          console.log(`  ✅ Created statistic: ${stat.name}`);
        } else {
          await db
            .update(statistics)
            .set({
              categoryId: category[0].id,
              dataSourceId,
              name: stat.name,
              description: stat.description,
              subMeasure: stat.subMeasure,
              calculation: stat.calculation,
              unit: stat.unit,
              availableSince: stat.availableSince,
              dataQuality: stat.dataQuality,
              provenance: stat.provenance,
            })
            .where(eq(statistics.id, existing[0].id));
          result.updated++;
          console.log(`  🔄 Updated statistic: ${stat.name}`);
        }
      } catch (error) {
        const errorMsg = `Failed to seed statistic ${stat.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    return result;
  }

  /**
   * Seed sample data points with name-based FK lookups
   */
  static async seedDataPoints(): Promise<SeedingResult> {
    const db = getDbOrThrow();
    const result: SeedingResult = { table: 'data_points', created: 0, updated: 0, errors: [] };

    // Get or create import session
    const importSession = await this.getOrCreateImportSession('Sample Data Import 2023');

    const dataPointData = [
      // Sample data points for demonstration
      { stateName: 'California', statisticName: 'K-8 Testing', year: 2023, value: 85.2 },
      { stateName: 'Texas', statisticName: 'K-8 Testing', year: 2023, value: 82.1 },
      { stateName: 'New York', statisticName: 'K-8 Testing', year: 2023, value: 87.5 },
      { stateName: 'California', statisticName: 'GDP', year: 2023, value: 3500000 },
      { stateName: 'Texas', statisticName: 'GDP', year: 2023, value: 2200000 },
      { stateName: 'New York', statisticName: 'GDP', year: 2023, value: 1800000 },
      { stateName: 'California', statisticName: 'Life Expectancy', year: 2023, value: 81.2 },
      { stateName: 'Texas', statisticName: 'Life Expectancy', year: 2023, value: 78.9 },
      { stateName: 'New York', statisticName: 'Life Expectancy', year: 2023, value: 80.5 },
    ];

    for (const dp of dataPointData) {
      try {
        // Look up state by name
        const state = await db
          .select()
          .from(states)
          .where(eq(states.name, dp.stateName))
          .limit(1);

        if (state.length === 0) {
          const errorMsg = `State '${dp.stateName}' not found for data point`;
          result.errors.push(errorMsg);
          console.error(`  ❌ ${errorMsg}`);
          continue;
        }

        // Look up statistic by name
        const statistic = await db
          .select()
          .from(statistics)
          .where(eq(statistics.name, dp.statisticName))
          .limit(1);

        if (statistic.length === 0) {
          const errorMsg = `Statistic '${dp.statisticName}' not found for data point`;
          result.errors.push(errorMsg);
          console.error(`  ❌ ${errorMsg}`);
          continue;
        }

        // Check if data point exists
        const existing = await db
          .select()
          .from(dataPoints)
          .where(and(
            eq(dataPoints.stateId, state[0].id),
            eq(dataPoints.statisticId, statistic[0].id),
            eq(dataPoints.year, dp.year),
            eq(dataPoints.importSessionId, importSession.id)
          ))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(dataPoints).values({
            stateId: state[0].id,
            statisticId: statistic[0].id,
            year: dp.year,
            value: dp.value,
            importSessionId: importSession.id,
          });
          result.created++;
          console.log(`  ✅ Created data point: ${dp.stateName} - ${dp.statisticName} (${dp.year})`);
        } else {
          await db
            .update(dataPoints)
            .set({ value: dp.value })
            .where(eq(dataPoints.id, existing[0].id));
          result.updated++;
          console.log(`  🔄 Updated data point: ${dp.stateName} - ${dp.statisticName} (${dp.year})`);
        }
      } catch (error) {
        const errorMsg = `Failed to seed data point ${dp.stateName} - ${dp.statisticName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    return result;
  }

  /**
   * Seed national averages
   */
  static async seedNationalAverages(): Promise<SeedingResult> {
    const db = getDbOrThrow();
    const result: SeedingResult = { table: 'national_averages', created: 0, updated: 0, errors: [] };

    const averageData = [
      { statisticName: 'K-8 Testing', year: 2023, value: 83.5, stateCount: 50 },
      { statisticName: 'GDP', year: 2023, value: 2500000, stateCount: 50 },
      { statisticName: 'Life Expectancy', year: 2023, value: 79.8, stateCount: 50 },
    ];

    for (const avg of averageData) {
      try {
        // Look up statistic by name
        const statistic = await db
          .select()
          .from(statistics)
          .where(eq(statistics.name, avg.statisticName))
          .limit(1);

        if (statistic.length === 0) {
          const errorMsg = `Statistic '${avg.statisticName}' not found for national average`;
          result.errors.push(errorMsg);
          console.error(`  ❌ ${errorMsg}`);
          continue;
        }

        // Check if national average exists
        const existing = await db
          .select()
          .from(nationalAverages)
          .where(and(
            eq(nationalAverages.statisticId, statistic[0].id),
            eq(nationalAverages.year, avg.year)
          ))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(nationalAverages).values({
            statisticId: statistic[0].id,
            year: avg.year,
            value: avg.value,
            calculationMethod: 'arithmetic_mean',
            stateCount: avg.stateCount,
          });
          result.created++;
          console.log(`  ✅ Created national average: ${avg.statisticName} (${avg.year})`);
        } else {
          await db
            .update(nationalAverages)
            .set({
              value: avg.value,
              stateCount: avg.stateCount,
              lastCalculated: new Date(),
            })
            .where(eq(nationalAverages.id, existing[0].id));
          result.updated++;
          console.log(`  🔄 Updated national average: ${avg.statisticName} (${avg.year})`);
        }
      } catch (error) {
        const errorMsg = `Failed to seed national average ${avg.statisticName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    return result;
  }

  /**
   * Get or create import session
   */
  private static async getOrCreateImportSession(name: string) {
    const db = getDbOrThrow();

    const existing = await db
      .select()
      .from(importSessions)
      .where(eq(importSessions.name, name))
      .limit(1);

    if (existing.length === 0) {
      const [newSession] = await db
        .insert(importSessions)
        .values({
          name,
          description: `Auto-created session for ${name}`,
          dataYear: new Date().getFullYear(),
          recordCount: 0,
        })
        .returning();
      return newSession;
    }

    return existing[0];
  }

} 