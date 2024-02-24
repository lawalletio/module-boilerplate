import { NostrEvent } from '@nostr-dev-kit/ndk';
import { getHandler } from '../../src/nostr/subscriptionName';
import { DefaultContext } from '../../src/type/request';

describe('Nostr handler', () => {
  it('should handle received evenshould handle received event', async () => {
    const context: DefaultContext = {
      outbox: { publish: jest.fn() },
    } as unknown as DefaultContext;
    const event = {} as NostrEvent;

    const handler = getHandler(context);
    await handler(event);

    expect(context.outbox.publish).toHaveBeenCalledWith(event);
  });
});
