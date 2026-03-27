import { describe, expect, test } from 'vitest';

import type { Item } from '../../../domain/entities';
import { prefilterRelevance } from './prefilterRelevance';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    sourceFetchRef: 'sourceFetchRef',
    itemRef: 'itemRef',
    title: 'title',
    content: 'content',
    score: 1,
    ...overrides,
  };
}

const opts = {
  enabled: true,
  rejectTitleOnly: true,
  applyTitleBlocklist: true,
};

describe('prefilterRelevance', () => {
  test('rejects title-only items', () => {
    expect(prefilterRelevance(makeItem({ content: '   ' }), opts)).toEqual({
      kind: 'reject',
      reason: 'title_only',
    });
  });

  test('rejects explicit blocked titles', () => {
    expect(
      prefilterRelevance(
        makeItem({ title: "[MegaThread] Recherches/Offres d'emploi" }),
        opts,
      ),
    ).toEqual({
      kind: 'reject',
      reason: 'title_blocklist',
    });
  });

  test('passes regular items', () => {
    expect(
      prefilterRelevance(
        makeItem({ title: 'Le marché Android est-il en train de mourir ?' }),
        opts,
      ),
    ).toEqual({ kind: 'pass' });
  });
});
