import type { AgentMessage } from '../types/AgentMessage.ts';

export type LlmRunOptions = {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stop?: string | string[];
  seed?: number;
  responseFormat?: { type: 'text' } | { type: 'json_object' };
  logitBias?: Record<string, number>;
};

export interface LlmPort {
  run(
    model: string,
    messages: readonly AgentMessage[],
    options?: LlmRunOptions,
  ): Promise<string>;
}
