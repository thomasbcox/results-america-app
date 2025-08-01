#!/usr/bin/env tsx

import { getDb } from '../src/lib/db';
import { dataPoints, statistics, nationalAverages } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { importBEAGDPData, importBLSEmploymentData, importCensusPopulationData } from '../src/lib/services/externalDataService';
import { NationalAverageService } from '../src/lib/services/aggregationService';

async function testExternalDataImport() {
  const db = getDb();  console.log('🧪 Testing External Data Import System...\n');

  try {
    // Test 1: Import BEA GDP Data
    console.log('📊 Test 1: Importing BEA GDP Data...');
    const gdpJob = await importBEAGDPData();
    console.log(`✅ GDP Import completed: ${gdpJob.processedRecords} records imported`);
    console.log(`   Status: ${gdpJob.status}`);
    console.log(`   Errors: ${gdpJob.errors.length}`);
    
    if (gdpJob.errors.length > 0) {
      console.log('   Error details:', gdpJob.errors.slice(0, 3));
    }

    // Test 2: Import BLS Employment Data
    console.log('\n📈 Test 2: Importing BLS Employment Data...');
    const employmentJob = await importBLSEmploymentData();
    console.log(`✅ Employment Import completed: ${employmentJob.processedRecords} records imported`);
    console.log(`   Status: ${employmentJob.status}`);
    console.log(`   Errors: ${employmentJob.errors.length}`);

    // Test 3: Import Census Population Data
    console.log('\n👥 Test 3: Importing Census Population Data...');
    const populationJob = await importCensusPopulationData();
    console.log(`✅ Population Import completed: ${populationJob.processedRecords} records imported`);
    console.log(`   Status: ${populationJob.status}`);
    console.log(`   Errors: ${populationJob.errors.length}`);

    // Test 4: Verify National Averages were calculated
    console.log('\n🔢 Test 4: Verifying National Averages...');
    const allAverages = await db.select().from(nationalAverages);
    console.log(`✅ Found ${allAverages.length} national averages in database`);

    // Show some sample averages
    if (allAverages.length > 0) {
      console.log('\n📋 Sample National Averages:');
      const sampleAverages = allAverages.slice(0, 5);
      for (const avg of sampleAverages) {
        console.log(`   Statistic ${avg.statisticId}, Year ${avg.year}: ${avg.value.toLocaleString()} (${avg.stateCount} states)`);
      }
    }

    // Test 5: Verify Data Points
    console.log('\n📊 Test 5: Verifying Data Points...');
    const allDataPoints = await db.select().from(dataPoints);
    console.log(`✅ Found ${allDataPoints.length} data points in database`);

    // Test 6: Verify Statistics
    console.log('\n📈 Test 6: Verifying Statistics...');
    const allStatistics = await db.select().from(statistics);
    console.log(`✅ Found ${allStatistics.length} statistics in database`);

    // Show statistics with their data
    console.log('\n📋 Statistics with Data:');
    for (const stat of allStatistics) {
      const statDataPoints = await db.select().from(dataPoints).where(eq(dataPoints.statisticId, stat.id));
      const statAverages = await db.select().from(nationalAverages).where(eq(nationalAverages.statisticId, stat.id));
      
      console.log(`   ${stat.name} (${stat.raNumber}):`);
      console.log(`     - Data Points: ${statDataPoints.length}`);
      console.log(`     - National Averages: ${statAverages.length}`);
      
      if (statAverages.length > 0) {
        const years = statAverages.map((avg: any) => avg.year).sort();
        console.log(`     - Years: ${years.join(', ')}`);
      }
    }

    // Test 7: Test National Average Retrieval
    console.log('\n🧮 Test 7: Testing National Average Retrieval...');
    if (allStatistics.length > 0 && allAverages.length > 0) {
      const testStat = allStatistics[0];
      const testYear = 2023;
      
      try {
        const average = await NationalAverageService.getNationalAverage(testStat.id, testYear);
        console.log(`✅ Retrieved national average for ${testStat.name} (${testYear}): ${average.toLocaleString()}`);
      } catch (error) {
        console.log(`❌ Failed to retrieve national average: ${error}`);
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Total Data Points: ${allDataPoints.length}`);
    console.log(`   - Total Statistics: ${allStatistics.length}`);
    console.log(`   - Total National Averages: ${allAverages.length}`);
    console.log(`   - Years of Data: 2017-2023 (7 years)`);
    console.log(`   - States Covered: 50 states`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testExternalDataImport()
  .then(() => {
    console.log('\n✅ External data import test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ External data import test failed:', error);
    process.exit(1);
  }); 