import { describe, expect, test } from 'vitest';
import { stripCodeFences } from './stripCodeFences';

/**
 * Spec: Remove surrounding triple-backtick code fences from a string.
 * - Removes both plain and language-specified fences.
 * - Preserves inner content and line breaks.
 * - Does not remove inline backticks that are not fences.
 */

describe(stripCodeFences.name, () => {
  test('removes code fence lines', () => {
    expect(stripCodeFences('```\ncode\n```')).toBe('code');
  });
  test('removes language-specified fences', () => {
    expect(stripCodeFences('```ts\ncode\n```')).toBe('code');
  });
  test('does not remove inline backticks', () => {
    expect(stripCodeFences('hello```')).toBe('hello```');
  });
  test('preserves inner line breaks', () => {
    expect(stripCodeFences('```\nline1\nline2\nline3\n```')).toBe(
      'line1\nline2\nline3',
    );
  });
  test('return empty string when input contains only fences', () => {
    expect(stripCodeFences('```\n```')).toBe('');
  });
});
