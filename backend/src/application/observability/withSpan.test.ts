import { afterEach, describe, expect, type Mocked, test, vi } from 'vitest';

import type { LoggerPort } from '../ports/output/LoggerPort';
import { withSpan } from './withSpan';

type LoggerDouble = {
  logger: Mocked<LoggerPort>;
  childLogger: Mocked<LoggerPort>;
};

function makeLoggerDouble(): LoggerDouble {
  const childLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn((_context) => childLogger),
  };
  return { logger, childLogger };
}

/**
 * Spec: Wrap a task in a logging span and measure execution time.
 * - Creates a child logger scoped with `{ span: name }`.
 * - Logs `start` before executing the task and `end` after (success or failure).
 * - Includes timestamps and `durationMs` based on `Date.now()`.
 * - Executes the task exactly once; resolves/rejects exactly like the task.
 */

describe(withSpan.name, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  test('log the time of a task', async () => {
    const { logger, childLogger } = makeLoggerDouble();
    const name = 'my-span';
    const fn = vi.fn(() => 'ok');

    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1300);

    const result = await withSpan(logger, name, fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(logger.child).toHaveBeenCalledTimes(1);
    expect(logger.child).toHaveBeenNthCalledWith(1, { span: name });
    expect(childLogger.debug).toHaveBeenCalledTimes(2);
    expect(childLogger.debug).toHaveBeenNthCalledWith(
      1,
      'start',
      expect.objectContaining({ ts: 1000 }),
    );
    expect(childLogger.debug).toHaveBeenNthCalledWith(
      2,
      'end',
      expect.objectContaining({ ts: 1300, durationMs: 300 }),
    );
  });
  test('supports async task', async () => {
    const { logger, childLogger } = makeLoggerDouble();
    const name = 'my-span';
    const fn = vi.fn(() => Promise.resolve('ok'));

    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1300);

    const result = await withSpan(logger, name, fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(logger.child).toHaveBeenCalledTimes(1);
    expect(logger.child).toHaveBeenNthCalledWith(1, { span: name });
    expect(childLogger.debug).toHaveBeenCalledTimes(2);
    expect(childLogger.debug).toHaveBeenNthCalledWith(1, 'start', {
      ts: 1000,
    });
    expect(childLogger.debug).toHaveBeenNthCalledWith(
      2,
      'end',
      expect.objectContaining({ ts: 1300, durationMs: 300 }),
    );
  });
  test('throws if the given task throws', async () => {
    const { logger, childLogger } = makeLoggerDouble();
    const err = new Error('boom');
    const fn = vi.fn(() => {
      throw err;
    });

    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1300);

    await expect(withSpan(logger, 'my-span', fn)).rejects.toBe(err);

    expect(childLogger.debug).toHaveBeenNthCalledWith(
      2,
      'end',
      expect.objectContaining({
        ts: 1300,
        durationMs: 300,
        error: err,
      }),
    );
  });
});
