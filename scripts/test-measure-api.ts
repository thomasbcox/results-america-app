#!/usr/bin/env tsx

async function testMeasureAPI() {
  console.log('🧪 Testing Measure API Endpoint...\n');

  try {
    // Test multiple measures to see different units
    const measureIds = [1, 2, 3, 4, 5, 6];
    
    for (const id of measureIds) {
      console.log(`\n📊 Testing Measure ID ${id}:`);
      
      const response = await fetch(`http://localhost:3050/api/statistics/${id}`);
      
      if (!response.ok) {
        console.log(`   ❌ Failed to fetch measure ${id}: ${response.status} ${response.statusText}`);
        continue;
      }

      const result = await response.json();

      if (result.success && result.name) {
        const measure = result;
        console.log(`   ✅ Name: ${measure.name}`);
        console.log(`   📏 Unit: ${measure.unit}`);
        console.log(`   📝 Display: "${measure.name} (${measure.unit})"`);
      } else {
        console.log(`   ❌ Invalid response format for measure ${id}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n💡 Make sure the development server is running on port 3050');
  }
}

// Run the test
testMeasureAPI().catch(console.error); 