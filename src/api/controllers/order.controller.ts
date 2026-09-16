import { Request, Response, NextFunction } from 'express';
import { orderService } from '../../services/order.service';
import { AppError } from '../../errors/app-error';
import { createOrderSchema } from '../../dto/create-order.dto';
import { bulkOrderSchema } from '../../dto/bulk-order.dto';

export class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createOrderSchema.parse(req.body);
      const result = await orderService.createOrder(dto);
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async trackOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.trackOrder(req.params.order_id);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.cancelOrder(req.params.order_id);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = bulkOrderSchema.parse(req.body);
      const results = await orderService.bulkProcess(dto.orders);
      return res.status(200).json({ results });
    } catch (error) {
      return next(error);
    }
  }

  healthCheck(req: Request, res: Response) {
    return res.status(200).json({ status: 'ok' });
  }
}

export const orderController = new OrderController();
