import 'dotenv/config';

import { pathToFileURL } from 'node:url';

import { runCalibration } from './run';

const entryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
const isEntryPoint = import.meta.url === entryUrl;

if (isEntryPoint) {
  try {
    await runCalibration();
    process.exit(0);
  } catch (err) {
    console.error('Replay input export failed', { error: err });
    process.exit(1);
  }
}
