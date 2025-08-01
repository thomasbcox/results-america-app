#!/usr/bin/env tsx

import { setupTestDatabase, seedTestData, cleanupTestDatabase, getTestDb } from '../src/lib/test-setup';
import { SimpleCSVImportService } from '../src/lib/services/simpleCSVImportService';

async function testWorkingCSVImport() {
  console.log('🧪 Testing Working CSV Import Formats...\n');

  try {
    // Setup test database
    await setupTestDatabase();
    await seedTestData();
    const db = getTestDb();

    console.log('✅ Test database setup complete');

    // Test 1: Multi-Category CSV Import
    console.log('\n📊 Test 1: Multi-Category CSV Import');
    
    const multiCategoryCSV = `State,Year,Category,Measure,Value
California,2023,Economy,Median Household Income,85000
Texas,2023,Economy,Median Household Income,72000
California,2023,Education,High School Graduation Rate,85.2
Texas,2023,Education,High School Graduation Rate,89.1`;

    const multiCategoryFile = new File([multiCategoryCSV], 'multi-category-test.csv', {
      type: 'text/csv'
    });

    const result1 = await SimpleCSVImportService.uploadCSV(
      multiCategoryFile,
      1, // Multi-Category template ID
      { description: 'Test multi-category import' },
      1 // user ID
    );

    console.log('Multi-Category Import Result:', {
      success: result1.success,
      message: result1.message,
      stats: result1.stats
    });

    // Test 2: Single-Category CSV Import
    console.log('\n📊 Test 2: Single-Category CSV Import');
    
    const singleCategoryCSV = `State,Year,Value
California,2023,85000
Texas,2023,72000
Alabama,2023,65000
Alaska,2023,78000
Arizona,2023,68000`;

    const singleCategoryFile = new File([singleCategoryCSV], 'single-category-test.csv', {
      type: 'text/csv'
    });

    const result2 = await SimpleCSVImportService.uploadCSV(
      singleCategoryFile,
      2, // Single-Category template ID
      { 
        description: 'Test single-category import',
        categoryName: 'Economy',
        statisticName: 'Median Household Income'
      },
      1 // user ID
    );

    console.log('Single-Category Import Result:', {
      success: result2.success,
      message: result2.message,
      stats: result2.stats
    });

    // Test 3: Get Templates
    console.log('\n📊 Test 3: Available Templates');
    
    const templates = await SimpleCSVImportService.getTemplates();
    console.log('Available Templates:');
    templates.forEach(template => {
      console.log(`- ${template.name}: ${template.description}`);
      console.log(`  Headers: ${template.expectedHeaders.join(', ')}`);
    });

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('✅ Multi-Category Import:', result1.success ? 'SUCCESS' : 'FAILED');
    console.log('✅ Single-Category Import:', result2.success ? 'SUCCESS' : 'FAILED');
    
    if (result1.success && result2.success) {
      console.log('\n🎉 All CSV import tests passed! The existing code can successfully load CSV files.');
    } else {
      console.log('\n❌ Some tests failed. Check the error messages above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await cleanupTestDatabase();
  }
}

// Run the test
testWorkingCSVImport().catch(console.error); 