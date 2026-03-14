import { canonicalizeRedditItemRef } from '../../../lib/reddit/canonicalizeRedditItemRef';
import type { PersistencePort } from '../../ports/output/PersistencePort';
import type {
  ConfirmedRelevanceCache,
  ConfirmedRelevanceCacheEntry,
} from '../../ports/pipeline/FilterRelevantItemsPort';
import { makeRelevanceSignature } from '../relevance/makeRelevanceSignature';

type RelevanceObservation = {
  signature: string;
  relevance: ConfirmedRelevanceCacheEntry['relevance'];
};

export async function getConfirmedRelevanceCacheBefore(
  createdAtISO: string,
  persistence: PersistencePort,
): Promise<ConfirmedRelevanceCache> {
  const snapshots = await persistence.getSnapshots();
  const target = Date.parse(createdAtISO);
  const historyByRef = new Map<string, RelevanceObservation[]>();

  for (const snapshot of snapshots) {
    if (Date.parse(snapshot.createdAt) >= target) continue;

    const pairCount = Math.min(
      snapshot.fetchedItems.length,
      snapshot.itemsRelevance.length,
    );

    for (let i = 0; i < pairCount; i++) {
      const item = snapshot.fetchedItems[i];
      const relevance = snapshot.itemsRelevance[i];
      const itemRef = canonicalizeRedditItemRef(item.itemRef);
      const signature = makeRelevanceSignature(item);

      const prev = historyByRef.get(itemRef) ?? [];
      prev.push({
        signature,
        relevance: {
          ...relevance,
          itemRef,
        },
      });
      historyByRef.set(itemRef, prev);
    }
  }

  const cache = new Map<string, ConfirmedRelevanceCacheEntry>();

  for (const [itemRef, history] of historyByRef) {
    if (history.length < 2) continue;

    const [latest, previous] = history;
    if (latest.signature !== previous.signature) continue;
    if (latest.relevance.relevant !== previous.relevance.relevant) continue;

    cache.set(itemRef, {
      signature: latest.signature,
      relevance: latest.relevance,
    });
  }

  return cache;
}
