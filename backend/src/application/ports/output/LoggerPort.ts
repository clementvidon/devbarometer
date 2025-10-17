/**
 * Aggregate and emit logs.
 *
 * Contract (interface-wide):
 * - Non-throwing best-effort logging; synchronous API.
 * - Level-based filtering; implementations may redact sensitive data.
 * - `child` returns a logger with merged immutable context.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LoggerPort {
  /** Emit debug information for developers. */
  debug(msg: string, meta?: Record<string, unknown>): void;
  /** Emit general informational events. */
  info(msg: string, meta?: Record<string, unknown>): void;
  /** Emit recoverable issues or degraded states. */
  warn(msg: string, meta?: Record<string, unknown>): void;
  /** Emit errors; must not throw. */
  error(msg: string, meta?: Record<string, unknown>): void;
  /** Create a derived logger with merged context. */
  child(context: Record<string, unknown>): LoggerPort;
}
