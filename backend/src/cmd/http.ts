import 'dotenv/config';
import OpenAI from 'openai';
import { NodeFetchAdapter } from '../internal/adapter/driven/fetch/NodeFetchAdapter.ts';
import { RedditItemsProviderAdapter } from '../internal/adapter/driven/items/RedditItemsProviderAdapter.ts';
import { OpenAiAdapter } from '../internal/adapter/driven/llm/OpenAiAdapter.ts';
import { PostgresAdapter } from '../internal/adapter/driven/persistence/PostgresAdapter.ts';
import { makeReportController } from '../internal/adapter/driving/web/ReportController.ts';
import { makeCoreAgent } from '../internal/core/service/makeCoreAgent.ts';

import type { FetchPort } from '../internal/core/port/FetchPort.ts';
import type { LlmPort } from '../internal/core/port/LlmPort.ts';
import type { PersistencePort } from '../internal/core/port/PersistencePort.ts';

type Deps = {
  redditUrl: string;
  port: number;
  fetcher: FetchPort;
  persistence: PersistencePort;
  llm: LlmPort;
};

export function buildServer(deps: Deps) {
  const agent = makeCoreAgent(
    new RedditItemsProviderAdapter(deps.fetcher, deps.redditUrl),
    deps.llm,
    deps.persistence,
  );
  const app = makeReportController(agent);
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
    llm: new OpenAiAdapter(new OpenAI({ apiKey })),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { app, port } = buildServer(depsFromEnv());
  app.listen(port, () => console.log(`→ http://localhost:${port}`));
}
