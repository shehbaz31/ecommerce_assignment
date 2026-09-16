import { CreateOrderDto } from '../../dto/create-order.dto';

export const mapCreateOrderRequest = (dto: CreateOrderDto) => ({
  order_id: dto.order_id,
  courier_partner: dto.courier_partner,
  sender: dto.sender,
  recipient: dto.recipient,
  parcel: dto.parcel,
});

export const mapTrackResponse = (response: any) => ({
  status: response?.status ?? 'IN_TRANSIT',
  rawPayload: response ?? {},
});

export const mapCancelResponse = (response: any) => ({
  status: response?.status ?? 'CANCELLED',
  rawPayload: response ?? {},
});
