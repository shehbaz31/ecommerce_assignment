import { z } from 'zod';

export const trackOrderSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
});

export type TrackOrderDto = z.infer<typeof trackOrderSchema>;
