import 'dotenv/config';

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(databaseUrl, { ssl: 'require' });
const db = drizzle(client);

await migrate(db, { migrationsFolder: 'drizzle' });
await client.end();
