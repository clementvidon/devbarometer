import 'dotenv/config';
import OpenAI from 'openai';
import { NodeFetchAdapter } from '../infrastructure/fetch/NodeFetchAdapter';
import { OpenAIAdapter } from '../infrastructure/llm/OpenAIAdapter';
import { RedditItemsAdapter } from '../infrastructure/sources/RedditItemsAdapter';
import { makeReportController } from '../interface/web/ReportController';

import type { ConfigPort } from '../application/ports/ConfigPort';
import type { FetchPort } from '../application/ports/FetchPort';
import type { LlmPort } from '../application/ports/LlmPort';
import type { PersistencePort } from '../application/ports/PersistencePort';
import { makeReportingAgent } from '../application/usecases/agent/makeReportingAgent';
import { makeSnapshotQueryService } from '../application/usecases/queries/makeSnapshotQueryService';
import { EnvConfigAdapter } from '../infrastructure/config/EnvConfigAdapter';
import { PostgresAdapter } from '../infrastructure/persistence/PostgresAdapter';
import type { RedditCredentials } from '../infrastructure/sources/redditAuth';

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

export function depsFromConfigEnv(config: ConfigPort): Deps {
  const {
    port,
    databaseUrl,
    openaiApiKey,

    redditUrl,
    redditClientId,
    redditClientSecret,
    redditUsername,
    redditPassword,
  } = config;

  if (!databaseUrl) throw new Error('Invalid databaseUrl');
  if (!openaiApiKey) throw new Error('Invalid openaiApiKey');
  if (!port) throw new Error('Invalid port');

  if (!redditUrl) throw new Error('Invalid redditUrl');
  if (!redditClientId) throw new Error('Invalid redditClientId');
  if (!redditClientSecret) throw new Error('Invalid redditClientSecret');
  if (!redditUsername) throw new Error('Invalid redditUsername');
  if (!redditPassword) throw new Error('Invalid redditPassword');

  return {
    redditUrl,
    port,
    fetcher: new NodeFetchAdapter(globalThis.fetch),
    persistence: new PostgresAdapter(databaseUrl),
    llm: new OpenAIAdapter(new OpenAI({ apiKey: openaiApiKey })),
    redditCreds: {
      clientId: redditClientId,
      clientSecret: redditClientSecret,
      username: redditUsername,
      password: redditPassword,
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = new EnvConfigAdapter();
  const { app, port } = buildServer(depsFromConfigEnv(config));
  app.listen(port, () => console.log(`→ http://localhost:${port}`));
}
