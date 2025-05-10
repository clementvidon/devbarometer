import type { AgentMessage } from '../types/AgentMessage.ts';

export interface LlmPort {
  run(
    _model: string,
    _temperature: number,
    _messages: readonly AgentMessage[],
  ): Promise<string>;
}
