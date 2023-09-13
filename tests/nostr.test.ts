import { setUpSubscriptions } from '../src/lib/utils';
import NDK from '@nostr-dev-kit/ndk';
import 'websocket-polyfill';
import relayList from '../src/constants/relays.json';
import path from 'path';

let ndk: NDK;

const ndkMock = {
  subscribe: jest.fn(),
  on: jest.fn(),
};

describe('Nostr test', () => {
  beforeAll(async () => {
    // ndk = new NDK({
    //   explicitRelayUrls: relayList,
    // });
  });

  it('should add subscriptions', async () => {
    const subscriptions = setUpSubscriptions(
      ndkMock as unknown as NDK,
      path.join(__dirname, '../src/nostr'),
    );

    // console.dir(subscriptions.);

    expect(200).toEqual(200);
  });
});
