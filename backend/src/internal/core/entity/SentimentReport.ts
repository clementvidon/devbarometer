export const WEATHER_EMOJIS = [
  '☀️',
  '🌤️',
  '⛅',
  '🌥️',
  '☁️',
  '🌦️',
  '🌧️',
  '⛈️',
  '❄️',
  '🌩️',
] as const;

export type WeatherEmoji = (typeof WEATHER_EMOJIS)[number];

export interface SentimentReport {
  text: string;
  emoji: WeatherEmoji;
}
