import { formatFloat } from '../../../utils/format.ts';
import type { ItemsProviderPort } from '../../core/port/ItemsProviderPort.ts';
import type { LlmPort } from '../../core/port/LlmPort.ts';
import type { PersistencePort } from '../../core/port/PersistencePort.ts';
import type { WeightsPort } from '../../core/port/WeightsPort.ts';
import { aggregateProfiles } from '../profiles/aggregateProfiles.ts';
import { createProfiles } from '../profiles/createProfiles.ts';
import { createReport } from '../profiles/createReport.ts';
import { getRelevantItemsBefore } from '../queries/getRelevantItemsBefore.ts';
import { filterRelevantItems } from '../relevance/filterRelevantItems.ts';

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

    const prevItems = await getRelevantItemsBefore(createdAt, this.persistence);
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
}
