import 'dotenv/config';
import OpenAI from 'openai';
import { NodeFetchAdapter } from '../internal/adapter/driven/fetch/NodeFetchAdapter.ts';
import { RedditItemsProviderAdapter } from '../internal/adapter/driven/items/RedditItemsProviderAdapter.ts';
import { OpenAiAdapter } from '../internal/adapter/driven/llm/OpenAiAdapter.ts';
import { PostgresAdapter } from '../internal/adapter/driven/persistence/PostgresAdapter.ts';
import { makeCoreAgentService } from '../internal/core/service/makeCoreAgentService.ts';

try {
  const llm = new OpenAiAdapter(
    new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }),
  );
  const persistence = new PostgresAdapter();
  const fetcher = new NodeFetchAdapter(globalThis.fetch);

  const url =
    process.env.REDDIT_URL ??
    'https://oauth.reddit.com/r/developpeurs/top.json?limit=100&t=week&raw_json=1';

  const provider = new RedditItemsProviderAdapter(fetcher, url);
  const agent = makeCoreAgentService(provider, llm, persistence);

  await agent.updateReport();
  process.exit(0);
} catch (err) {
  console.error('Agent run failed:', err);
  process.exit(1);
}
