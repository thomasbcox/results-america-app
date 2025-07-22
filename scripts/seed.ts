import { seedDatabaseNormalized } from '../src/lib/db/seed-normalized';

async function main() {
  try {
    await seedDatabaseNormalized();
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main(); 