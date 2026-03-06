export type ParseFailureReason = 'invalid_json' | 'invalid_schema';

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; value: T; reason: ParseFailureReason };

export function ok<T>(value: T): ParseResult<T> {
  return { ok: true, value };
}

export function fail<T>(value: T, reason: ParseFailureReason): ParseResult<T> {
  return { ok: false, value, reason };
}
