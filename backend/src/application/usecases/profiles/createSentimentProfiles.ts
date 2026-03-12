import pLimit from 'p-limit';

import type { RelevantItem, SentimentProfile } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type { CreateSentimentProfilesOptions } from '../../ports/pipeline/CreateSentimentProfilesPort';
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
} satisfies CreateSentimentProfilesOptions;

function mergeCreateSentimentProfilesOptions(
  opts: Partial<CreateSentimentProfilesOptions> = {},
): CreateSentimentProfilesOptions {
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

export async function createSentimentProfiles(
  logger: LoggerPort,
  items: RelevantItem[],
  llm: LlmPort,
  opts: Partial<CreateSentimentProfilesOptions> = {},
): Promise<SentimentProfile[]> {
  if (items.length === 0) {
    logger.error('No items to profile.');
    return [];
  }

  const { emotionPrompt, tonalityPrompt, concurrency, llmOptions } =
    mergeCreateSentimentProfilesOptions(opts);

  const limit = pLimit(concurrency);
  const { model, ...runOpts } = llmOptions;

  const jobs = items.map((item) =>
    limit(async (): Promise<SentimentProfile> => {
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
          itemRef: item.itemRef,
          emotions: emotionsRes.value,
          tonalities: tonalitiesRes.value,
          status: hasFailed ? 'fallback' : 'ok',
        };
      } catch (err) {
        logger.error('LLM error', {
          itemRef: item.itemRef,
          title: item.title,
          error: err,
        });
        return {
          itemRef: item.itemRef,
          emotions: FALLBACK_EMOTIONS,
          tonalities: FALLBACK_TONALITIES,
          status: 'fallback',
        };
      }
    }),
  );

  return Promise.all(jobs);
}
