import NDK, { NDKEvent, NDKSubscription } from '@nostr-dev-kit/ndk';
import LastHandledTracker from '../../src/lib/lastHandled';
import EventEmitter from 'events';
import { mockEventPublish } from '../utils';

const now: number = 1231006505000;
jest.useFakeTimers({ now });

const mockedSub = jest.fn();

const mockedStats = jest.fn();
const writeNDK: NDK = {
  pool: { stats: mockedStats },
  subscribe: mockedSub,
} as unknown as NDK;

describe('Last Handled', () => {
  beforeEach(() => {
    jest.mocked(mockedStats).mockReset();
    jest.mocked(mockedSub).mockReset();
    jest.clearAllTimers();
  });

  describe('empty tracker', () => {
    it('should not publish any event', () => {
      new LastHandledTracker(writeNDK, []);
      mockedStats.mockReturnValue({
        disconnected: 0,
        total: 1,
        connected: 1,
        connecting: 0,
      });

      jest.advanceTimersByTime(120000);

      expect(NDKEvent).not.toHaveBeenCalled();
      expect(mockEventPublish).not.toHaveBeenCalled();
      expect(writeNDK.pool.stats).toHaveBeenCalledTimes(2);
    });

    it('should throw error when getting', () => {
      const tracker = new LastHandledTracker(writeNDK, []);

      expect(() => {
        tracker.get('');
      }).toThrow(ReferenceError);
    });

    it('should throw error when hitting', () => {
      const tracker = new LastHandledTracker(writeNDK, []);

      expect(() => {
        tracker.hit('', 10);
      }).toThrow(ReferenceError);
    });
  });

  describe('tracker', () => {
    it('should not publish event if the pool is disconnected', () => {
      new LastHandledTracker(writeNDK, ['handler1', 'handler2', 'handler3']);
      mockedStats.mockReturnValue({
        disconnected: 1,
        total: 1,
        connected: 0,
        connecting: 0,
      });

      jest.advanceTimersByTime(120000);

      expect(NDKEvent).not.toHaveBeenCalled();
      expect(mockEventPublish).not.toHaveBeenCalled();
      expect(writeNDK.pool.stats).toHaveBeenCalledTimes(2);
    });

    it('should not publish event if it have not handled anything', () => {
      new LastHandledTracker(writeNDK, ['handler1', 'handler2', 'handler3']);
      mockedStats.mockReturnValue({
        disconnected: 0,
        total: 1,
        connected: 1,
        connecting: 0,
      });

      jest.advanceTimersByTime(120000);

      expect(NDKEvent).not.toHaveBeenCalled();
      expect(mockEventPublish).not.toHaveBeenCalled();
      expect(writeNDK.pool.stats).toHaveBeenCalledTimes(2);
    });

    it('should publish events only for hitted handlers', () => {
      const tracker = new LastHandledTracker(writeNDK, [
        'handler1',
        'handler2',
        'handler3',
      ]);
      mockedStats.mockReturnValue({
        disconnected: 0,
        total: 1,
        connected: 1,
        connecting: 0,
      });
      mockEventPublish.mockImplementation(() => Promise.resolve());

      tracker.hit('handler2', 100);
      tracker.hit('handler3', 101);
      jest.advanceTimersByTime(120000);

      expect(NDKEvent).toHaveBeenNthCalledWith(1, writeNDK, {
        content: '100',
        created_at: now / 1000 + 60,
        kind: 31111,
        pubkey:
          '0ce32219d1fce60df30b59b2b3885edea84341444a422918ff8d6cf641ecfa6b',
        tags: [['d', 'lastHandled:handler2']],
      });
      expect(NDKEvent).toHaveBeenNthCalledWith(2, writeNDK, {
        content: '101',
        created_at: now / 1000 + 60,
        kind: 31111,
        pubkey:
          '0ce32219d1fce60df30b59b2b3885edea84341444a422918ff8d6cf641ecfa6b',
        tags: [['d', 'lastHandled:handler3']],
      });
      expect(NDKEvent).toHaveBeenNthCalledWith(3, writeNDK, {
        content: '100',
        created_at: now / 1000 + 120,
        kind: 31111,
        pubkey:
          '0ce32219d1fce60df30b59b2b3885edea84341444a422918ff8d6cf641ecfa6b',
        tags: [['d', 'lastHandled:handler2']],
      });
      expect(NDKEvent).toHaveBeenNthCalledWith(4, writeNDK, {
        content: '101',
        created_at: now / 1000 + 120,
        kind: 31111,
        pubkey:
          '0ce32219d1fce60df30b59b2b3885edea84341444a422918ff8d6cf641ecfa6b',
        tags: [['d', 'lastHandled:handler3']],
      });
      expect(mockEventPublish).toHaveBeenCalledTimes(4);
      expect(writeNDK.pool.stats).toHaveBeenCalledTimes(2);
    });

    it('should load existing lastHandled information', async () => {
      const tracker = new LastHandledTracker(writeNDK, [
        'handler1',
        'handler2',
        'handler3',
      ]);
      mockedStats.mockReturnValue({
        disconnected: 0,
        total: 1,
        connected: 1,
        connecting: 0,
      });
      mockEventPublish.mockImplementation(() => Promise.resolve());
      const mockSubscribe = new EventEmitter() as unknown as NDKSubscription;
      mockedSub.mockReturnValue(mockSubscribe);

      const fetchLastHandled = tracker.fetchLastHandled();
      mockSubscribe.emit('event', {
        content: '100',
        created_at: now / 1000 - 60,
        kind: 31111,
        pubkey:
          '0ce32219d1fce60df30b59b2b3885edea84341444a422918ff8d6cf641ecfa6b',
        tags: [['d', 'lastHandled:handler2']],
      });
      mockSubscribe.emit('event', {
        content: '100',
        created_at: now / 1000 - 60,
        kind: 31111,
        pubkey:
          '0ce32219d1fce60df30b59b2b3885edea84341444a422918ff8d6cf641ecfa6b',
        tags: [['d', 'invalidTag']],
      });
      mockSubscribe.emit('event', {
        content: '100',
        created_at: now / 1000 - 60,
        kind: 31111,
        pubkey:
          '0ce32219d1fce60df30b59b2b3885edea84341444a422918ff8d6cf641ecfa6b',
        tags: [],
      });
      mockSubscribe.emit('eose');
      await fetchLastHandled;
      jest.advanceTimersByTime(120000);

      expect(NDKEvent).toHaveBeenNthCalledWith(1, writeNDK, {
        content: '100',
        created_at: now / 1000 + 60,
        kind: 31111,
        pubkey:
          '0ce32219d1fce60df30b59b2b3885edea84341444a422918ff8d6cf641ecfa6b',
        tags: [['d', 'lastHandled:handler2']],
      });
      expect(NDKEvent).toHaveBeenNthCalledWith(2, writeNDK, {
        content: '100',
        created_at: now / 1000 + 120,
        kind: 31111,
        pubkey:
          '0ce32219d1fce60df30b59b2b3885edea84341444a422918ff8d6cf641ecfa6b',
        tags: [['d', 'lastHandled:handler2']],
      });
      expect(mockEventPublish).toHaveBeenCalledTimes(2);
      expect(writeNDK.pool.stats).toHaveBeenCalledTimes(2);
    });

    it('should store greater timestamps', () => {
      const tracker = new LastHandledTracker(writeNDK, [
        'handler1',
        'handler2',
        'handler3',
      ]);
      mockedStats.mockReturnValue({
        disconnected: 0,
        total: 1,
        connected: 1,
        connecting: 0,
      });

      tracker.hit('handler1', 100);
      expect(tracker.get('handler1')).toBe(100);
      tracker.hit('handler1', 99);
      expect(tracker.get('handler1')).toBe(100);
      tracker.hit('handler1', 101);
      expect(tracker.get('handler1')).toBe(101);
    });

    it('should handle race condition', () => {
      const tracker = new LastHandledTracker(writeNDK, [
        'handler1',
        'handler2',
        'handler3',
      ]);
      mockedStats.mockReturnValue({
        disconnected: 0,
        total: 1,
        connected: 1,
        connecting: 0,
      });

      tracker.hit('handler1', 100);
      jest.spyOn(global.Atomics, 'compareExchange').mockReturnValueOnce(101n);
      tracker.hit('handler1', 102);

      expect(tracker.get('handler1')).toBe(102);

      jest.spyOn(global.Atomics, 'compareExchange').mockRestore();
    });
  });
});
