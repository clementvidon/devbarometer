import { analyzeSentiments } from '../../usecase/analyzeSentiments.ts';
import { compressSentiments } from '../../usecase/compressSentiments.ts';
import { fetchRedditPosts } from '../../usecase/fetchRedditPosts.ts';
import { filterRelevantPosts } from '../../usecase/filterRelevantPosts.ts';
import { generateSentimentReport } from '../../usecase/generateSentimentReport.ts';
import type { AverageSentiment, Sentiment } from '../entity/Sentiment.ts';
import type { SentimentReport } from '../entity/SentimentReport.ts';
import type { FetchPort } from '../port/FetchPort.ts';
import type { LlmPort } from '../port/LlmPort.ts';
import type { PersistencePort } from '../port/PersistencePort.ts';
import type { HeadlineInfo } from '../types/HeadlineInfo.ts';

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
    subreddit: string = 'developpeurs',
    limit: number = 100,
    period: string = 'week',
  ): Promise<void> {
    const { posts, fetchUrl } = await fetchRedditPosts(
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
    console.log('[AgentService] Computed average sentiment.');

    const report = await generateSentimentReport(averageSentiment, this.llm);
    console.log(
      `[AgentService] New report generated at ${new Date().toISOString()}`,
    );

    console.log(averageSentiment);
    console.log(report);

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

  async getLastSentiments(): Promise<Sentiment[] | null> {
    const snapshots = await this.persistence.getSnapshots();
    return snapshots[0]?.sentimentPerPost ?? null;
  }

  async getLastSentimentReport(): Promise<SentimentReport | null> {
    const snapshots = await this.persistence.getSnapshots();
    return snapshots[0]?.report ?? null;
  }

  async getLastTopHeadlines(limit = 5): Promise<HeadlineInfo[]> {
    const last: Sentiment[] | null = await this.getLastSentiments();

    if (!last) return [];

    return last
      .slice()
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, limit)
      .map((post) => ({
        title: post.title,
        upvotes: post.upvotes,
        url: `https://www.reddit.com/comments/${post.postId}`,
      }));
  }

  async getAverageSentiments(): Promise<
    { createdAt: string; emotions: AverageSentiment['emotions'] }[]
  > {
    const snapshots = await this.persistence.getSnapshots();

    return snapshots.map((s) => ({
      createdAt: s.createdAt,
      emotions: s.averageSentiment.emotions,
    }));
  }
}
