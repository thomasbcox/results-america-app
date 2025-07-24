#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔍 Running pre-build validation...\n');

let hasErrors = false;

// Check 1: Verify all UI component imports use lowercase filenames
console.log('1. Checking UI component import paths...');
const adminPages = [
  'src/app/admin/bootstrap/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/data/page.tsx',
  'src/app/admin/analytics/page.tsx'
];

for (const page of adminPages) {
  try {
    const content = readFileSync(page, 'utf-8');
    const incorrectImports = content.match(/@\/components\/ui\/[A-Z][a-zA-Z]*/g);
    
    if (incorrectImports) {
      console.log(`❌ ${page}: Found incorrect imports:`, incorrectImports);
      hasErrors = true;
    } else {
      console.log(`✅ ${page}: Import paths are correct`);
    }
  } catch (error) {
    console.log(`⚠️  ${page}: Could not read file`);
  }
}

// Check 2: Verify Next.js 15 dynamic route types
console.log('\n2. Checking dynamic route parameter types...');
const dynamicRoutes = [
  'src/app/api/admin/users/[id]/route.ts',
  'src/app/api/statistics/[id]/route.ts'
];

for (const route of dynamicRoutes) {
  try {
    const content = readFileSync(route, 'utf-8');
    const hasOldParamsType = content.includes('params: { id: string }');
    const hasNewParamsType = content.includes('params: Promise<{ id: string }>');
    
    if (hasOldParamsType && !hasNewParamsType) {
      console.log(`❌ ${route}: Uses old Next.js params type`);
      hasErrors = true;
    } else {
      console.log(`✅ ${route}: Uses correct Next.js 15 params type`);
    }
  } catch (error) {
    console.log(`⚠️  ${route}: Could not read file`);
  }
}

// Check 3: Verify no explicit 'any' types in production code (excluding tests)
console.log('\n3. Checking for explicit "any" types in production code...');
try {
  const result = execSync('grep -r "as any" src/app src/lib/services src/lib/db --include="*.ts" --include="*.tsx" --exclude-dir=__tests__ --exclude="*.test.ts" --exclude="*.test.tsx" | grep -v "//"', { encoding: 'utf-8' });
  if (result.trim()) {
    console.log('❌ Found explicit "any" types in production code:');
    console.log(result);
    hasErrors = true;
  } else {
    console.log('✅ No explicit "any" types found in production code');
  }
} catch (error) {
  console.log('✅ No explicit "any" types found in production code');
}

// Check 4: Verify TypeScript compilation (excluding test files)
console.log('\n4. Running TypeScript compilation check...');
try {
  // Create a temporary tsconfig that excludes test files
  const tempTsConfig = {
    extends: './tsconfig.json',
    exclude: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/__tests__/**',
      '**/test-setup.ts',
      '**/test-utils*.ts',
      '**/jest.config.js',
      '**/jest.setup.js'
    ]
  };
  
  // Write temporary config
  const fs = require('fs');
  fs.writeFileSync('./tsconfig.validate.json', JSON.stringify(tempTsConfig, null, 2));
  
  // Run TypeScript check with temporary config
  execSync('npx tsc --noEmit --project tsconfig.validate.json', { stdio: 'inherit' });
  
  // Clean up
  fs.unlinkSync('./tsconfig.validate.json');
  
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Build validation failed! Please fix the issues above before deploying.');
  process.exit(1);
} else {
  console.log('✅ Build validation passed! Ready for deployment.');
} 