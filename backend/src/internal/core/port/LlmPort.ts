import type { Chat } from 'openai/resources';

export type LlmMessage =
  | Chat.Completions.ChatCompletionSystemMessageParam
  | Chat.Completions.ChatCompletionUserMessageParam
  | Chat.Completions.ChatCompletionAssistantMessageParam;

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

/**
 * Minimal LLM interface.
 *
 * Contract:
 * - `model` must be a model identifier understood by the adapter.
 * - `messages` are treated as read-only; the adapter must not mutate them.
 * - `options` are best-effort; unsupported fields may be ignored.
 * - On transport/API errors, the Promise rejects. On valid empty content,
 *   it may resolve to an empty string (adapter-specific).
 * - Returned string is raw model output (no JSON parsing).
 */
export interface LlmPort {
  run(
    model: string,
    messages: readonly LlmMessage[],
    options?: LlmRunOptions,
  ): Promise<string>;
}
