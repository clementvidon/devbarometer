# ERRORS ARCHITECTURAL GUIDELINE

## INDEX

- **TL;DR** - Quick summary
- **CORE PRINCIPLES** - Fundamental rules and trade-offs
- **RULES BY LAYER** - Per layer responsibilities
- **DETAILS** - Secondary building blocks / implementation notes

## TL;DR

1. An error occurs
2. It is captured and normalized
3. Wrapped in a layer-scoped error
4. Propagates through layers
5. Mapped across boundaries to an app-level error
6. Retry policies may apply
7. Ends as a protocol-specific response

## CORE PRINCIPLES

- Fallible operations return `Result<T,E>`; use `ok(value)` for success, `err(error)` for failure
- Layer-scoped errors use `kind` and `meta`; App-level errors use `code` and `errorId`
- Throw only for programmer errors or broken invariants; never for expected domain failures
- Strip diagnostic metadata when crossing architectural boundaries; apply light redaction at capture
- Layers own their error types; adapters normalize external exceptions; usecases map to `AppError`
- Retry tactically in adapters (transient failures), strategically in entrypoints (full operations)

## RULES BY LAYER

---

Defines error handling per layer in the **error flow order**.

```
[lib, domain, adapters] → [application (ports, usecases)] → [interface] → [entrypoints]

┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer          │ Produces              │ Consumes           │ Returns       │
├─────────────────────────────────────────────────────────────────────────────┤
│ lib            │ LibError              │ -                  │ LibError      │
│ domain         │ DomainError           │ LibError           │ DomainError   │
│ adapters       │ <Adapter>Error        │ external throws    │ <Port>Error   │
│ ports          │ <Port>Error           │ -                  │ <Port>Error   │
│ usecases       │ AppError              │ Domain/Lib/Port    │ AppError      │
│ interface      │ <Interface>Error      │ AppError           │ AppError      │
│ entrypoints    │ HTTP/CLI response     │ AppError           │ status code   │
└─────────────────────────────────────────────────────────────────────────────┘
```

Each layer section below uses these keys:

- **Errors** — types produced, consumed, returned
- **Mappers** — how errors are transformed _→ see Error Mappings_
- **Throws** — when exceptions may be thrown
- **Try/catch** — what is caught here
- **Location** — where error types and mappers live
- **Dependencies** — allowed layer deps
- **Retries** — handles retries _→ see Retry Policies_

### Lib

Provide reusable utilities for all layers.

- **Errors:**
  - Produced: `LibError` { kind + meta }
  - Consumed: none
  - Returned: `LibError`
- **Mappers:** none
- **Throws:** yes (programmer errors only)
- **Try/catch:** yes (parsing, validation)
- **Location:** `src/lib/errors.ts`
- **Dependencies:** none
- **Retries:** no

### Domain

Encode business rule violations.

- **Errors:**
  - Produced: `DomainError` { kind + meta }
  - Consumed: `LibError` (optionally)
  - Returned: `DomainError`
- **Mappers:** none
- **Throws:** never
- **Try/catch:** not allowed (pure logic)
- **Location:** `src/domain/errors.ts`
- **Dependencies:** `lib`
- **Retries:** no

### Adapters

Implement application (ports) contracts.

- **Errors:**
  - Produced: `<Adapter>Error` (e.g. `OpenAIAdapterError` for `OpenAIAdapter` adapter) { kind + meta }
  - Consumed: external exceptions (API, DB, FS)
  - Returned: `<Port>Error`
- **Mappers:** `<Adapter>Error → <Port>Error`
- **Throws:** never
- **Try/catch:** yes (api, db, fs, external errors)
- **Location:** `src/adapters/*/*/errors.ts`
- **Dependencies:** `lib`, `ports`
- **Retries:** tactical retries

### Ports

Define abstract contracts between application and infrastructure.

- **Errors:**
  - Produced: `<Port>Error` (e.g. `LlmPortError` for `LlmPort` port) { kind + meta }
  - Consumed: none (interface contract only)
  - Returned: `<Port>Error`
- **Mappers:** none
- **Throws:** never
- **Try/catch:** not allowed
- **Location:** `src/application/ports/*/*/errors.ts`
- **Dependencies:** `domain`, `lib`
- **Retries:** no

### Usecases

Orchestrate business logic and map to user-facing errors.

- **Errors:**
  - Produced: `AppError` { code + errorId }
  - Consumed: `DomainError | LibError | <Port>Error`
  - Returned: `AppError`
