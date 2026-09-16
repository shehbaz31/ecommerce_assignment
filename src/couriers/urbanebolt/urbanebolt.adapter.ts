import { CreateOrderDto } from '../../dto/create-order.dto';
import { AppError } from '../../errors/app-error';
import { ICourierAdapter, CourierCancelResult, CourierOrderResult, CourierTrackResult } from '../courier.interface';
import { UrbaneBoltClient } from './urbanebolt.client';
import { mapCancelResponse, mapCreateOrderRequest, mapTrackResponse } from './urbanebolt.mapper';

export class UrbaneBoltAdapter implements ICourierAdapter {
  private readonly client: UrbaneBoltClient;

  constructor() {
    this.client = new UrbaneBoltClient();
  }

  async authenticate(): Promise<void> {
    await this.client.authenticate();
  }

  async createOrder(dto: CreateOrderDto): Promise<CourierOrderResult> {
    try {
      const response = await this.client.getClient().post('/orders', mapCreateOrderRequest(dto));
      return {
        courierOrderId: response?.data?.courierOrderId ?? response?.data?.orderId ?? `${dto.order_id}-ub`,
        awbNumber: response?.data?.awbNumber ?? response?.data?.trackingNumber ?? undefined,
        status: response?.data?.status ?? 'CREATED',
        rawResponse: response?.data,
      };
    } catch (error) {
      throw new AppError('COURIER_API_ERROR', 'Failed to create shipment with UrbaneBolt', 502, [{
        field: 'courier_partner',
        message: 'Courier request failed',
      }]);
    }
  }

  async trackShipment(courierOrderId: string): Promise<CourierTrackResult> {
    try {
      const response = await this.client.getClient().get(`/orders/${courierOrderId}/track`);
      return mapTrackResponse(response?.data ?? {});
    } catch (error) {
      throw new AppError('COURIER_API_ERROR', 'Failed to track shipment with UrbaneBolt', 502);
    }
  }

  async cancelOrder(courierOrderId: string): Promise<CourierCancelResult> {
    try {
      const response = await this.client.getClient().post(`/orders/${courierOrderId}/cancel`);
      return mapCancelResponse(response?.data ?? {});
    } catch (error) {
      throw new AppError('COURIER_API_ERROR', 'Failed to cancel shipment with UrbaneBolt', 502);
    }
  }
}
