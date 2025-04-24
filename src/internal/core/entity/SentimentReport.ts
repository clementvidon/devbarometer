export type WeatherEmoji =
  | '☀️'
  | '🌤️'
  | '⛅'
  | '🌥️'
  | '☁️'
  | '🌦️'
  | '🌧️'
  | '⛈️'
  | '❄️'
  | '🌩️';

export interface SentimentReport {
  text: string;
  emoji: WeatherEmoji;
  timestamp: string;
}
