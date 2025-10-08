import 'dotenv/config';
import fs from 'fs';
import OpenAI from 'openai';
import path from 'path';
import { makeReportingAgent } from '../application/usecases/agent/makeReportingAgent';
import type { Item } from '../domain/entities';
import { JsonSnapshotAdapter } from '../infrastructure/items/JsonSnapshotAdapter';
import { OpenAIAdapter } from '../infrastructure/llm/OpenAIAdapter';
import { PostgresAdapter } from '../infrastructure/persistence/PostgresAdapter';

// - Dump Neon UI: { id?, date_created: "YYYY-MM-DD HH:mm:ss.SSS", data: { items: Item[] } }
// - Export Script: { id?, createdAt: "YYYY-MM-DDTHH:mm:ss.SSSZ", items: Item[] }
type RawRow = { id?: string; date_created: string; data: { items: Item[] } };
type SnapRow = { id?: string; createdAt: string; items: Item[] };
type AnyRow = RawRow | SnapRow;

function usage() {
  console.log('Usage: tsx src/cmd/replay <input.json>');
  process.exit(1);
}

function toISO(s: string): string {
  const looksISO = s.includes('T') || /z$/i.test(s);
  const normalized = looksISO ? s : s.replace(' ', 'T') + 'Z';
  return new Date(normalized).toISOString();
}

function getCreatedAtISO(row: AnyRow): string {
  return 'date_created' in row ? toISO(row.date_created) : toISO(row.createdAt);
}

function getItems(row: AnyRow): Item[] {
  return 'data' in row ? (row.data?.items ?? []) : (row.items ?? []);
}

function getLabel(row: AnyRow, createdAtISO: string): string {
  return `replay:${row.id ?? createdAtISO}`;
}

try {
  const file = process.argv[2];
  if (!file) usage();

  const abs = path.resolve(process.cwd(), file);
  const rows = JSON.parse(fs.readFileSync(abs, 'utf-8')) as AnyRow[];

  rows.sort(
    (a, b) => Date.parse(getCreatedAtISO(a)) - Date.parse(getCreatedAtISO(b)),
  );

  const llm = new OpenAIAdapter(
    new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }),
  );
  const persistence = new PostgresAdapter();

  let ok = 0;
  for (const r of rows) {
    const items = getItems(r);
    if (!items.length) continue;

    const createdAtISO = getCreatedAtISO(r);
    const provider = new JsonSnapshotAdapter(
      items,
      getLabel(r, createdAtISO),
      createdAtISO,
    );
    const agent = makeReportingAgent(provider, llm, persistence);

    await agent.captureSnapshot();
    ok++;
  }

  console.log(`[replay] processed ${ok}/${rows.length}`);
  process.exit(0);
} catch (err) {
  console.error('[replay] failed:', err);
  process.exit(1);
}
