import { Debugger } from 'debug';
import type { NDKFilter, NostrEvent } from '@nostr-dev-kit/ndk';

import { logger } from '../lib/utils';
import { DefaultContext } from '../type/request';
import { EventHandler } from '../type/nostr';

const log: Debugger = logger.extend('nostr:subscriptionName');

const filter: NDKFilter = {
  // ids: null,
  authors: [''],
  kinds: [1],
  // '#e': null,
  // '#p': null,
  // '#a': null,
  since: Math.floor(Date.now() / 1000) - 86000,
  until: Math.floor(Date.now() / 1000) + 86000,
  // limit: null,
};

const getHandler = (ctx: DefaultContext): EventHandler => {
  return async (event: NostrEvent): Promise<void> => {
    log('******* Received event: *******');
    log(event.content);
    await ctx.outbox.publish(event);
  };
};

export { filter, getHandler };
