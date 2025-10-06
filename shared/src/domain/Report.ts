import { z } from 'zod';

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

export const WeatherEmojiSchema = z.enum(WEATHER_EMOJIS);
export type WeatherEmoji = z.infer<typeof WeatherEmojiSchema>;

export const ReportSchema = z.object({
  text: z.string().max(200),
  emoji: WeatherEmojiSchema,
});
export type Report = z.infer<typeof ReportSchema>;
