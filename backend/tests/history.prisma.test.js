/**
 * Ensures the optional Prisma persistence path in historyController is executed.
 */

// Use manual mock from __mocks__ directory
jest.mock('@prisma/client');
const { __mocks } = require('@prisma/client');

const request = require('supertest');
const app = require('../server');

describe('History API (Prisma path)', () => {
  test('POST /api/history triggers Prisma create + disconnect', async () => {
    const payload = {
      userId: '11111111-1111-1111-1111-111111111111',
      eventId: '22222222-2222-2222-2222-222222222222',
      activityType: 'Volunteer',
      details: 'Cover prisma path',
    };

    const res = await request(app).post('/api/history').send(payload);
    expect(res.status).toBe(201);

    // Allow the async IIFE inside controller to run
    await new Promise((r) => setImmediate(r));

    expect(__mocks.mockCreate).toHaveBeenCalled();
    expect(__mocks.mockDisconnect).toHaveBeenCalled();
  });

  test('POST /api/history handles Prisma create rejection (catch path)', async () => {
    // Force one rejection to exercise catch branch inside IIFE
    __mocks.mockCreate.mockRejectedValueOnce(new Error('inject create failure'));

    const payload = {
      userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      eventId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      activityType: 'Volunteer',
    };

    const res = await request(app).post('/api/history').send(payload);
    expect(res.status).toBe(201);

    await new Promise((r) => setImmediate(r));
    expect(__mocks.mockCreate).toHaveBeenCalled();
  });
});


