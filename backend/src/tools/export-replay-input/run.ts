import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

type RawDbRow = {
  id: string;
  date_created: Date | string | null;
  data: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseData(value: unknown, rowIndex: number): Record<string, unknown> {
  if (isRecord(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (isRecord(parsed)) {
        return parsed;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(
        'Invalid JSON data at row ' + String(rowIndex) + ': ' + message,
      );
    }
  }

  throw new Error('Invalid JSON data at row ' + String(rowIndex));
}

function toIsoDate(value: Date | string | null, rowIndex: number): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const normalized = value.includes('T')
      ? value
      : value.replace(' ', 'T') + 'Z';
    const parsed = new Date(normalized);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  throw new Error('Invalid date_created at row ' + String(rowIndex));
}

function pickFetchedItems(data: Record<string, unknown>): unknown[] {
  if (Array.isArray(data.fetchedItems)) {
    return data.fetchedItems;
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  return [];
}

export async function runExportReplayInput(outArg?: string) {
  const outPath = outArg ?? (process.argv[2] || './tmp/replay-input.json');
  const absPath = path.isAbsolute(outPath)
    ? outPath
    : path.resolve(process.cwd(), outPath);

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL missing');
  }

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

  try {
    console.log('Replay input export start');

    const rows = await sql<RawDbRow[]>`
    select id, date_created, data
    from pipeline_snapshots
    order by date_created asc
  `;

    let missingItems = 0;

    const output = rows.map((row, rowIndex) => {
      const data = parseData(row.data, rowIndex);
      const fetchedItems = pickFetchedItems(data);

      if (fetchedItems.length === 0) {
        missingItems++;
      }

      return {
        id: row.id,
        createdAt: toIsoDate(row.date_created, rowIndex),
        fetchedItems,
      };
    });

    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, JSON.stringify(output, null, 2), 'utf-8');

    console.log('Replay input export done');
    console.log('rows=' + String(output.length));
    console.log('output=' + absPath);
    console.log('fetchedItems.missing=' + String(missingItems));
  } finally {
    await sql.end();
  }
}
