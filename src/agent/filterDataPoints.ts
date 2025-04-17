import { runLLM } from '../llm/llm';
import type { DataPoint } from '../reddit/types';

const makeMessages = (dp: DataPoint) => [
  {
    role: 'system' as const,
    content: `
Vous êtes un expert du marché de l'emploi des développeurs en France.
Vous aidez à filtrer les posts Reddit pour ne garder que ceux qui apportent un éclairage pertinent sur le sentiment du marché de l'emploi tech
`.trim(),
  },
  {
    role: 'user' as const,
    content: `
Je veux que tu lises ce post et que tu me dises **uniquement** “Oui” si tu le juges **pertinent** pour analyser le sentiment actuel du le marché de l'emploi tech, sinon “Non”.
Vérifie deux fois pour t'assurer que ce post est pertinent pour mesurer le climat général actuel du marché de l'emploi tech, si tu as le moindre doute, dis moi “Non”.

**Titre** : ${dp.title}

**Contenu** : ${dp.content}

**Meilleur commentaire** : ${dp.topComment}

`.trim(),
  },
];

export async function filterDataPoints(
  dataPoints: DataPoint[],
): Promise<DataPoint[]> {
  const checks = await Promise.all(
    dataPoints.map(async (dp) => {
      const answer = await runLLM('gpt-4o-mini', makeMessages(dp));
      const isRelevant = answer.trim().toLowerCase().startsWith('oui');
      return { dp, isRelevant };
    }),
  );

  const filtered = checks.filter((c) => c.isRelevant).map((c) => c.dp);
  console.log(`Filtered ${filtered.length}/${dataPoints.length} pertinents.`);
  return filtered;
}
