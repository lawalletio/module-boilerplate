import { errorHandler } from '../../../src/lib/middlewares/error.middleware';
import { ErrorResponseContract } from '../../../src/type/responses';
import { NextFunction, Request, Response } from 'express';

describe('Error middleware', () => {
  it.each([
    { e: new SyntaxError(), expected: 415 },
    { e: new Error(), expected: 500 },
  ])('should return $expected when called with $e', ({ e, expected }) => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response<ErrorResponseContract>;

    errorHandler(e, {} as Request, mockRes, {} as NextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(expected);
    expect(mockRes.send).toHaveBeenCalled();
  });
});
