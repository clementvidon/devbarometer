import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { PostgresAdapter } from '../internal/adapter/driven/persistence/PostgresAdapter.ts';
import { getAggregatedProfiles } from '../internal/usecase/queries/getAggregatedProfiles.ts';
import { getLastReport } from '../internal/usecase/queries/getLastReport.ts';
import { getTopHeadlines } from '../internal/usecase/queries/getTopHeadlines.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../../../frontend/public');

function save(filename: string, data: unknown) {
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data ?? null, null, 2), 'utf-8');
  console.log(`[generate-static] ${filename} saved.`);
}

export async function generateStatic() {
  const persistence = new PostgresAdapter();

  const report = await getLastReport(persistence);
  const ticker = await getTopHeadlines(persistence, 5);
  const chart = await getAggregatedProfiles(persistence);

  save('report.json', report);
  save('ticker.json', ticker);
  save('chart.json', chart);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateStatic()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[generate-static] Failed to generate static JSON:', err);
      process.exit(1);
    });
}
