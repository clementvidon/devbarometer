import type { LoggerPort } from '../../application/ports/output/LoggerPort';

export async function withSpan<T>(
  logger: LoggerPort,
  name: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  const log = logger.child({ span: name });
  const start = Date.now();
  log.debug('start', { ts: start });
  let error: unknown;
  try {
    const result = await fn();
    return result;
  } catch (err) {
    error = err;
    throw err;
  } finally {
    const end = Date.now();
    const durationMs = end - start;
    const meta: Record<string, unknown> = { ts: end, durationMs };
    if (error) meta.error = error as unknown;
    log.debug('end', meta);
  }
}
