import { describe, expect, test } from 'vitest';
import type { Report } from '../../../domain/entities';
import { parseReport } from './parseReport';
import { FALLBACK_REPORT } from './policy';

/**
 * Spec: Parse report from an LLM raw string.
 * - Accepts JSON with or without ``` fences.
 * - Returns validated Report, otherwise FALLBACK_REPORT.
 * - Never throws.
 */

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    text: 'text',
    emoji: '☀️',
    ...overrides,
  };
}

describe(parseReport.name, () => {
  test('return fallback if raw does not parse to JSON', () => {
    expect(parseReport('{ wrong }')).toBe(FALLBACK_REPORT);
  });
  test('return fallback if raw does not parse to Report', () => {
    expect(parseReport('{ "wrong": true }')).toBe(FALLBACK_REPORT);
  });
  test('return raw as a Report if it is valid, with code-fences', () => {
    const obj = makeReport({ text: 'hello' });
    const raw = '```\n' + JSON.stringify(obj) + '\n```';

    const result = parseReport(raw);

    expect(result).toStrictEqual(obj);
    expect(result).not.toStrictEqual(FALLBACK_REPORT);
  });
  test('return raw as Report if it is valid, without code-fences', () => {
    const obj = makeReport({ text: 'hello' });
    const raw = JSON.stringify(obj);

    const result = parseReport(raw);

    expect(result).toStrictEqual(obj);
    expect(result).not.toStrictEqual(FALLBACK_REPORT);
  });
  test('return fallback for empty string', () => {
    expect(parseReport('')).toBe(FALLBACK_REPORT);
  });
});
