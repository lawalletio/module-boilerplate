import { setUpRoutes } from '../src/lib/utils';
import request from 'supertest';
import app from '../src/app';

import express from 'express';
import path from 'path';

describe('Rest requests', () => {
  beforeAll(async () => {
    const routes = setUpRoutes(express.Router(), path.join(__dirname, 'rest'));
    await app.use('/', routes!);
    return;
  });

  it('should return status 200 on GET', async () => {
    app.use('/folder/:param1', (req, res) => {
      res.status(200).json({ message: 'Hello world!' });
    });

    const res = await request(app).get('/folder/testparam1');
    expect(res.statusCode).toEqual(200);
  });

  it('should return status 200 on POST', async () => {
    const res = await request(app).post('/folder/testparam2');
    expect(res.statusCode).toEqual(200);
  });

  it('should return status 404', async () => {
    const res = await request(app).get('/notfoundtest');
    expect(res.statusCode).toEqual(404);
  });
});
