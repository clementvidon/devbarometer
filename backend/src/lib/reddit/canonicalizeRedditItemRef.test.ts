import { describe, expect, test } from 'vitest';

import { canonicalizeRedditItemRef } from './canonicalizeRedditItemRef';

describe('canonicalizeRedditItemRef', () => {
  test('keeps short reddit item refs unchanged', () => {
    expect(
      canonicalizeRedditItemRef('https://reddit.com/comments/1abc123'),
    ).toBe('https://reddit.com/comments/1abc123');
  });

  test('canonicalizes long reddit post urls', () => {
    expect(
      canonicalizeRedditItemRef(
        'https://reddit.com/r/developpeurs/comments/1abc123/un_post/',
      ),
    ).toBe('https://reddit.com/comments/1abc123');
  });

  test('returns non-reddit refs as-is', () => {
    expect(canonicalizeRedditItemRef('https://example.com/post/42')).toBe(
      'https://example.com/post/42',
    );
  });
});
