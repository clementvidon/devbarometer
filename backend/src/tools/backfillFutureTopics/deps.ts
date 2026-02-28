/**
 * TEMP SCRIPT
 * Backfills future topics.
 * Can violate hexagonal boundaries.
 * Do not reuse in production code.
 */

import postgres from 'postgres';

export function makeDb(databaseUrl: string) {
  return postgres(databaseUrl, {
    ssl: 'require',
    onnotice: (notice) => {
      if (notice.code === '42P07') return;
      console.warn('[postgres notice]', notice);
    },
  });
}
