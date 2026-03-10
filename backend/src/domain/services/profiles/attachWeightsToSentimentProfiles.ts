import type {
  SentimentProfile,
  WeightedItem,
  WeightedSentimentProfile,
} from '../../entities';

export function attachWeightsToSentimentProfiles(
  profiles: SentimentProfile[],
  weightedItems: WeightedItem[],
): WeightedSentimentProfile[] {
  if (profiles.length !== weightedItems.length) {
    throw new Error(
      `[${attachWeightsToSentimentProfiles.name}] Profiles/items length mismatch.`,
    );
  }

  return profiles.map((profile, i) => {
    const weightedItem = weightedItems[i];

    if (profile.itemRef !== weightedItem.itemRef) {
      throw new Error(
        `[${attachWeightsToSentimentProfiles.name}] Item/profile mismatch.`,
      );
    }

    return {
      itemRef: profile.itemRef,
      status: profile.status,
      emotions: profile.emotions,
      tonalities: profile.tonalities,
      weight: profile.status === 'fallback' ? 0 : weightedItem.weight,
    };
  });
}
