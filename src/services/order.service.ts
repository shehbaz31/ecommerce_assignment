import { CreateOrderDto } from '../dto/create-order.dto';
import { AppError } from '../errors/app-error';
import { courierRegistry } from '../couriers/courier.registry';
import { orderRepository } from '../repositories/order.repository';
import { trackingRepository } from '../repositories/tracking.repository';

export class OrderService {
  async createOrder(dto: CreateOrderDto) {
    const existing = await orderRepository.findByOrderId(dto.order_id);
    if (existing) {
      throw new AppError('DUPLICATE_ORDER_ID', 'Order id already exists', 409, [{
        field: 'order_id',
        message: 'Duplicate order id',
      }]);
    }

    const adapter = courierRegistry.getAdapter(dto.courier_partner);
    const courierResult = await adapter.createOrder(dto);

    const saved = await orderRepository.create({
      order_id: dto.order_id,
      courier_partner: dto.courier_partner,
      courier_order_id: courierResult.courierOrderId,
      awb_number: courierResult.awbNumber ?? null,
      status: courierResult.status ?? 'CREATED',
      request_payload: dto,
      response_payload: courierResult.rawResponse ?? {},
    });

    await trackingRepository.add({
      order_id: dto.order_id,
      status: saved.status,
      raw_payload: courierResult.rawResponse ?? {},
    });

    return {
      order_id: saved.order_id,
      courier_partner: saved.courier_partner,
      courier_order_id: saved.courier_order_id,
      awb_number: saved.awb_number,
      status: saved.status,
    };
  }

  async trackOrder(orderId: string) {
    const saved = await orderRepository.findByOrderId(orderId);
    if (!saved) {
      throw new AppError('NOT_FOUND', 'Order not found', 404, [{
        field: 'order_id',
        message: 'Order not found',
      }]);
    }

    const adapter = courierRegistry.getAdapter(saved.courier_partner);
    const tracking = await adapter.trackShipment(saved.courier_order_id ?? saved.order_id);

    const history = await trackingRepository.findByOrderId(orderId);
    if (history.length === 0) {
      await trackingRepository.add({
        order_id: orderId,
        status: tracking.status,
        raw_payload: tracking.rawPayload ?? {},
      });
    }

    return {
      order_id: orderId,
      courier_partner: saved.courier_partner,
      current_status: tracking.status,
      tracking_history: history.length > 0 ? history.map((entry) => ({
        status: entry.status,
        recorded_at: entry.recorded_at.toISOString(),
        raw_payload: entry.raw_payload,
      })) : [{
        status: tracking.status,
        recorded_at: new Date().toISOString(),
        raw_payload: tracking.rawPayload ?? {},
      }],
    };
  }

  async cancelOrder(orderId: string) {
    const saved = await orderRepository.findByOrderId(orderId);
    if (!saved) {
      throw new AppError('NOT_FOUND', 'Order not found', 404, [{
        field: 'order_id',
        message: 'Order not found',
      }]);
    }

    const adapter = courierRegistry.getAdapter(saved.courier_partner);
    const cancelResult = await adapter.cancelOrder(saved.courier_order_id ?? saved.order_id);

    await orderRepository.update(saved.order_id, { status: cancelResult.status ?? 'CANCELLED' });
    await trackingRepository.add({
      order_id: saved.order_id,
      status: cancelResult.status ?? 'CANCELLED',
      raw_payload: cancelResult.rawPayload ?? {},
    });

    return {
      order_id: saved.order_id,
      status: cancelResult.status ?? 'CANCELLED',
    };
  }

  async bulkProcess(orders: CreateOrderDto[]) {
    const results = await Promise.allSettled(
      orders.map(async (dto) => {
        try {
          const created = await this.createOrder(dto);
          return { order_id: dto.order_id, success: true, data: created };
        } catch (error) {
          const appError = error instanceof AppError ? error : new AppError('UNKNOWN_ERROR', 'Order processing failed', 500);
          return {
            order_id: dto.order_id,
            success: false,
            error: {
              code: appError.code,
              message: appError.message,
            },
          };
        }
      }),
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        order_id: 'unknown',
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Order processing failed',
        },
      };
    });
  }
}

export const orderService = new OrderService();
