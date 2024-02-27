import NDK, { NDKRelay } from '@nostr-dev-kit/ndk';
import {
  connectToTempRelays,
  getReadNDK,
  getSignerNDK,
  getWriteNDK,
} from '../../src/services/ndk';
import { mockedNDKRelay } from '../utils';

const now: number = 1231006505000;
jest.useFakeTimers({ now });

describe('NDK wrapper', () => {
  describe('getReadNDK', () => {
    it('should create the ndk only once', () => {
      const readNDK = getReadNDK();

      expect(getReadNDK()).toBe(readNDK);
      expect(NDK).toHaveBeenCalledTimes(1);
      expect(NDK).toHaveBeenCalledWith({
        explicitRelayUrls: [
          'wss://relay.lawallet.ar',
          'wss://relay.example.org',
        ],
      });
    });
  });

  describe('getWriteNDK', () => {
    it('should create the ndk only once', () => {
      const writeNDK = getWriteNDK();

      expect(getWriteNDK()).toBe(writeNDK);
      expect(NDK).toHaveBeenCalledTimes(1);
      expect(NDK).toHaveBeenCalledWith(
        expect.objectContaining({
          explicitRelayUrls: ['wss://write.relay.lawallet.ar'],
        }),
      );
    });
  });

  describe('getSignerNDK', () => {
    it('should give an ndk instance', () => {
      getSignerNDK();
      expect(NDK).toHaveBeenCalledTimes(1);
    });
  });

  describe('connectToTempRelays', () => {
    beforeEach(() => {
      jest.clearAllTimers();
    });
    it('should connect correctly', () => {
      const relays: string[] = ['wss://relay.lawallet.ar'];
      const ndk = new NDK();
      mockedNDKRelay.on.mockImplementation((_, fn: () => void) => {
        fn();
      });

      connectToTempRelays(relays, ndk);

      expect(NDKRelay).toHaveBeenCalledTimes(1);
      expect(NDKRelay).toHaveBeenCalledWith('wss://relay.lawallet.ar');

      jest.advanceTimersByTime(5 * 60 * 1000);
      jest.mocked(NDKRelay).mockClear();
      relays.push('wss://relay.example.org');

      connectToTempRelays(relays, ndk);

      expect(NDKRelay).toHaveBeenCalledTimes(1);
      expect(NDKRelay).toHaveBeenCalledWith('wss://relay.example.org');

      jest.advanceTimersByTime(10 * 60 * 1000);
      jest.mocked(NDKRelay).mockClear();
      mockedNDKRelay.connect.mockRejectedValueOnce('Oops');

      connectToTempRelays(relays, ndk);

      expect(NDKRelay).toHaveBeenCalledTimes(2);
    });
  });
});
