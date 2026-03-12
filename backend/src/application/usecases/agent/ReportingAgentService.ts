import type { WeightedItem } from '../../../domain/entities';
import { aggregateSentimentProfiles } from '../../../domain/services/profiles/aggregateSentimentProfiles';
import { attachWeightsToSentimentProfiles } from '../../../domain/services/profiles/attachWeightsToSentimentProfiles';
import { formatFloat } from '../../../lib/number/formatFloat';
import { roundNumber } from '../../../lib/number/roundNumber';
import { nowIso } from '../../../lib/time/nowIso';
import { withSpan } from '../../observability/withSpan';
import type { ReportingAgentPort } from '../../ports/input/ReportingAgentPort';
import type { ItemsProviderPort } from '../../ports/output/ItemsProviderPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type { PersistencePort } from '../../ports/output/PersistencePort';
import type { ComputeMomentumWeightsPort } from '../../ports/pipeline/ComputeMomentumWeightsPort';
import type { CreateReportPort } from '../../ports/pipeline/CreateReportPort';
import type { CreateSentimentProfilesPort } from '../../ports/pipeline/CreateSentimentProfilesPort';
import type { FilterRelevantItemsPort } from '../../ports/pipeline/FilterRelevantItemsPort';
import { getLastRelevantItemsBefore } from '../queries/getLastRelevantItemsBefore';

export function sortByWeightDesc(items: WeightedItem[]): WeightedItem[] {
  return items.slice().sort((a, b) => b.weight - a.weight);
}

export class ReportingAgentService implements ReportingAgentPort {
  constructor(
    private readonly logger: LoggerPort,
    private readonly items: ItemsProviderPort,
    private readonly persistence: PersistencePort,
    private readonly relevance: FilterRelevantItemsPort,
    private readonly profiles: CreateSentimentProfilesPort,
    private readonly weights: ComputeMomentumWeightsPort,
    private readonly report: CreateReportPort,
  ) {}

  async captureSnapshot(): Promise<void> {
    const log = this.logger.child({ module: 'agent.reporting' });
    const startedAt = performance.now();
    const createdAt = this.items.getCreatedAt() ?? nowIso();
    const snapshotDay = createdAt.slice(0, 10);

    log.info('Snapshot started', { createdAt, snapshotDay });

    const items = await withSpan(log, 'getItems', () => this.items.getItems());
    log.info('Items fetched', { count: items.length });

    const relevant = await withSpan(
      log,
      this.relevance.filterRelevantItems.name,
      () => this.relevance.filterRelevantItems(log, items),
    );
    log.info('Relevant items filtered', { relevant: relevant.length });

    const [presentProfiles, previousRelevantItems] = await Promise.all([
      withSpan(log, this.profiles.createSentimentProfiles.name, () =>
        this.profiles.createSentimentProfiles(log, relevant),
      ),
      withSpan(log, getLastRelevantItemsBefore.name, () =>
        getLastRelevantItemsBefore(createdAt, this.persistence),
      ),
    ]);
    log.info('Sentiment profiles created', { count: presentProfiles.length });
    log.info('Previous relevant items fetched', {
      count: previousRelevantItems.length,
    });

    const weightedItems = await withSpan(
      log,
      this.weights.computeMomentumWeights.name,
      () =>
        this.weights.computeMomentumWeights(relevant, previousRelevantItems),
    );
    log.info('Momentum weights computed', { count: weightedItems.length });

    const weightedProfiles = await withSpan(
      log,
      attachWeightsToSentimentProfiles.name,
      () => attachWeightsToSentimentProfiles(presentProfiles, weightedItems),
    );
    log.info('Momentum weights attached to profiles', {
      count: weightedProfiles.length,
    });

    const aggregated = await withSpan(
      log,
      aggregateSentimentProfiles.name,
      () => aggregateSentimentProfiles(weightedProfiles),
    );
    log.info('Sentiment profiles aggregated');

    const report = await withSpan(log, this.report.createReport.name, () =>
      this.report.createReport(log, aggregated),
    );
    log.info('Report created');

    const persistedWeightedItems = weightedItems.map((item) => ({
      ...item,
      weight: roundNumber(item.weight),
    }));

    const persistedWeightedProfiles = weightedProfiles.map((profile) => ({
      ...profile,
      weight: roundNumber(profile.weight),
    }));

    const persistedTotalWeight = persistedWeightedProfiles.reduce(
      (sum, profile) => sum + profile.weight,
      0,
    );

    const persistedAggregated = {
      ...aggregated,
      totalWeight: persistedTotalWeight,
      emotions: Object.fromEntries(
        Object.entries(aggregated.emotions).map(([key, value]) => [
          key,
          roundNumber(value),
        ]),
      ) as typeof aggregated.emotions,
      tonalities: Object.fromEntries(
        Object.entries(aggregated.tonalities).map(([key, value]) => [
          key,
          roundNumber(value),
        ]),
      ) as typeof aggregated.tonalities,
    };

    await withSpan(log, this.persistence.storeSnapshotAt.name, () =>
      this.persistence.storeSnapshotAt(createdAt, {
        fetchedItems: items,
        weightedItems: persistedWeightedItems,
        weightedSentimentProfiles: persistedWeightedProfiles,
        aggregatedSentimentProfile: persistedAggregated,
        report,
      }),
    );

    log.info('Snapshot persisted', { createdAt });

    const ms = Math.round(performance.now() - startedAt);
    log.info('Snapshot finished', { ms, createdAt, snapshotDay });

    log.debug('Previous items', {
      items: previousRelevantItems.map((it) => ({
        title: it.title,
        score: formatFloat(it.score),
      })),
    });
    log.debug('Relevant items', {
      items: relevant.map((it) => ({
        title: it.title,
        score: formatFloat(it.score),
      })),
    });
    log.debug('Weighted items', {
      items: sortByWeightDesc(weightedItems).map((it) => ({
        title: it.title,
        weight: formatFloat(it.weight),
      })),
    });
    if (weightedItems.length > 0) {
      const total = weightedItems.reduce((s, it) => s + it.weight, 0);
      const top = sortByWeightDesc(weightedItems)[0];
      const topShare = total > 0 ? top.weight / total : 0;
      log.info('Weights summary', {
        N: weightedItems.length,
        totalWeight: Number.isFinite(total) ? total : 0,
        topWeight: top.weight,
        topShare,
      });
    }
    log.debug('Aggregated profile', { aggregated });
    log.debug('Report payload', { report });
  }
}
