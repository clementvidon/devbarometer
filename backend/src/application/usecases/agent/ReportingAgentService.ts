import type { WeightedItem } from '../../../domain/entities';
import { aggregateSentimentProfiles } from '../../../domain/services/profiles/aggregateSentimentProfiles';
import { attachWeightsToSentimentProfiles } from '../../../domain/services/profiles/attachWeightsToSentimentProfiles';
import { formatFloat } from '../../../lib/number/formatFloat';
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

    log.info('Pipeline start');

    const fetchRef = this.items.getFetchRef();

    const items = await withSpan(log, 'getItems', () => this.items.getItems());
    log.info('Items fetched', { count: items.length, fetchRef });

    const createdAt = this.items.getCreatedAt() ?? nowIso();

    const relevant = await withSpan(
      log,
      this.relevance.filterRelevantItems.name,
      () => this.relevance.filterRelevantItems(log, items),
    );
    log.info('Items filtered', { relevant: relevant.length });

    const [presentProfiles, previousRelevantItems] = await Promise.all([
      withSpan(log, this.profiles.createSentimentProfiles.name, () =>
        this.profiles.createSentimentProfiles(log, relevant),
      ),
      withSpan(log, getLastRelevantItemsBefore.name, () =>
        getLastRelevantItemsBefore(createdAt, this.persistence),
      ),
    ]);
    log.info('Previous items fetched', { count: previousRelevantItems.length });
    log.info('Profiles created', { count: presentProfiles.length });

    const weightedItems = await withSpan(
      log,
      this.weights.computeMomentumWeights.name,
      () =>
        this.weights.computeMomentumWeights(relevant, previousRelevantItems),
    );
    log.info('Weights computed', { count: weightedItems.length });

    const weightedProfiles = await withSpan(
      log,
      attachWeightsToSentimentProfiles.name,
      () => attachWeightsToSentimentProfiles(presentProfiles, weightedItems),
    );
    log.info('Weights attached to profiles', {
      count: weightedProfiles.length,
    });

    const aggregated = await withSpan(
      log,
      aggregateSentimentProfiles.name,
      () => aggregateSentimentProfiles(weightedProfiles),
    );
    log.info('Profiles aggregated');

    const report = await withSpan(log, this.report.createReport.name, () =>
      this.report.createReport(log, aggregated),
    );
    log.info('Report created');

    await withSpan(log, this.persistence.storeSnapshotAt.name, () =>
      this.persistence.storeSnapshotAt(createdAt, {
        fetchRef,
        fetchedItems: items,
        weightedItems: weightedItems,
        weightedSentimentProfiles: weightedProfiles,
        aggregatedSentimentProfile: aggregated,
        report,
      }),
    );
    log.info('Snapshot persisted', { createdAt });

    const ms = Math.round(performance.now() - startedAt);
    log.info('Pipeline finished', { ms });

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
