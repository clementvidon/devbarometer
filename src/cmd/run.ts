import 'dotenv/config';
import { AgentService } from '../internal/core/service/AgentService';
import { NodeFetchAdapter } from '../internal/adapter/driven/fetch/NodeFetchAdapter';
import { OpenAiAdapter } from '../internal/adapter/driven/llm/OpenAiAdapter';

(async () => {
  const fetcher = new NodeFetchAdapter(globalThis.fetch);
  const llm = new OpenAiAdapter(process.env.OPENAI_API_KEY!);
  const agent = new AgentService(fetcher, llm);
  const report = await agent.run('developpeurs', 100, 'week');
  console.log('Done:', report);
})();
