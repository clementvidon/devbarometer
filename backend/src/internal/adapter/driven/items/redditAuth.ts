import type { FetchPort } from '../../../../application/ports/FetchPort';

type RedditTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

export async function getRedditAccessToken(
  fetcher: FetchPort,
): Promise<string> {
  const {
    REDDIT_CLIENT_ID: clientId,
    REDDIT_CLIENT_SECRET: clientSecret,
    REDDIT_USERNAME: username,
    REDDIT_PASSWORD: password,
  } = process.env;

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error('Missing Reddit credentials in env variables');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
  });

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
    throw new Error(`Reddit token fetch failed (${status}): ${msg}`);
  }

  const data = (await response.json()) as Partial<RedditTokenResponse>;

  if (!data.access_token) {
    throw new Error(
      `No access_token in Reddit response: ${JSON.stringify(data)}`,
    );
  }

  return data.access_token;
}
