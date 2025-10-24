import type { WeightedItem } from '../../../domain/entities';
import { aggregateProfiles } from '../../../domain/services/profiles/aggregateProfiles';
import { formatFloat } from '../../../lib/number/formatFloat';
import { withSpan } from '../../../lib/observability/withSpan';
import { nowIso } from '../../../lib/time/nowIso';
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
    const agentLogger = this.logger.child({ module: 'agent.reporting' });
    const startedAt = performance.now();

    agentLogger.info('Pipeline start');

    const label = this.items.getLabel();

    const items = await withSpan(agentLogger, 'getItems', () =>
      this.items.getItems(),
    );
    agentLogger.info('Items fetched', { count: items.length });

    const createdAt = this.items.getCreatedAt() ?? nowIso();
    const previous = await withSpan(agentLogger, 'getRelevantItemsBefore', () =>
      getRelevantItemsBefore(createdAt, this.persistence),
    );
    agentLogger.info('Previous items fetched', { count: previous.length });

    const relevant = await withSpan(agentLogger, 'filterRelevantItems', () =>
      filterRelevantItems(agentLogger, items, this.llm),
    );
    agentLogger.info('Items filtered', { relevant: relevant.length });

    const weighted = await withSpan(agentLogger, 'computeWeights', () =>
      this.weights.computeWeights(relevant, previous),
    );
    agentLogger.info('Weights computed', { count: weighted.length });

    const profiles = await withSpan(agentLogger, 'createProfiles', () =>
      createProfiles(agentLogger, weighted, this.llm),
    );
    agentLogger.info('Profiles created', { count: profiles.length });

    const aggregated = await withSpan(agentLogger, 'aggregateProfiles', () =>
      aggregateProfiles(profiles),
    );
    agentLogger.info('Profiles aggregated');

    const report = await withSpan(agentLogger, 'createReport', () =>
      createReport(agentLogger, aggregated, this.llm),
    );
    agentLogger.info('Report created');

    await withSpan(agentLogger, 'storeSnapshotAt', () =>
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
    agentLogger.info('Snapshot persisted', { createdAt, fetchLabel: label });

    const ms = Math.round(performance.now() - startedAt);
    agentLogger.info('Pipeline finished', { ms });

    agentLogger.debug('Previous items', {
      items: previous.map((it) => ({
        title: it.title,
        score: formatFloat(it.score),
      })),
    });
    agentLogger.debug('Relevant items', {
      items: relevant.map((it) => ({
        title: it.title,
        score: formatFloat(it.score),
      })),
    });
    agentLogger.debug('Weighted items', {
      items: sortByWeightDesc(weighted).map((it) => ({
        title: it.title,
        weight: formatFloat(it.weight),
      })),
    });
    agentLogger.debug('Aggregated profile', { aggregated });
    agentLogger.debug('Report payload', { report });
  }
}
