import NDK, { NDKRelaySet, NostrEvent } from '@nostr-dev-kit/ndk';
import { ApiGatewayOutbox, DirectOutbox } from '../../src/services/outbox';
import { mockEventPublish } from '../utils';

describe('Outbox', () => {
  describe('Direct', () => {
    const ndk = new NDK();
    const outbox = new DirectOutbox(ndk);
    it('should publish an event correctly', async () => {
      expect.assertions(2);
      mockEventPublish.mockResolvedValueOnce({ size: 1 });

      await expect(outbox.publish({} as NostrEvent)).resolves.not.toThrow();
      expect(mockEventPublish).toHaveBeenCalled();
    });

    it('should fail if no relay published', async () => {
      expect.assertions(2);
      mockEventPublish.mockResolvedValueOnce({ size: 0 });

      await expect(outbox.publish({} as NostrEvent)).rejects.toEqual(
        new Error('Did not publish to any relay'),
      );
      expect(mockEventPublish).toHaveBeenCalled();
    });

    it('should fail if publishing failed', async () => {
      expect.assertions(2);
      mockEventPublish.mockRejectedValueOnce('');

      await expect(outbox.publish({} as NostrEvent)).rejects.toEqual(
        new Error('Unexpected error publishing event'),
      );
      expect(mockEventPublish).toHaveBeenCalled();
    });
  });

  describe('ApiGateway', () => {
    const outbox = new ApiGatewayOutbox('https://example.com/publish');
    it('should publish an event correctly', async () => {
      expect.assertions(2);
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({} as Response);

      await expect(outbox.publish({} as NostrEvent)).resolves.not.toThrow();
      expect(fetch).toHaveBeenCalled();
    });

    it('should not accept relaySet param', async () => {
      expect.assertions(1);

      await expect(
        outbox.publish({} as NostrEvent, {} as NDKRelaySet),
      ).rejects.toEqual(new Error('Unsupported param relaySet'));
    });

    it('should fail if publishing failed', async () => {
      expect.assertions(2);
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error());

      await expect(outbox.publish({} as NostrEvent)).rejects.toEqual(
        new Error('Unexpected error publishing event'),
      );
      expect(fetch).toHaveBeenCalled();
    });
  });
});
