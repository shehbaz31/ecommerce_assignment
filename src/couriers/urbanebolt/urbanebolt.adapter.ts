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
      await this.client.ensureAuthenticated();
      const response = await this.client.getClient().post('/services/manifest/', mapCreateOrderRequest(dto));
      const result = Array.isArray(response?.data) ? response.data[0] : response?.data;
      return {
        courierOrderId: result?.awbNumber ?? result?.orderNumber ?? `${dto.order_id}-ub`,
        awbNumber: result?.awbNumber ?? undefined,
        status: result?.status ?? 'CREATED',
        rawResponse: result,
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
      await this.client.ensureAuthenticated();
      const response = await this.client.getClient().get(`/services/tracking-pub/`, { params: { awb: courierOrderId } });
      return mapTrackResponse(response?.data ?? {});
    } catch (error) {
      throw new AppError('COURIER_API_ERROR', 'Failed to track shipment with UrbaneBolt', 502);
    }
  }

  async cancelOrder(courierOrderId: string): Promise<CourierCancelResult> {
    try {
      await this.client.ensureAuthenticated();
      const response = await this.client.getClient().post(`/services/cancel/`, { awbs: courierOrderId });
      return mapCancelResponse(response?.data ?? {});
    } catch (error) {
      throw new AppError('COURIER_API_ERROR', 'Failed to cancel shipment with UrbaneBolt', 502);
    }
  }
}
