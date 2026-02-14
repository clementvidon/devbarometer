import type {
  LogContext,
  LoggerPort,
  LogLevel,
} from '../../application/ports/output/LoggerPort';

export interface ConsoleLoggerOptions {
  level: LogLevel;
  pretty: boolean;
}

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50,
};

const REDACT_KEYS = ['api_key', 'apikey', 'token', 'secret', 'password'];
const ERROR_BASE_KEYS = new Set(['name', 'message', 'stack', 'cause']);

function shouldRedactKey(key: string): boolean {
  const lower = key.toLowerCase();
  return REDACT_KEYS.some(
    (pattern) => lower.includes(pattern) || lower.endsWith(pattern),
  );
}

function redactObject(input: unknown, seen = new WeakSet<object>()): unknown {
  if (input == null) return input;

  if (typeof input !== 'object') return input;

  const reference = input;
  if (seen.has(reference)) return '[Circular]';
  seen.add(reference);

  if (Array.isArray(input)) {
    return input.map((item) => redactObject(item, seen));
  }

  if (input instanceof Error) {
    const base = serializeError(input);
    const extra: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(
      input as unknown as Record<string, unknown>,
    )) {
      if (ERROR_BASE_KEYS.has(key)) continue;
      extra[key] = shouldRedactKey(key)
        ? '[REDACTED]'
        : redactObject(value, seen);
    }

    return { ...base, ...extra };
  }

  if (input instanceof Date || input instanceof Map || input instanceof Set) {
    return input;
  }

  const obj = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = shouldRedactKey(key) ? '[REDACTED]' : redactObject(value, seen);
  }
  return out;
}

type SerializedError = {
  name: string;
  message: string;
  stack?: string;
  cause?: SerializedError;
};

function serializeError(err: Error, seen = new Set<Error>()): SerializedError {
  const serialized: SerializedError = {
    name: err.name,
    message: err.message,
    stack: err.stack ?? undefined,
  };
  if (seen.has(err)) return serialized;
  seen.add(err);
  const out: SerializedError = serialized;
  if ('cause' in err && err.cause instanceof Error) {
    out.cause = serializeError(err.cause, seen);
  }
  return out;
}

function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  const replacer = (_key: string, raw: unknown) => {
    if (raw && typeof raw === 'object') {
      const obj = raw;
      if (seen.has(obj)) return '[Circular]';
      seen.add(obj);
    }
    return raw instanceof Error ? serializeError(raw) : raw;
  };
  try {
    return JSON.stringify(value, replacer);
  } catch {
    return '"[Unserializable]"';
  }
}

export class ConsoleLoggerAdapter implements LoggerPort {
  constructor(
    private readonly opts: ConsoleLoggerOptions,
    private readonly baseContext: LogContext = {},
  ) {}

  private shouldLog(level: LogLevel) {
    return LEVEL_RANK[level] >= LEVEL_RANK[this.opts.level];
  }

  private formatPretty(
    level: LogLevel,
    msg: string,
    context: LogContext,
    error: unknown,
  ): string {
    const time = new Date().toISOString().slice(11, 19); // UTC HH:MM:SS
    const kv = Object.entries(context)
      .map(([k, v]) =>
        typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
          ? `${k}=${String(v)}`
          : `${k}=${safeStringify(v)}`,
      )
      .join(' ');
    const errPart = error === undefined ? '' : ` error=${safeStringify(error)}`;
    return `[${time}] ${level.toUpperCase()} ${msg}${kv ? ` ${kv}` : ''}${errPart}`;
  }

  private emit(level: LogLevel, msg: string, meta: LogContext, error: unknown) {
    const context = redactObject({
      ...this.baseContext,
      ...meta,
    }) as LogContext;
    const redactedError = error === undefined ? undefined : redactObject(error);
    if (this.opts.pretty) {
      const line = this.formatPretty(level, msg, context, redactedError);

      (level === 'error' ? console.error : console.log)(line);
    } else {
      const payload = {
        time: Date.now(),
        level,
        msg,
        context,
        error: redactedError,
      };
      const line = safeStringify(payload);
      (level === 'error' ? console.error : console.log)(line);
    }
  }

  private log(
    level: LogLevel,
    msg: string,
    meta?: LogContext,
    error?: unknown,
  ) {
    if (!this.shouldLog(level)) return;
    this.emit(level, msg, meta ?? {}, error);
  }

  debug(msg: string, meta?: LogContext, error?: unknown) {
    this.log('debug', msg, meta, error);
  }
  info(msg: string, meta?: LogContext) {
    this.log('info', msg, meta);
  }
  warn(msg: string, meta?: LogContext, error?: unknown) {
    this.log('warn', msg, meta, error);
  }
  error(msg: string, meta?: LogContext, error?: unknown) {
    this.log('error', msg, meta, error);
  }

  child(context: LogContext): LoggerPort {
    return new ConsoleLoggerAdapter(this.opts, {
      ...this.baseContext,
      ...context,
    });
  }
}
