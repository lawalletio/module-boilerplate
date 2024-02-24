import { notFound } from '../../../src/lib/middlewares/not-found.middleware';
import { NextFunction, Request, Response } from 'express';

describe('Not found middleware', () => {
  it('should return 404 when called', () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;

    notFound({} as Request, mockRes, {} as NextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.send).toHaveBeenCalled();
  });
});
