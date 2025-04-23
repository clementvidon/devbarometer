import type { AgentMessage } from '../types';

export interface LlmPort {
  run(model: string, messages: AgentMessage[]): Promise<string>;
}
