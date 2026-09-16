import { CreateOrderDto } from '../../dto/create-order.dto';
import { ICourierAdapter, CourierCancelResult, CourierOrderResult, CourierTrackResult } from '../courier.interface';

export class MockCourierAdapter implements ICourierAdapter {
  async authenticate(): Promise<void> {
    return;
  }

  async createOrder(dto: CreateOrderDto): Promise<CourierOrderResult> {
    return {
      courierOrderId: `mock-${dto.order_id}`,
      awbNumber: `AWB-${dto.order_id}`,
      status: 'CREATED',
      rawResponse: { status: 'CREATED' },
    };
  }

  async trackShipment(courierOrderId: string): Promise<CourierTrackResult> {
    return {
      status: 'CREATED',
      rawPayload: { courierOrderId, status: 'CREATED' },
    };
  }

  async cancelOrder(courierOrderId: string): Promise<CourierCancelResult> {
    return {
      status: 'CANCELLED',
      rawPayload: { courierOrderId, status: 'CANCELLED' },
    };
  }
}
