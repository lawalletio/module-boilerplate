import NDK, { NostrEvent } from '@nostr-dev-kit/ndk';
import { OutboxService } from '@services/outbox';
import { mockEventPublish } from '../../__mocks__/@nostr-dev-kit/ndk';

describe('Outbox service', () => {
  const ndk = new NDK();
  const outbox = new OutboxService(ndk);
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
      'Did not publish to any relay',
    );
    expect(mockEventPublish).toHaveBeenCalled();
  });

  it('should fail if publishing failed', async () => {
    expect.assertions(2);
    mockEventPublish.mockRejectedValueOnce('');

    await expect(outbox.publish({} as NostrEvent)).rejects.toEqual(
      'Unexpected error publishing event',
    );
    expect(mockEventPublish).toHaveBeenCalled();
  });
});
