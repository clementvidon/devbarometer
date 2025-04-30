import type OpenAI from 'openai';
import type { LlmPort } from '../../../core/port/LlmPort';
import type { AgentMessage } from '../../../core/types';

export class OpenAiAdapter implements LlmPort {
  constructor(private readonly client: OpenAI) {}

  async run(model: string, messages: AgentMessage[]): Promise<string> {
    const res = await this.client.chat.completions.create({
      model,
      temperature: 0.1,
      messages,
    });

    const content = res.choices?.[0]?.message?.content;
    if (content === null) {
      throw new Error('No content returned from OpenAI API');
    }
    return content;
  }
}
