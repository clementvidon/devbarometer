import { z } from 'zod';
import pLimit from 'p-limit';
import { runLLM } from '../llm/llm';
import { stripCodeFences } from '../utils/stripCodeFences';
import type { DataPoint } from '../reddit/types';

const CONCURRENCY_LIMIT = 10;

const RelevanceSchema = z.object({
  relevant: z.boolean(),
});

const makeDataPointsMessages = (dp: DataPoint) => [
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

async function isRelevantDataPoint(dp: DataPoint): Promise<boolean> {
  try {
    const raw = await runLLM('gpt-4o-mini', makeDataPointsMessages(dp));
    // console.debug(`LLM raw output for "${dp.title}":\n`, raw);
    const cleaned = stripCodeFences(raw);
    const parsed = JSON.parse(cleaned);
    const result = RelevanceSchema.safeParse(parsed);
    if (!result.success) {
      console.error(
        `Validation failed for "${dp.title}":`,
        result.error.flatten(),
      );
      return false;
    }
    return result.data.relevant;
  } catch (error) {
    console.error(`Error at "${dp.title}":`, error);
    return false;
  }
}

export async function filterDataPoints(
  dataPoints: DataPoint[],
): Promise<DataPoint[]> {
  const limit = pLimit(CONCURRENCY_LIMIT);
  const checks = await Promise.all(
    dataPoints.map((dp) =>
      limit(async () => ({
        dp,
        isRelevant: await isRelevantDataPoint(dp),
      })),
    ),
  );
  const relevantDataPoints = checks
    .filter((c) => c.isRelevant)
    .map((c) => c.dp);
  console.log(
    `Filtered ${relevantDataPoints.length}/${dataPoints.length} relevantDataPoints.`,
  );
  return relevantDataPoints;
}
