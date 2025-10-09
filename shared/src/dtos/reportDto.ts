import { z } from 'zod';
import { WeatherEmojiSchema } from '../domain';

export const ReportDtoSchema = z.object({
  text: z.string().max(200),
  emoji: WeatherEmojiSchema,
});
export type ReportDto = z.infer<typeof ReportDtoSchema>;
