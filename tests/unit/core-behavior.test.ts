import { createOrderSchema } from '../../src/dto/create-order.dto';
import { bulkOrderSchema } from '../../src/dto/bulk-order.dto';
import { validateBody } from '../../src/api/middlewares/validate.middleware';
import { errorMiddleware } from '../../src/api/middlewares/error.middleware';
import { AppError } from '../../src/errors/app-error';
import { logger } from '../../src/logger/logger';
import { config } from '../../src/config/config';
import { orderRepository } from '../../src/repositories/order.repository';
import { trackingRepository } from '../../src/repositories/tracking.repository';
import { orderService } from '../../src/services/order.service';
import { courierRegistry } from '../../src/couriers/courier.registry';
import { MockCourierAdapter } from '../../src/couriers/mockcourier/mockcourier.adapter';
import { UrbaneBoltAdapter } from '../../src/couriers/urbanebolt/urbanebolt.adapter';
import { UrbaneBoltClient } from '../../src/couriers/urbanebolt/urbanebolt.client';

describe('Core backend behavior', () => {
  it('validates request bodies and maps errors to AppError', () => {
    const req = { body: { courier_partner: 'mockcourier' } } as any;
    const res = {} as any;
    const next = jest.fn();

    validateBody(createOrderSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('returns normalized application errors and internal errors', () => {
    const res = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    errorMiddleware(new AppError('NOT_FOUND', 'Not found', 404, [{ field: 'order_id', message: 'Missing' }]), {} as any, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: 'Not found',
        details: [{ field: 'order_id', message: 'Missing' }],
      },
    });

    errorMiddleware(new Error('boom'), {} as any, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('exposes configuration and logger defaults', () => {
    expect(config.port).toBeGreaterThan(0);
    expect(logger.level).toBeDefined();
  });

  it('persists orders and tracking records through repositories', async () => {
    const created = await orderRepository.create({
      order_id: 'repo-order-1',
      courier_partner: 'mockcourier',
      courier_order_id: 'courier-1',
      awb_number: 'AWB-1',
      status: 'CREATED',
      request_payload: { order_id: 'repo-order-1' },
      response_payload: { status: 'CREATED' },
    });

    expect(created.order_id).toBe('repo-order-1');
    expect(await orderRepository.findByOrderId('repo-order-1')).toBeTruthy();

    const updated = await orderRepository.update('repo-order-1', { status: 'DELIVERED' });
    expect(updated?.status).toBe('DELIVERED');

    const tracking = await trackingRepository.add({
      order_id: 'repo-order-1',
      status: 'CREATED',
      raw_payload: { state: 'CREATED' },
    });
    expect(tracking.order_id).toBe('repo-order-1');
    expect((await trackingRepository.findByOrderId('repo-order-1')).length).toBeGreaterThan(0);
  });

  it('creates orders through the service and rejects duplicates', async () => {
    const created = await orderService.createOrder({
      order_id: 'svc-order-1',
      courier_partner: 'mockcourier',
      sender: {
        name: 'A',
        phone: '1',
        address: 'X',
        city: 'Y',
        pincode: '123',
      },
      recipient: {
        name: 'B',
        phone: '2',
        address: 'Z',
        city: 'Q',
        pincode: '456',
      },
      parcel: {
        weight_kg: 1,
        length_cm: 10,
        width_cm: 10,
        height_cm: 5,
        description: 'Books',
      },
    });

    expect(created.status).toBe('CREATED');

    await expect(
      orderService.createOrder({
        order_id: 'svc-order-1',
        courier_partner: 'mockcourier',
        sender: {
          name: 'A',
          phone: '1',
          address: 'X',
          city: 'Y',
          pincode: '123',
        },
        recipient: {
          name: 'B',
          phone: '2',
          address: 'Z',
          city: 'Q',
          pincode: '456',
        },
        parcel: {
          weight_kg: 1,
          length_cm: 10,
          width_cm: 10,
          height_cm: 5,
          description: 'Books',
        },
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_ORDER_ID' });
  });

  it('tracks and cancels orders with the service layer', async () => {
    const created = await orderService.createOrder({
      order_id: 'svc-order-2',
      courier_partner: 'mockcourier',
      sender: {
        name: 'A',
        phone: '1',
        address: 'X',
        city: 'Y',
        pincode: '123',
      },
      recipient: {
        name: 'B',
        phone: '2',
        address: 'Z',
        city: 'Q',
        pincode: '456',
      },
      parcel: {
        weight_kg: 2,
        length_cm: 12,
        width_cm: 8,
        height_cm: 4,
        description: 'Box',
      },
    });

    const trackResult = await orderService.trackOrder('svc-order-2');
    expect(trackResult.current_status).toBe('CREATED');

    const cancelResult = await orderService.cancelOrder('svc-order-2');
    expect(cancelResult.status).toBe('CANCELLED');
    expect(created.order_id).toBe('svc-order-2');
  });

  it('handles bulk processing and courier registry lookups', async () => {
    const bulk = await orderService.bulkProcess([
      {
        order_id: 'bulk-1',
        courier_partner: 'mockcourier',
        sender: { name: 'S', phone: '1', address: 'A', city: 'C', pincode: '1' },
        recipient: { name: 'R', phone: '2', address: 'B', city: 'D', pincode: '2' },
        parcel: { weight_kg: 1, length_cm: 10, width_cm: 10, height_cm: 5, description: 'Test' },
      },
      {
        order_id: 'bulk-2',
        courier_partner: 'unknown',
        sender: { name: 'S', phone: '1', address: 'A', city: 'C', pincode: '1' },
        recipient: { name: 'R', phone: '2', address: 'B', city: 'D', pincode: '2' },
        parcel: { weight_kg: 1, length_cm: 10, width_cm: 10, height_cm: 5, description: 'Test' },
      },
    ]);

    expect(bulk).toHaveLength(2);
    expect(bulk[0].success).toBe(true);
    expect(bulk[1].success).toBe(false);

    const adapter = courierRegistry.getAdapter('mockcourier');
    expect(adapter).toBeInstanceOf(MockCourierAdapter);

    expect(() => courierRegistry.getAdapter('missing')).toThrow(AppError);
  });

  it('accepts valid bulk DTOs and mocks courier adapters', async () => {
    const parsed = bulkOrderSchema.safeParse({
      orders: [
        {
          order_id: 'bulk-3',
          courier_partner: 'mockcourier',
          sender: { name: 'S', phone: '1', address: 'A', city: 'C', pincode: '1' },
          recipient: { name: 'R', phone: '2', address: 'B', city: 'D', pincode: '2' },
          parcel: { weight_kg: 1, length_cm: 10, width_cm: 10, height_cm: 5, description: 'Test' },
        },
      ],
    });
    expect(parsed.success).toBe(true);

    const mock = new MockCourierAdapter();
    expect(await mock.createOrder(createOrderSchema.parse({
      order_id: 'mock-order',
      courier_partner: 'mockcourier',
      sender: { name: 'S', phone: '1', address: 'A', city: 'C', pincode: '1' },
      recipient: { name: 'R', phone: '2', address: 'B', city: 'D', pincode: '2' },
      parcel: { weight_kg: 1, length_cm: 10, width_cm: 10, height_cm: 5, description: 'Test' },
    }))).toHaveProperty('courierOrderId');
  });

  it('covers UrbaneBolt adapter and client auth flows', async () => {
    const adapter = new UrbaneBoltAdapter() as any;
    const postMock = jest.fn();
    const getMock = jest.fn();

    postMock
      .mockResolvedValueOnce({ data: { courierOrderId: 'urban-1', awbNumber: 'AA-1', status: 'CREATED' } })
      .mockResolvedValueOnce({ data: { status: 'CANCELLED' } });
    getMock.mockResolvedValue({ data: { status: 'IN_TRANSIT' } });

    adapter.client.getClient = () => ({
      post: postMock,
      get: getMock,
    });

    const created = await adapter.createOrder({
      order_id: 'urban-order',
      courier_partner: 'urbanebolt',
      sender: { name: 'S', phone: '1', address: 'A', city: 'C', pincode: '1' },
      recipient: { name: 'R', phone: '2', address: 'B', city: 'D', pincode: '2' },
      parcel: { weight_kg: 1, length_cm: 10, width_cm: 10, height_cm: 5, description: 'Test' },
    });
    expect(created.courierOrderId).toBe('urban-1');

    const track = await adapter.trackShipment('urban-1');
    expect(track.status).toBe('IN_TRANSIT');

    const cancel = await adapter.cancelOrder('urban-1');
    expect(cancel.status).toBe('CANCELLED');

    const client = new UrbaneBoltClient();
    const instance = client as any;
    instance.client.post = jest.fn().mockResolvedValue({ data: { token: 'abc-token' } });
    await client.authenticate();
    expect(instance.token).toBe('abc-token');
  });
});
