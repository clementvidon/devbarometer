import pLimit from 'p-limit';
import type { EmotionProfile, WeightedItem } from '../../../domain/entities';
import type { LlmPort, LlmRunOptions } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { makeProfileMessages } from './llmMessages';
import { parseEmotionRaw } from './parseEmotion';
import { parseTonalityRaw } from './parseTonality';
import {
  CONCURRENCY,
  FALLBACK_EMOTIONS,
  FALLBACK_TONALITIES,
  PROFILES_LLM_OPTIONS,
} from './policy';
import { emotionProfilePrompt, tonalityProfilePrompt } from './prompts';

interface CreateProfilesOptions {
  /** System prompt to evaluate emotions */
  emotionPrompt: string;
  /** System prompt to evaluate tonalities */
  tonalityPrompt: string;
  /** LLM calls concurrency limit */
  concurrency: number;
  /** Standard LLM Options (including the model) */
  llmOptions: LlmRunOptions & { model: string };
}

const DEFAULT_CREATE_PROFILES_OPTIONS = {
  emotionPrompt: emotionProfilePrompt,
  tonalityPrompt: tonalityProfilePrompt,
  concurrency: CONCURRENCY,
  llmOptions: PROFILES_LLM_OPTIONS,
} satisfies CreateProfilesOptions;

/** Note: per‑call partial overrides of llmOptions currently drop defaults (shallow merge). */
function mergeCreateProfilesOptions(
  opts: Partial<CreateProfilesOptions> = {},
): CreateProfilesOptions {
  return { ...DEFAULT_CREATE_PROFILES_OPTIONS, ...opts };
}

export async function createProfiles(
  logger: LoggerPort,
  items: WeightedItem[],
  llm: LlmPort,
  opts: Partial<CreateProfilesOptions> = {},
): Promise<EmotionProfile[]> {
  const log = logger.child({ module: 'profiles.create' });

  if (items.length === 0) {
    log.error('No items to profile.');
    return [];
  }

  const { emotionPrompt, tonalityPrompt, concurrency, llmOptions } =
    mergeCreateProfilesOptions(opts);

  const limit = pLimit(concurrency);
  const { model, ...runOpts } = llmOptions;

  const jobs = items.map((item) =>
    limit(async (): Promise<EmotionProfile> => {
      try {
        const [rawEmotion, rawTonality] = await Promise.all([
          llm.run(model, makeProfileMessages(item, emotionPrompt), runOpts),
          llm.run(model, makeProfileMessages(item, tonalityPrompt), runOpts),
        ]);

        const emotions = parseEmotionRaw(rawEmotion);
        const tonalities = parseTonalityRaw(rawTonality);
        const hasFailed =
          emotions === FALLBACK_EMOTIONS || tonalities === FALLBACK_TONALITIES;

        if (hasFailed) {
          log.warn('LLM fallback', {
            source: item.source,
            title: item.title,
          });
        }

        return {
          title: item.title,
          source: item.source,
          weight: hasFailed ? 0 : item.weight,
          emotions,
          tonalities,
        };
      } catch (err) {
        log.error('LLM error', {
          source: item.source,
          title: item.title,
          error: err,
        });
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
