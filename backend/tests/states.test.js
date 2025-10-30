const request = require('supertest');
const app = require('../server');

/**
 * @file States API tests.
 * @module backend/tests/states.test
 */

describe('States API', () => {
  test('GET /api/states returns 50 states with code and name', async () => {
    const res = await request(app).get('/api/states');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Expect exactly 50 from seed
    expect(res.body.length).toBe(50);
    expect(res.body[0]).toHaveProperty('code');
    expect(res.body[0]).toHaveProperty('name');
  });
});


