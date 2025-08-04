#!/usr/bin/env tsx

import { getDb } from '../../src/lib/db';
import { users } from '../../src/lib/db/schema-postgres';

async function checkUsers() {
  const db = getDb();  console.log('👥 Checking users in database...');
  
  try {
    const allUsers = await db.select().from(users);
    console.log(`✅ Found ${allUsers.length} users:`);
    
    for (const user of allUsers) {
      console.log(`   - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    }
    
    if (allUsers.length === 0) {
      console.log('❌ No users found. Please create an admin user first.');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
}

checkUsers()
  .then(() => {
    console.log('✅ User check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  }); 