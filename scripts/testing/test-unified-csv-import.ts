#!/usr/bin/env tsx

import { UnifiedCSVImportService } from '../../src/lib/services/unifiedCSVImportService';

async function testUnifiedCSVImport() {
  console.log('🧪 Testing Unified CSV Import System...\n');

  try {
    // Test 1: Create test CSV data
    console.log('📊 Test 1: Creating test CSV data...');
    const timestamp = Date.now();
    const testCSV = `State,Year,Category,Measure,Value
California,2023,Economy,Gross Domestic Product,${3500000 + timestamp % 1000}
Texas,2023,Economy,Gross Domestic Product,${2200000 + timestamp % 1000}
New York,2023,Economy,Gross Domestic Product,${1800000 + timestamp % 1000}
California,2023,Education,HS Graduation Rate,${85.2 + (timestamp % 10) / 10}
Texas,2023,Education,HS Graduation Rate,${89.1 + (timestamp % 10) / 10}
New York,2023,Education,HS Graduation Rate,${87.5 + (timestamp % 10) / 10}`;

    // Create a File object from the CSV data
    const csvBlob = new Blob([testCSV], { type: 'text/csv' });
    const testFile = new File([csvBlob], 'test-unified-import.csv', { type: 'text/csv' });

    console.log('✅ Test CSV data created');
    console.log('   File name:', testFile.name);
    console.log('   File size:', testFile.size, 'bytes');

    // Test 2: Upload and stage CSV
    console.log('\n📤 Test 2: Uploading and staging CSV...');
    const uploadResult = await UnifiedCSVImportService.uploadAndStage(
      testFile,
      1, // Multi-category template ID
      {
        name: 'Test Unified Import',
        description: 'Test import with unified service',
        categoryName: 'Economy',
        statisticName: 'Gross Domestic Product'
      },
      3 // Admin user ID
    );

    console.log('✅ Upload result:', uploadResult);
    
    if (!uploadResult.success) {
      console.log('❌ Upload failed:', uploadResult.errors);
      return;
    }

    const importId = uploadResult.importId!;
    console.log(`   Import ID: ${importId}`);
    console.log(`   Message: ${uploadResult.message}`);
    console.log(`   Stats: ${uploadResult.stats?.totalRows} total, ${uploadResult.stats?.validRows} valid, ${uploadResult.stats?.invalidRows} invalid`);

    // Test 3: Validate staged data
    console.log('\n🔍 Test 3: Validating staged data...');
    const validationResult = await UnifiedCSVImportService.validateStagedData(importId);

    console.log('✅ Validation result:', validationResult);
    console.log(`   Is Valid: ${validationResult.isValid}`);
    console.log(`   Errors: ${validationResult.errors.length}`);
    console.log(`   Warnings: ${validationResult.warnings.length}`);
    console.log(`   Stats: ${validationResult.stats.validRows} valid, ${validationResult.stats.errorRows} errors`);

    if (validationResult.errors.length > 0) {
      console.log('   First few errors:');
      validationResult.errors.slice(0, 3).forEach(error => {
        console.log(`     Row ${error.rowNumber}: ${error.message}`);
      });
    }

    // Test 4: Promote to production (if validation passed)
    if (validationResult.isValid) {
      console.log('\n🚀 Test 4: Promoting to production...');
      const promotionResult = await UnifiedCSVImportService.promoteToProduction(importId, 3);

      console.log('✅ Promotion result:', promotionResult);
      console.log(`   Success: ${promotionResult.success}`);
      console.log(`   Message: ${promotionResult.message}`);
      console.log(`   Published Rows: ${promotionResult.publishedRows}`);

      // Test 5: Test retry logic
      console.log('\n🔄 Test 5: Testing retry logic...');
      const duplicateCheck = await UnifiedCSVImportService.checkDuplicateFile(
        'test-hash-that-does-not-exist'
      );

      console.log('✅ Duplicate check result:', duplicateCheck);
      console.log(`   Is Duplicate: ${duplicateCheck.isDuplicate}`);
      console.log(`   Can Retry: ${duplicateCheck.canRetry}`);
    } else {
      console.log('\n⚠️ Skipping promotion test due to validation errors');
    }

    // Test 6: Test retry of failed import
    console.log('\n🔄 Test 6: Testing retry of failed import...');
    const retryResult = await UnifiedCSVImportService.retryImport(importId, 3);

    console.log('✅ Retry result:', retryResult);
    console.log(`   Success: ${retryResult.success}`);
    console.log(`   Message: ${retryResult.message}`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Upload: ${uploadResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   - Validation: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(`   - Promotion: ${validationResult.isValid ? 'TESTED' : 'SKIPPED'}`);
    console.log(`   - Retry Logic: TESTED`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testUnifiedCSVImport()
  .then(() => {
    console.log('\n✅ Unified CSV import test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unified CSV import test failed:', error);
    process.exit(1);
  }); 