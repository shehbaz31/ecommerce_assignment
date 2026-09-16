import { z } from 'zod';

export const cancelOrderSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
});

export type CancelOrderDto = z.infer<typeof cancelOrderSchema>;
