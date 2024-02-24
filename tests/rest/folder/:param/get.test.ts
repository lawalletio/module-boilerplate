import get from '../../../../src/rest/folder/:param/get';
import { ExtendedRequest } from '../../../../src/type/request';
import type { Response } from 'express';

describe('GET handler', () => {
  it('Should handle requests', () => {
    const mockReq = {} as ExtendedRequest;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;

    get(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalled();
    expect(mockRes.send).toHaveBeenCalled();
  });
});
