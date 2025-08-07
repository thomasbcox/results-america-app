import { ComprehensiveCSVImportService } from '../../src/lib/services/comprehensiveCSVImportService';

// Test CSV with valid data (assuming these states, categories, and statistics exist)
const validCSV = `state,category,statistic,value,year
California,Economy,GDP,3000000,2023
Texas,Economy,GDP,2500000,2023
New York,Economy,GDP,2000000,2023
Florida,Economy,GDP,1800000,2023
Illinois,Economy,GDP,1500000,2023
Ohio,Economy,GDP,1200000,2023
Pennsylvania,Economy,GDP,1100000,2023
`;

async function testValidImport() {
  console.log('🧪 Testing Valid CSV Import (All-or-Nothing)');
  console.log('============================================\n');

  try {
    const userId = 4; // Using the test user we created
    const fileName = 'valid-test-import-2.csv';
    const buffer = Buffer.from(validCSV, 'utf-8');

    console.log('📤 Starting valid import...');
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

    if (result.success && result.importId) {
      console.log('\n📋 Getting import details...');
      const details = await ComprehensiveCSVImportService.getImportDetails(result.importId);
      
      console.log('\n📝 Import Details:');
      console.log('Status:', (details.import as any)?.status || 'unknown');
      console.log('Total Logs:', details.logs.length);
      
      if (details.summary) {
        console.log('Validation Summary:', details.summary);
      }

      console.log('\n✅ Success Logs:');
      const infoLogs = details.logs.filter(log => log.logLevel === 'info');
      infoLogs.forEach(log => {
        console.log(`- ${log.message}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testValidImport(); 