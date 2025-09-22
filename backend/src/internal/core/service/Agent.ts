import { formatFloat } from '../../../utils/format.ts';
import { aggregateProfiles } from '../../usecase/aggregateProfiles.ts';
import { createReport } from '../../usecase/createReport.ts';
import { createProfiles } from '../../usecase/profiles/createProfiles.ts';
import { filterRelevantItems } from '../../usecase/relevance/filterRelevantItems.ts';
import type {
  AggregatedEmotionProfile,
  EmotionProfile,
} from '../entity/EmotionProfile.ts';
import type { RelevantItem } from '../entity/Item.ts';
import type { Report } from '../entity/Report.ts';
import type { ItemsProviderPort } from '../port/ItemsProviderPort.ts';
import type { LlmPort } from '../port/LlmPort.ts';
import type { PersistencePort } from '../port/PersistencePort.ts';
import type { WeightsPort } from '../port/WeightsPort.ts';

export class Agent {
  constructor(
    private readonly itemsProvider: ItemsProviderPort,
    private readonly llm: LlmPort,
    private readonly persistence: PersistencePort,
    private readonly weights: WeightsPort,
  ) {}

  async updateReport(): Promise<void> {
    const items = await this.itemsProvider.getItems();
    const fetchLabel = this.itemsProvider.getLabel();
    const createdAt =
      this.itemsProvider.getCreatedAt() ?? new Date().toISOString();
    console.log(
      `[Agent] Got ${items.length} items from provider: ${fetchLabel}`,
    );

    const prevItems = await this.getRelevantItemsBefore(createdAt);
    for (const it of prevItems) {
      console.log(
        `<prevItems> score: ${formatFloat(it.score)}, title: ${it.title}`,
      );
    }

    const relevantItems = await filterRelevantItems(items, this.llm);
    console.log(
      `[Agent] Selected ${relevantItems.length}/${items.length} items relevant to the tech job market.`,
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
    console.log(`[Agent] Computed weight of each item.`);

    const emotionProfilePerItem = await createProfiles(weightedItems, this.llm);
    console.log('[Agent] Completed emotionProfile analysis on selected items.');

    const aggregatedEmotionProfile = aggregateProfiles(emotionProfilePerItem);
    console.log('[Agent] Computed aggregated emotionProfile.');

    const report = await createReport(aggregatedEmotionProfile, this.llm);
    console.log(
      `[Agent] New report generated at ${this.itemsProvider.getCreatedAt() ?? new Date().toISOString()}`,
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

  async getLastProfiles(): Promise<EmotionProfile[] | null> {
    const snapshots = await this.persistence.getSnapshots();
    return snapshots[0]?.emotionProfilePerItem ?? null;
  }

  async getLastReport(): Promise<Report | null> {
    const snapshots = await this.persistence.getSnapshots();
    return snapshots[0]?.report ?? null;
  }

  async getAggregatedProfiles(): Promise<
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

  async getRelevantItemsBefore(createdAtISO: string): Promise<RelevantItem[]> {
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
