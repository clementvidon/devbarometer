import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import OpenAI from 'openai';
import type { ReportingAgentPort } from '../application/ports/input/ReportingAgentPort';
import type { FetchPort } from '../application/ports/output/FetchPort';
import type { LlmPort } from '../application/ports/output/LlmPort';
import type { LoggerPort } from '../application/ports/output/LoggerPort';
import type { PersistencePort } from '../application/ports/output/PersistencePort';
import { makeReportingAgentService } from '../application/usecases/agent/makeReportingAgentService';
import type { ReportingAgentConfig } from '../infrastructure/config/loaders';
import { loadReportingAgentConfig } from '../infrastructure/config/loaders';
import { NodeFetchAdapter } from '../infrastructure/fetch/NodeFetchAdapter';
import type { RedditCredentials } from '../infrastructure/items/redditAuth';
import { RedditItemsAdapter } from '../infrastructure/items/RedditItemsAdapter';
import { OpenAIAdapter } from '../infrastructure/llm/OpenAIAdapter';
import { makeLogger } from '../infrastructure/logging/root';
import { PostgresAdapter } from '../infrastructure/persistence/PostgresAdapter';

const rootLogger = makeLogger();

type Deps = {
  logger: LoggerPort;
  fetcher: FetchPort;
  persistence: PersistencePort;
  llm: LlmPort;
  redditUrl: string;
  redditCreds: RedditCredentials;
};

export function buildCliAgent(deps: Deps): ReportingAgentPort {
  const itemsProvider = new RedditItemsAdapter(
    deps.logger,
    deps.fetcher,
    deps.redditUrl,
    deps.redditCreds,
  );
  return makeReportingAgentService(
    deps.logger.child({ scope: 'agent' }),
    itemsProvider,
    deps.llm,
    deps.persistence,
  );
}

export function buildDeps(
  logger: LoggerPort,
  config: ReportingAgentConfig,
): Deps {
  const { databaseUrl, openaiApiKey, reddit } = config;
  return {
    logger,
    fetcher: new NodeFetchAdapter(globalThis.fetch),
    persistence: new PostgresAdapter(databaseUrl),
    llm: new OpenAIAdapter(new OpenAI({ apiKey: openaiApiKey }), logger),
    redditUrl: reddit.url,
    redditCreds: {
      clientId: reddit.clientId,
      clientSecret: reddit.clientSecret,
      username: reddit.username,
      password: reddit.password,
    },
  };
}

export async function runCLI(logger: LoggerPort) {
  const log = logger.child({ module: 'cli' });
  const config = loadReportingAgentConfig();
  const deps = buildDeps(log, config);
  const agent = buildCliAgent(deps);
  await agent.captureSnapshot();
}

const entryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
const isEntryPoint = import.meta.url === entryUrl;

if (isEntryPoint) {
  const logger = rootLogger.child({ cmd: 'agent', traceId: randomUUID() });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { error: reason });
    process.exit(1);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err });
    process.exit(1);
  });
  try {
    await runCLI(logger);
    process.exit(0);
  } catch (err) {
    logger.error('ReportingAgentService run failed', { error: err });
    process.exit(1);
  }
}
