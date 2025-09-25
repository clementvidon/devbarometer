import 'dotenv/config';
import OpenAI from 'openai';
import { NodeFetchAdapter } from '../internal/adapter/driven/fetch/NodeFetchAdapter.ts';
import { RedditItemsAdapter } from '../internal/adapter/driven/items/RedditItemsAdapter.ts';
import { OpenAIAdapter } from '../internal/adapter/driven/llm/OpenAIAdapter.ts';
import { PostgresAdapter } from '../internal/adapter/driven/persistence/PostgresAdapter.ts';

import type { FetchPort } from '../internal/core/port/FetchPort.ts';
import type { LlmPort } from '../internal/core/port/LlmPort.ts';
import type { PersistencePort } from '../internal/core/port/PersistencePort.ts';
import { makeAgent } from '../internal/usecase/agent/makeAgent.ts';

type Deps = {
  redditUrl: string;
  fetcher: FetchPort;
  persistence: PersistencePort;
  llm: LlmPort;
};

export function buildCLIAgent(deps: Deps) {
  const provider = new RedditItemsAdapter(deps.fetcher, deps.redditUrl);
  return makeAgent(provider, deps.llm, deps.persistence);
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
    const agent = buildCLIAgent(depsFromEnv());
    await agent.captureSnapshot();
    process.exit(0);
  } catch (err) {
    console.error('Agent run failed:', err);
    process.exit(1);
  }
}
