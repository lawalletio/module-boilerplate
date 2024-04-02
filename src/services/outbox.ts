import { Debugger } from 'debug';
import NDK, { NDKEvent, NDKRelaySet, NostrEvent } from '@nostr-dev-kit/ndk';

import { jsonStringify, logger } from '../lib/utils';

const log: Debugger = logger.extend('index');
const error: Debugger = log.extend('warn');

export class DirectOutbox implements Outbox {
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
        .catch((e: unknown) => {
          error('Error found when publishing event %s: %O', event.id, e);
          reject(new Error('Unexpected error publishing event'));
        });
    });
  }
}

export class ApiGatewayOutbox implements Outbox {
  constructor(private readonly postUrl: string) {}

  async publish(event: NostrEvent, relaySet?: NDKRelaySet): Promise<void> {
    if (undefined !== relaySet) {
      throw new Error('Unsupported param relaySet');
    }
    const options: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonStringify(event),
    };

    try {
      await fetch(this.postUrl, options);
    } catch (e: unknown) {
      error('Error found when publishing event %s: %O', event.id, e);
      throw new Error('Unexpected error publishing event');
    }
  }
}

export interface Outbox {
  publish(event: NostrEvent, relaySet?: NDKRelaySet): Promise<void>;
}
