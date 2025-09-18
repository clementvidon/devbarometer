import type { Item, RelevantItem } from '../../../core/entity/Item.ts';
import type { LlmPort } from '../../../core/port/LlmPort.ts';
import type { RelevanceFilterPort } from '../../../core/port/RelevanceFilterPort.ts';

import pLimit from 'p-limit';
import { z } from 'zod';
import { stripCodeFences } from '../../../../utils/stripCodeFences.ts';
import type { AgentMessage } from '../../../core/types/AgentMessage.ts';

const CONCURRENCY = 1;
const RelevanceSchema = z.object({ relevant: z.boolean() });

function makeMessages(item: Item, prompt: string): readonly AgentMessage[] {
  return [
    {
      role: 'system' as const,
      content: prompt.trim(),
    },
    {
      role: 'user' as const,
      content: `
Data to be filtered following the given instructions:
Item title: ${item.title}
Item content: ${item.content}
      `.trim(),
    },
  ] as const satisfies readonly AgentMessage[];
}

async function isRelevant(
  item: Item,
  llm: LlmPort,
  prompt: string,
): Promise<boolean> {
  try {
    const raw = await llm.run('gpt-5-chat-latest', makeMessages(item, prompt), {
      temperature: 0.1,
      maxOutputTokens: 300,
      topP: 0.1,
      presencePenalty: 0,
      frequencyPenalty: 0.2,
      responseFormat: { type: 'json_object' },
    });

    const json: unknown = JSON.parse(stripCodeFences(raw));
    const parsed = RelevanceSchema.safeParse(json);
    return parsed.success ? parsed.data.relevant : false;
  } catch (err) {
    console.error(
      `[filterRelevantItems] Failed to check relevance for item "${item.title}"`,
      err,
    );
    return false;
  }
}

export async function filterRelevantItems(
  items: Item[],
  llm: LlmPort,
  prompt: string,
): Promise<RelevantItem[]> {
  if (items.length === 0) {
    console.error('[filterRelevantItems] Received empty items array.');
    return [];
  }
  const limit = pLimit(CONCURRENCY);
  const labeledItems = await Promise.all(
    items.map((item) =>
      limit(async () => ({ item, ok: await isRelevant(item, llm, prompt) })),
    ),
  );

  const relevantItems = labeledItems.filter((r) => r.ok).map((r) => r.item);
  if (relevantItems.length === 0) {
    console.error('[filterRelevantItems] No relevant items identified.');
  }

  return relevantItems;
}

export class PromptRelevanceFilterAdapter implements RelevanceFilterPort {
  constructor(
    private readonly llm: LlmPort,
    private readonly prompt: string,
  ) {}

  async filterItems(items: Item[]): Promise<RelevantItem[]> {
    return filterRelevantItems(items, this.llm, this.prompt);
  }
}
