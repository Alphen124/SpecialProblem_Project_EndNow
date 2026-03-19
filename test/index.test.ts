import request from 'supertest';
import { app } from '../src/index';

describe('GET /', () => {
  it('should respond with a 200 status code', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });

  it('should respond with HTML', async () => {
    const response = await request(app).get('/');
    expect(response.headers['content-type']).toMatch(/html/);
  });
});

describe('GET /api/health', () => {
  it('should return ok status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
