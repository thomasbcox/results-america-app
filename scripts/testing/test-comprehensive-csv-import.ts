import { ComprehensiveCSVImportService } from '../../src/lib/services/comprehensiveCSVImportService';

// Test CSV with various validation errors
const testCSV = `state,category,statistic,value,year
California,Economy,GDP,3000000,2023
Texas,Economy,GDP,2500000,2023
InvalidState,Economy,GDP,1000000,2023
New York,Economy,GDP,-500000,2023
Florida,Economy,GDP,2000000,2035
California,Economy,GDP,3000000,2023
California,InvalidCategory,GDP,1500000,2023
California,Economy,InvalidStatistic,1200000,2023
California,Economy,GDP,abc,2023
California,Economy,GDP,1800000,abc
California,Economy,GDP,,2023
California,,GDP,2000000,2023
,InvalidCategory,GDP,900000,2023
`;

async function testComprehensiveImport() {
  console.log('🧪 Testing Comprehensive CSV Import System');
  console.log('==========================================\n');

  try {
    // Test with a user ID (you might need to create a test user first)
    const userId = 4; // Using the test user we just created
    const fileName = 'test-import.csv';
    const buffer = Buffer.from(testCSV, 'utf-8');

    console.log('📤 Starting import...');
    const result = await ComprehensiveCSVImportService.importCSV(
      userId,
      fileName,
      buffer
    );

    console.log('\n📊 Import Result:');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    console.log('Import ID:', result.importId);
    console.log('Stats:', result.stats);
    
    if (result.summary) {
      console.log('Summary:', result.summary);
    }

    if (!result.success && result.importId) {
      console.log('\n📋 Getting import details...');
      const details = await ComprehensiveCSVImportService.getImportDetails(result.importId);
      
      console.log('\n📝 Import Details:');
      console.log('Status:', details.import.status);
      console.log('Total Logs:', details.logs.length);
      
      if (details.summary) {
        console.log('Validation Summary:', details.summary);
      }

      console.log('\n🚨 Validation Errors:');
      const validationErrors = details.logs.filter(log => log.logLevel === 'validation_error');
      validationErrors.forEach(error => {
        console.log(`Row ${error.rowNumber}: ${error.message}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testComprehensiveImport(); 