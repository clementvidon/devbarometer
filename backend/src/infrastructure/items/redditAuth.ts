import type { FetchPort } from '../../application/ports/output/FetchPort';
import type { LoggerPort } from '../../application/ports/output/LoggerPort';

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

  log?.debug('Requesting Reddit access token');
  const response = await fetcher.fetch(
    'https://www.reddit.com/api/v1/access_token',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'devbarometer/1.0 (https://github.com/clementvidon/devbarometer by u/clem9nt)',
      },
      body,
    },
  );

  if (!('ok' in response) || !response.ok) {
    const msg = 'text' in response ? await response.text() : '<no text>';
    const status = 'status' in response ? response.status : '???';
    log?.debug('Reddit token fetch failed', { status, msg });
    throw new Error(`Reddit token fetch failed (${String(status)}): ${msg}`);
  }

  const data = (await response.json()) as Partial<RedditTokenResponse>;

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
