/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  roots: ['<rootDir>/src/lib/services', '<rootDir>/src/app/api', '<rootDir>/src/lib/middleware', '<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { 
      tsconfig: 'tsconfig.json',
      useESM: true 
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/lib/test-infrastructure/jest-setup.ts'],
  testTimeout: 30000,
  // Clear mocks between tests to ensure isolation
  clearMocks: true,
  // Restore mocks between tests
  restoreMocks: true,
  // Collect coverage from these directories
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/test-infrastructure/**',
    '!src/lib/test-setup.ts',
  ],
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/?(*.)+(spec|test).{ts,tsx}',
  ],
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/out/',
    '/dist/',
  ],
  // Environment variables for tests
  setupFiles: ['<rootDir>/src/lib/test-infrastructure/jest-setup.ts'],
  // Global test environment variables
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      useESM: true,
    },
  },
};