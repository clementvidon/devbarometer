import 'dotenv/config';
import OpenAI from 'openai';
import { NodeFetchAdapter } from '../internal/adapter/driven/fetch/NodeFetchAdapter.ts';
import { RedditItemsProviderAdapter } from '../internal/adapter/driven/items/RedditItemsProviderAdapter.ts';
import { OpenAiAdapter } from '../internal/adapter/driven/llm/OpenAiAdapter.ts';
import { PostgresAdapter } from '../internal/adapter/driven/persistence/PostgresAdapter.ts';
import { makeCoreAgentService } from '../internal/core/service/makeCoreAgentService.ts';

import type { FetchPort } from '../internal/core/port/FetchPort.ts';
import type { LlmPort } from '../internal/core/port/LlmPort.ts';
import type { PersistencePort } from '../internal/core/port/PersistencePort.ts';

type Deps = {
  redditUrl: string;
  fetcher: FetchPort;
  persistence: PersistencePort;
  llm: LlmPort;
};

export function buildAgent(deps: Deps) {
  const provider = new RedditItemsProviderAdapter(deps.fetcher, deps.redditUrl);
  return makeCoreAgentService(provider, deps.llm, deps.persistence);
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
    llm: new OpenAiAdapter(new OpenAI({ apiKey })),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const agent = buildAgent(depsFromEnv());
    await agent.updateReport();
    process.exit(0);
  } catch (err) {
    console.error('Agent run failed:', err);
    process.exit(1);
  }
}
