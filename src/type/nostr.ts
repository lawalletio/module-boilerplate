import { NDKFilter, NostrEvent } from '@nostr-dev-kit/ndk';
import { Context } from '@type/request';

export type EventHandler = (event: NostrEvent) => Promise<void>;

export type EventHandlerGenerator = (
  ctx: Context,
  iteration?: number,
) => EventHandler;

export type SubHandling = {
  filter: NDKFilter;
  getHandler: EventHandlerGenerator;
};
