import { Router } from 'express';
import { validateBody } from '../middlewares/validate.middleware';
import { orderController } from '../controllers/order.controller';
import { createOrderSchema } from '../../dto/create-order.dto';
import { bulkOrderSchema } from '../../dto/bulk-order.dto';

const router = Router();

router.get('/health', orderController.healthCheck);
router.post('/api/v1/orders', validateBody(createOrderSchema), orderController.createOrder.bind(orderController));
router.get('/api/v1/orders/:order_id/track', orderController.trackOrder.bind(orderController));
router.post('/api/v1/orders/:order_id/cancel', orderController.cancelOrder.bind(orderController));
router.post('/api/v1/orders/bulk', validateBody(bulkOrderSchema), orderController.bulkCreate.bind(orderController));

export default router;
