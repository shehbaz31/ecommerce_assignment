import { z } from 'zod';
import { createOrderSchema } from './create-order.dto';

export const bulkOrderSchema = z.object({
  orders: z.array(createOrderSchema).max(100, 'Maximum 100 orders allowed'),
});

export type BulkOrderDto = z.infer<typeof bulkOrderSchema>;
