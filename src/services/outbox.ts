import { logger, setUpSubscriptions } from '@lib/utils';
import NDK, {
  NDKEvent,
  NDKPrivateKeySigner,
  NDKRelay,
  NostrEvent,
} from '@nostr-dev-kit/ndk';
import { Debugger } from 'debug';
import path from 'path';
import 'websocket-polyfill';

const log: Debugger = logger.extend('services:outbox');
const warn: Debugger = log.extend('warn');

class OutboxService {
  private ndk: NDK;

  constructor() {
    // Instantiate ndk
    log('Instantiate NDK');
    this.ndk = new NDK({
      explicitRelayUrls: process.env.NOSTR_RELAYS?.split(','),
      signer: new NDKPrivateKeySigner(process.env.NOSTR_PRIVATE_KEY),
    });
    log('Subscribing...');
    const subscribed = setUpSubscriptions(
      this.ndk,
      path.join(__dirname, '../nostr'),
    );

    if (null === subscribed) {
      throw new Error('Error setting up subscriptions');
    }

    this.ndk.pool.on('relay:connect', (relay: NDKRelay) => {
      log('Connected to Relay', relay.url);
    });

    this.ndk.on('error', (err) => {
      log('Error connecting to Relay', err);
    });

    // Connect to Nostr
    log('Connecting to Nostr...');
    this.ndk.connect().catch((error) => {
      warn('Error connecting to nostr: %o', error);
    });
  }

  publish(event: NostrEvent) {
    const ndkEvent = new NDKEvent(this.ndk, event);
    ndkEvent.publish();
    return 'Published Outbox!';
  }

  async getEvent(id: string): Promise<NDKEvent | null> {
    return this.ndk.fetchEvent(id);
  }
}

export interface Outbox {
  publish(event: NostrEvent): string;
  getEvent(id: string): Promise<NDKEvent | null>;
}

const outbox = new OutboxService();

export default outbox;
