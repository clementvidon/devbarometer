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

        const emotionsRes = parseEmotion(rawEmotion);
        const tonalitiesRes = parseTonality(rawTonality);
        const hasFailed = !emotionsRes.ok || !tonalitiesRes.ok;

        if (hasFailed) {
          logger.warn('LLM fallback', {
            itemRef: item.itemRef,
            title: item.title,
          });
        }

        return {
          title: item.title,
          itemRef: item.itemRef,
          weight: hasFailed ? 0 : item.weight,
          emotions: emotionsRes.value,
          tonalities: tonalitiesRes.value,
        };
      } catch (err) {
        logger.error('LLM error', {
          itemRef: item.itemRef,
          title: item.title,
          error: err,
        });
        return {
          title: item.title,
          itemRef: item.itemRef,
          weight: 0,
          emotions: FALLBACK_EMOTIONS,
          tonalities: FALLBACK_TONALITIES,
        };
      }
    }),
  );

  return Promise.all(jobs);
}
