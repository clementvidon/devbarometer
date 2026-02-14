/**
 * Aggregate and emit logs.
 *
 * Contract (interface‑wide):
 * - Best‑effort, non‑throwing; synchronous API.
 * - Level‑based filtering; implementations may redact sensitive data.
 * - child returns a logger with merged, immutable context.
 * - Implementations must accept native Error in meta and serialize safely
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export type LogContext = Record<string, unknown>;

export interface LoggerPort {
  /** Emit debug information for developers. */
  debug(msg: string, context?: LogContext, error?: unknown): void;
  /** Emit general informational events. */
  info(msg: string, context?: LogContext): void;
  /** Emit recoverable issues or degraded states. */
  warn(msg: string, context?: LogContext, error?: unknown): void;
  /** Emit errors; must not throw. */
  error(msg: string, context?: LogContext, error?: unknown): void;
  /** Create a derived logger with merged context. */
  child(context: LogContext): LoggerPort;
}
