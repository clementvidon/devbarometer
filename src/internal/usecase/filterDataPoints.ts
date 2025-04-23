import { z } from 'zod';
import pLimit from 'p-limit';
import type { LlmPort } from '../core/port/LlmPort';
import type { DataPoint } from '../core/entity/DataPoint';
import { stripCodeFences } from '../../utils/stripCodeFences';

const CONCURRENCY = 10;
const RelevanceSchema = z.object({ relevant: z.boolean() });

function makeMessages(dp: DataPoint) {
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
        titre        : ${dp.title}
      contenu      : ${dp.content}
      meilleur com.: ${dp.topComment}
      `.trim(),
    },
  ];
}

async function isRelevant(dp: DataPoint, llm: LlmPort): Promise<boolean> {
  try {
    const raw = await llm.run('gpt-4o-mini', makeMessages(dp));
    const json = JSON.parse(stripCodeFences(raw));
    const result = RelevanceSchema.safeParse(json);
    return result.success && result.data.relevant;
  } catch {
    return false;
  }
}

export async function filterDataPoints(
  dataPoints: DataPoint[],
  llm: LlmPort,
): Promise<DataPoint[]> {
  const limit = pLimit(CONCURRENCY);
  const checks = await Promise.all(
    dataPoints.map((dp) =>
      limit(async () => ({ dp, ok: await isRelevant(dp, llm) })),
    ),
  );
  return checks.filter((c) => c.ok).map((c) => c.dp);
}
