import { runLLM } from '../llm/llm';
import pLimit from 'p-limit';
import type { DataPoint } from '../reddit/types';

const CONCURRENCY_LIMIT = 10;

const makeDataPointsMessages = (dp: DataPoint) => [
  {
    role: 'system' as const,
    content: `
    Vous êtes un expert du marché de l'emploi des développeurs en France.
      Vous aidez à filtrer les posts Reddit pour ne garder que ceux qui apportent un éclairage pertinent sur le sentiment du marché de l'emploi tech.

      Analysez la donnée fourni dans son entièreté et répondez STRICTEMENT par un "Oui" si vous les jugez pertinentes pour analyser le sentiment actuel du marché de l'emploi tech, sinon "Non".
      Vérifiez encore une fois pour vous assurer de la pertinence de ces données pour la mesure du climat général actuel du marché de l'emploi tech. En cas de doute, répondez "Non".
      `.trim(),
  },
  {
    role: 'user' as const,
    content: `
    Analysez ces données :
    titre        : ${dp.title}
    contenu      : ${dp.content}
    meilleur com.: ${dp.topComment}
    `.trim(),
  },
];

async function isRelevantPost(dp: DataPoint): Promise<boolean> {
  const answer = await runLLM('gpt-4o-mini', makeDataPointsMessages(dp));
  return answer.trim().toLowerCase().startsWith('oui');
}

export async function filterDataPoints(
  dataPoints: DataPoint[],
): Promise<DataPoint[]> {
  const limit = pLimit(CONCURRENCY_LIMIT);
  const checks = await Promise.all(
    dataPoints.map((dp) =>
      limit(async () => ({
        dp,
        isRelevant: await isRelevantPost(dp),
      })),
    ),
  );

  const relevantDataPoints = checks
    .filter((c) => c.isRelevant)
    .map((c) => c.dp);
  console.log(
    `Filtered ${relevantDataPoints.length}/${dataPoints.length} pertinents.`,
  );
  return relevantDataPoints;
}
