import {
  WEATHER_EMOJIS as SHARED_WEATHER_EMOJIS,
  type Report as SharedReport,
  type WeatherEmoji as SharedWeatherEmoji,
} from '@devbarometer/shared';

export const WEATHER_EMOJIS = SHARED_WEATHER_EMOJIS;
export type WeatherEmoji = SharedWeatherEmoji;
export type Report = SharedReport;
