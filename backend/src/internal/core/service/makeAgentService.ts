import OpenAI from 'openai';
import { NodeFetchAdapter } from '../../adapter/driven/fetch/NodeFetchAdapter.ts';
import { OpenAiAdapter } from '../../adapter/driven/llm/OpenAiAdapter.ts';
import { PostgresAdapter } from '../../adapter/driven/persistence/PostgresAdapter.ts';
import { AgentService } from './AgentService.ts';

export function makeAgentService(): AgentService {
  const fetcher = new NodeFetchAdapter(globalThis.fetch);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const llm = new OpenAiAdapter(openai);
  const persistence = new PostgresAdapter();
  const agent = new AgentService(fetcher, llm, persistence);

  return agent;
}
