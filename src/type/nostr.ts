import { NDKFilter, NostrEvent } from '@nostr-dev-kit/ndk';
import { DefaultContext } from '../../src/type/request';

export type EventHandler = (event: NostrEvent) => Promise<void>;

export type EventHandlerGenerator<
  Context extends DefaultContext = DefaultContext,
> = (ctx: Context, iteration?: number) => EventHandler;

export type SubHandling<Context extends DefaultContext = DefaultContext> = {
  filter: NDKFilter;
  getHandler: EventHandlerGenerator<Context>;
};
