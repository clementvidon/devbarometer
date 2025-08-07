import { analyzeEmotionProfiles } from '../../usecase/analyzeEmotionProfiles.ts';
import { compressEmotionProfiles } from '../../usecase/compressEmotionProfiles.ts';
import { fetchRedditPosts } from '../../usecase/fetchRedditPosts.ts';
import { filterRelevantPosts } from '../../usecase/filterRelevantPosts.ts';
import { generateEmotionProfileReport } from '../../usecase/generateEmotionProfileReport.ts';
import type {
  AverageEmotionProfile,
  EmotionProfile,
} from '../entity/EmotionProfile.ts';
import type { EmotionProfileReport } from '../entity/EmotionProfileReport.ts';
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

    const sentimentPerPost = await analyzeEmotionProfiles(
      relevantPosts,
      this.llm,
    );
    console.log(
      '[AgentService] Completed sentiment analysis on selected posts.',
    );

    const averageEmotionProfile = compressEmotionProfiles(sentimentPerPost);
    console.log('[AgentService] Computed average sentiment.');

    const report = await generateEmotionProfileReport(
      averageEmotionProfile,
      this.llm,
    );
    console.log(
      `[AgentService] New report generated at ${new Date().toISOString()}`,
    );

    console.log(averageEmotionProfile);
    console.log(report);

    await this.persistence.storeSnapshot({
      subreddit,
      fetchUrl: fetchUrl,
      posts,
      relevantPosts,
      sentimentPerPost,
      averageEmotionProfile,
      report,
    });
  }

  async getLastEmotionProfiles(): Promise<EmotionProfile[] | null> {
    const snapshots = await this.persistence.getSnapshots();
    return snapshots[0]?.sentimentPerPost ?? null;
  }

  async getLastEmotionProfileReport(): Promise<EmotionProfileReport | null> {
    const snapshots = await this.persistence.getSnapshots();
    return snapshots[0]?.report ?? null;
  }

  async getLastTopHeadlines(limit = 5): Promise<HeadlineInfo[]> {
    const last: EmotionProfile[] | null = await this.getLastEmotionProfiles();

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

  async getAverageEmotionProfiles(): Promise<
    { createdAt: string; emotions: AverageEmotionProfile['emotions'] }[]
  > {
    const snapshots = await this.persistence.getSnapshots();

    return snapshots.map((s) => ({
      createdAt: s.createdAt,
      emotions: s.averageEmotionProfile.emotions,
    }));
  }
}
