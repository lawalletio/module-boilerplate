export const mockedNDKRelay = {
  connect: jest.fn().mockResolvedValue(''),
  disconnect: jest.fn(),
  on: jest.fn(),
};

export const mockedNDK = {
  assertSigner: jest.fn(),
  connect: jest.fn().mockResolvedValue(''),
  on: jest.fn(),
  pool: {
    on: jest.fn(),
    relays: new Map([[1, mockedNDKRelay]]),
  },
};

export const mockEventPublish = jest.fn();

export const mockRouteRes = {
  status: jest.fn().mockReturnThis(),
  header: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
};

export const mockAppListen = jest.fn((_port, fn: () => void) => {
  fn();
});
