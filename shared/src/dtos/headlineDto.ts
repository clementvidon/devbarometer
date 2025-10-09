import { z } from 'zod';

export const HeadlineDtoSchema = z.object({
  title: z.string(),
  weight: z.string(),
  source: z.string(),
});
export type HeadlineDto = z.infer<typeof HeadlineDtoSchema>;
