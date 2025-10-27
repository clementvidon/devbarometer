import 'dotenv/config';
import fs from 'fs';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import OpenAI from 'openai';
import path from 'path';
import type { ReportingAgentPort } from '../application/ports/input/ReportingAgentPort';
import type { LlmPort } from '../application/ports/output/LlmPort';
import type { LoggerPort } from '../application/ports/output/LoggerPort';
import type { PersistencePort } from '../application/ports/output/PersistencePort';
import { makeReportingAgentService } from '../application/usecases/agent/makeReportingAgentService';
import type { Item } from '../domain/entities';
import {
  loadReplayConfig,
  type ReplayConfig,
} from '../infrastructure/config/loaders';
import { JsonSnapshotAdapter } from '../infrastructure/items/JsonSnapshotAdapter';
import { OpenAIAdapter } from '../infrastructure/llm/OpenAIAdapter';
import { makeLogger } from '../infrastructure/logging/root';
import { PostgresAdapter } from '../infrastructure/persistence/PostgresAdapter';

const rootLogger = makeLogger();

// - Dump Neon UI: { id?, date_created: "YYYY-MM-DD HH:mm:ss.SSS", data: { items: Item[] } }
// - Export Script: { id?, createdAt: "YYYY-MM-DDTHH:mm:ss.SSSZ", items: Item[] }
type RawRow = { id?: string; date_created: string; data: { items: Item[] } };
type SnapRow = { id?: string; createdAt: string; items: Item[] };
type AnyRow = RawRow | SnapRow;

const USAGE = 'Usage: tsx src/cli/replay <input.json>';

class ReplayUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReplayUsageError';
  }
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
  return 'data' in row ? row.data.items : row.items;
}

function getLabel(row: AnyRow, createdAt: string): string {
  return `replay:${row.id ?? createdAt}`;
}

type Deps = {
  logger: LoggerPort;
  persistence: PersistencePort;
  llm: LlmPort;
};

export function buildReplayAgent(
  items: Item[],
  label: string,
  createdAt: string,
  deps: Deps,
): ReportingAgentPort {
  const itemsProvider = new JsonSnapshotAdapter(items, label, createdAt);
  return makeReportingAgentService(
    deps.logger.child({ scope: 'agent' }),
    itemsProvider,
    deps.llm,
    deps.persistence,
  );
}

export function buildDeps(logger: LoggerPort, config: ReplayConfig): Deps {
  const { databaseUrl, openaiApiKey } = config;
  return {
    logger,
    persistence: new PostgresAdapter(databaseUrl),
    llm: new OpenAIAdapter(new OpenAI({ apiKey: openaiApiKey }), logger),
  };
}

export async function runReplay(logger: LoggerPort, fileArg = process.argv[2]) {
  const log = logger.child({ module: 'cli' });
  if (!fileArg) throw new ReplayUsageError(USAGE);

  const abs = path.resolve(process.cwd(), fileArg);

  let rows: AnyRow[];
  try {
    const raw = fs.readFileSync(abs, 'utf-8');
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error('Input must be a JSON array');
    }

    rows = parsed as AnyRow[];
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new ReplayUsageError(`Invalid input file "${abs}": ${msg}`);
  }

  rows.sort(
    (a, b) => Date.parse(getCreatedAtISO(a)) - Date.parse(getCreatedAtISO(b)),
  );

  const config = loadReplayConfig();
  const deps = buildDeps(log, config);

  log.info('Snapshots replay start', { input: abs });

  let ok = 0;
  for (const [rIndex, r] of rows.entries()) {
    const createdAt = getCreatedAtISO(r);
    const label = getLabel(r, createdAt);
    const items = getItems(r);

    if (!items.length) {
      log.debug('Skip empty row', {
        reason: 'no_items',
        rIndex,
        createdAt,
        label,
      });
      continue;
    }
    const agent = buildReplayAgent(items, label, createdAt, deps);
    await agent.captureSnapshot();
    ok++;
  }

  log.info('Snapshots replay done', {
    processedCount: ok,
    totalCount: rows.length,
  });
}

const entryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
const isEntryPoint = import.meta.url === entryUrl;

if (isEntryPoint) {
  const logger = rootLogger.child({ cmd: 'replay', traceId: randomUUID() });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { error: reason });
    process.exit(1);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err });
    process.exit(1);
  });
  try {
    await runReplay(logger);
    process.exit(0);
  } catch (err) {
    if (err instanceof ReplayUsageError) {
      logger.warn('Replay usage error', { message: err.message });
      process.exit(2);
    }
    logger.error('Replay failed', { error: err });
    process.exit(1);
  }
}
