import { describe, expect, test } from 'vitest';
import { stripCodeFences } from './stripCodeFences';

describe('stripCodeFences', () => {
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
