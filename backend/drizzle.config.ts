import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/internal/adapter/driven/persistence/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} as any);
