import 'dotenv/config';
import fs from 'fs';
import { pathToFileURL } from 'node:url';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAggregatedProfiles } from '../application/usecases/queries/getAggregatedProfiles';
import { getLastReport } from '../application/usecases/queries/getLastReport';
import { getTopHeadlines } from '../application/usecases/queries/getTopHeadlines';
import { loadCoreConfig } from '../infrastructure/config/loaders';
import { PostgresAdapter } from '../infrastructure/persistence/PostgresAdapter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../../../frontend/public');

function save(filename: string, data: unknown) {
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data ?? null, null, 2), 'utf-8');
  console.log(`[generate-static] ${filename} saved.`);
}

export async function generateStatic() {
  const { databaseUrl } = loadCoreConfig();
  const persistence = new PostgresAdapter(databaseUrl);

  const report = await getLastReport(persistence);
  const ticker = await getTopHeadlines(persistence, 5);
  const chart = await getAggregatedProfiles(persistence);

  save('report.json', report);
  save('ticker.json', ticker);
  save('chart.json', chart);
}

const entryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;

if (import.meta.url === entryUrl) {
  try {
    await generateStatic();
    process.exit(0);
  } catch (err) {
    console.error('[generate-static] Failed to generate static JSON:', err);
    process.exit(1);
  }
}
