export const THEME = {
  axisText: '#9ec3ff',
  axisLine: '#6b93c9',
  grid: '#2a4566',
  tooltipBg: 'rgba(18, 34, 52, 0.96)',
  tooltipBorder: '#3a5f8f',
  tooltipText: '#dbeaff',
} as const;

export const EMOTION_COLORS = {
  joy: '#B7C8FF',
  trust: '#B39EFF',
  fear: '#D00000',
  anger: '#D20054',
  disgust: '#7E0000',
  sadness: '#8B1F4D',
} as const;

export type EmotionKey = keyof typeof EMOTION_COLORS;
export const EMOTION_KEYS = Object.keys(EMOTION_COLORS) as EmotionKey[];

export const EMOTION_LABELS: Record<EmotionKey, string> = {
  joy: 'Joie',
  trust: 'Confiance',
  fear: 'Peur',
  anger: 'Colère',
  disgust: 'Dégoût',
  sadness: 'Tristesse',
};

export const TONALITY_COLORS = {
  polarity: '#FF3385',
  surprise: '#EA80FF',
  anticipation: '#7728FF',
} as const;

export type TonalityKey = keyof typeof TONALITY_COLORS;
export const TONALITY_KEYS = Object.keys(TONALITY_COLORS) as TonalityKey[];

export const TONALITY_LABELS: Record<TonalityKey, string> = {
  polarity: 'Polarité',
  surprise: 'Surprise',
  anticipation: 'Anticipation',
};
