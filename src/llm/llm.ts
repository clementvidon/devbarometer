import { ai } from './ai';
import type { AgentMessage } from './types';

export const runLLM = async (
  model: string,
  messages: AgentMessage[],
): Promise<string> => {
  const response = await ai.chat.completions.create({
    model,
    temperature: 0.1,
    messages,
  });

  return response.choices[0].message.content;
};
