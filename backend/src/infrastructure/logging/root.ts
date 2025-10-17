import type { LoggerPort } from '../../application/ports/output/LoggerPort';
import { loadLoggingConfig } from '../config/loaders';
import { ConsoleLoggerAdapter } from './ConsoleLoggerAdapter';

export function makeLogger() {
  const { level, pretty } = loadLoggingConfig();
  return new ConsoleLoggerAdapter({ level, pretty });
}

export async function withSpan<T>(
  logger: LoggerPort,
  name: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  const span = logger.child({ span: name });
  const start = Date.now();
  span.debug('start', { ts: start });
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
    span.debug('end', meta);
  }
}
