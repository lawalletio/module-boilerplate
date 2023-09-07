import request from 'supertest';
import app from '../src/app';

describe('Api request', () => {
  it('should return status 200', async () => {
    const res = await request(app).get('/folder/testparam1');
    expect(res.statusCode).toEqual(200);
  });
});
