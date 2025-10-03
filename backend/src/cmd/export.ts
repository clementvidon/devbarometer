import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PostgresAdapter } from '../internal/adapter/driven/persistence/PostgresAdapter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const out = process.argv[2] ?? './snapshots-export.json';

  const persistence = new PostgresAdapter();
  const snapshots = await persistence.getSnapshots();

  const ordered = snapshots.sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );

  const abs = path.isAbsolute(out) ? out : path.resolve(__dirname, out);
  fs.writeFileSync(abs, JSON.stringify(ordered, null, 2), 'utf-8');
  console.log(`[export-db] wrote ${ordered.length} snapshots -> ${abs}`);

  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[export-db] failed:', err);
    process.exit(1);
  });
}
