import { z } from 'zod';

export const addressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  pincode: z.string().min(1, 'Pincode is required'),
});

export const parcelSchema = z.object({
  weight_kg: z.number().positive('Weight must be positive'),
  length_cm: z.number().positive('Length must be positive'),
  width_cm: z.number().positive('Width must be positive'),
  height_cm: z.number().positive('Height must be positive'),
  description: z.string().min(1, 'Description is required'),
});

export const createOrderSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
  courier_partner: z.string().min(1, 'courier_partner is required'),
  sender: addressSchema,
  recipient: addressSchema,
  parcel: parcelSchema,
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
