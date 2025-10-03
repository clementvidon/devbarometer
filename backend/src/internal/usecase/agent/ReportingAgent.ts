import { aggregateProfiles } from '../../core/domain/profiles/aggregateProfiles';
import type { WeightedItem } from '../../core/entity/Item';
import type { AgentPort } from '../../core/port/AgentPort';
import type { ItemsProviderPort } from '../../core/port/ItemsProviderPort';
import type { LlmPort } from '../../core/port/LlmPort';
import type { PersistencePort } from '../../core/port/PersistencePort';
import type { WeightsPort } from '../../core/port/WeightsPort';
import { formatFloat } from '../../lib/number/formatFloat';
import { nowIso } from '../../lib/time/nowIso';
import { createProfiles } from '../profiles/createProfiles';
import { createReport } from '../profiles/createReport';
import { getRelevantItemsBefore } from '../queries/getRelevantItemsBefore';
import { filterRelevantItems } from '../relevance/filterRelevantItems';

export function sortByWeightDesc(items: WeightedItem[]): WeightedItem[] {
  return items.slice().sort((a, b) => b.weight - a.weight);
}

export class ReportingAgent implements AgentPort {
  constructor(
    private readonly items: ItemsProviderPort,
    private readonly llm: LlmPort,
    private readonly persistence: PersistencePort,
    private readonly weights: WeightsPort,
  ) {}

  async captureSnapshot(): Promise<void> {
    console.log(`=== PIPELINE START ===`);
    const items = await this.items.getItems();
    console.log(`[Agent] Got ${items.length} items`);
    const label = this.items.getLabel();
    const createdAt = this.items.getCreatedAt() ?? nowIso();
    const previous = await getRelevantItemsBefore(createdAt, this.persistence);
    console.log(`[Agent] Got ${previous.length} previous`);
    const relevant = await filterRelevantItems(items, this.llm);
    console.log(`[Agent] Got ${relevant.length} relevant`);
    const weighted = await this.weights.computeWeights(relevant, previous);
    console.log(`[Agent] Computed weights`);
    const profiles = await createProfiles(weighted, this.llm);
    console.log(`[Agent] Computed profiles`);
    const aggregated = aggregateProfiles(profiles);
    console.log(`[Agent] Aggregated profiles`);
    const report = await createReport(aggregated, this.llm);
    console.log(`[Agent] Created report`);
    await this.persistence.storeSnapshotAt(createdAt, {
      fetchLabel: label,
      items,
      relevantItems: relevant,
      weightedItems: weighted,
      emotionProfilePerItem: profiles,
      aggregatedEmotionProfile: aggregated,
      report,
    });
    console.log(`[Agent] Persisted data`);
    console.log(`=== PIPELINE FINISH ===\n\n`);

    console.log(`=== DETAILS ===\n\n`);
    console.log(`>>> previous <<<`);
    for (const it of previous) {
      console.log(` score: ${formatFloat(it.score)}, title: ${it.title}`);
    }
    console.log(`>>> relevant <<<`);
    for (const it of relevant ?? []) {
      console.log(` score: ${formatFloat(it.score)}, title: ${it.title}`);
    }
    console.log(`>>> weights <<<`);
    for (const it of sortByWeightDesc(weighted ?? [])) {
      console.log(` weight: ${formatFloat(it.weight)}, title: ${it.title}`);
    }
    console.log(`>>> aggregated <<<`);
    console.log(aggregated);
    console.log(`>>> report <<<`);
    console.log(report);
  }
}
