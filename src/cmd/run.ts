import 'dotenv/config';
import { AgentService } from '../internal/core/service/AgentService';
import { NodeFetchAdapter } from '../internal/adapter/driven/fetch/NodeFetchAdapter';
import { OpenAiAdapter } from '../internal/adapter/driven/llm/OpenAiAdapter';
import { LowdbAdapter } from '../internal/adapter/driven/persistence/LowdbAdapter';

(async () => {
  const fetcher = new NodeFetchAdapter(globalThis.fetch);
  const llm = new OpenAiAdapter(process.env.OPENAI_API_KEY!);
  const persistence = new LowdbAdapter();

  const agent = new AgentService(fetcher, llm, persistence);

  const report = await agent.run('developpeurs', 100, 'week');
  console.log(report);
})().catch((err) => {
  console.error('Agent run failed:', err);
  process.exit(1);
});
