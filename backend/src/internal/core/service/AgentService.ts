import { aggregateEmotionProfiles } from '../../usecase/aggregateEmotionProfiles.ts';
import { analyzeEmotionProfiles } from '../../usecase/analyzeEmotionProfiles.ts';
import { fetchRedditPosts } from '../../usecase/fetchRedditPosts.ts';
import { filterRelevantPosts } from '../../usecase/filterRelevantPosts.ts';
import { generateEmotionProfileReport } from '../../usecase/generateEmotionProfileReport.ts';
import type {
  AggregatedEmotionProfile,
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

    const emotionProfilePerPost = await analyzeEmotionProfiles(
      relevantPosts,
      this.llm,
    );
    console.log(
      '[AgentService] Completed emotionProfile analysis on selected posts.',
    );

    const aggregatedEmotionProfile = aggregateEmotionProfiles(
      emotionProfilePerPost,
    );
    console.log('[AgentService] Computed aggregated emotionProfile.');

    const report = await generateEmotionProfileReport(
      aggregatedEmotionProfile,
      this.llm,
    );
    console.log(
      `[AgentService] New report generated at ${new Date().toISOString()}`,
    );

    console.log(aggregatedEmotionProfile);
    console.log(report);

    await this.persistence.storeSnapshot({
      subreddit,
      fetchUrl: fetchUrl,
      posts,
      relevantPosts,
      emotionProfilePerPost,
      aggregatedEmotionProfile,
      report,
    });
  }

  async getLastEmotionProfiles(): Promise<EmotionProfile[] | null> {
    const snapshots = await this.persistence.getSnapshots();
    return snapshots[0]?.emotionProfilePerPost ?? null;
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
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
      .map((post) => ({
        title: post.title,
        weight: post.weight,
        source: post.source,
      }));
  }

  async getAggregatedEmotionProfiles(): Promise<
    {
      createdAt: string;
      emotions: AggregatedEmotionProfile['emotions'];
      tonalities: AggregatedEmotionProfile['tonalities'];
    }[]
  > {
    const snapshots = await this.persistence.getSnapshots();

    return snapshots
      .filter((s) => {
        const ok = !!s.aggregatedEmotionProfile;
        if (!ok) {
          console.warn(
            `[getAggregatedEmotionProfiles] Skipping snapshot without aggregate: ${s.createdAt}`,
          );
        }
        return ok;
      })
      .map((s) => ({
        createdAt: s.createdAt,
        emotions: s.aggregatedEmotionProfile.emotions,
        tonalities: s.aggregatedEmotionProfile.tonalities,
      }));
  }
}
