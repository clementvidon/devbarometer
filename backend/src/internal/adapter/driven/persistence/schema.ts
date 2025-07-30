import { jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

export const snapshotsTable = pgTable('pipeline_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  date_created: timestamp('date_created').defaultNow(),
  data: jsonb('data'),
});
