const request = require('supertest');
const app = require('../server');
describe('health', () => {
 it('returns ok', async () => {
 const res = await request(app).get('/api/health');
 expect(res.status).toBe(200);
 expect(res.body).toEqual({ status: 'ok' });
 });
});