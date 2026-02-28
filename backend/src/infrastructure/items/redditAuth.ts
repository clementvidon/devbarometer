import type { FetchPort } from '../../application/ports/output/FetchPort';
import type { LoggerPort } from '../../application/ports/output/LoggerPort';
import { fetchWithRetry } from '../../lib/http/fetchWithRetry';

type RedditTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

export type RedditCredentials = {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
};

export const DEFAULT_REDDIT_USER_AGENT =
  'devbarometer/1.0 (https://github.com/clementvidon/devbarometer by u/clem9nt)';

const TOKEN_FETCH_MAX_ATTEMPTS = 3;
const TOKEN_FETCH_TIMEOUT_MS = 15_000;

export async function getRedditAccessToken(
  fetcher: FetchPort,
  creds: RedditCredentials,
  logger?: LoggerPort,
): Promise<string> {
  const log = logger?.child({ module: 'items.reddit.auth' });
  const { clientId, clientSecret, username, password } = creds;

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error('Missing Reddit credentials in env variables');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
  });

  log?.debug('Requesting Reddit access token', {
    maxRetries: TOKEN_FETCH_MAX_ATTEMPTS,
    timeoutMs: TOKEN_FETCH_TIMEOUT_MS,
  });

  const result = await fetchWithRetry(
    fetcher,
    'https://www.reddit.com/api/v1/access_token',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': DEFAULT_REDDIT_USER_AGENT,
      },
      body,
    },
    {
      maxRetries: TOKEN_FETCH_MAX_ATTEMPTS,
      timeoutMs: TOKEN_FETCH_TIMEOUT_MS,
    },
  );

  if (!result.ok) {
    log?.debug('Reddit token fetch failed', {
      code: result.code,
      status: result.status ?? null,
      retryable: result.retryable,
      retryAfterMs: result.retryAfterMs ?? null,
      error: result.error,
    });
    throw new Error(
      `Reddit token fetch failed: ${JSON.stringify({
        code: result.code,
        status: result.status ?? null,
        retryable: result.retryable,
        retryAfterMs: result.retryAfterMs ?? null,
      })}`,
    );
  }

  const data = (await result.res.json()) as Partial<RedditTokenResponse>;

  if (!data.access_token) {
    log?.debug('No access_token in Reddit response', { data });
    throw new Error(
      `No access_token in Reddit response: ${JSON.stringify(data)}`,
    );
  }

  log?.debug('Received Reddit access token', {
    token_type: data.token_type,
    expires_in: data.expires_in,
    scope: data.scope,
  });
  return data.access_token;
}
