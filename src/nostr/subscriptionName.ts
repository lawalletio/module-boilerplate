import type { NDKFilter, NostrEvent } from '@nostr-dev-kit/ndk';

const filter: NDKFilter = {
  // ids: null,
  authors: ['46241efb55cbfc73d410a136fac1cf88ddb6778014b8a58cecd0df8b01a98ffc'],
  kinds: [1],
  // '#e': null,
  // '#p': null,
  // '#a': null,
  since: Math.round(Date.now() / 1000) - 86000,
  until: Math.round(Date.now() / 1000) + 86000,
  // limit: null,
};

const handler = (event: NostrEvent) => {
  console.info('Received event: ');
  console.dir(event);
};

export { filter, handler };
