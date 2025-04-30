import type OpenAI from 'openai';
import type { LlmPort } from '../../../core/port/LlmPort';
import type { AgentMessage } from '../../../core/types';

export class OpenAiAdapter implements LlmPort {
  constructor(private readonly client: OpenAI) {}

  async run(
    model: string,
    temperature: number,
    messages: readonly AgentMessage[],
  ): Promise<string> {
    const res = await this.client.chat.completions.create({
      model,
      temperature,
      messages: [...messages],
    });

    const content = res.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim() === '') {
      console.warn('[OpenAiAdapter] No content returned from OpenAI API');
      return '';
    }
    return content;
  }
}
