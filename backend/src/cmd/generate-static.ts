import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { PostgresAdapter } from '../internal/adapter/driven/persistence/PostgresAdapter.ts';
import type { Item } from '../internal/core/entity/Item.ts';
import type { ItemsProviderPort } from '../internal/core/port/ItemsProviderPort.ts';
import type { LlmPort } from '../internal/core/port/LlmPort.ts';
import { makeCoreAgentService } from '../internal/core/service/makeCoreAgentService.ts';

class NoopItemsProvider implements ItemsProviderPort {
  getItems(): Promise<Item[]> {
    return Promise.resolve([]);
  }
  getLabel() {
    return 'noop://static-gen';
  }
  getCreatedAt() {
    return null;
  }
}

class NoopLlm implements LlmPort {
  run(): Promise<string> {
    return Promise.reject(new Error('[generate-static] LLM not used here'));
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../../../frontend/public');

function save(filename: string, data: unknown) {
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data ?? null, null, 2), 'utf-8');
  console.log(`[generate-static] ${filename} saved.`);
}

export async function generateStatic() {
  const persistence = new PostgresAdapter();
  const agent = makeCoreAgentService(
    new NoopItemsProvider(),
    new NoopLlm(),
    persistence,
  );

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
