import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import OpenAI from 'openai';
import type { FetchPort } from '../application/ports/output/FetchPort';
import type { LlmPort } from '../application/ports/output/LlmPort';
import type { LoggerPort } from '../application/ports/output/LoggerPort';
import type { PersistencePort } from '../application/ports/output/PersistencePort';
import { makeReportingAgentService } from '../application/usecases/agent/makeReportingAgentService';
import { makeSnapshotQueryService } from '../application/usecases/queries/makeSnapshotQueryService';
import type { ReportingAgentConfig } from '../infrastructure/config/loaders';
import { loadReportingAgentConfig } from '../infrastructure/config/loaders';
import { NodeFetchAdapter } from '../infrastructure/fetch/NodeFetchAdapter';
import type { RedditCredentials } from '../infrastructure/items/redditAuth';
import { RedditItemsAdapter } from '../infrastructure/items/RedditItemsAdapter';
import { OpenAIAdapter } from '../infrastructure/llm/OpenAIAdapter';
import { makeLogger } from '../infrastructure/logging/root';
import { PostgresAdapter } from '../infrastructure/persistence/PostgresAdapter';
import { makeReportController } from '../interface/web/ReportController';

const rootLogger = makeLogger();

type Deps = {
  logger: LoggerPort;
  port: number;
  fetcher: FetchPort;
  persistence: PersistencePort;
  llm: LlmPort;
  redditUrl: string;
  redditCreds: RedditCredentials;
};

export function buildHttpServer(deps: Deps) {
  const itemsProvider = new RedditItemsAdapter(
    deps.fetcher,
    deps.redditUrl,
    deps.redditCreds,
  );
  const agent = makeReportingAgentService(
    deps.logger.child({ scope: 'agent' }),
    itemsProvider,
    deps.llm,
    deps.persistence,
  );
  const query = makeSnapshotQueryService(deps.persistence);
  const app = makeReportController(
    deps.logger.child({ scope: 'web' }),
    agent,
    query,
  );
  return { app, port: deps.port };
}

export function buildDeps(
  logger: LoggerPort,
  config: ReportingAgentConfig,
): Deps {
  const { port, databaseUrl, openaiApiKey, reddit } = config;
  return {
    logger,
    port,
    fetcher: new NodeFetchAdapter(globalThis.fetch),
    persistence: new PostgresAdapter(databaseUrl),
    llm: new OpenAIAdapter(new OpenAI({ apiKey: openaiApiKey })),
    redditUrl: reddit.url,
    redditCreds: {
      clientId: reddit.clientId,
      clientSecret: reddit.clientSecret,
      username: reddit.username,
      password: reddit.password,
    },
  };
}

export function runHttpServer(logger: LoggerPort) {
  const webLogger = logger.child({ module: 'http' });
  const config = loadReportingAgentConfig();
  const deps = buildDeps(webLogger, config);
  const { app, port } = buildHttpServer(deps);
  return app.listen(port, () => {
    webLogger.info('Server listening', { port });
  });
}

const entryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
const isEntryPoint = import.meta.url === entryUrl;

if (isEntryPoint) {
  const logger = rootLogger.child({ cmd: 'httpServer', traceId: randomUUID() });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { error: reason });
    process.exit(1);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err });
    process.exit(1);
  });
  try {
    runHttpServer(logger);
  } catch (err) {
    logger.error('HTTP server error', { error: err });
    process.exit(1);
  }
}
