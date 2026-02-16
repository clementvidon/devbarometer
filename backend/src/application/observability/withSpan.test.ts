import { afterEach, describe, expect, test, vi } from 'vitest';
import type { LoggerPort } from '../ports/output/LoggerPort';
import { withSpan } from './withSpan';

/**
 * Spec: Log the time span of a task
 * Inputs:
 * - a logger for span lifecycle
 * - a span name for log context
 * - a task to execute
 * Side effects:
 * - use the current time
 * Output:
 * - the output of the given task (as a Promise)
 * Throws:
 * - if the given task throws
 * Behavior:
 * - logs are contextualized with the given span name
 * - logs the start time before task execution
 * - logs the end time and duration after task completion (even if it throws)
 * - includes the error in the end log meta if the task execution fails
 * - supports both sync and async tasks
 */

function makeLoggerDouble() {
  const childLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  } satisfies LoggerPort;
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => childLogger),
  } satisfies LoggerPort;
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
