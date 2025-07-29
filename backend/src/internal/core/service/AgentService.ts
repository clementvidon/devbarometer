import { makeRedditTopUrl } from '../../../utils/redditUrl.ts';
import { analyzeSentiments } from '../../usecase/analyzeSentiments.ts';
import { compressSentiments } from '../../usecase/compressSentiments.ts';
import { fetchRedditPosts } from '../../usecase/fetchRedditPosts.ts';
import { filterRelevantPosts } from '../../usecase/filterRelevantPosts.ts';
import { generateSentimentReport } from '../../usecase/generateSentimentReport.ts';
import type { SentimentReport } from '../entity/SentimentReport.ts';
import type { FetchPort } from '../port/FetchPort.ts';
import type { LlmPort } from '../port/LlmPort.ts';
import type { PersistencePort } from '../port/PersistencePort.ts';

export class AgentService {
  private readonly fetcher: FetchPort;
  private readonly llm: LlmPort;
  private readonly persistence: PersistencePort;

  constructor(fetcher: FetchPort, llm: LlmPort, persistence: PersistencePort) {
    this.fetcher = fetcher;
    this.llm = llm;
    this.persistence = persistence;
  }

  async updateReport(
    subreddit: string,
    limit: number,
    period: string,
  ): Promise<void> {
    const fetchUrl = makeRedditTopUrl(subreddit, limit, period);

    const posts = await fetchRedditPosts(
      this.fetcher,
      subreddit,
      limit,
      period,
    );
    console.log(
      `[AgentService] Fetched ${posts.length} top posts from "r/${subreddit}" for the past ${period}.`,
    );

    const relevantPosts = await filterRelevantPosts(posts, this.llm);
    console.log(
      `[AgentService] Selected ${relevantPosts.length}/${posts.length} posts relevant to the tech job market.`,
    );

    const sentimentPerPost = await analyzeSentiments(relevantPosts, this.llm);
    console.log(
      '[AgentService] Completed sentiment analysis on selected posts.',
    );

    const averageSentiment = compressSentiments(sentimentPerPost);
    console.log('[AgentService] Computed average sentiment:', averageSentiment);

    const report = await generateSentimentReport(averageSentiment, this.llm);
    console.log(
      `[AgentService] New report generated at ${new Date().toISOString()}`,
    );

    await this.persistence.storeSnapshot({
      subreddit,
      fetchUrl: fetchUrl,
      posts,
      relevantPosts,
      sentimentPerPost,
      averageSentiment,
      report,
    });
  }

  async getLastReport(): Promise<SentimentReport | null> {
    const snapshots = await this.persistence.getSnapshots();
    return snapshots[0]?.report ?? null;
  }
}
