import { errorHandler } from '@lib/middlewares/error.middleware';
import { NextFunction, Request, Response } from 'express';

describe('Error middleware', () => {
  it.each([
    { e: new SyntaxError(), expected: 415 },
    { e: new Error(), expected: 500 },
  ])('should return $expected when called with $e', ({ e, expected }) => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;

    errorHandler(e, {} as Request, mockRes, {} as NextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(expected);
    expect(mockRes.send).toHaveBeenCalled();
  });
});
