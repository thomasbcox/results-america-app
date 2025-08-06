import { getDb } from '../src/lib/db/index';
import { statistics } from '../src/lib/db/schema-postgres';
import { eq, like, or } from 'drizzle-orm';

async function runMigration() {
  console.log('🔄 Running preference direction migration...');
  
  const db = getDb();
  if (!db) {
    console.error('❌ Database connection failed');
    return;
  }

  try {
    // Update existing statistics with appropriate preference directions
    console.log('📊 Updating statistics with preference directions...');
    
    // Higher is better for positive metrics
    const higherMetrics = await db.update(statistics)
      .set({ preferenceDirection: 'higher' })
      .where(
        or(
          like(statistics.name, '%employment%'),
          like(statistics.name, '%graduation%'),
          like(statistics.name, '%literacy%'),
          like(statistics.name, '%life expectancy%'),
          like(statistics.name, '%income%'),
          like(statistics.name, '%gdp%'),
          like(statistics.name, '%growth%'),
          like(statistics.name, '%access%'),
          like(statistics.name, '%coverage%')
        )
      );
    
    console.log('✅ Updated higher preference metrics');

    // Lower is better for negative metrics
    const lowerMetrics = await db.update(statistics)
      .set({ preferenceDirection: 'lower' })
      .where(
        or(
          like(statistics.name, '%unemployment%'),
          like(statistics.name, '%crime%'),
          like(statistics.name, '%poverty%'),
          like(statistics.name, '%dropout%'),
          like(statistics.name, '%mortality%'),
          like(statistics.name, '%death%'),
          like(statistics.name, '%injury%'),
          like(statistics.name, '%deficit%'),
          like(statistics.name, '%debt%')
        )
      );
    
    console.log('✅ Updated lower preference metrics');

    // Neutral for descriptive metrics
    const neutralMetrics = await db.update(statistics)
      .set({ preferenceDirection: 'neutral' })
      .where(
        or(
          like(statistics.name, '%population%'),
          like(statistics.name, '%area%'),
          like(statistics.name, '%temperature%'),
          like(statistics.name, '%density%'),
          like(statistics.name, '%ratio%')
        )
      );
    
    console.log('✅ Updated neutral preference metrics');

    // Verify the migration
    const allStats = await db.select({
      id: statistics.id,
      name: statistics.name,
      preferenceDirection: statistics.preferenceDirection
    }).from(statistics);

    console.log('\n📋 Migration Summary:');
    console.log(`Total statistics: ${allStats.length}`);
    
    const higherCount = allStats.filter(s => s.preferenceDirection === 'higher').length;
    const lowerCount = allStats.filter(s => s.preferenceDirection === 'lower').length;
    const neutralCount = allStats.filter(s => s.preferenceDirection === 'neutral').length;
    
    console.log(`Higher preference: ${higherCount}`);
    console.log(`Lower preference: ${lowerCount}`);
    console.log(`Neutral preference: ${neutralCount}`);

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
runMigration().catch(console.error); 