export interface Item {
  source: string;
  title: string;
  content: string;
  score: number; // delete
}

export type RelevantItem = Item;
export interface WeightedItem extends Item {
  weight: number; // poids recalculé par le pipeline
}
