import type OpenAI from 'openai';
import type { LlmPort, LlmRunOptions } from '../../../core/port/LlmPort.ts';
import type { AgentMessage } from '../../../core/types/AgentMessage.ts';

export class OpenAiAdapter implements LlmPort {
  private readonly client: OpenAI;

  constructor(client: OpenAI) {
    this.client = client;
  }

  async run(
    model: string,
    messages: readonly AgentMessage[],
    options?: LlmRunOptions,
  ): Promise<string> {
    const res = await this.client.chat.completions.create({
      model,
      messages: [...messages],
      temperature: options?.temperature,
      max_completion_tokens: options?.maxOutputTokens,
      top_p: options?.topP,
      presence_penalty: options?.presencePenalty,
      frequency_penalty: options?.frequencyPenalty,
      stop: options?.stop,
      seed: options?.seed,
      response_format: options?.responseFormat,
      logit_bias: options?.logitBias,
    });

    const content = res.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim() === '') {
      console.error('[OpenAiAdapter] No content returned from OpenAI API');
      return '';
    }
    return content;
  }
}
