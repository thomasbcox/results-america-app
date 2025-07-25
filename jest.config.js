/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  roots: ['<rootDir>/src/lib/services', '<rootDir>/src/app/api', '<rootDir>/src/lib/middleware'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { 
      tsconfig: 'tsconfig.json',
      useESM: true 
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/lib/test-setup.ts'],
  testTimeout: 10000,
};