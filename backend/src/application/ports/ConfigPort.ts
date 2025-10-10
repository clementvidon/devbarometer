/**
 * TODO
 *
 * Contract:
 * - TODO
 */
export interface ConfigPort {
  readonly port: number;
  readonly databaseUrl: string;
  readonly openaiApiKey: string;

  readonly redditUrl: string;
  readonly redditClientId: string;
  readonly redditClientSecret: string;
  readonly redditUsername: string;
  readonly redditPassword: string;
}
