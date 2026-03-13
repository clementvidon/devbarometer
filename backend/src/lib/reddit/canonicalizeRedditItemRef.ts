export function canonicalizeRedditItemRef(itemRef: string): string {
  const match = itemRef.match(
    /(?:https?:\/\/)?(?:www\.)?reddit\.com\/(?:r\/[^/]+\/)?comments\/([a-z0-9]+)/i,
  );

  return match
    ? `https://reddit.com/comments/${match[1].toLowerCase()}`
    : itemRef;
}
