import { z } from 'zod';
import pLimit from 'p-limit';
import type { LlmPort } from '../core/port/LlmPort';
import type { Post, RelevantPost } from '../core/entity/Post';
import { stripCodeFences } from '../../utils/stripCodeFences';

const CONCURRENCY = 10;
const RelevanceSchema = z.object({ relevant: z.boolean() });

function makeMessages(post: Post) {
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
titre        : ${post.title}
contenu      : ${post.content}
meilleur com.: ${post.topComment}
      `.trim(),
    },
  ];
}

async function isRelevant(post: Post, llm: LlmPort): Promise<boolean> {
  try {
    const raw = await llm.run('gpt-4o-mini', makeMessages(post));
    const json = JSON.parse(stripCodeFences(raw));
    const result = RelevanceSchema.safeParse(json);
    return result.success && result.data.relevant;
  } catch {
    return false;
  }
}

export async function filterRelevantPosts(
  posts: Post[],
  llm: LlmPort,
): Promise<RelevantPost[]> {
  const limit = pLimit(CONCURRENCY);
  const relevantPosts = await Promise.all(
    posts.map((post) =>
      limit(async () => ({ post, ok: await isRelevant(post, llm) })),
    ),
  );
  return relevantPosts.filter((r) => r.ok).map((r) => r.post);
}
