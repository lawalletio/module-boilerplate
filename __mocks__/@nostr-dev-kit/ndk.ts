export const mockEventPublish = jest.fn();

export const NDKEvent = jest.fn().mockImplementation(() => {
  return {
    publish: mockEventPublish,
  }
});

export const NDKPrivateKeySigner = jest.fn();

export const mockedNDKRelay = {
  connect: jest.fn().mockResolvedValue(''),
  disconnect: jest.fn(),
  on: jest.fn(),
};
export const NDKRelay = jest.fn(() => mockedNDKRelay);

export const NDKRelaySet = jest.fn();

export const mockedNDK = {
  assertSigner: jest.fn(),
  connect: jest.fn().mockResolvedValue(''),
  on: jest.fn(),
  pool : {
    on: jest.fn(),
    relays: new Map([[1, mockedNDKRelay]]),
  },
};
export default jest.fn(() => mockedNDK);
