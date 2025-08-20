import type { ItemsProviderPort } from '../port/ItemsProviderPort.ts';
import type { LlmPort } from '../port/LlmPort.ts';
import type { PersistencePort } from '../port/PersistencePort.ts';
import { AgentService } from './AgentService.ts';

export function makeCoreAgentService(
  itemsProvider: ItemsProviderPort,
  llm: LlmPort,
  persistence: PersistencePort,
): AgentService {
  return new AgentService(itemsProvider, llm, persistence);
}
