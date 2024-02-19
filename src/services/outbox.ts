import { Debugger } from 'debug';
import NDK, { NDKEvent, NDKRelaySet, NostrEvent } from '@nostr-dev-kit/ndk';

import { logger } from '@lib/utils';

const log: Debugger = logger.extend('index');
const error: Debugger = log.extend('warn');

export class OutboxService {
  constructor(private readonly ndk: NDK) {}

  publish(event: NostrEvent, relaySet?: NDKRelaySet): Promise<void> {
    const ndkEvent = new NDKEvent(this.ndk, event);
    return new Promise((resolve, reject) => {
      ndkEvent
        .publish(relaySet)
        .then((relays) => {
          if (0 === relays.size) {
            error('Could not publish to any relay event %s', event.id);
            reject(new Error('Did not publish to any relay'));
          } else {
            resolve();
          }
        })
        .catch((e) => {
          error('Error found when publishing event %s: %O', event.id, e);
          reject(new Error('Unexpected error publishing event'));
        });
    });
  }
}
