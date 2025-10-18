import 'dotenv/config';
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

process.on('unhandledRejection', (reason) => {
  rootLogger.error('Unhandled rejection', { error: reason });
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  rootLogger.error('Uncaught exception', { error: err });
  process.exit(1);
});

type Deps = {
  logger: LoggerPort;
  port: number;

  fetcher: FetchPort;
  persistence: PersistencePort;

  llm: LlmPort;
  redditUrl: string;
  redditCreds: RedditCredentials;
};

export function buildServer(deps: Deps) {
  const provider = new RedditItemsAdapter(
    deps.fetcher,
    deps.redditUrl,
    deps.redditCreds,
  );

  const agent = makeReportingAgentService(provider, deps.llm, deps.persistence);
  const query = makeSnapshotQueryService(deps.persistence);
  const app = makeReportController(
    deps.logger.child({ module: 'http' }),
    agent,
    query,
  );
  return { app, port: deps.port };
}

export function buildDeps(config: ReportingAgentConfig): Deps {
  const { port, databaseUrl, openaiApiKey, reddit } = config;

  return {
    logger: rootLogger,
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

export function runHttpServer() {
  const config = loadReportingAgentConfig();
  const deps = buildDeps(config);
  const { app, port } = buildServer(deps);

  const httpLogger = rootLogger.child({ module: 'http' });
  return app.listen(port, () => {
    httpLogger.info('Server listening', { port });
  });
}

const entryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;

if (import.meta.url === entryUrl) {
  try {
    runHttpServer();
  } catch (err) {
    rootLogger.error('ReportingAgentService run failed:', { error: err });
    process.exit(1);
  }
}
