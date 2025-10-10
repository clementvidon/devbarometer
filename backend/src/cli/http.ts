import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import OpenAI from 'openai';
import type { FetchPort } from '../application/ports/FetchPort';
import type { LlmPort } from '../application/ports/LlmPort';
import type { PersistencePort } from '../application/ports/PersistencePort';
import { makeReportingAgent } from '../application/usecases/agent/makeReportingAgent';
import { makeSnapshotQueryService } from '../application/usecases/queries/makeSnapshotQueryService';
import type { ReportingAgentConfig } from '../infrastructure/config/loaders';
import { loadReportingAgentConfig } from '../infrastructure/config/loaders';
import { NodeFetchAdapter } from '../infrastructure/fetch/NodeFetchAdapter';
import type { RedditCredentials } from '../infrastructure/items/redditAuth';
import { RedditItemsAdapter } from '../infrastructure/items/RedditItemsAdapter';
import { OpenAIAdapter } from '../infrastructure/llm/OpenAIAdapter';
import { PostgresAdapter } from '../infrastructure/persistence/PostgresAdapter';
import { makeReportController } from '../interface/web/ReportController';

type Deps = {
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

  const agent = makeReportingAgent(provider, deps.llm, deps.persistence);
  const query = makeSnapshotQueryService(deps.persistence);
  const app = makeReportController(agent, query);
  return { app, port: deps.port };
}

export function depsFromConfig(config: ReportingAgentConfig): Deps {
  const { port, databaseUrl, openaiApiKey, reddit } = config;

  return {
    redditUrl: reddit.url,
    port,
    fetcher: new NodeFetchAdapter(globalThis.fetch),
    persistence: new PostgresAdapter(databaseUrl),
    llm: new OpenAIAdapter(new OpenAI({ apiKey: openaiApiKey })),
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
  const { app, port } = buildServer(depsFromConfig(config));

  return app.listen(port, () => {
    console.log(`→ http://localhost:${port}`);
  });
}

const entryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;

if (import.meta.url === entryUrl) {
  try {
    runHttpServer();
  } catch (err) {
    console.error('ReportingAgent run failed:', err);
    process.exit(1);
  }
}
