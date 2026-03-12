import type { Report } from '@devbarometer/shared/domain';
import { describe, expect, test } from 'vitest';

import { parseReport } from './parseReport';
import { FALLBACK_REPORT } from './policy';

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    text: 'text',
    emoji: '☀️',
    ...overrides,
  };
}

/**
 * Spec: Parse Report from LLM output.
 * - Accepts JSON with or without ``` fences.
 * - Returns a validated Report, otherwise FALLBACK_REPORT.
 * - Never throws.
 */

describe(parseReport.name, () => {
  test('returns FALLBACK on invalid JSON', () => {
    expect(parseReport('{ wrong }')).toMatchObject({
      ok: false,
      reason: 'invalid_json',
      value: FALLBACK_REPORT,
    });
  });
  test('returns FALLBACK on invalid schema', () => {
    expect(parseReport('{ "wrong": true }')).toMatchObject({
      ok: false,
      reason: 'invalid_schema',
      value: FALLBACK_REPORT,
    });
  });
  test('returns raw if valid (with code-fences)', () => {
    const obj = makeReport({ text: 'my-report' });
    const raw = '```\n' + JSON.stringify(obj) + '\n```';

    expect(parseReport(raw)).toMatchObject({
      ok: true,
      value: obj,
    });
  });
  test('returns raw if valid (with no code-fences)', () => {
    const obj = makeReport({ text: 'my-report' });
    const raw = JSON.stringify(obj);

    expect(parseReport(raw)).toMatchObject({
      ok: true,
      value: obj,
    });
  });
  test('returns FALLBACK on empty string', () => {
    expect(parseReport('')).toMatchObject({
      ok: false,
      reason: 'invalid_json',
      value: FALLBACK_REPORT,
    });
  });
});
