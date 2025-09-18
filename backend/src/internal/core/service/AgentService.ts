import { formatFloat } from '../../../utils/format.ts';
import { logItemsOnePerLine } from '../../../utils/logItems.ts';
import { aggregateEmotionProfiles } from '../../usecase/aggregateEmotionProfiles.ts';
import { computeMomentumWeights } from '../../usecase/computeMomentumWeights.ts';
import { computeWeightsCap } from '../../usecase/computeWeightsCap.ts';
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
import type { HeadlineInfo } from '../types/HeadlineInfo.ts';

const CAP_OPTS = {
  minN: 10,
  percentile: 0.95,
  percentileSmallN: 0.9,
  baseWeight: 1,
  concentrationGate: 0.35,
} as const;

export class AgentService {
  constructor(
    private readonly itemsProvider: ItemsProviderPort,
    private readonly llm: LlmPort,
    private readonly persistence: PersistencePort,
    private readonly relevance: RelevanceFilterPort,
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
    logItemsOnePerLine('prevItems', prevItems ?? []);

    const relevantItems = await this.relevance.filterItems(items);
    console.log(
      `[AgentService] Selected ${relevantItems.length}/${items.length} items relevant to the tech job market.`,
    );
    logItemsOnePerLine('relevantItems', relevantItems);

    const momentumItems = computeMomentumWeights(relevantItems, prevItems);
    logItemsOnePerLine('momentumItems', momentumItems);

    console.log(
      `[AgentService] Computed momentum (1+log1p Δ, floor=1) for ${momentumItems.length} items${prevItems ? ` using ${prevItems.length} baseline items` : ''}.`,
    );

    const {
      cappedItems,
      capped,
      reason,
      capValue,
      usedPercentile,
      topShare,
      N,
    } = computeWeightsCap(momentumItems, CAP_OPTS);
    const mode = N < CAP_OPTS.minN ? 'smallN' : 'always';
    console.log(
      `[AgentService] cap mode=${mode} ${capped ? 'APPLIED' : 'SKIPPED'} reason=${reason} ` +
        `cap=${capValue?.toFixed(3)} N=${N} topShare=${topShare.toFixed(2)} p=${usedPercentile?.toFixed(2)}`,
    );

    const sum = cappedItems.reduce((s, i) => s + i.weight, 0);
    const mean = sum / Math.max(1, cappedItems.length);
    const weightedItems =
      mean > 0
        ? cappedItems.map((i) => ({ ...i, weight: i.weight / mean }))
        : cappedItems;
    console.log(
      `[AgentService] Renorm: mean=${mean.toFixed(3)} (target=1.000)`,
    );

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

  async getPrevRelevantItemsAt(
    createdAtISO: string,
  ): Promise<RelevantItem[] | null> {
    const snapshots = await this.persistence.getSnapshots();
    const target = Date.parse(createdAtISO);

    const prev =
      snapshots
        .filter((s) => Date.parse(s.createdAt) < target)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ??
      null;

    return prev?.relevantItems ?? null;
  }
}
