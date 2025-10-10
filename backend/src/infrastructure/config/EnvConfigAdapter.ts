import 'dotenv/config';
import { z } from 'zod';
import type { ConfigPort } from '../../application/ports/ConfigPort';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL missing'),

  // Optional for non-agent commands
  OPENAI_API_KEY: z.string().default(''),
  REDDIT_URL: z
    .union([z.string().url('REDDIT_URL must be a valid URL'), z.literal('')])
    .default(''),
  REDDIT_CLIENT_ID: z.string().default(''),
  REDDIT_CLIENT_SECRET: z.string().default(''),
  REDDIT_USERNAME: z.string().default(''),
  REDDIT_PASSWORD: z.string().default(''),
});

export class EnvConfigAdapter implements ConfigPort {
  readonly port: number;
  readonly databaseUrl: string;
  readonly openaiApiKey: string;

  readonly redditUrl: string;
  readonly redditClientId: string;
  readonly redditClientSecret: string;
  readonly redditUsername: string;
  readonly redditPassword: string;

  constructor(env = process.env) {
    const parsed = EnvSchema.safeParse(env);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw new Error(`Invalid environment: ${msg}`);
    }
    const v = parsed.data;
    this.port = v.PORT;
    this.databaseUrl = v.DATABASE_URL;
    this.openaiApiKey = v.OPENAI_API_KEY;

    this.redditUrl = v.REDDIT_URL;
    this.redditClientId = v.REDDIT_CLIENT_ID;
    this.redditClientSecret = v.REDDIT_CLIENT_SECRET;
    this.redditUsername = v.REDDIT_USERNAME;
    this.redditPassword = v.REDDIT_PASSWORD;
  }
}
