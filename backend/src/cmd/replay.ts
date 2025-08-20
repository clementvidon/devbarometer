import 'dotenv/config';
import fs from 'fs';
import OpenAI from 'openai';
import path from 'path';
import { JsonSnapshotProviderAdapter } from '../internal/adapter/driven/items/JsonSnapshotProviderAdapter.ts';
import { OpenAiAdapter } from '../internal/adapter/driven/llm/OpenAiAdapter.ts';
import { PostgresAdapter } from '../internal/adapter/driven/persistence/PostgresAdapter.ts';
import type { Item } from '../internal/core/entity/Item.ts';
import { makeCoreAgentService } from '../internal/core/service/makeCoreAgentService.ts';

type Row = {
  id?: string;
  date_created: string;
  data: { items: Item[] };
};

function usage() {
  console.log('Usage: tsx src/cmd/replay.ts <input.json>');
  process.exit(1);
}

try {
  const file = process.argv[2];
  if (!file) usage();

  const abs = path.resolve(process.cwd(), file);
  const rows = JSON.parse(fs.readFileSync(abs, 'utf-8')) as Row[];

  rows.sort((a, b) => Date.parse(a.date_created) - Date.parse(b.date_created));

  const llm = new OpenAiAdapter(
    new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }),
  );
  const persistence = new PostgresAdapter();

  let ok = 0;
  for (const r of rows) {
    const items = r.data?.items ?? [];
    if (!items.length) continue;

    const createdAtISO = new Date(r.date_created).toISOString();
    const provider = new JsonSnapshotProviderAdapter(
      items,
      `replay:${r.id ?? createdAtISO}`,
      createdAtISO,
    );
    const agent = makeCoreAgentService(provider, llm, persistence);

    await agent.updateReport();
    ok++;
  }

  console.log(`[replay] processed ${ok}/${rows.length}`);
  process.exit(0);
} catch (err) {
  console.error('[replay] failed:', err);
  process.exit(1);
}
