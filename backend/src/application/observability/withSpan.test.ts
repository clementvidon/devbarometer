import { afterEach, describe, expect, test, vi, type Mocked } from 'vitest';
import type { LoggerPort } from '../ports/output/LoggerPort';
import { withSpan } from './withSpan';

/**
 * Spec: Wraps a task in a logging span and measures its execution time.
 *
 * Inputs:
 * - a logger (LoggerPort)
 * - a span name (string)
 * - a task function (sync or async)
 *
 * Output:
 * - returns the resolved value of the task as a Promise
 *
 * Side effects:
 * - creates a child logger scoped with { span: name }
 * - logs start and end timestamps using Date.now()
 *
 * Throws:
 * - rethrows any error thrown by the task
 *
 * Behavior:
 * - creates a child logger contextualized with the given span name
 * - logs a "start" debug entry before executing the task
 * - executes the task (supports sync and async functions)
 * - logs an "end" debug entry after execution
 * - includes execution duration in milliseconds
 * - includes the error in the end log metadata if the task fails
 *
 * Invariants:
 * - the task is executed exactly once
 * - "start" log happens before task execution
 * - "end" log always happens after execution (success or failure)
 * - the returned promise resolves or rejects exactly as the task does
 */

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

describe('withSpan', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe('happy path', () => {
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
  });
  describe('error cases', () => {
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
});
