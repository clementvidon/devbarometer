import 'dotenv/config';
import OpenAI from 'openai';
import { NodeFetchAdapter } from '../internal/adapter/driven/fetch/NodeFetchAdapter';
import { RedditItemsAdapter } from '../internal/adapter/driven/items/RedditItemsAdapter';
import { OpenAIAdapter } from '../internal/adapter/driven/llm/OpenAIAdapter';
import { PostgresAdapter } from '../internal/adapter/driven/persistence/PostgresAdapter';

import { makeReportingAgent } from '../application/usecases/agent/makeReportingAgent';
import type { FetchPort } from '../internal/core/port/FetchPort';
import type { LlmPort } from '../internal/core/port/LlmPort';
import type { PersistencePort } from '../internal/core/port/PersistencePort';

type Deps = {
  redditUrl: string;
  fetcher: FetchPort;
  persistence: PersistencePort;
  llm: LlmPort;
};

export function buildCLIReportingAgent(deps: Deps) {
  const provider = new RedditItemsAdapter(deps.fetcher, deps.redditUrl);
  return makeReportingAgent(provider, deps.llm, deps.persistence);
}

export function depsFromEnv(): Deps {
  const apiKey = process.env.OPENAI_API_KEY;
  const redditUrl = process.env.REDDIT_URL;

  if (!apiKey) throw new Error('Missing llm');
  if (!redditUrl) throw new Error('Missing redditUrl');

  return {
    redditUrl,
    fetcher: new NodeFetchAdapter(globalThis.fetch),
    persistence: new PostgresAdapter(),
    llm: new OpenAIAdapter(new OpenAI({ apiKey })),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const agent = buildCLIReportingAgent(depsFromEnv());
    await agent.captureSnapshot();
    process.exit(0);
  } catch (err) {
    console.error('ReportingAgent run failed:', err);
    process.exit(1);
  }
}
