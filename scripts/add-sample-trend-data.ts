import { getDb } from '../src/lib/db/index';
import { dataPoints, statistics, states, importSessions } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function addSampleTrendData() {
  const db = getDb();
  console.log('📈 Adding sample trend data for 2020-2023...');

  // Create import sessions for each year
  const importSessionData = [
    { name: 'Sample 2020 Data Import', importDate: '2020-12-31', dataYear: 2020 },
    { name: 'Sample 2021 Data Import', importDate: '2021-12-31', dataYear: 2021 },
    { name: 'Sample 2022 Data Import', importDate: '2022-12-31', dataYear: 2022 },
  ];

  const importSessionIds = [];
  for (const session of importSessionData) {
    const [result] = await db.insert(importSessions).values(session).returning();
    importSessionIds.push(result.id);
  }

  // Get all statistics
  const allStatistics = await db.select().from(statistics);
  
  // Get all states
  const allStates = await db.select().from(states);

  // Generate trend data for each statistic and state
  for (const statistic of allStatistics) {
    for (const state of allStates) {
      // Generate realistic trend data with some variation
      const baseValue = Math.random() * 100 + 50; // Base value between 50-150
      const trendDirection = Math.random() > 0.5 ? 1 : -1; // Random trend direction
      const trendStrength = Math.random() * 5 + 1; // Trend strength between 1-6

      const trendData = [
        { year: 2020, value: baseValue },
        { year: 2021, value: baseValue + (trendDirection * trendStrength * 1) },
        { year: 2022, value: baseValue + (trendDirection * trendStrength * 2) },
        { year: 2023, value: baseValue + (trendDirection * trendStrength * 3) },
      ];

      // Insert data for each year
      for (let i = 0; i < 3; i++) { // 2020, 2021, 2022 (2023 already exists)
        const yearData = trendData[i];
        const importSessionId = importSessionIds[i];

        await db.insert(dataPoints).values({
          importSessionId,
          year: yearData.year,
          stateId: state.id,
          statisticId: statistic.id,
          value: Math.round(yearData.value * 100) / 100, // Round to 2 decimal places
        });
      }
    }
  }

  console.log('✅ Sample trend data added successfully!');
  console.log(`📊 Added data for ${allStatistics.length} statistics across ${allStates.length} states for years 2020-2022`);
  console.log('📈 Each statistic now has 4 years of trend data (2020-2023)');
}

// Run the script
addSampleTrendData()
  .then(() => {
    console.log('🎉 Trend data generation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error generating trend data:', error);
    process.exit(1);
  }); 