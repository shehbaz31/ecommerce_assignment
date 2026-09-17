import { CreateOrderDto } from '../../dto/create-order.dto';
import { config } from '../../config/config';

export const mapCreateOrderRequest = (dto: CreateOrderDto) => ([
  {
    customerCode: config.urbanebolt.customerCode,
    orderNumber: dto.order_id,
    itemDescription: dto.parcel.description,
    declaredValue: dto.parcel.declared_value,
    collectableValue: dto.parcel.collectable_value,
    invoiceNumber: dto.parcel.invoice_number,
    invoiceDate: dto.parcel.invoice_date,
    invoiceValue: dto.parcel.invoice_value,
    itemQuantity: dto.parcel.item_quantity,
    weight: dto.parcel.weight_kg,
    length: dto.parcel.length_cm,
    breadth: dto.parcel.width_cm,
    height: dto.parcel.height_cm,
    pieces: 1,
    serviceType: 'SDD',
    payMode: dto.parcel.pay_mode,
    shprName: dto.sender.name,
    shprMobile: dto.sender.phone,
    shprAddress: dto.sender.address,
    shprCity: dto.sender.city,
    shprState: dto.sender.state,
    shprPincode: Number(dto.sender.pincode),
    shprCountry: dto.sender.country,
    shprEmail: dto.sender.email,
    shprAddressType: 'Seller',
    consName: dto.recipient.name,
    consMobile: dto.recipient.phone,
    consAddress: dto.recipient.address,
    consCity: dto.recipient.city,
    consState: dto.recipient.state,
    consPincode: Number(dto.recipient.pincode),
    consCountry: dto.recipient.country,
    consEmail: dto.recipient.email,
    consAddressType: 'Home',
    rtnName: dto.sender.name,
    rtnMobile: dto.sender.phone,
    rtnAddress: dto.sender.address,
    rtnCity: dto.sender.city,
    rtnState: dto.sender.state,
    rtnPincode: Number(dto.sender.pincode),
    rtnCountry: dto.sender.country,
    rtnEmail: dto.sender.email,
    rtnAddressType: 'Seller',
  },
]);

export const mapTrackResponse = (response: any) => ({
  status: response?.status ?? 'IN_TRANSIT',
  rawPayload: response ?? {},
});

export const mapCancelResponse = (response: any) => ({
  status: response?.status ?? 'CANCELLED',
  rawPayload: response ?? {},
});
