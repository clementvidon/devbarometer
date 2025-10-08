import pLimit from 'p-limit';
import type { EmotionProfile, WeightedItem } from '../../../domain/entities';
import type { LlmPort } from '../../ports/LlmPort';
import { makeEmotionMessages, makeTonalityMessages } from './messages';
import { parseEmotionRaw } from './parseEmotion';
import { parseTonalityRaw } from './parseTonality';
import {
  CONCURRENCY,
  DEFAULT_LLM_OPTIONS,
  FALLBACK_EMOTIONS,
  FALLBACK_TONALITIES,
} from './policy';
import { emotionProfilePrompt, tonalityProfilePrompt } from './prompts';

export interface CreateProfilesOptions {
  /** Prompt système pour l’analyse des émotions */
  emotionPrompt: string;
  /** Prompt système pour l’évaluation de la tonalité */
  tonalityPrompt: string;
  /** Concurrence p-limit pour les appels LLM */
  concurrency: number;
  /** Options LLM finales (incluant le modèle) */
  llmOptions: typeof DEFAULT_LLM_OPTIONS;
}

export const DEFAULT_CREATE_PROFILES_OPTIONS = {
  emotionPrompt: emotionProfilePrompt,
  tonalityPrompt: tonalityProfilePrompt,
  concurrency: CONCURRENCY,
  llmOptions: DEFAULT_LLM_OPTIONS,
} as const satisfies CreateProfilesOptions;

function mergeProfilesOptions(
  opts: Partial<CreateProfilesOptions> = {},
): CreateProfilesOptions {
  return { ...DEFAULT_CREATE_PROFILES_OPTIONS, ...opts };
}

export async function createProfiles(
  items: WeightedItem[],
  llm: LlmPort,
  opts: Partial<CreateProfilesOptions> = {},
): Promise<EmotionProfile[]> {
  if (items.length === 0) {
    console.error('[createProfiles] Received empty items array.');
    return [];
  }

  const { emotionPrompt, tonalityPrompt, concurrency, llmOptions } =
    mergeProfilesOptions(opts);

  const limit = pLimit(concurrency);
  const { model, ...runOpts } = llmOptions;

  const jobs = items.map((item) =>
    limit(async (): Promise<EmotionProfile> => {
      try {
        const [rawEmotion, rawTonality] = await Promise.all([
          llm.run(model, makeEmotionMessages(item, emotionPrompt), runOpts),
          llm.run(model, makeTonalityMessages(item, tonalityPrompt), runOpts),
        ]);

        const emotions = parseEmotionRaw(String(rawEmotion));
        const tonalities = parseTonalityRaw(String(rawTonality));
        const hasFailed =
          emotions === FALLBACK_EMOTIONS || tonalities === FALLBACK_TONALITIES;

        if (hasFailed) {
          console.error(`[createProfiles] LLM fallback for ${item.source}`);
        }

        return {
          title: item.title,
          source: item.source,
          weight: hasFailed ? 0 : (item.weight ?? 0),
          emotions,
          tonalities,
        };
      } catch (err) {
        console.error(`[createProfiles] Error for ${item.source}`, err);
        return {
          title: item.title,
          source: item.source,
          weight: 0,
          emotions: FALLBACK_EMOTIONS,
          tonalities: FALLBACK_TONALITIES,
        };
      }
    }),
  );

  return Promise.all(jobs);
}
