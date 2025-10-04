import { z } from 'zod';

export const IsoDateStringSchema = z.string().datetime({ offset: true });
export type IsoDateString = z.infer<typeof IsoDateStringSchema>;
