import { z } from 'zod';

export const HeadlineDtoSchema = z
  .object({
    title: z.string(),
    weight: z.string(),
    itemRef: z.string(),
  })
  .brand<'HeadlineDto'>();
export type HeadlineDto = z.infer<typeof HeadlineDtoSchema>;
