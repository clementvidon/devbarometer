export type AgentMessage =
  | Chat.Completions.ChatCompletionAssistantMessageParam
  | Chat.Completions.ChatCompletionUserMessageParam
  | Chat.Completions.ChatCompletionToolMessageParam;
