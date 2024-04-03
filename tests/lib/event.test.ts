import { NostrEvent } from '@nostr-dev-kit/ndk';

import {
  MultiNip04Content,
  buildMultiNip04Event,
  getTagValue,
  parseEventBody,
  parseMultiNip04Event,
  responseEvent,
  validateDelegation,
  validateDelegationConditions,
} from '../../src/lib/event';

const now: number = 1231006505000;
jest.useFakeTimers({ now });
jest.mock('crypto');

describe('Event utils', () => {
  describe('parseEventBody', () => {
    const validEvent: NostrEvent = {
      id: '2e650fdf7a980356b9a2e0ffe52378e200a520e82a83f091b60dbe7631bac1e5',
      pubkey:
        '2e14a0495e41fbe9ee9e4fdcb0691ecf7ab09f763b7d6e4fe3d817407926b27c',
      created_at: 1231006505,
      kind: 1,
      tags: [],
      content: 'Hello World',
      sig: 'f1fcab646900e6461fe5d1de95f1b721b75a65b87b7e13ff72fe99513e226f15bcaf56a1e07450ef3cd357c01b011b576493e8f213ef6a177fa75c921ad1577f',
    };
    const oldEvent: NostrEvent = {
      id: 'f320abee67837c29a44c78a56547b0f5072a0d2c9660f1726456a0a7f041c325',
      pubkey:
        '2e14a0495e41fbe9ee9e4fdcb0691ecf7ab09f763b7d6e4fe3d817407926b27c',
      created_at: 1231006305,
      kind: 1,
      tags: [],
      content: 'Hello World',
      sig: 'f44ffcc4fce439b3107219bf22a922812a5fa54023de2d0dd0b27702c5971f45fbb67fc4934e7573cd47283a97e794163f5099bdb0a8c1d2fd11d503e09012ee',
    };
    const delegator =
      '71316e754a94bd5f5a8b662c41bc2d05241abca4c33ea0ae50a90dfb2a0e8918';
    const validDelegatedEvent: NostrEvent = {
      id: '5d273c78a008cfc15ad75b16f6d68804835724b5de3bc809d49063b15fce653f',
      pubkey:
        '2e14a0495e41fbe9ee9e4fdcb0691ecf7ab09f763b7d6e4fe3d817407926b27c',
      created_at: 1231006505,
      kind: 1,
      tags: [
        [
          'delegation',
          '71316e754a94bd5f5a8b662c41bc2d05241abca4c33ea0ae50a90dfb2a0e8918',
          'kind=1&created_at<2147483647&created_at>1',
          'f9b556cc720b0054181efe17a7775e5145ee39fa7049d3d1420d64da7611f587451509f900c68ebc85c06574aecd43595ad57942db06ea2c31c2e2be55226b23',
        ],
      ],
      content: 'Hello World',
      sig: 'c6295e3c0adae52e81790b1d51925e734bb15c718c7f364a8b3e653ed12d4ff8b513f8e92b4d526b78f4e0313b577bb01147d39656d798304fd5c7d574494ecf',
    };
    const invalidDelegatedEvent: NostrEvent = {
      id: 'd4b47467c8c1ff05ab619d4d92597db8264c2ca1281b56bb2e1bd440d8d01650',
      pubkey:
        '2e14a0495e41fbe9ee9e4fdcb0691ecf7ab09f763b7d6e4fe3d817407926b27c',
      created_at: 1231006505,
      kind: 1,
      tags: [
        [
          'delegation',
          '61316e754a94bd5f5a8b662c41bc2d05241abca4c33ea0ae50a90dfb2a0e8918',
          'kind=1&created_at<2147483647&created_at>1',
          'f9b556cc720b0054181efe17a7775e5145ee39fa7049d3d1420d64da7611f587451509f900c68ebc85c06574aecd43595ad57942db06ea2c31c2e2be55226b23',
        ],
      ],
      content: 'Hello World',
      sig: 'c0345cd47b8315883913fca370472c0ca50c083764b6f1dcefe29666b6f31cc7200d4731db569038d3eef0a87c58b361ef7ef394fdb15edc31ece7df71adc2b8',
    };
    it.each([
      { event: {} as NostrEvent, expectedPubkey: undefined, expected: null },
      {
        event: { ...validEvent, sig: '' },
        expectedPubkey: undefined,
        expected: null,
      },
      {
        event: invalidDelegatedEvent,
        expectedPubkey: undefined,
        expected: null,
      },
      { event: oldEvent, expectedPubkey: undefined, expected: null },
      { event: validEvent, expectedPubkey: 'otherPubkey', expected: null },
      { event: validEvent, expectedPubkey: undefined, expected: validEvent },
      {
        event: validDelegatedEvent,
        expectedPubkey: undefined,
        expected: expect.objectContaining({
          ...validDelegatedEvent,
          pubkey: delegator,
        }) as NostrEvent,
      },
    ])(
      'should resolve to $expected with $event and $expectedPubkey',
      ({ event, expectedPubkey, expected }) => {
        expect(parseEventBody(event, expectedPubkey)).toEqual(expected);
      },
    );
  });

  describe('getTagValue', () => {
    it('should get tag value', () => {
      const [expectedTagName, expectedTagValue]: [string, string] = [
        't',
        'example-value',
      ];
      const event: NostrEvent = {
        created_at: 1700597798,
        content: '',
        tags: [[expectedTagName, expectedTagValue]],
        pubkey: '',
      };

      const tagValue: string | undefined = getTagValue(event, expectedTagName);

      expect(tagValue).toBe(expectedTagValue);
    });

    it('should return undefined for invalid tag name', () => {
      const [expectedTagName, expectedTagValue]: [string, string] = [
        't',
        'example-value',
      ];
      const event: NostrEvent = {
        created_at: 1700597798,
        content: '',
        tags: [[expectedTagName, expectedTagValue]],
        pubkey: '',
      };

      const tagValue: string | undefined = getTagValue(event, 'other-tag');

      expect(tagValue).toBeUndefined();
    });

    it('should return undefined for empty tags', () => {
      const event: NostrEvent = {
        created_at: 1700597798,
        content: '',
        tags: [],
        pubkey: '',
      };

      const tagValue: string | undefined = getTagValue(event, 'tag-name');

      expect(tagValue).toBeUndefined();
    });
  });

  describe('responseEvent', () => {
    it('should create response without request', () => {
      expect(responseEvent('response-type', 'Hello World')).toEqual({
        pubkey: process.env['NOSTR_PUBLIC_KEY'],
        created_at: now / 1000,
        kind: 21111,
        tags: [['t', 'response-type']],
        content: 'Hello World',
      });
    });

    it('should create response with request', () => {
      const reqEvent = {
        id: '12345',
        pubkey: 'myPubkey',
      } as NostrEvent;
      expect(responseEvent('response-type', 'Hello World', reqEvent)).toEqual({
        pubkey: process.env['NOSTR_PUBLIC_KEY'],
        created_at: now / 1000,
        kind: 21111,
        tags: [
          ['t', 'response-type'],
          ['p', reqEvent.pubkey],
          ['e', reqEvent.id],
        ],
        content: 'Hello World',
      });
    });
  });

  describe('validateDelegationConditions', () => {
    it.each([
      { conditions: '', expected: null },
      {
        conditions: 'kind=1',
        expected: null,
      },
      {
        conditions: 'kind=1&kind=2&created_at<2147483647&created_at>1',
        expected: null,
      },
      {
        conditions: 'kind=1&created_at<2147483647&created_at<10&created_at>1',
        expected: null,
      },
      {
        conditions: 'kind=1&created_at<2147483647&created_at>10&created_at>1',
        expected: null,
      },
      {
        conditions: 'kind=1&created_at<2147483647&created_at>1',
        expected: { kind: 1, since: 1, until: 2147483647 },
      },
    ])('should validate correctly', ({ conditions, expected }) => {
      expect(validateDelegationConditions(conditions)).toEqual(expected);
    });
  });

  describe('validateDelegation', () => {
    it('should return true for valid delegation', () => {
      const pubkey =
        'be1d4c01271d6c010829b47e7c29fe1baab4555d810b839500025264d6edfc30';
      const cond = 'kind=1&created_at<2147483647&created_at>1';
      const token =
        'e97a5ae84c0bea2b31f83c3696fcc6cca941d6c1ed10581be9a08f6b0c619eb0bba40d75fe8baa63a051f087e0238d499b4efbfa3474f269eed5a0c50202c27d';
      const isValid = validateDelegation(pubkey, cond, token, 1);

      expect(isValid).toBe(true);
    });

    it('should return true for valid regular delegation', () => {
      const pubkey =
        'be1d4c01271d6c010829b47e7c29fe1baab4555d810b839500025264d6edfc30';
      const cond = 'kind=1112&created_at<2147483647&created_at>1';
      const token =
        'a9e9a84b4b3610f0085fefc71553da93691b08fe93142616003151c45b3a8ecb0c7e9f062b2a40dd48b40342bce67ec8b424e080af92f820846bdc575f2d748f';
      const isValid = validateDelegation(pubkey, cond, token);

      expect(isValid).toBe(true);
    });

    // we use an external lib for validating, not going to test it
    it('should return false for invalid delegation', () => {
      expect(validateDelegation('', '', '')).toBe(false);
    });
  });

  describe('buildMultiNip04Event', () => {
    it('should generate event correctly', async () => {
      const msg = 'Hello World';
      const priv =
        '77aaadb00be9fc5c15d920d1ac4b6d991db198bf861d0ab9339186c9bcef933a';
      const pub =
        'f392c2530a9e8ec07dd9d1235b6b3e7782d27048a577fc7ca36302c67a449781';
      const receivers = [
        '9d2989edd27f1377bbfc6635893d5a825e01a7e1da7a377a5a3030ac0b347ac5',
        '0ce927e017647607cd50d45dccaacb28c55c18114ef4cfe07a9d9dd6afcd85fb',
      ];

      const event = await buildMultiNip04Event(msg, priv, pub, receivers);

      expect(event).toEqual(
        expect.objectContaining({
          content: expect.any(String) as string,
          created_at: now / 1000,
          tags: [
            [
              'p',
              '9d2989edd27f1377bbfc6635893d5a825e01a7e1da7a377a5a3030ac0b347ac5',
            ],
            [
              'p',
              '0ce927e017647607cd50d45dccaacb28c55c18114ef4cfe07a9d9dd6afcd85fb',
            ],
          ],
          pubkey: pub,
        }),
      );
      const content = JSON.parse(event.content) as MultiNip04Content;
      expect(content.alg).toEqual('sha256:nip-04:nip-04');
      expect(content.enc).toEqual(
        'vWXLTR1QZZkvy0GXc+0C8A==?iv=AAAAAAAAAAAAAAAAAAAAAA==',
      );
      expect(content.mac).toEqual(
        'pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=',
      );
      expect(Object.keys(content.key)).toEqual([
        '9d2989edd27f1377bbfc6635893d5a825e01a7e1da7a377a5a3030ac0b347ac5',
        '0ce927e017647607cd50d45dccaacb28c55c18114ef4cfe07a9d9dd6afcd85fb',
      ]);
    });
  });

  describe('parseMultiNip04Event', () => {
    it.each([
      { event: { tags: [['']] } as NostrEvent, privkey: '', pubkey: '' },
      {
        event: { tags: [['p', '123']] } as NostrEvent,
        privkey: '',
        pubkey: '456',
      },
      {
        event: {
          content: '{}',
          tags: [
            [
              'p',
              'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
            ],
          ],
        } as NostrEvent,
        privkey: '',
        pubkey:
          'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      },
      {
        event: {
          content: '{"mac":null}',
          tags: [
            [
              'p',
              'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
            ],
          ],
        } as NostrEvent,
        privkey: '',
        pubkey:
          'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      },
      {
        event: {
          content: '{"mac":null,"enc":null}',
          tags: [
            [
              'p',
              'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
            ],
          ],
        } as NostrEvent,
        privkey: '',
        pubkey:
          'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      },
      {
        event: {
          content: '{"mac":null,"enc":null,"key":null}',
          tags: [
            [
              'p',
              'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
            ],
          ],
        } as NostrEvent,
        privkey: '',
        pubkey:
          'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      },
      {
        event: {
          content: '{"mac":null,"enc":null,"key":null,"alg":null}',
          tags: [
            [
              'p',
              'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
            ],
          ],
        } as NostrEvent,
        privkey: '',
        pubkey:
          'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      },
      {
        event: {
          content: '{"mac":"","enc":null,"key":null,"alg":null}',
          tags: [
            [
              'p',
              'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
            ],
          ],
        } as NostrEvent,
        privkey: '',
        pubkey:
          'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      },
      {
        event: {
          content: '{"mac":"","enc":"","key":null,"alg":null}',
          tags: [
            [
              'p',
              'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
            ],
          ],
        } as NostrEvent,
        privkey: '',
        pubkey:
          'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      },
      {
        event: {
          content: '{"mac":"","enc":"","key":"","alg":null}',
          tags: [
            [
              'p',
              'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
            ],
          ],
        } as NostrEvent,
        privkey: '',
        pubkey:
          'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      },
      {
        event: {
          content: '{"mac":"","enc":"","key":{},"alg":null}',
          tags: [
            [
              'p',
              'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
            ],
          ],
        } as NostrEvent,
        privkey: '',
        pubkey:
          'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      },
      {
        event: {
          content: '{"mac":"","enc":"","key":{},"alg":""}',
          tags: [
            [
              'p',
              'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
            ],
          ],
        } as NostrEvent,
        privkey: '',
        pubkey:
          'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      },
      {
        event: {
          content:
            '{"mac":"","enc":"","key":{"":""},"alg":"sha256:nip-04:nip-04"}',
          tags: [
            [
              'p',
              'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
            ],
          ],
        } as NostrEvent,
        privkey: '',
        pubkey:
          'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      },
      {
        event: {
          content:
            '{"mac":"pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG5=","enc":"vWXLTR1QZZkvy0GXc+0C8A==?iv=AAAAAAAAAAAAAAAAAAAAAA==","key":{"9d2989edd27f1377bbfc6635893d5a825e01a7e1da7a377a5a3030ac0b347ac5":"5N3nxzOxVMiWISzl1UZl64QFYczLZ/fZokkn02vICHMovCnLT+5I7BadnWJHI8QL?iv=AAAAAAAAAAAAAAAAAAAAAA==","0ce927e017647607cd50d45dccaacb28c55c18114ef4cfe07a9d9dd6afcd85fb":"cfm+AmQX4dz22na4T/hbKNhGn7JtFcKrmIzVvqiDY6NWF93qCd9LcGavVoiht6cs?iv=AAAAAAAAAAAAAAAAAAAAAA==","f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873":"A4KMEMJ8SFi5eGfrebms3GKFM9cHv6C3zcMGqy9CN5x1djaOtg1pG7K1GN1C97+q?iv=AAAAAAAAAAAAAAAAAAAAAA=="},"alg":"sha256:nip-04:nip-04"}',
          created_at: 1231006505,
          pubkey:
            'f392c2530a9e8ec07dd9d1235b6b3e7782d27048a577fc7ca36302c67a449781',
          tags: [
            [
              'p',
              '9d2989edd27f1377bbfc6635893d5a825e01a7e1da7a377a5a3030ac0b347ac5',
            ],
            [
              'p',
              '0ce927e017647607cd50d45dccaacb28c55c18114ef4cfe07a9d9dd6afcd85fb',
            ],
            [
              'p',
              'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
            ],
          ],
        },
        privkey:
          '9446703e3023a1aba0c25a203ce93889cd31be97477255a0ac4e07b7bf93516b',
        pubkey:
          'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      },
      {
        event: {
          content:
            '{"mac":"pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG5=","enc":"","key":{"9d2989edd27f1377bbfc6635893d5a825e01a7e1da7a377a5a3030ac0b347ac5":"5N3nxzOxVMiWISzl1UZl64QFYczLZ/fZokkn02vICHMovCnLT+5I7BadnWJHI8QL?iv=AAAAAAAAAAAAAAAAAAAAAA==","0ce927e017647607cd50d45dccaacb28c55c18114ef4cfe07a9d9dd6afcd85fb":"cfm+AmQX4dz22na4T/hbKNhGn7JtFcKrmIzVvqiDY6NWF93qCd9LcGavVoiht6cs?iv=AAAAAAAAAAAAAAAAAAAAAA==","f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873":"A4KMEMJ8SFi5eGfrebms3GKFM9cHv6C3zcMGqy9CN5x1djaOtg1pG7K1GN1C97+q?iv=AAAAAAAAAAAAAAAAAAAAAA=="},"alg":"sha256:nip-04:nip-04"}',
          created_at: 1231006505,
          pubkey:
            'f392c2530a9e8ec07dd9d1235b6b3e7782d27048a577fc7ca36302c67a449781',
          tags: [
            [
              'p',
              '9d2989edd27f1377bbfc6635893d5a825e01a7e1da7a377a5a3030ac0b347ac5',
            ],
            [
              'p',
              '0ce927e017647607cd50d45dccaacb28c55c18114ef4cfe07a9d9dd6afcd85fb',
            ],
            [
              'p',
              'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
            ],
          ],
        },
        privkey:
          '9446703e3023a1aba0c25a203ce93889cd31be97477255a0ac4e07b7bf93516b',
        pubkey:
          'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      },
    ])(
      'should throw error for event $event',
      async ({ event, privkey, pubkey }) => {
        expect.assertions(1);
        await expect(
          parseMultiNip04Event(event, privkey, pubkey),
        ).rejects.toEqual(expect.any(Error));
      },
    );

    it('should decrypt correctly', async () => {
      const event: NostrEvent = {
        content:
          '{"mac":"pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=","enc":"vWXLTR1QZZkvy0GXc+0C8A==?iv=AAAAAAAAAAAAAAAAAAAAAA==","key":{"9d2989edd27f1377bbfc6635893d5a825e01a7e1da7a377a5a3030ac0b347ac5":"5N3nxzOxVMiWISzl1UZl64QFYczLZ/fZokkn02vICHMovCnLT+5I7BadnWJHI8QL?iv=AAAAAAAAAAAAAAAAAAAAAA==","0ce927e017647607cd50d45dccaacb28c55c18114ef4cfe07a9d9dd6afcd85fb":"cfm+AmQX4dz22na4T/hbKNhGn7JtFcKrmIzVvqiDY6NWF93qCd9LcGavVoiht6cs?iv=AAAAAAAAAAAAAAAAAAAAAA==","f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873":"A4KMEMJ8SFi5eGfrebms3GKFM9cHv6C3zcMGqy9CN5x1djaOtg1pG7K1GN1C97+q?iv=AAAAAAAAAAAAAAAAAAAAAA=="},"alg":"sha256:nip-04:nip-04"}',
        created_at: 1231006505,
        pubkey:
          'f392c2530a9e8ec07dd9d1235b6b3e7782d27048a577fc7ca36302c67a449781',
        tags: [
          [
            'p',
            '9d2989edd27f1377bbfc6635893d5a825e01a7e1da7a377a5a3030ac0b347ac5',
          ],
          [
            'p',
            '0ce927e017647607cd50d45dccaacb28c55c18114ef4cfe07a9d9dd6afcd85fb',
          ],
          [
            'p',
            'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
          ],
        ],
      };

      const message = await parseMultiNip04Event(
        event,
        '9446703e3023a1aba0c25a203ce93889cd31be97477255a0ac4e07b7bf93516b',
        'f5d182c473d6ad7687904918953f80c945949dbd505af322670a00608033e873',
      );
      expect(message).toBe('Hello World');
    });
  });
});
