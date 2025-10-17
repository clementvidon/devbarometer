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
 * Contract (interface-wide):
 * - `model` is adapter-specific; messages are read-only.
 * - Options are best-effort; unsupported fields may be ignored.
 * - Rejects on transport/API errors or invalid/empty content.
 * - Returns raw model text (no parsing).
 */
export interface LlmPort {
  /** Runs a chat completion and returns raw text; may throw on empty content. */
  run(
    model: string,
    messages: readonly LlmMessage[],
    options?: LlmRunOptions,
  ): Promise<string>;
}
