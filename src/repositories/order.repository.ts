import { PrismaClient } from '@prisma/client';

type OrderRecord = {
  id: string;
  order_id: string;
  courier_partner: string;
  courier_order_id: string | null;
  awb_number: string | null;
  status: string;
  request_payload: unknown;
  response_payload: unknown;
  created_at: Date;
  updated_at: Date;
};

const prisma = new PrismaClient();
const memoryOrders: OrderRecord[] = [];

export class OrderRepository {
  async create(order: Omit<OrderRecord, 'id' | 'created_at' | 'updated_at'>): Promise<OrderRecord> {
    try {
      const record = await prisma.order.create({
        data: {
          order_id: order.order_id,
          courier_partner: order.courier_partner,
          courier_order_id: order.courier_order_id,
          awb_number: order.awb_number,
          status: order.status,
          request_payload: order.request_payload as any,
          response_payload: order.response_payload as any,
        },
      });

      return {
        id: record.id,
        order_id: record.order_id,
        courier_partner: record.courier_partner,
        courier_order_id: record.courier_order_id,
        awb_number: record.awb_number,
        status: record.status,
        request_payload: record.request_payload,
        response_payload: record.response_payload,
        created_at: record.created_at,
        updated_at: record.updated_at,
      };
    } catch (error) {
      const record: OrderRecord = {
        id: globalThis.crypto?.randomUUID?.() ?? `order-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        created_at: new Date(),
        updated_at: new Date(),
        ...order,
      };
      memoryOrders.push(record);
      return record;
    }
  }

  async findByOrderId(orderId: string): Promise<OrderRecord | undefined> {
    try {
      const record = await prisma.order.findUnique({ where: { order_id: orderId } });
      if (!record) {
        return memoryOrders.find((order) => order.order_id === orderId);
      }
      return {
        id: record.id,
        order_id: record.order_id,
        courier_partner: record.courier_partner,
        courier_order_id: record.courier_order_id,
        awb_number: record.awb_number,
        status: record.status,
        request_payload: record.request_payload,
        response_payload: record.response_payload,
        created_at: record.created_at,
        updated_at: record.updated_at,
      };
    } catch (error) {
      return memoryOrders.find((order) => order.order_id === orderId);
    }
  }

  async update(orderId: string, patch: Partial<OrderRecord>): Promise<OrderRecord | undefined> {
    try {
      const record = await prisma.order.update({
        where: { order_id: orderId },
        data: {
          courier_partner: patch.courier_partner,
          courier_order_id: patch.courier_order_id,
          awb_number: patch.awb_number,
          status: patch.status,
          request_payload: patch.request_payload as any,
          response_payload: patch.response_payload as any,
        },
      });

      return {
        id: record.id,
        order_id: record.order_id,
        courier_partner: record.courier_partner,
        courier_order_id: record.courier_order_id,
        awb_number: record.awb_number,
        status: record.status,
        request_payload: record.request_payload,
        response_payload: record.response_payload,
        created_at: record.created_at,
        updated_at: record.updated_at,
      };
    } catch (error) {
      const index = memoryOrders.findIndex((order) => order.order_id === orderId);
      if (index === -1) {
        return undefined;
      }
      memoryOrders[index] = {
        ...memoryOrders[index],
        ...patch,
        updated_at: new Date(),
      };
      return memoryOrders[index];
    }
  }

  async list(): Promise<OrderRecord[]> {
    try {
      const records = (await prisma.order.findMany()) as any[];
      return records.map((record: any) => ({
        id: record.id,
        order_id: record.order_id,
        courier_partner: record.courier_partner,
        courier_order_id: record.courier_order_id,
        awb_number: record.awb_number,
        status: record.status,
        request_payload: record.request_payload,
        response_payload: record.response_payload,
        created_at: record.created_at,
        updated_at: record.updated_at,
      }));
    } catch (error) {
      return [...memoryOrders];
    }
  }
}

export const orderRepository = new OrderRepository();
