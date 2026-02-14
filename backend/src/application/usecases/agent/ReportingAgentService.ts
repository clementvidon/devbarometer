import type { WeightedItem } from '../../../domain/entities';
import { aggregateProfiles } from '../../../domain/services/profiles/aggregateProfiles';
import { formatFloat } from '../../../lib/number/formatFloat';
import { nowIso } from '../../../lib/time/nowIso';
import { withSpan } from '../../observability/withSpan';
import type { ReportingAgentPort } from '../../ports/input/ReportingAgentPort';
import type { ItemsProviderPort } from '../../ports/output/ItemsProviderPort';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type { PersistencePort } from '../../ports/output/PersistencePort';
import type { WeightsPort } from '../../ports/output/WeightsPort';
import { createProfiles } from '../profiles/createProfiles';
import { createReport } from '../profiles/createReport';
import { getRelevantItemsBefore } from '../queries/getRelevantItemsBefore';
import { filterRelevantItems } from '../relevance/filterRelevantItems';

export function sortByWeightDesc(items: WeightedItem[]): WeightedItem[] {
  return items.slice().sort((a, b) => b.weight - a.weight);
}

export class ReportingAgentService implements ReportingAgentPort {
  constructor(
    private readonly logger: LoggerPort,
    private readonly items: ItemsProviderPort,
    private readonly llm: LlmPort,
    private readonly persistence: PersistencePort,
    private readonly weights: WeightsPort,
  ) {}

  async captureSnapshot(): Promise<void> {
    const log = this.logger.child({ module: 'agent.reporting' });
    const startedAt = performance.now();

    log.info('Pipeline start');

    const label = this.items.getLabel();

    const items = await withSpan(log, 'getItems', () => this.items.getItems());
    log.info('Items fetched', { count: items.length, fetchLabel: label });

    const createdAt = this.items.getCreatedAt() ?? nowIso();
    const previous = await withSpan(log, 'getRelevantItemsBefore', () =>
      getRelevantItemsBefore(createdAt, this.persistence),
    );
    log.info('Previous items fetched', { count: previous.length });

    const relevant = await withSpan(log, 'filterRelevantItems', () =>
      filterRelevantItems(log, items, this.llm),
    );
    log.info('Items filtered', { relevant: relevant.length });

    const weighted = await withSpan(log, 'computeWeights', () =>
      this.weights.computeWeights(relevant, previous),
    );
    log.info('Weights computed', { count: weighted.length });

    const profiles = await withSpan(log, 'createProfiles', () =>
      createProfiles(log, weighted, this.llm),
    );
    log.info('Profiles created', { count: profiles.length });

    const aggregated = await withSpan(log, 'aggregateProfiles', () =>
      aggregateProfiles(profiles),
    );
    log.info('Profiles aggregated');

    const report = await withSpan(log, 'createReport', () =>
      createReport(log, aggregated, this.llm),
    );
    log.info('Report created');

    await withSpan(log, 'storeSnapshotAt', () =>
      this.persistence.storeSnapshotAt(createdAt, {
        fetchLabel: label,
        items,
        relevantItems: relevant,
        weightedItems: weighted,
        emotionProfilePerItem: profiles,
        aggregatedEmotionProfile: aggregated,
        report,
      }),
    );
    log.info('Snapshot persisted', { createdAt });

    const ms = Math.round(performance.now() - startedAt);
    log.info('Pipeline finished', { ms });

    log.debug('Previous items', {
      items: previous.map((it) => ({
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
      items: sortByWeightDesc(weighted).map((it) => ({
        title: it.title,
        weight: formatFloat(it.weight),
      })),
    });
    if (weighted.length > 0) {
      const total = weighted.reduce((s, it) => s + it.weight, 0);
      const top = sortByWeightDesc(weighted)[0];
      const topShare = total > 0 ? top.weight / total : 0;
      log.info('Weights summary', {
        N: weighted.length,
        totalWeight: Number.isFinite(total) ? total : 0,
        topWeight: top.weight,
        topShare,
      });
    }
    log.debug('Aggregated profile', { aggregated });
    log.debug('Report payload', { report });
  }
}
