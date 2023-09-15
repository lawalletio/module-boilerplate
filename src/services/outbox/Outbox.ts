import NDK, {
  NDKEvent,
  NDKPrivateKeySigner,
  NostrEvent,
} from '@nostr-dev-kit/ndk';

export class OutboxService {
  private ndk: NDK;

  constructor() {
    this.ndk = new NDK({
      explicitRelayUrls: process.env.NOSTR_RELAYS?.split(','),
      signer: new NDKPrivateKeySigner(process.env.NOSTR_PRIVATE_KEY),
    });
  }

  publish(event: NostrEvent) {
    const ndkEvent = new NDKEvent(this.ndk, event);
    ndkEvent.publish();
    return 'Published Outbox!';
  }
}
