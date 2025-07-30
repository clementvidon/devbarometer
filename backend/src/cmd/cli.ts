import 'dotenv/config';
import { makeAgentService } from '../internal/core/service/makeAgentService.ts';

try {
  const agent = makeAgentService();
  await agent.updateReport();
} catch (err) {
  console.error('Agent run failed:', err);
  process.exit(1);
}
