import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { makeAgentService } from '../internal/core/service/makeAgentService.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../../../frontend/public');

export const save = (filename: string, data: unknown) => {
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[generate-static] ${filename} saved.`);
};

export async function generateStatic() {
  const agent = makeAgentService();

  const report = await agent.getLastEmotionProfileReport();
  const ticker = await agent.getLastTopHeadlines(10);
  const chart = await agent.getAggregatedEmotionProfiles();

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
