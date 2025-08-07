export type HeadlineInfo = {
  title: string;
  weight: number;
  source: string;
};

export function isHeadline(obj: unknown): obj is HeadlineInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'title' in obj &&
    'weight' in obj &&
    'source' in obj &&
    typeof (obj as Record<string, unknown>).title === 'string' &&
    typeof (obj as Record<string, unknown>).weight === 'number' &&
    typeof (obj as Record<string, unknown>).source === 'string'
  );
}
