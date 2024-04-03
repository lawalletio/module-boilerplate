import { Router } from 'express';

import {
  DuplicateRoutesError,
  EmptyRoutesError,
  generateSuuid,
  isEmpty,
  jsonParseOrNull,
  jsonStringify,
  nowInSeconds,
  requiredEnvVar,
  requiredProp,
  setUpRoutes,
  shuffled,
  suuid2uuid,
  uuid2suuid,
} from '../../src/lib/utils';
import { Path, globSync } from 'glob';
import { v4 } from 'uuid';
import { mockRouteRes } from '../utils';

const now: number = 1231006505000;
jest.useFakeTimers({ now });
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));
jest.mock('glob', () => {
  const ogModule = jest.requireActual<typeof import('glob')>('glob');
  return {
    __esModule: true,
    ...ogModule,
    globSync: jest.fn(),
  };
});

const globPath = (path: string): Path => {
  let p: Path | undefined = undefined;
  for (const name of path.split('/')) {
    p = {
      name,
      parent: p,
      relative: function () {
        return this.parent?.relative
          ? `${this.parent.relative()}/${this.name}`
          : this.name;
      },
    } as Path;
  }
  return p!;
};

describe('utils', () => {
  describe('setUpRoutes', () => {
    it.each([
      { files: [], expected: expect.any(EmptyRoutesError) as EmptyRoutesError },
      {
        files: [globPath('hello.ts'), globPath('hello.ts')],
        expected: expect.any(DuplicateRoutesError) as DuplicateRoutesError,
      },
    ])('should throw $expected', async ({ files, expected }) => {
      jest.mocked<typeof globSync>(globSync).mockReturnValueOnce(files);

      await expect(setUpRoutes(Router(), '')).rejects.toEqual(expected);
    });

    it('should generate routes correctly', async () => {
      jest.mock(
        '/hello/world/post.js',
        () => {
          return {
            __esModule: true,
            default: jest.fn(),
          };
        },
        { virtual: true },
      );
      jest.mock(
        '/hello/world/get.js',
        () => {
          return {
            __esModule: true,
            default: jest.fn(),
          };
        },
        { virtual: true },
      );
      jest.mock(
        '/hello/_name/get.js',
        () => {
          return {
            __esModule: true,
            default: jest.fn(),
          };
        },
        { virtual: true },
      );
      jest.mock(
        '/hello/:param/get.js',
        () => {
          return {
            __esModule: true,
            default: jest.fn(),
          };
        },
        { virtual: true },
      );
      jest.mock(
        '/hello/get.js',
        () => {
          return {
            __esModule: true,
            default: jest.fn(),
          };
        },
        { virtual: true },
      );
      jest
        .mocked<typeof globSync>(globSync)
        .mockReturnValueOnce([
          globPath('/hello/world/post.js'),
          globPath('/hello/world/get.js'),
          globPath('/hello/_name/get.js'),
          globPath('/hello/:param/get.js'),
          globPath('/hello/get.js'),
          globPath('/hello/ignored.js'),
        ]);

      const router: Router = await setUpRoutes(Router(), '');
      await Promise.resolve();

      expect(router.get).toHaveBeenCalledTimes(4);
      expect(router.get).toHaveBeenCalledWith(
        '//hello/world',
        expect.any(Function),
      );
      expect(router.get).toHaveBeenCalledWith('//hello', expect.any(Function));
      expect(router.get).toHaveBeenCalledWith(
        '//hello/:name',
        expect.any(Function),
      );
      expect(router.get).toHaveBeenCalledWith(
        '//hello/:param',
        expect.any(Function),
      );
      expect(router.post).toHaveBeenCalledTimes(4);
      expect(router.post).toHaveBeenCalledWith(
        '//hello/world',
        expect.any(Function),
      );
      expect(router.post).toHaveBeenCalledWith('//hello', expect.any(Function));
      expect(router.put).toHaveBeenCalledTimes(4);
      expect(router.put).toHaveBeenCalledWith(
        '//hello/world',
        expect.any(Function),
      );
      expect(router.put).toHaveBeenCalledWith('//hello', expect.any(Function));
      expect(router.patch).toHaveBeenCalledTimes(4);
      expect(router.patch).toHaveBeenCalledWith(
        '//hello/world',
        expect.any(Function),
      );
      expect(router.patch).toHaveBeenCalledWith(
        '//hello',
        expect.any(Function),
      );
      expect(router.delete).toHaveBeenCalledTimes(4);
      expect(router.delete).toHaveBeenCalledWith(
        '//hello/world',
        expect.any(Function),
      );
      expect(router.delete).toHaveBeenCalledWith(
        '//hello',
        expect.any(Function),
      );
      expect(mockRouteRes.status).toHaveBeenCalledTimes(15);
      expect(mockRouteRes.status).toHaveBeenCalledWith(405);
    });
  });

  describe('requiredEnvVar', () => {
    it('should fail if not env not found', () => {
      expect(() => {
        requiredEnvVar('NOT_EXISTING');
      }).toThrow(Error);
    });

    it('should return existing env var', () => {
      process.env['REAL_VAR'] = 'hello';

      expect(requiredEnvVar('REAL_VAR')).toBe('hello');

      // eslint-disable-next-line
      delete process.env['REAL_VAR'];
    });
  });

  describe('requiredProp', () => {
    it('should fail if no prop found', () => {
      expect(() => {
        // @ts-expect-error assign to parameter of type never
        requiredProp({}, 'hello');
      }).toThrow(Error);
    });

    it('should return existing prop', () => {
      expect(requiredProp({ hello: 'world' }, 'hello')).toBe('world');
    });
  });

  describe('nowInSeconds', () => {
    it('should return current timestamp in seconds', () => {
      expect(nowInSeconds()).toEqual(now / 1000);
    });
  });

  describe('isEmpty', () => {
    it.each([
      { obj: {}, expected: true },
      { obj: { hello: undefined }, expected: false },
      { obj: { hello: 'world' }, expected: false },
    ])('should validate correctly $obj', ({ obj, expected }) => {
      expect(isEmpty(obj)).toBe(expected);
    });
  });

  describe('shuffled', () => {
    it.each([
      {
        original: [1, 2, 3, 4, 5],
        rand: [
          0.23239596559586917, 0.09675788832201793, 0.6551478523988861,
          0.8360012068709017,
        ],
        expected: [4, 3, 5, 1, 2],
      },
      {
        original: [1, 2, 3, 4, 5],
        rand: [
          0.24791228155123424, 0.37068634688373936, 0.2693094189219749,
          0.8776158069947135,
        ],
        expected: [3, 4, 1, 5, 2],
      },
      {
        original: ['Lorem', 'ipsum', 'dolor'],
        rand: [0.28642573379948355, 0.8551675718374636],
        expected: ['dolor', 'ipsum', 'Lorem'],
      },
    ])('should shuffle correctly', ({ original, rand, expected }) => {
      for (const n of rand) {
        jest.spyOn(global.Math, 'random').mockReturnValueOnce(n);
      }

      expect(shuffled<(typeof original)[1]>(original)).toEqual(expected);

      jest.spyOn(global.Math, 'random').mockRestore();
    });
  });

  describe('uuid2suuid', () => {
    it.each([
      { uuid: 'this is not an uuid', expected: null },
      { uuid: '', expected: null },
      { uuid: '12345', expected: null },
      {
        uuid: '59cc3d0c-52c7-4882-adde-0233e54aa726',
        expected: 'BZzD0MUsdIgq3eAjPlSqcm',
      },
      {
        uuid: 'e8bb3f8e-6553-4cce-882e-48c09ca064bc',
        expected: 'Douz-OZVNMzoguSMCcoGS8',
      },
      {
        uuid: '52911a11-6107-4135-8627-592b6505f4e4',
        expected: 'BSkRoRYQdBNYYnWStlBfTk',
      },
    ])('should convert $uuid correctly', ({ uuid, expected }) => {
      expect(uuid2suuid(uuid)).toBe(expected);
    });
  });

  describe('suuid2uuid', () => {
    it.each([
      { suuid: 'this is not a suuid', expected: null },
      { suuid: '', expected: null },
      { suuid: '2948dkjvkd?=', expected: null },
      { suuid: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZ', expected: null },
      {
        suuid: 'BZzD0MUsdIgq3eAjPlSqcm',
        expected: '59cc3d0c-52c7-4882-adde-0233e54aa726',
      },
      {
        suuid: 'Douz-OZVNMzoguSMCcoGS8',
        expected: 'e8bb3f8e-6553-4cce-882e-48c09ca064bc',
      },
      {
        suuid: 'BSkRoRYQdBNYYnWStlBfTk',
        expected: '52911a11-6107-4135-8627-592b6505f4e4',
      },
    ])('should convert $suuid correctly', ({ suuid, expected }) => {
      expect(suuid2uuid(suuid)).toBe(expected);
    });
  });

  describe('generateSuuid', () => {
    it('should generate an uuid and convert it to ssuid', () => {
      jest
        .mocked(v4)
        .mockReturnValueOnce('562005cd-5701-43d6-a66a-6f419eccf702');

      expect(generateSuuid()).toBe('BWIAXNVwFD1qZqb0GezPcC');
    });
  });

  describe('jsonParseOrNull', () => {
    it.each([
      { s: '{', expected: null },
      { s: '', expected: null },
      { s: 'Hello world', expected: null },
      { s: '{}', expected: {} },
      { s: '{"a": [1, 2], "b":"c"}', expected: { a: [1, 2], b: 'c' } },
    ])('should return $expected for "$s"', ({ s, expected }) => {
      expect(jsonParseOrNull(s)).toEqual(expected);
    });
  });

  describe('jsonStringify', () => {
    it.each([
      { v: {}, expected: '{}' },
      { v: { a: [1, 2], b: 'c' }, expected: '{"a":[1,2],"b":"c"}' },
      { v: { a: 100n }, expected: '{"a":"100"}' },
    ])('should return $expected for "$v"', ({ v, expected }) => {
      expect(jsonStringify(v)).toEqual(expected);
    });
  });
});
