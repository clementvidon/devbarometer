import { z } from 'zod';
import { stripCodeFences } from '../../utils/stripCodeFences.ts';
import type { AverageSentiment } from '../core/entity/Sentiment.ts';
import type { SentimentReport } from '../core/entity/SentimentReport.ts';
import { WEATHER_EMOJIS } from '../core/entity/SentimentReport.ts';
import type { LlmPort } from '../core/port/LlmPort.ts';
import type { AgentMessage } from '../core/types/AgentMessage.ts';

const LLMOutputSchema = z.object({
  text: z.string().max(200),
  emoji: z.enum(WEATHER_EMOJIS),
});

const FALLBACK = {
  text: '',
  emoji: '☁️',
} satisfies SentimentReport;

function makeMessages(emotionsText: string): readonly AgentMessage[] {
  return [
    {
      role: 'system' as const,
      content: `
1. **"text"** : À partir de l'objet émotions donné, écris une **phrase courte (≤ 20 mots)** qui traduit fidèlement l’atmosphère émotionnelle.

### Instructions :

* Identifie les émotions saillantes (typiquement 2 ou 3) et ignore les autres.
* Appuie toi sur les valeurs *positive* et *negative* pour renforcer le ton (positivité, négativité, neutralité, polarité)
* N’énumère jamais les émotions. Utilise le vocabulaire météorologique pour les exprimer.
* Privilégie une formulation épurée : évite les articles si cela rend la phrase plus fluide ou symbolique.
* Ne dépasse jamais 20 mots.
* N’évoque jamais d’émotion absente ou anodine.

2. **"emoji"** : choisis un unique symbole météo parmi : ${WEATHER_EMOJIS.join(' ')} pour illustrer ce texte.

Retourne un JSON brut avec uniquement ces deux clés.
        `.trim(),
    },
    {
      role: 'user' as const,
      content: `
Voici l'objet émotion JSON :
        ${emotionsText}
        `.trim(),
    },
  ] as const satisfies readonly AgentMessage[];
}

export async function generateSentimentReport(
  averageSentiment: AverageSentiment,
  llm: LlmPort,
): Promise<SentimentReport> {
  try {
    const raw = await llm.run(
      'gpt-4o-mini',
      0.1,
      makeMessages(JSON.stringify(averageSentiment.emotions)),
    );
    const json: unknown = JSON.parse(stripCodeFences(raw));
    const parsed = LLMOutputSchema.safeParse(json);
    return parsed.success ? parsed.data : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
