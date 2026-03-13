import type { Item } from '../../../domain/entities';
import type { RelevancePrefilterOptions } from '../../ports/pipeline/FilterRelevantItemsPort';

export const TITLE_BLOCKLIST_PATTERNS = [
  /^\s*\[?mega ?thread\]?/i,
  /^\s*\[?meta\]?(?:\s|:|-)/i,
  /\bflair\b/i,
  /\breview\b.{0,20}\bcv\b/i,
  /\bjoin.*discord\b/i,
  /\bp[ée]tition\b/i,
] as const;

export type PrefilterDecision =
  | { kind: 'pass' }
  | { kind: 'reject'; reason: 'title_only' | 'title_blocklist' };

export function prefilterRelevance(
  item: Item,
  opts: RelevancePrefilterOptions,
): PrefilterDecision {
  if (!opts.enabled) return { kind: 'pass' };

  if (
    opts.applyTitleBlocklist &&
    TITLE_BLOCKLIST_PATTERNS.some((pattern) => pattern.test(item.title))
  ) {
    return { kind: 'reject', reason: 'title_blocklist' };
  }

  if (opts.rejectTitleOnly && item.content.trim().length === 0) {
    return { kind: 'reject', reason: 'title_only' };
  }

  return { kind: 'pass' };
}
