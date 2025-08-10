export const THEME = {
  axisText: '#9ec3ff',
  axisLine: '#6b93c9',
  grid: '#2a4566',
  tooltipBg: 'rgba(18, 34, 52, 0.96)',
  tooltipBorder: '#3a5f8f',
  tooltipText: '#dbeaff',
} as const;

export const EMOTION_COLORS = {
  joy: '#00FFFF',
  trust: '#00CFFF',
  fear: '#FF6600',
  anger: '#FF3300',
  disgust: '#FFCC66',
  sadness: '#FF9999',
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
  polarity: '#66FF66',
  surprise: '#FFD166',
  anticipation: '#7C83FF',
} as const;

export type TonalityKey = keyof typeof TONALITY_COLORS;
export const TONALITY_KEYS = Object.keys(TONALITY_COLORS) as TonalityKey[];

export const TONALITY_LABELS: Record<TonalityKey, string> = {
  polarity: 'Polarité',
  surprise: 'Surprise',
  anticipation: 'Anticipation',
};
