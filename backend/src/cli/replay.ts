import 'dotenv/config';

import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

import { IsoDateStringSchema } from '@masswhisper/shared/primitives';
import fs from 'fs';
import OpenAI from 'openai';
import path from 'path';
import { z } from 'zod';

import type { ReportingAgentPort } from '../application/ports/input/ReportingAgentPort';
import type { LlmPort } from '../application/ports/output/LlmPort';
import type { LoggerPort } from '../application/ports/output/LoggerPort';
import type { PersistencePort } from '../application/ports/output/PersistencePort';
import { makeReportingAgentService } from '../application/usecases/agent/makeReportingAgentService';
import { type Item, ItemSchema } from '../domain/entities';
import {
  loadReplayConfig,
  type ReplayConfig,
} from '../infrastructure/config/loaders';
import { JsonSnapshotAdapter } from '../infrastructure/items/JsonSnapshotAdapter';
import { OpenAIAdapter } from '../infrastructure/llm/OpenAIAdapter';
import { makeLogger } from '../infrastructure/logging/root';
import { PostgresAdapter } from '../infrastructure/persistence/PostgresAdapter';

const rootLogger = makeLogger();

const ReplayExportRowSchema = z.object({
  id: z.string().optional(),
  createdAt: IsoDateStringSchema,
  fetchedItems: z.array(ItemSchema),
});

// Replay only accepts the normalized export shape:
// { id?, createdAt, fetchedItems }
const ReplayInputSchema = z.array(ReplayExportRowSchema);
type SnapRow = z.infer<typeof ReplayExportRowSchema>;

const USAGE = 'Usage: tsx src/cli/replay.ts <input.json>';

class ReplayUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReplayUsageError';
  }
}

function getCreatedAtISO(row: SnapRow): string {
  return row.createdAt;
}

function formatReplayValidationIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 20)
    .map((issue) => {
      const pathLabel = issue.path
        .map((segment) =>
          typeof segment === 'number' ? '[' + String(segment) + ']' : segment,
        )
        .join('.')
        .replace('.[', '[');

      return pathLabel + ': ' + issue.message;
    })
    .join(' | ');
}

type Deps = {
  logger: LoggerPort;
  persistence: PersistencePort;
  llm: LlmPort;
};

export function buildReplayAgent(
  items: Item[],
  createdAt: string,
  deps: Deps,
): ReportingAgentPort {
  const itemsProvider = new JsonSnapshotAdapter(items, createdAt);
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

  let rows: SnapRow[];
  try {
    const raw = fs.readFileSync(abs, 'utf-8');
    const parsed: unknown = JSON.parse(raw);

    const result = ReplayInputSchema.safeParse(parsed);

    if (!result.success) {
      throw new Error(
        'Replay input validation failed: ' +
          formatReplayValidationIssues(result.error),
      );
    }

    rows = result.data;
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
    const items = r.fetchedItems;

    if (!items.length) {
      log.debug('Skip empty row', {
        reason: 'no_items',
        rIndex,
        createdAt,
      });
      continue;
    }

    const agent = buildReplayAgent(items, createdAt, deps);
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
