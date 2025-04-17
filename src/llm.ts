import { ai } from './ai';
import type { Chat } from 'openai/resources';

type AgentMessage =
  | Chat.Completions.ChatCompletionAssistantMessageParam
  | Chat.Completions.ChatCompletionUserMessageParam
  | Chat.Completions.ChatCompletionToolMessageParam;

export const runLLM = async (model: string, message: AgentMessage) => {
  const response = await ai.chat.completions.create({
    model,
    temperature: 0.1,
    messages: [message],
  });

  return response.choices[0].message.content;
};
