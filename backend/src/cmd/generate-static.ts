import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { makeAgentService } from '../internal/core/service/makeAgentService.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../../../frontend/public');

const save = (filename: string, data: unknown) => {
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[generate-static] ${filename} saved.`);
};

try {
  const agent = makeAgentService();

  const report = await agent.getLastSentimentReport();

  save('report.json', report);
  process.exit(0);
} catch (err) {
  console.error('[generate-static] Failed to generate static JSON:', err);
  process.exit(1);
}
