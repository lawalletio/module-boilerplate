import NDK, { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk';

export class OutboxService {
  private ndk: NDK;

  constructor(ndk: NDK) {
    this.ndk = ndk;
  }

  publish(event: NostrEvent) {
    const ndkEvent = new NDKEvent(this.ndk, event);
    ndkEvent.publish();
    return 'Published Outbox!';
  }
}
