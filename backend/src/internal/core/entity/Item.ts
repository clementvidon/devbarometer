export interface Item {
  source: string;
  title: string;
  content: string;
  score: number;
}

export type RelevantItem = Item;
export interface WeightedItem extends Item {
  weight: number;
}
