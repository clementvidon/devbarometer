import type {
  EmotionProfile,
  WeightedEmotionProfile,
  WeightedItem,
} from '../../entities';

export function attachWeightsToProfiles(
  profiles: EmotionProfile[],
  weightedItems: WeightedItem[],
): WeightedEmotionProfile[] {
  if (profiles.length !== weightedItems.length) {
    throw new Error(
      `[${attachWeightsToProfiles.name}] Profiles/items length mismatch.`,
    );
  }

  return profiles.map((profile, i) => {
    const weightedItem = weightedItems[i];

    if (profile.itemRef !== weightedItem.itemRef) {
      throw new Error(
        `[${attachWeightsToProfiles.name}] Item/profile mismatch.`,
      );
    }

    return {
      profile,
      weight: profile.status === 'fallback' ? 0 : weightedItem.weight,
    };
  });
}