- **Mappers:** `DomainError | LibError | <Port>Error → AppError`
- **Throws:** yes (`assertNever` only)
- **Try/catch:** not allowed
- **Location:** `src/application/errors.ts`
- **Dependencies:** `domain`/`lib`/`ports` only
- **Retries:** no

### Interface

Handle protocol concerns and adapt to application layer.

- **Errors:**
  - Produced: `<Interface>Error` { kind + meta } (internal only)
  - Consumed: `AppError` (from usecases)
  - Returned: `AppError`
- **Mappers:** `<Interface>Error → AppError`
- **Throws:** never
- **Try/catch:** yes (parsing, validation, serialization)
- **Location:** `src/interface/*/errors.ts`
- **Dependencies:** `application` layer only
- **Retries:** no

### Entrypoints

Orchestrate requests and convert to protocol responses.

- **Errors:**
  - Produced: none (orchestration only)
  - Consumed: `AppError` (from interface/usecases)
  - Returned: protocol-specific responses (HTTP status, CLI exit code)
- **Mappers:** `AppError → protocol-specific responses (CLI/HTTP)`
- **Throws:** yes (critical failures: missing env vars, config errors, port binding)
- **Try/catch:** yes (converts unexpected throws to `AppError` with INTERNAL or UNAVAILABLE code)
- **Location:** `src/entrypoints/*`
- **Dependencies:** `interface` + `application` only
- **Retries:** apply strategic retries

## DETAILS

### Type Definitions

#### Layer-scoped Errors

**Structure:**

- Technical errors: `{ kind: 'SampleError'; meta?: SampleErrorMeta }` (PascalCase)
- Business errors: `{ kind: 'SAMPLE_ERROR'; meta?: SampleErrorMeta }` (UPPER_SNAKE_CASE)

**Metadata by layer:**

```ts
// src/lib/errors.ts
export type LibErrorMeta = {
  field?: string;               // faulty field name
  reason?: string;              // short explanation
  cause?: NormalizedError;      // underlying technical error
};

// src/domain/errors.ts
export type DomainErrorMeta = {
  entity?: string;              // business entity (User, Match, etc.)
  id?: string;                  // business identifier
  reason?: string;              // human-readable explanation
};

// src/adapters/*/*/errors.ts
export type <Adapter>ErrorMeta = {
  adapter: string;              // adapter/integration name
  status?: number;              // HTTP/SQL status code
  reason?: string;              // textual cause
  cause?: NormalizedError;      // root technical error
};

// src/application/ports/*/*/errors.ts
export type <Port>ErrorMeta = {
  adapter: string;              // adapter/integration name
  status?: number;              // HTTP/SQL status code
  reason?: string;              // textual cause
  retry?: {                     // keep track of tactical retries
    attempts: number;           // total attempts made
    lastStatus?: number|string; // final code/status before giving up
    retryAfterMs?: number;      // last backoff or server hint
    backoffSummary?: string;    // e.g. "100-200-400-800"
  };
};

// src/interface/*/errors.ts
export type InterfaceErrorMeta = {
  protocol: string;             // http, cli, grpc, etc.
  path?: string;                // request path or route
  reason?: string;              // serialization/validation failure
  cause?: NormalizedError;      // underlying technical error
};
```

#### App-level Errors

**Structure:**

```ts
// src/application/errors.ts
export type AppError = Readonly<{ code: ErrorCode; errorId: string }>;
```

```ts
// src/application/errors.ts
export type ErrorCode =
  | 'VALIDATION_ERROR' // invalid input or schema
  | 'BAD_REQUEST' // malformed request or parse fail
  | 'NOT_FOUND' // resource or entity missing
  | 'CONFLICT' // duplicate or state mismatch
  | 'UNAUTHORIZED' // missing or invalid auth
  | 'FORBIDDEN' // action not allowed
  | 'RATE_LIMITED' // too many requests / quota hit
  | 'TIMEOUT' // operation took too long
  | 'UNAVAILABLE' // service or dependency down
  | 'INTEGRITY' // data corruption or constraint
  | 'INTERNAL'; // unexpected bug or crash
```

```ts
// src/lib/errors.ts
export function generateErrorId(): string;
```

> The `errorId` is generated via `generateErrorId()` when mapping layer errors
> to `AppError`; it is included in all logs (usecase/interface) and returned in
> HTTP/CLI responses for user reference. It allows users to reference specific
> error instances in support requests. The ID is NOT included in `NormalizedError`
> (technical diagnostic only).

### Error Handling

#### Normalization

Convert unknown exceptions to serializable structure:

```ts
// lib/errors.ts
type NormalizedError = {
  __normalized?: true;
  name?: string;
  message?: string;
  truncatedStack?: string;
  cause?: NormalizedError;
};
```

