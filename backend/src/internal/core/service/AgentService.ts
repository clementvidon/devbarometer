import { aggregateEmotionProfiles } from '../../usecase/aggregateEmotionProfiles.ts';
import { computeMomentumWeights } from '../../usecase/computeMomentumWeights.ts';
import { computeWeightsCap } from '../../usecase/computeWeightsCap.ts';
import { createEmotionProfiles } from '../../usecase/createEmotionProfiles.ts';
import { filterRelevantItems } from '../../usecase/filterRelevantItems.ts';
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
import type { HeadlineInfo } from '../types/HeadlineInfo.ts';

type SnapshotLike = { createdAt: string };

function sortSnapshotsDesc<T extends SnapshotLike>(arr: T[]): T[] {
  return arr.slice().sort((a, b) => {
    const tb = Date.parse(b.createdAt);
    const ta = Date.parse(a.createdAt);
    if (!Number.isNaN(tb) && !Number.isNaN(ta)) return tb - ta;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export class AgentService {
  private readonly itemsProvider: ItemsProviderPort;
  private readonly llm: LlmPort;
  private readonly persistence: PersistencePort;

  constructor(
    itemsProvider: ItemsProviderPort,
    llm: LlmPort,
    persistence: PersistencePort,
  ) {
    this.itemsProvider = itemsProvider;
    this.llm = llm;
    this.persistence = persistence;
  }

  async updateReport(): Promise<void> {
    const items = await this.itemsProvider.getItems();
    const fetchLabel = this.itemsProvider.getLabel();
    const createdAt =
      this.itemsProvider.getCreatedAt() ?? new Date().toISOString();

    console.log(
      `[AgentService] Got ${items.length} items from provider: ${fetchLabel}`,
    );

    const relevantItems = await filterRelevantItems(items, this.llm);
    console.log(
      `[AgentService] Selected ${relevantItems.length}/${items.length} items relevant to the tech job market.`,
    );
    console.log(relevantItems);

    const prevItems = await this.getPrevRelevantItems();
    const momentumItems = computeMomentumWeights(relevantItems, prevItems);
    console.log(
      `[AgentService] Computed momentum (log1p Δ) for ${momentumItems.length} items${prevItems ? ` using ${prevItems.length} baseline items` : ''}.`,
    );

    const { cappedItems, capped, reason, capValue, topShare, N } =
      computeWeightsCap(momentumItems, {
        minN: 20,
        topShareThreshold: 0.5,
        percentile: 0.95,
      });
    console.log(
      `[AgentService] cap p95 ${capped ? 'APPLIED' : 'SKIPPED'} reason=${reason} cap=${capValue?.toFixed(3)} N=${N} topShare=${topShare.toFixed(2)}`,
    );

    const weightedItems = cappedItems;
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
        weight: item.weight,
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
    const snapshots = sortSnapshotsDesc(await this.persistence.getSnapshots());

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

  async getPrevRelevantItems(): Promise<RelevantItem[] | null> {
    const snapshots = sortSnapshotsDesc(await this.persistence.getSnapshots());
    return snapshots[1]?.relevantItems ?? null;
  }
}
