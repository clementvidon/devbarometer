import 'dotenv/config';
import OpenAI from 'openai';
import { NodeFetchAdapter } from '../infrastructure/fetch/NodeFetchAdapter';
import { OpenAIAdapter } from '../infrastructure/llm/OpenAIAdapter';
import { RedditItemsAdapter } from '../infrastructure/sources/RedditItemsAdapter';
import { makeReportController } from '../interface/web/ReportController';

import type { FetchPort } from '../application/ports/FetchPort';
import type { LlmPort } from '../application/ports/LlmPort';
import type { PersistencePort } from '../application/ports/PersistencePort';
import { makeReportingAgent } from '../application/usecases/agent/makeReportingAgent';
import { makeReportQueryService } from '../application/usecases/queries/makeReportQueryService';
import { PostgresAdapter } from '../infrastructure/persistence/PostgresAdapter';

type Deps = {
  redditUrl: string;
  port: number;
  fetcher: FetchPort;
  persistence: PersistencePort;
  llm: LlmPort;
};

export function buildServer(deps: Deps) {
  const agent = makeReportingAgent(
    new RedditItemsAdapter(deps.fetcher, deps.redditUrl),
    deps.llm,
    deps.persistence,
  );
  const query = makeReportQueryService(deps.persistence);
  const app = makeReportController(agent, query);
  return { app, port: deps.port };
}

export function depsFromEnv(): Deps {
  const apiKey = process.env.OPENAI_API_KEY;
  const redditUrl = process.env.REDDIT_URL;
  const port = Number(process.env.PORT);

  if (!apiKey) throw new Error('Missing llm');
  if (!redditUrl) throw new Error('Missing redditUrl');
  if (!port) throw new Error('Missing/invalid port');

  return {
    redditUrl,
    port,
    fetcher: new NodeFetchAdapter(globalThis.fetch),
    persistence: new PostgresAdapter(),
    llm: new OpenAIAdapter(new OpenAI({ apiKey })),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { app, port } = buildServer(depsFromEnv());
  app.listen(port, () => console.log(`→ http://localhost:${port}`));
}
