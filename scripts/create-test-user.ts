import { getDb } from '../src/lib/db';
import { users } from '../src/lib/db/schema-postgres';
import { eq } from 'drizzle-orm';

async function createTestUser() {
  const db = getDb();
  if (!db) {
    throw new Error('Database not available');
  }
  try {
    console.log('👤 Creating test user...');
    
    // Check if test user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'test@example.com'))
      .limit(1);
    
    if (existingUser.length > 0) {
      console.log('✅ Test user already exists with ID:', existingUser[0].id);
      return existingUser[0].id;
    }
    
    // Create test user
    const [newUser] = await db
      .insert(users)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        isActive: 1,
        emailVerified: 1,
      })
      .returning();
    
    console.log('✅ Test user created with ID:', newUser.id);
    return newUser.id;
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

createTestUser(); 