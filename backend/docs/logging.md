# Logging Guideling

## Rules by layer

```
.
├── cli                 // `rootLogger`
├── interface           // injected logger (required)
├── infrastructure      // injected logger (required)
├── application/usecase // injected logger (required)
├── application/port    // no logger (`LoggerPort` definition)
├── domain              // no logger
└── lib                 // no logger (except for observability needs)
```

## Enforcement and hygiene

- Recommended scopes: `cmd` (entrypoint), `module` (component), `scope` (sub-scope).
- Prefer structured logs: `logger.error('msg', { error, ...meta })`, not string concat.
- Propagate two IDs: `traceId` — global run / distributed trace (generate at entrypoint or reuse incoming trace header); `requestId` — per-request/job id (create in middleware or job handler).
- Sync vs async: prefer `LoggerPort` sync; if async, document and `await` properly.
- Recommended JSON fields: `{ time, level, msg, context }` where context may include: `cmd?, module?, scope?, traceId?, requestId?, …`

## Redaction and safety

- Centralize redaction in the adapter; denylist keys: `token, secret, password, api_key, authorization, cookie, set-cookie`.
- Truncate large payloads; whitelist minimal fields for bodies/headers.
- Never log credentials or PII; prefer stable IDs (e.g. `userId`, `orderId`).
- Adapter must serialize and normalize fields (`time`, `level`, `msg`, `context`) before emitting.

## Levels and sampling

- Configure default level via `LOG_LEVEL` (prod=info, dev=debug).
- Sample noisy logs (retries/loops) with rate limit or every N attempts.

## Scoping conventions

- Derive child once per boundary (avoid double-child):
  - root: `rootLogger` created with base context `{ service, env, version }`
  - cli: `child({ cmd, traceId })`
  - interface: `child({ module: 'web' })` then per-request `child({ requestId, method, path })`
  - infrastructure: `child({ module: 'items.reddit' })` in constructor
  - application: `child({ scope: 'agent' })` in factory
  - lib: `child({ module: 'lib.fetch' })`

## Errors and observability

- Standardize `error`: `{ message, code?, stack_truncated? }`.

## Naming conventions

- `rootLogger` = result of `makeLogger` (factory).
- `logger` = functions/constructors argument.
- `log` = child declared inside a function/method.

## Tests

- Tests: `NoopLoggerAdapter` or spy logger to assert calls/metadata; `NoopLoggerAdapter` reserved for tests only.
