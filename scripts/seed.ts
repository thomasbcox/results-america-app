import { seedDatabase } from '../src/lib/db/seed';

async function main() {
  try {
    await seedDatabase();
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main(); 