#!/usr/bin/env tsx

/**
 * Vercel Build Check Script
 * 
 * This script checks for common issues that would prevent Vercel deployment
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Checking for Vercel build issues...\n');

const checks = [
  {
    name: 'TypeScript Compilation',
    command: 'npx tsc --noEmit',
    description: 'Check for TypeScript compilation errors'
  },
  {
    name: 'ESLint',
    command: 'npm run lint',
    description: 'Check for ESLint violations'
  },
  {
    name: 'Build Test',
    command: 'npm run build',
    description: 'Test the actual build process'
  }
];

let allPassed = true;

for (const check of checks) {
  console.log(`📋 ${check.name}: ${check.description}`);
  
  try {
    execSync(check.command, { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    console.log(`✅ ${check.name} passed\n`);
  } catch (error) {
    console.log(`❌ ${check.name} failed:`);
    console.log((error as any).stdout?.toString() || (error as Error).message);
    console.log('');
    allPassed = false;
  }
}

// Check for critical files
const criticalFiles = [
  'src/lib/types/database-results.ts',
  'src/lib/types/type-safety-rules.ts',
  'eslint.config.mjs'
];

console.log('📁 Checking critical type safety files:');
for (const file of criticalFiles) {
  if (existsSync(join(process.cwd(), file))) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allPassed = false;
  }
}

console.log('');

if (allPassed) {
  console.log('🎉 All checks passed! Ready for Vercel deployment.');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please fix issues before deploying.');
  process.exit(1);
}
