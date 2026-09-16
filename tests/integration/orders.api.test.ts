import request from 'supertest';
import { app } from '../../src/app';

describe('Ease Commerce API', () => {
  it('creates an order successfully', async () => {
    const payload = {
      order_id: 'ord-001',
      courier_partner: 'mockcourier',
      sender: {
        name: 'Alice',
        phone: '1234567890',
        address: '10 Main St',
        city: 'Bengaluru',
        pincode: '560001',
      },
      recipient: {
        name: 'Bob',
        phone: '0987654321',
        address: '22 Market Rd',
        city: 'Hyderabad',
        pincode: '500001',
      },
      parcel: {
        weight_kg: 2.5,
        length_cm: 30,
        width_cm: 20,
        height_cm: 15,
        description: 'Books',
      },
    };

    const res = await request(app).post('/api/v1/orders').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.order_id).toBe('ord-001');
    expect(res.body.courier_partner).toBe('mockcourier');
    expect(res.body.status).toBe('CREATED');
  });

  it('returns validation error for missing fields', async () => {
    const res = await request(app).post('/api/v1/orders').send({
      courier_partner: 'mockcourier',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('tracks an order by internal order id', async () => {
    const createRes = await request(app).post('/api/v1/orders').send({
      order_id: 'ord-track-1',
      courier_partner: 'mockcourier',
      sender: {
        name: 'Alice',
        phone: '1234567890',
        address: '10 Main St',
        city: 'Bengaluru',
        pincode: '560001',
      },
      recipient: {
        name: 'Bob',
        phone: '0987654321',
        address: '22 Market Rd',
        city: 'Hyderabad',
        pincode: '500001',
      },
      parcel: {
        weight_kg: 1,
        length_cm: 10,
        width_cm: 10,
        height_cm: 5,
        description: 'Documents',
      },
    });

    const res = await request(app).get(`/api/v1/orders/${createRes.body.order_id}/track`);

    expect(res.status).toBe(200);
    expect(res.body.order_id).toBe('ord-track-1');
    expect(Array.isArray(res.body.tracking_history)).toBe(true);
  });

  it('returns a 400 for unsupported courier partners', async () => {
    const res = await request(app).post('/api/v1/orders').send({
      order_id: 'ord-unknown-courier',
      courier_partner: 'unsupportedcourier',
      sender: {
        name: 'Alice',
        phone: '1234567890',
        address: '10 Main St',
        city: 'Bengaluru',
        pincode: '560001',
      },
      recipient: {
        name: 'Bob',
        phone: '0987654321',
        address: '22 Market Rd',
        city: 'Hyderabad',
        pincode: '500001',
      },
      parcel: {
        weight_kg: 1,
        length_cm: 10,
        width_cm: 10,
        height_cm: 5,
        description: 'Test',
      },
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UNKNOWN_COURIER');
    expect(res.body.error.message).toContain('Supported couriers');
  });

  it('returns a 404 for a missing order track request', async () => {
    const res = await request(app).get('/api/v1/orders/NOTEXIST/track');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('processes bulk orders and isolates failures', async () => {
    const res = await request(app).post('/api/v1/orders/bulk').send({
      orders: [
        {
          order_id: 'bulk-1',
          courier_partner: 'mockcourier',
          sender: {
            name: 'A',
            phone: '1',
            address: 'X',
            city: 'Y',
            pincode: '1',
          },
          recipient: {
            name: 'B',
            phone: '2',
            address: 'Z',
            city: 'Q',
            pincode: '2',
          },
          parcel: {
            weight_kg: 1,
            length_cm: 10,
            width_cm: 10,
            height_cm: 5,
            description: 'First',
          },
        },
        {
          order_id: 'bulk-2',
          courier_partner: 'unsupportedcourier',
          sender: {
            name: 'C',
            phone: '3',
            address: 'M',
            city: 'N',
            pincode: '3',
          },
          recipient: {
            name: 'D',
            phone: '4',
            address: 'O',
            city: 'P',
            pincode: '4',
          },
          parcel: {
            weight_kg: 2,
            length_cm: 12,
            width_cm: 8,
            height_cm: 6,
            description: 'Second',
          },
        },
      ],
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results[0].success).toBe(true);
    expect(res.body.results[1].success).toBe(false);
  });
});
