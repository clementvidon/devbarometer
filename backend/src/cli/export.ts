import 'dotenv/config';
import fs from 'fs';
import { pathToFileURL } from 'node:url';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadCoreConfig } from '../infrastructure/config/loaders';
import { PostgresAdapter } from '../infrastructure/persistence/PostgresAdapter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runExport(outArg?: string) {
  const out = outArg ?? process.argv.at(2) ?? './snapshots-export.json';

  const { databaseUrl } = loadCoreConfig();
  const persistence = new PostgresAdapter(databaseUrl);
  const snapshots = await persistence.getSnapshots();

  const ordered = snapshots.sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );

  const abs = path.isAbsolute(out) ? out : path.resolve(__dirname, out);
  fs.writeFileSync(abs, JSON.stringify(ordered, null, 2), 'utf-8');
  console.log(
    `[export-db] wrote ${String(ordered.length)} snapshots -> ${abs}`,
  );
}

const entryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;

if (import.meta.url === entryUrl) {
  try {
    await runExport();
    process.exit(0);
  } catch (err) {
    console.error('[export-db] failed:', err);
    process.exit(1);
  }
}
