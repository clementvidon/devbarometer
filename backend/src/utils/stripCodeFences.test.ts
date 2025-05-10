import { describe, expect, test } from 'vitest';
import { stripCodeFences } from './stripCodeFences.ts';

describe('stripCodeFences', () => {
  test('removes plain triple backticks', () => {
    const raw = '```\ncode\n```';
    expect(stripCodeFences(raw)).toBe('code');
  });

  test('removes language-specified fences', () => {
    const raw = '```ts\nconst x = 1;\n```';
    expect(stripCodeFences(raw)).toBe('const x = 1;');
  });

  test('ignores content without fences', () => {
    const raw = 'plain text\nno fences';
    expect(stripCodeFences(raw)).toBe('plain text\nno fences');
  });

  test('preserves inner line breaks', () => {
    const raw = '```\nline1\nline2\n```';
    expect(stripCodeFences(raw)).toBe('line1\nline2');
  });
});
