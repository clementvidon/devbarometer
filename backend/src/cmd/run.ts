import 'dotenv/config';
import OpenAI from 'openai';
import { NodeFetchAdapter } from '../internal/adapter/driven/fetch/NodeFetchAdapter.ts';
import { OpenAiAdapter } from '../internal/adapter/driven/llm/OpenAiAdapter.ts';
import { LowdbAdapter } from '../internal/adapter/driven/persistence/LowdbAdapter.ts';
import { AgentService } from '../internal/core/service/AgentService.ts';

(async () => {
  const fetcher = new NodeFetchAdapter(globalThis.fetch);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const llm = new OpenAiAdapter(openai);

  const persistence = new LowdbAdapter();
  const agent = new AgentService(fetcher, llm, persistence);

  await agent.run('developpeurs', 100, 'week');
})().catch((err) => {
  console.error('Agent run failed:', err);
  process.exit(1);
});
