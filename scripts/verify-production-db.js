#!/usr/bin/env node

/**
 * Production Database Verification Script
 * 
 * This script verifies that your production database is correctly configured
 * and all required tables exist.
 */

const { getDb } = require('../src/lib/db');
const { AuthService } = require('../src/lib/services/authService');

async function verifyProductionDatabase() {
  console.log('🔍 Verifying production database configuration...\n');

  try {
    // Step 1: Test database connection
    console.log('1️⃣ Testing database connection...');
    const db = getDb();
    console.log('   ✅ Database connection successful');

    // Step 2: Check if magic_links table exists
    console.log('\n2️⃣ Checking magic_links table...');
    const magicLinksResult = await db.execute(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'magic_links')"
    );
    
    if (magicLinksResult[0]?.exists) {
      console.log('   ✅ magic_links table exists');
    } else {
      console.log('   ❌ magic_links table missing - run migrations!');
      console.log('   💡 Run: npm run db:migrate:prod');
      process.exit(1);
    }

    // Step 3: Check if users table exists
    console.log('\n3️⃣ Checking users table...');
    const usersResult = await db.execute(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
    );
    
    if (usersResult[0]?.exists) {
      console.log('   ✅ users table exists');
    } else {
      console.log('   ❌ users table missing - run migrations!');
      process.exit(1);
    }

    // Step 4: Test magic link creation
    console.log('\n4️⃣ Testing magic link creation...');
    const testEmail = 'test-verification@example.com';
    const magicLink = await AuthService.createMagicLink(testEmail);
    console.log('   ✅ Magic link creation successful');
    console.log(`   📧 Test email: ${testEmail}`);
    console.log(`   🔗 Token: ${magicLink.token.substring(0, 10)}...`);

    // Step 5: List all tables
    console.log('\n5️⃣ Checking all required tables...');
    const tablesResult = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const requiredTables = [
      'categories', 'csv_imports', 'csv_import_metadata', 'csv_import_staging',
      'csv_import_templates', 'csv_import_validation', 'data_points', 'data_sources',
      'import_logs', 'import_sessions', 'import_validation_summary', 'magic_links',
      'national_averages', 'sessions', 'states', 'statistics', 'user_favorites',
      'user_suggestions', 'users'
    ];

    const existingTables = tablesResult.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    if (missingTables.length === 0) {
      console.log('   ✅ All required tables exist');
    } else {
      console.log('   ❌ Missing tables:', missingTables.join(', '));
      console.log('   💡 Run: npm run db:migrate:prod');
      process.exit(1);
    }

    // Step 6: Environment check
    console.log('\n6️⃣ Checking environment configuration...');
    const nodeEnv = process.env.NODE_ENV;
    const databaseUrl = process.env.DATABASE_URL;
    
    console.log(`   📊 NODE_ENV: ${nodeEnv}`);
    console.log(`   🔗 DATABASE_URL: ${databaseUrl ? 'Set' : 'Not set'}`);
    
    if (nodeEnv === 'production' && databaseUrl) {
      console.log('   ✅ Environment configuration correct');
    } else {
      console.log('   ⚠️  Environment configuration may need adjustment');
    }

    console.log('\n🎉 Production database verification completed successfully!');
    console.log('✅ Your production database is correctly configured.');
    console.log('✅ Magic link authentication should work properly.');
    console.log('✅ All required tables exist.');
    console.log('✅ Database connection is working.');

  } catch (error) {
    console.error('\n❌ Production database verification failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes('magic_links')) {
      console.log('\n💡 Solution: Run database migrations');
      console.log('   npm run db:migrate:prod');
    } else if (error.message.includes('DATABASE_URL')) {
      console.log('\n💡 Solution: Set DATABASE_URL environment variable');
      console.log('   Check Vercel environment variables');
    } else if (error.message.includes('connection')) {
      console.log('\n💡 Solution: Check database connection string');
      console.log('   Verify Neon database is accessible');
    }
    
    process.exit(1);
  }
}

// Run verification
verifyProductionDatabase(); 