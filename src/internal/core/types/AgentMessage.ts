import type { Chat } from 'openai/resources';

export type AgentMessage =
  | Chat.Completions.ChatCompletionSystemMessageParam
  | Chat.Completions.ChatCompletionUserMessageParam
  | Chat.Completions.ChatCompletionAssistantMessageParam;
