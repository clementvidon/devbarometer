import { formatFloat } from '../../../utils/format.ts';
import { aggregateEmotionProfiles } from '../../usecase/aggregateEmotionProfiles.ts';
import { createEmotionProfiles } from '../../usecase/createEmotionProfiles.ts';
import { generateEmotionProfileReport } from '../../usecase/generateEmotionProfileReport.ts';
import type {
  AggregatedEmotionProfile,
  EmotionProfile,
} from '../entity/EmotionProfile.ts';
import type { EmotionProfileReport } from '../entity/EmotionProfileReport.ts';
import type { RelevantItem } from '../entity/Item.ts';
import type { ItemsProviderPort } from '../port/ItemsProviderPort.ts';
import type { LlmPort } from '../port/LlmPort.ts';
import type { PersistencePort } from '../port/PersistencePort.ts';
import type { RelevanceFilterPort } from '../port/RelevanceFilterPort.ts';
import type { WeightsPort } from '../port/WeightsPort.ts';
import type { HeadlineInfo } from '../types/HeadlineInfo.ts';

export class AgentService {
  constructor(
    private readonly itemsProvider: ItemsProviderPort,
    private readonly llm: LlmPort,
    private readonly persistence: PersistencePort,
    private readonly relevance: RelevanceFilterPort,
    private readonly weights: WeightsPort,
  ) {}

  async updateReport(): Promise<void> {
    const items = await this.itemsProvider.getItems();
    const fetchLabel = this.itemsProvider.getLabel();
    const createdAt =
      this.itemsProvider.getCreatedAt() ?? new Date().toISOString();
    console.log(
      `[AgentService] Got ${items.length} items from provider: ${fetchLabel}`,
    );

    const prevItems = await this.getPrevRelevantItemsAt(createdAt);
    for (const it of prevItems) {
      console.log(
        `<prevItems> score: ${formatFloat(it.score)}, title: ${it.title}`,
      );
    }

    const relevantItems = await this.relevance.filterItems(items);
    console.log(
      `[AgentService] Selected ${relevantItems.length}/${items.length} items relevant to the tech job market.`,
    );
    for (const it of relevantItems ?? []) {
      console.log(
        `<relevantItems> score: ${formatFloat(it.score)}, title: ${it.title}`,
      );
    }

    const weightedItems = await this.weights.computeWeights(
      relevantItems,
      prevItems,
    );
    for (const it of (weightedItems ?? [])
      .slice()
      .sort((a, b) => b.weight - a.weight)) {
      console.log(
        `<weightedItems> weight: ${formatFloat(it.weight)}, title: ${it.title}`,
      );
    }
    console.log(`[AgentService] Computed weight of each item.`);

    const emotionProfilePerItem = await createEmotionProfiles(
      weightedItems,
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
      `[AgentService] New report generated at ${this.itemsProvider.getCreatedAt() ?? new Date().toISOString()}`,
    );

    console.log(aggregatedEmotionProfile);
    console.log(report);

    await this.persistence.storeSnapshotAt(createdAt, {
      fetchLabel,
      items,
      relevantItems,
      weightedItems,
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

  async getLastTopHeadlines(limit: number): Promise<HeadlineInfo[]> {
    const last: EmotionProfile[] | null = await this.getLastEmotionProfiles();

    if (!last) return [];

    return last
      .slice()
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
      .map((item) => ({
        title: item.title,
        weight: formatFloat(item.weight, 0),
        source: item.source,
      }));
  }

  async getAggregatedEmotionProfiles(): Promise<
    {
      createdAt: string;
      emotions: AggregatedEmotionProfile['emotions'];
      tonalities: AggregatedEmotionProfile['tonalities'];
      totalWeight: number;
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
        totalWeight: s.aggregatedEmotionProfile.totalWeight,
      }));
  }

  async getPrevRelevantItemsAt(createdAtISO: string): Promise<RelevantItem[]> {
    const snapshots = await this.persistence.getSnapshots();
    const target = Date.parse(createdAtISO);

    const prev =
      snapshots
        .filter((s) => Date.parse(s.createdAt) < target)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ??
      null;

    return prev?.relevantItems ?? [];
  }
}
