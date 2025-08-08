import pLimit from 'p-limit';
import { z } from 'zod';
import { stripCodeFences } from '../../utils/stripCodeFences.ts';
import type { Item, RelevantItem } from '../core/entity/Item.ts';
import type { LlmPort } from '../core/port/LlmPort.ts';
import type { AgentMessage } from '../core/types/AgentMessage.ts';

const CONCURRENCY = 10;
const RelevanceSchema = z.object({ relevant: z.boolean() });

function makeMessages(item: Item): readonly AgentMessage[] {
  return [
    {
      role: 'system' as const,
      content: `
Vous êtes un expert du marché de l'emploi des développeurs en France.
Vous aidez à filtrer des données de Reddit pour ne garder que celles qui apportent un éclairage pertinent sur le sentiment du marché de l'emploi tech.

Analysez cette donnée dans son entièreté et répondez STRICTEMENT en JSON brut au format : { "relevant": true } ou { "relevant": false }, aucune autre clé, texte, ou explication.
{ "relevant": true } si vous la jugez pertinente pour analyser le climat actuel du marché de l'emploi tech. Sinon, répondez { "relevant": false }.
Vérifiez encore une fois pour vous assurer de la pertinence de ces données pour la mesure du climat général actuel du marché de l'emploi tech. En cas de doute, répondez { "relevant": false }.
        `.trim(),
    },
    {
      role: 'user' as const,
      content: `
Analysez cette donnée :
titre        : ${item.title}
contenu      : ${item.content}
      `.trim(),
    },
  ] as const satisfies readonly AgentMessage[];
}

async function isRelevant(item: Item, llm: LlmPort): Promise<boolean> {
  try {
    const raw = await llm.run('gpt-4o-mini', 0.1, makeMessages(item));
    const json: unknown = JSON.parse(stripCodeFences(raw));
    const parsed = RelevanceSchema.safeParse(json);
    return parsed.success ? parsed.data.relevant : false;
  } catch {
    return false;
  }
}

export async function filterRelevantItems(
  items: Item[],
  llm: LlmPort,
): Promise<RelevantItem[]> {
  if (items.length === 0) {
    console.error('[filterRelevantItems] Received empty items array.');
    return [];
  }
  const limit = pLimit(CONCURRENCY);
  const labeledItems = await Promise.all(
    items.map((item) =>
      limit(async () => ({ item, ok: await isRelevant(item, llm) })),
    ),
  );

  const relevantItems = labeledItems.filter((r) => r.ok).map((r) => r.item);
  if (relevantItems.length === 0) {
    console.error('[filterRelevantItems] No relevant items identified.');
  }

  return relevantItems;
}
