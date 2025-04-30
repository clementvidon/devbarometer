import type { AgentMessage } from '../types';

export interface LlmPort {
  run(
    model: string,
    temperature: number,
    messages: AgentMessage[],
  ): Promise<string>;
}
