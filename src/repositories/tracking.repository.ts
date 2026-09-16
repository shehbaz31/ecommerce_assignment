import { PrismaClient } from '@prisma/client';

type TrackingRecord = {
  id: string;
  order_id: string;
  status: string;
  raw_payload: unknown;
  recorded_at: Date;
};

const prisma = new PrismaClient();
const memoryHistory: TrackingRecord[] = [];

export class TrackingRepository {
  async add(entry: Omit<TrackingRecord, 'id' | 'recorded_at'>): Promise<TrackingRecord> {
    try {
      const record = await prisma.trackingHistory.create({
        data: {
          order_id: entry.order_id,
          status: entry.status,
          raw_payload: entry.raw_payload as any,
        },
      });

      return {
        id: record.id,
        order_id: record.order_id,
        status: record.status,
        raw_payload: record.raw_payload,
        recorded_at: record.recorded_at,
      };
    } catch (error) {
      const record: TrackingRecord = {
        id: globalThis.crypto?.randomUUID?.() ?? `track-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        recorded_at: new Date(),
        ...entry,
      };
      memoryHistory.push(record);
      return record;
    }
  }

  async findByOrderId(orderId: string): Promise<TrackingRecord[]> {
    try {
      const records = (await prisma.trackingHistory.findMany({ where: { order_id: orderId } })) as any[];
      return records.map((record: any) => ({
        id: record.id,
        order_id: record.order_id,
        status: record.status,
        raw_payload: record.raw_payload,
        recorded_at: record.recorded_at,
      }));
    } catch (error) {
      return memoryHistory.filter((entry) => entry.order_id === orderId);
    }
  }
}

export const trackingRepository = new TrackingRepository();
