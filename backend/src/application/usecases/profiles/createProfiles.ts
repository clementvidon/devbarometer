import pLimit from 'p-limit';
import type { EmotionProfile, WeightedItem } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type { CreateProfilesOptions } from '../../ports/pipeline/CreateProfilesPort';
import { makeProfileMessages } from './llmMessages';
import { parseEmotion } from './parseEmotion';
import { parseTonality } from './parseTonality';
import {
  CONCURRENCY,
  FALLBACK_EMOTIONS,
  FALLBACK_TONALITIES,
  PROFILES_LLM_OPTIONS,
} from './policy';
import { emotionProfilePrompt, tonalityProfilePrompt } from './prompts';

const DEFAULT_CREATE_PROFILES_OPTIONS = {
  emotionPrompt: emotionProfilePrompt,
  tonalityPrompt: tonalityProfilePrompt,
  concurrency: CONCURRENCY,
  llmOptions: PROFILES_LLM_OPTIONS,
} satisfies CreateProfilesOptions;

function mergeCreateProfilesOptions(
  opts: Partial<CreateProfilesOptions> = {},
): CreateProfilesOptions {
  const mergedLlmOptions = {
    ...DEFAULT_CREATE_PROFILES_OPTIONS.llmOptions,
    ...(opts.llmOptions ?? {}),
  };
  return {
    ...DEFAULT_CREATE_PROFILES_OPTIONS,
    ...opts,
    llmOptions: mergedLlmOptions,
  };
}

export async function createProfiles(
  logger: LoggerPort,
  items: WeightedItem[],
  llm: LlmPort,
  opts: Partial<CreateProfilesOptions> = {},
): Promise<EmotionProfile[]> {
  if (items.length === 0) {
    logger.error('No items to profile.');
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

        const emotions = parseEmotion(rawEmotion);
        const tonalities = parseTonality(rawTonality);
        const hasFailed =
          emotions === FALLBACK_EMOTIONS || tonalities === FALLBACK_TONALITIES;

        if (hasFailed) {
          logger.warn('LLM fallback', {
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
        logger.error('LLM error', {
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
