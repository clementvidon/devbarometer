import type OpenAI from 'openai';
import type { LlmPort } from '../../../core/port/LlmPort.ts';
import type { AgentMessage } from '../../../core/types/AgentMessage.ts';

export class OpenAiAdapter implements LlmPort {
  private readonly client: OpenAI;

  constructor(client: OpenAI) {
    this.client = client;
  }

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
      console.error('[OpenAiAdapter] No content returned from OpenAI API');
      return '';
    }
    return content;
  }
}
