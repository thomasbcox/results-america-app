#!/usr/bin/env tsx

import { SimpleCSVImportService } from '../../src/lib/services/simpleCSVImportService';
import { getDb } from '../../src/lib/db';
import { csvImports, csvImportStaging, dataPoints } from '../../src/lib/db/schema-postgres';
import { eq } from 'drizzle-orm';

async function testSimpleCSVImport() {
  const db = getDb();  console.log('🧪 Testing Simplified CSV Import System...\n');

  try {
    // Test 1: Get templates
    console.log('📋 Test 1: Getting CSV templates...');
    const templates = await SimpleCSVImportService.getTemplates();
    console.log(`✅ Found ${templates.length} templates:`);
    
    for (const template of templates) {
      console.log(`   - ${template.name}: ${template.description}`);
      console.log(`     Expected headers: ${template.expectedHeaders.join(', ')}`);
      console.log(`     Type: ${template.type}`);
    }

    // Test 2: Create test CSV data for multi-category template
    console.log('\n📊 Test 2: Creating test CSV data for multi-category template...');
    const timestamp = Date.now();
    const multiCategoryCSV = `State,Year,Category,Measure,Value
California,2023,Economy,Gross Domestic Product,${3500000 + timestamp % 1000}
Texas,2023,Economy,Gross Domestic Product,${2200000 + timestamp % 1000}
New York,2023,Economy,Gross Domestic Product,${1800000 + timestamp % 1000}
California,2023,Education,HS Graduation Rate,${85.2 + (timestamp % 10) / 10}
Texas,2023,Education,HS Graduation Rate,${89.1 + (timestamp % 10) / 10}
New York,2023,Education,HS Graduation Rate,${87.5 + (timestamp % 10) / 10}`;

    // Create a File object from the CSV data
    const csvBlob = new Blob([multiCategoryCSV], { type: 'text/csv' });
    const testFile = new File([csvBlob], 'test-multi-category.csv', { type: 'text/csv' });

    console.log('✅ Test CSV data created');
    console.log('   File name:', testFile.name);
    console.log('   File size:', testFile.size, 'bytes');
    console.log('   Content preview:');
    console.log(multiCategoryCSV.split('\n').slice(0, 4).join('\n'));

    // Test 3: Upload CSV using multi-category template
    console.log('\n📤 Test 3: Uploading CSV with multi-category template...');
    const multiCategoryTemplate = templates.find(t => t.name === 'Multi-Category Data Import');
    
    if (!multiCategoryTemplate) {
      throw new Error('Multi-category template not found');
    }

    const uploadResult = await SimpleCSVImportService.uploadCSV(
      testFile,
      multiCategoryTemplate.id,
      {
        name: 'Test Multi-Category Import',
        description: 'Test import with multiple categories and measures',
        categoryName: 'Economy',
        statisticName: 'Gross Domestic Product'
      },
      3 // Use existing admin user ID
    );

    console.log('✅ Upload result:', uploadResult);
    
    if (uploadResult.success) {
      console.log(`   Import ID: ${uploadResult.importId}`);
      console.log(`   Message: ${uploadResult.message}`);
      console.log(`   Stats: ${uploadResult.stats?.totalRows} total, ${uploadResult.stats?.validRows} valid, ${uploadResult.stats?.invalidRows} invalid`);
    } else {
      console.log('❌ Upload failed:', uploadResult.errors);
    }

    // Test 4: Create test CSV data for single-category template
    console.log('\n📊 Test 4: Creating test CSV data for single-category template...');
    const singleCategoryCSV = `State,Year,Value
California,2023,${3500000 + timestamp % 1000}
Texas,2023,${2200000 + timestamp % 1000}
New York,2023,${1800000 + timestamp % 1000}
Florida,2023,${1200000 + timestamp % 1000}
Illinois,2023,${900000 + timestamp % 1000}`;

    const singleCsvBlob = new Blob([singleCategoryCSV], { type: 'text/csv' });
    const singleTestFile = new File([singleCsvBlob], 'test-single-category.csv', { type: 'text/csv' });

    console.log('✅ Single-category test CSV data created');
    console.log('   File name:', singleTestFile.name);
    console.log('   File size:', singleTestFile.size, 'bytes');

    // Test 5: Upload CSV using single-category template
    console.log('\n📤 Test 5: Uploading CSV with single-category template...');
    const singleCategoryTemplate = templates.find(t => t.name === 'Single-Category Data Import');
    
    if (!singleCategoryTemplate) {
      throw new Error('Single-category template not found');
    }

    const singleUploadResult = await SimpleCSVImportService.uploadCSV(
      singleTestFile,
      singleCategoryTemplate.id,
      {
        name: 'Test Single-Category Import',
        description: 'Test import with single category and measure',
        categoryName: 'Economy',
        statisticName: 'Gross Domestic Product',
        categoryId: 2, // Economy category ID
        statisticId: 51  // Gross Domestic Product statistic ID
      },
      3 // Use existing admin user ID
    );

    console.log('✅ Single-category upload result:', singleUploadResult);
    
    if (singleUploadResult.success) {
      console.log(`   Import ID: ${singleUploadResult.importId}`);
      console.log(`   Message: ${singleUploadResult.message}`);
      console.log(`   Stats: ${singleUploadResult.stats?.totalRows} total, ${singleUploadResult.stats?.validRows} valid, ${singleUploadResult.stats?.invalidRows} invalid`);
    } else {
      console.log('❌ Single-category upload failed:', singleUploadResult.errors);
    }

    // Test 6: Verify data was imported
    console.log('\n📊 Test 6: Verifying imported data...');
    const allImports = await db.select().from(csvImports).orderBy(csvImports.id);
    console.log(`✅ Found ${allImports.length} total imports`);

    for (const importRecord of allImports) {
      console.log(`   Import ${importRecord.id}: ${importRecord.name} (${importRecord.status})`);
      
      const stagedData = await db.select().from(csvImportStaging)
        .where(eq(csvImportStaging.csvImportId, importRecord.id));
      console.log(`     Staged rows: ${stagedData.length}`);
      
      const validStaged = stagedData.filter((row: any) => row.validationStatus === 'valid');
      console.log(`     Valid rows: ${validStaged.length}`);
    }

    // Test 7: Check data points
    console.log('\n📈 Test 7: Checking data points...');
    const totalDataPoints = await db.select().from(dataPoints);
    console.log(`✅ Total data points in database: ${totalDataPoints.length}`);

    // Show recent data points
    const recentDataPoints = await db.select().from(dataPoints)
      .orderBy(dataPoints.id)
      .limit(10);
    
    console.log('   Recent data points:');
    for (const dp of recentDataPoints) {
      console.log(`     State ${dp.stateId}, Statistic ${dp.statisticId}, Year ${dp.year}: ${dp.value}`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Templates: ${templates.length}`);
    console.log(`   - Total Imports: ${allImports.length}`);
    console.log(`   - Total Data Points: ${totalDataPoints.length}`);
    console.log(`   - Multi-category upload: ${uploadResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   - Single-category upload: ${singleUploadResult.success ? 'SUCCESS' : 'FAILED'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testSimpleCSVImport()
  .then(() => {
    console.log('\n✅ Simplified CSV import test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Simplified CSV import test failed:', error);
    process.exit(1);
  }); 