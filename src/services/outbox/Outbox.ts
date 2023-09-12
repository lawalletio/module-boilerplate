import NDK, {
  NDKEvent,
  NDKPrivateKeySigner,
  NostrEvent,
} from '@nostr-dev-kit/ndk';
import relayList from '../../constants/relays.json';

export class OutboxService {
  private ndk: NDK;

  constructor() {
    this.ndk = new NDK({
      explicitRelayUrls: relayList,
      signer: new NDKPrivateKeySigner(process.env.NOSTR_PRIVATE_KEY),
    });
  }

  publish(event: NostrEvent) {
    const ndkEvent = new NDKEvent(this.ndk, event);
    ndkEvent.publish();
    return 'Published Outbox!';
  }
}
