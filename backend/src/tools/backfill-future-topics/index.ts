import 'dotenv/config';

import { pathToFileURL } from 'node:url';

import { runBackfillFutureTopics } from './run';

/**
 * TEMP SCRIPT
 * Backfills future topics.
 * Can violate hexagonal boundaries.
 * Do not reuse in production code.
 */

const entryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
const isEntryPoint = import.meta.url === entryUrl;

if (isEntryPoint) {
  try {
    await runBackfillFutureTopics();
    process.exit(0);
  } catch (err) {
    console.error('Backfill failed', { error: err });
    process.exit(1);
  }
}
