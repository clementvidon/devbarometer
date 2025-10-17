import type { LoggerPort } from '../../application/ports/output/LoggerPort';

export class NoopLoggerAdapter implements LoggerPort {
  debug(_msg: string, _meta?: Record<string, unknown>): void {}
  info(_msg: string, _meta?: Record<string, unknown>): void {}
  warn(_msg: string, _meta?: Record<string, unknown>): void {}
  error(_msg: string, _meta?: Record<string, unknown>): void {}
  child(_context: Record<string, unknown>): LoggerPort {
    return this;
  }
}
