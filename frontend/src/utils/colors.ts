export function amberToFlame(
  upvotes: number,
  min: number,
  max: number,
): string {
  if (max === min) return 'hsl(10, 20%, 50%)';
  const t = (upvotes - min) / (max - min);
  const hue = 5 + t * 15;
  const saturation = 20 + t * 80;
  const lightness = 45 + t * 15;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
