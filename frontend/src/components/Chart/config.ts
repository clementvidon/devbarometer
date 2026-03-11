import type {
  EmotionScoreField,
  TonalityAxisKey,
} from '@devbarometer/shared/domain';

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

export const EMOTION_LABELS: Record<EmotionScoreField, string> = {
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

export const TONALITY_LABELS: Record<TonalityAxisKey, string> = {
  polarity: 'Valence',
  surprise: 'Surprise',
  anticipation: 'Anticipation',
};
