import { NostrEvent } from '@nostr-dev-kit/ndk';
import { getHandler } from '@nostr/subscriptionName';
import { Context } from '@type/request';

describe('Nostr handler', () => {
  it('should handle received evenshould handle received eventt', () => {
    const context: Context = {
      outbox: { publish: jest.fn() },
    } as unknown as Context;
    const event = {} as NostrEvent;

    const handler = getHandler(context);
    handler(event);

    expect(context.outbox.publish).toHaveBeenCalledWith(event);
  });
});