**Rules:**

- Call `normalizeError()` in catch block
- Attach to `meta.cause` in adapter errors
- Logger calls `normalizeError()` again as safety net
- Truncate stack to 1000 chars
- Recurse into cause chain (max depth: 2 levels of causes). At depth limit, replace nested causes with `{ message: '[truncated: max depth exceeded]' }`
- Never traverse arbitrary enumerable properties
- Handle non-Error types gracefully
- `normalizeError()` sets `__normalized = true` for idempotency
- If `!(e instanceof Error)`, produce `NormalizedError { name: 'UnknownError', message: String(e) }`

_Example: Cause chain_

```ts
{
  name: 'ApiError',
  message: 'Request failed',
  cause: {
    name: 'NetworkError',
    message: 'ECONNREFUSED',
    cause: {
      message: '[truncated: max depth exceeded]'
    }
  }
}
```

**Location:**

- Function lives in `lib/errors.ts`
- Called in adapter catch blocks
- Applied again by logger adapter before emission

#### Light Redaction

Applied during `normalizeError()` when catching unexpected failures, the
**light redaction** is fast and immediately catches 99% of cases at source. It
redacts highly sensitive keys from the error as soon as it is caught.

**Highly sensitive patterns** (case-insensitive):

- password, passwd, pwd
- token, jwt, bearer
- secret, api_key, apikey
- authorization, auth_header
- credit_card, ssn, cvv

**Purpose:**

- Remove highly sensitive keys immediately
- Redact tokens/secrets from error messages
- Happens once at error capture point
- Shallow redaction (message + known patterns)

#### Retry Policies

Retry logic is split between tactical (in adapters) and strategic (in entrypoints) retries.

**Adapters** apply **tactical retries** for transient failures:

- Reasons: Rate limits (429), Network timeouts (ETIMEDOUT, ECONNRESET), Service unavailable (503)
- Use exponential backoff with jitter
- If all retries fail, return `<Port>Error` with `meta` containing retry details
- Tactical retries
  - attempts: 3
  - base: 100 ms
  - factor: 2
  - cap: 2_000 ms
  - jitter: full jitter `(Math.random() * calculatedBackoff)`

**Entrypoints** apply **strategic retries** for entire operations according to
(`src/application/errors.ts`) `isRetryable(code)` :

- Retry the full usecase call on retryable `AppError.code`
- Retryable codes: UNAVAILABLE, TIMEOUT, RATE_LIMITED (used by `isRetryable`).
- Strategic retries
  - attempts: 3
  - base: 500 ms
  - factor: 2
  - cap: 5_000 ms
  - jitter: full jitter `(Math.random() * calculatedBackoff)`

**Key differences:**

```
┌──────────────┬────────────────────┬──────────────────────┐
│              │ Tactical (Adapter) │ Strategic (Entry)    │
├──────────────┼────────────────────┼──────────────────────┤
│ Scope        │ Single API call    │ Entire operation     │
│ Retries      │ 3 × 100-200-400ms  │ 3 × 500-1000-2000ms  │
│ Reasons      │ 429, 503, timeout  │ UNAVAILABLE, TIMEOUT │
│ Logs         │ DEBUG (per retry)  │ INFO (per attempt)   │
│ On failure   │ Return PortError   │ Return final AppError│
└──────────────┴────────────────────┴──────────────────────┘
```

**Retry Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│ Entrypoint (Strategic)                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Attempt 1                                                   │ │
│ │   ↓                                                         │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Usecase                                                 │ │ │
│ │ │   ↓                                                     │ │ │
│ │ │ ┌─────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ Adapter (Tactical)                                  │ │ │ │
│ │ │ │   → API call [fails: 503]                           │ │ │ │
│ │ │ │   → wait 100ms                                      │ │ │ │
│ │ │ │   → API call [fails: 503]                           │ │ │ │
│ │ │ │   → wait 200ms                                      │ │ │ │
│ │ │ │   → API call [fails: 503]                           │ │ │ │
│ │ │ │   → tactical retries exhausted                      │ │ │ │
│ │ │ │   ← return PortError { retry: { attempts: 3 } }     │ │ │ │
│ │ │ └─────────────────────────────────────────────────────┘ │ │ │
│ │ │   ← map to AppError(UNAVAILABLE)                        │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │   ← return AppError                                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│   → isRetryable(UNAVAILABLE) = true                             │
│   → wait 500ms                                                  │
│   ↓                                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Attempt 2                                                   │ │
│ │   → [same flow, fails again]                                │ │
│ │   ← AppError(UNAVAILABLE)                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│   → wait 1000ms                                                 │
│   ↓                                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Attempt 3                                                   │ │
│ │   → [succeeds or final failure]                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│   → strategic retries exhausted                                 │
│   ← return AppError to caller                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Error Transformation

