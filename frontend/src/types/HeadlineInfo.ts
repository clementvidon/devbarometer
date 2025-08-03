export type HeadlineInfo = {
  title: string;
  upvotes: number;
  url: string;
};

export function isHeadline(obj: unknown): obj is HeadlineInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'title' in obj &&
    'upvotes' in obj &&
    'url' in obj &&
    typeof (obj as Record<string, unknown>).title === 'string' &&
    typeof (obj as Record<string, unknown>).upvotes === 'number' &&
    typeof (obj as Record<string, unknown>).url === 'string'
  );
}
