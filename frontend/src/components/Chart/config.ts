export const THEME = {
  axisText: '#9ec3ff',
  axisLine: '#6b93c9',
  grid: '#2a4566',
  tooltipBg: 'rgba(18, 34, 52, 0.96)',
  tooltipBorder: '#3a5f8f',
  tooltipText: '#dbeaff',
} as const;

export const LABELS_FR: Record<string, string> = {
  joy: 'Joie',
  trust: 'Confiance',
  fear: 'Peur',
  anger: 'Colère',
  disgust: 'Dégoût',
  sadness: 'Tristesse',
};

export const COLOR_MAP = {
  joy: '#00FFFF',
  trust: '#00CFFF',
  fear: '#FF6600',
  anger: '#FF3300',
  disgust: '#FFCC66',
  sadness: '#FF9999',
} as const;

export type Key = keyof typeof COLOR_MAP;
export const EMOTION_KEYS = Object.keys(COLOR_MAP) as Key[];