#### Error Mappings

Error mappings transform errors at architectural boundaries.

**Rules:**

_General (apply to all mappings):_

- **Exhaustive matching:** Use TypeScript's discriminated unions and `switch` to handle all `kind` values
- **Unknown kinds:** Trigger `assertNever(error)` to catch unmapped types at compile time
- **Preserve semantics:** Map similar failure modes consistently across layers

_When mapping to AppError:_

- **Error ID generation:** Call `generateErrorId()` for every `AppError` created
- **Meta stripping:** Always remove `meta` (diagnostic data never leaves the system)

**Locations:**

- `src/adapters/*/*/errors.ts`: `<Adapter>Error → <Port>Error`
- `src/application/errors.ts`: `DomainError | LibError | <Port>Error → AppError`
- `src/interface/*/errors.ts`: `<Interface>Error → AppError`
- `src/entrypoints/*`: `AppError → protocol response` (HTTP status, CLI exit code)

_Example: Exhaustive mapping with assertNever_

```ts
// src/lib/errors.ts
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

// src/application/errors.ts
function mapPortErrorToAppError(error: LlmPortError): AppError {
  switch (error.kind) {
    case 'RateLimitError':
      return { code: 'RATE_LIMITED', errorId: generateErrorId() };
    case 'TimeoutError':
      return { code: 'TIMEOUT', errorId: generateErrorId() };
    case 'NetworkError':
      return { code: 'UNAVAILABLE', errorId: generateErrorId() };
    case 'AuthError':
      return { code: 'UNAUTHORIZED', errorId: generateErrorId() };
    default:
      // TypeScript forces us to handle all cases
      // If a new kind is added, this line won't compile
      assertNever(error);
  }
}
```

#### Mapping Tables

ErrorCode -> HTTP

```
┌───────────────────────────────────────────────────────────────────────┐
│ ErrorCode        │ HTTP Status       │ Meaning summary                │
├───────────────────────────────────────────────────────────────────────┤
│ VALIDATION_ERROR │ 422               │ Unprocessable input/schema     │
│ BAD_REQUEST      │ 400               │ Malformed request syntax       │
│ NOT_FOUND        │ 404               │ Resource not found             │
│ CONFLICT         │ 409               │ Duplicate / state conflict     │
│ UNAUTHORIZED     │ 401               │ Missing or invalid auth token  │
│ FORBIDDEN        │ 403               │ Auth OK but action forbidden   │
│ RATE_LIMITED     │ 429               │ Too many requests / quota hit  │
│ TIMEOUT          │ 504               │ Upstream timeout / dependency  │
│ UNAVAILABLE      │ 503               │ Service temporarily unavailable│
│ INTEGRITY        │ 409               │ Data constraint violation      │
│ INTERNAL         │ 500               │ Unexpected internal failure    │
└───────────────────────────────────────────────────────────────────────┘
```

ErrorCode -> CLI (POSIX)

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ ErrorCode        │ CLI Status │ sysexits.h     │ Meaning summary                  │
├───────────────────────────────────────────────────────────────────────────────────┤
│ VALIDATION_ERROR │ 64         │ EX_USAGE       │ Invalid args or malformed input  │
│ BAD_REQUEST      │ 65         │ EX_DATAERR     │ Bad input data                   │
│ NOT_FOUND        │ 66         │ EX_NOINPUT     │ Missing input/resource           │
│ CONFLICT         │ 65         │ EX_DATAERR     │ Data conflict or state mismatch  │
│ UNAUTHORIZED     │ 77         │ EX_NOPERM      │ Missing/invalid credentials      │
│ FORBIDDEN        │ 77         │ EX_NOPERM      │ Permission denied                │
│ RATE_LIMITED     │ 75         │ EX_TEMPFAIL    │ Temporary failure, retry later   │
│ TIMEOUT          │ 75         │ EX_TEMPFAIL    │ Timeout, retry later             │
│ UNAVAILABLE      │ 69         │ EX_UNAVAILABLE │ Service unavailable              │
│ INTEGRITY        │ 65         │ EX_DATAERR     │ Data constraint violation        │
│ INTERNAL         │ 70         │ EX_SOFTWARE    │ Internal software error          │
└───────────────────────────────────────────────────────────────────────────────────┘

```

> CLI exit codes provide limited information — output structured JSON to stderr
> (including errorId) for accurate error tracing.
