import { aggregateEmotionProfiles } from '../../usecase/aggregateEmotionProfiles.ts';
import { createEmotionProfiles } from '../../usecase/createEmotionProfiles.ts';
import { fetchRedditItems } from '../../usecase/fetchRedditItems.ts';
import { filterRelevantItems } from '../../usecase/filterRelevantItems.ts';
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
    const { items, fetchUrl } = await fetchRedditItems(
      this.fetcher,
      subreddit,
      limit,
      period,
    );

    console.log(
      `[AgentService] Fetched ${items.length} top items from "r/${subreddit}" for the past ${period}.`,
    );

    const relevantItems = await filterRelevantItems(items, this.llm);
    console.log(
      `[AgentService] Selected ${relevantItems.length}/${items.length} items relevant to the tech job market.`,
    );

    const emotionProfilePerItem = await createEmotionProfiles(
      relevantItems,
      this.llm,
    );
    console.log(
      '[AgentService] Completed emotionProfile analysis on selected items.',
    );

    const aggregatedEmotionProfile = aggregateEmotionProfiles(
      emotionProfilePerItem,
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
      items,
      relevantItems,
      emotionProfilePerItem,
      aggregatedEmotionProfile,
      report,
    });
  }

  async getLastEmotionProfiles(): Promise<EmotionProfile[] | null> {
    const snapshots = await this.persistence.getSnapshots();
    return snapshots[0]?.emotionProfilePerItem ?? null;
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
      .map((item) => ({
        title: item.title,
        weight: item.weight,
        source: item.source,
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
