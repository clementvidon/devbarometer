import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { runExportReplayInput } from './run';

/**
 * Exports normalized replay input from persisted snapshots.
 * Intended for replay and migration workflows.
 * Do not reuse in production code.
 */

const entryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
const isEntryPoint = import.meta.url === entryUrl;

if (isEntryPoint) {
  try {
    await runExportReplayInput();
    process.exit(0);
  } catch (err) {
    console.error('Replay input export failed', { error: err });
    process.exit(1);
  }
}
