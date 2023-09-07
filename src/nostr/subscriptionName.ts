import { NostrEvent } from '@nostr-dev-kit/ndk';

const req = {};

const cb = (event: NostrEvent) => {
  console.info('event: ');
  console.info(event);
};

export { req, cb };
