import { CreateOrderDto } from '../dto/create-order.dto';

export type CourierOrderResult = {
  courierOrderId: string;
  awbNumber?: string;
  status: string;
  rawResponse?: unknown;
};

export type CourierTrackResult = {
  status: string;
  rawPayload: unknown;
};

export type CourierCancelResult = {
  status: string;
  rawPayload?: unknown;
};

export interface ICourierAdapter {
  authenticate(): Promise<void>;
  createOrder(dto: CreateOrderDto): Promise<CourierOrderResult>;
  trackShipment(courierOrderId: string): Promise<CourierTrackResult>;
  cancelOrder(courierOrderId: string): Promise<CourierCancelResult>;
}
