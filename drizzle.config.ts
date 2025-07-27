import type { Config } from 'drizzle-kit';

// Environment-based configuration
const env = process.env.NODE_ENV || 'development';

const config: Config = {
  schema: env === 'test' ? './src/lib/db/schema.ts' : './src/lib/db/schema-postgres.ts',
  out: './drizzle',
  dialect: env === 'test' ? 'sqlite' : 'postgresql',
  dbCredentials: env === 'test' 
    ? { url: ':memory:' }
    : { url: process.env.DATABASE_URL || process.env.DEV_DATABASE_URL || '' },
  verbose: true,
  strict: true,
};

export default config; 