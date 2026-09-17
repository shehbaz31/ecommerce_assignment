import { z } from 'zod';

export const addressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  country: z.string().min(1).default('INDIA'),
  email: z.string().email().optional().default(''),
});

export const parcelSchema = z.object({
  weight_kg: z.number().positive('Weight must be positive'),
  length_cm: z.number().positive('Length must be positive'),
  width_cm: z.number().positive('Width must be positive'),
  height_cm: z.number().positive('Height must be positive'),
  description: z.string().min(1, 'Description is required'),
  declared_value: z.number().positive('Declared value must be positive'),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  invoice_value: z.number().positive('Invoice value must be positive'),
  item_quantity: z.number().int().positive('Item quantity must be positive'),
  pay_mode: z.enum(['PPD', 'COD', 'RVP', 'RVPQC']).default('PPD'),
  collectable_value: z.number().min(0).default(0),
});

export const createOrderSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
  courier_partner: z.string().min(1, 'courier_partner is required'),
  sender: addressSchema,
  recipient: addressSchema,
  parcel: parcelSchema,
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
