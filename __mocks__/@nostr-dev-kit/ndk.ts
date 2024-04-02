import { mockEventPublish, mockedNDK, mockedNDKRelay } from '../../tests/utils';

export const NDKEvent = jest.fn().mockImplementation(() => {
  return {
    publish: mockEventPublish,
  };
});

export const NDKPrivateKeySigner = jest.fn();

export const NDKRelay = jest.fn(() => mockedNDKRelay);

export const NDKRelaySet = jest.fn();

export default jest.fn(() => mockedNDK);
