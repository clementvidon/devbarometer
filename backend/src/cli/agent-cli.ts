import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import OpenAI from 'openai';
import type { FetchPort } from '../application/ports/FetchPort';
import type { LlmPort } from '../application/ports/LlmPort';
import type { PersistencePort } from '../application/ports/PersistencePort';
import { makeReportingAgent } from '../application/usecases/agent/makeReportingAgent';
import type { ReportingAgentConfig } from '../infrastructure/config/loaders';
import { loadReportingAgentConfig } from '../infrastructure/config/loaders';
import { NodeFetchAdapter } from '../infrastructure/fetch/NodeFetchAdapter';
import type { RedditCredentials } from '../infrastructure/items/redditAuth';
import { RedditItemsAdapter } from '../infrastructure/items/RedditItemsAdapter';
import { OpenAIAdapter } from '../infrastructure/llm/OpenAIAdapter';
import { PostgresAdapter } from '../infrastructure/persistence/PostgresAdapter';

type Deps = {
  fetcher: FetchPort;
  persistence: PersistencePort;
  llm: LlmPort;
  redditUrl: string;
  redditCreds: RedditCredentials;
};

export function buildCLIReportingAgent(deps: Deps) {
  const provider = new RedditItemsAdapter(
    deps.fetcher,
    deps.redditUrl,
    deps.redditCreds,
  );
  return makeReportingAgent(provider, deps.llm, deps.persistence);
}

export function depsFromConfig(config: ReportingAgentConfig): Deps {
  const { databaseUrl, openaiApiKey, reddit } = config;

  return {
    redditUrl: reddit.url,
    fetcher: new NodeFetchAdapter(globalThis.fetch),
    persistence: new PostgresAdapter(databaseUrl),
    llm: new OpenAIAdapter(new OpenAI({ apiKey: openaiApiKey })),
    redditCreds: {
      clientId: reddit.clientId,
      clientSecret: reddit.clientSecret,
      username: reddit.username,
      password: reddit.password,
    },
  };
}

export async function runCLI() {
  const config = loadReportingAgentConfig();
  const agent = buildCLIReportingAgent(depsFromConfig(config));
  await agent.captureSnapshot();
}

const entryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;

if (import.meta.url === entryUrl) {
  try {
    await runCLI();
    process.exit(0);
  } catch (err) {
    console.error('ReportingAgent run failed:', err);
    process.exit(1);
  }
}
