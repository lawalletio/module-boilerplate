import debug from 'debug';
import { RequestHandler, Router } from 'express';
import { globSync } from 'glob';
import NDK, { NostrEvent } from '@nostr-dev-kit/ndk';
import { v4 as uuidv4 } from 'uuid';

import Path from 'path';
import { DefaultContext } from '@type/request';
export const logger: debug.Debugger = debug(process.env['MODULE_NAME'] || '');
import LastHandledTracker from '@lib/lastHandled';
import { SubHandling } from '@type/nostr';
import { fileURLToPath } from 'url';

type RouteMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export const uuidRegex: RegExp =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const log: debug.Debugger = logger.extend('lib:utils');
const warn: debug.Debugger = logger.extend('lib:utils:warn');
const CREATED_AT_TOLERANCE: number = 2 * 180;
const sAlpha: string =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const sAlphaLength: bigint = BigInt(sAlpha.length);
let lastHandledTracker: LastHandledTracker | undefined;

export class EmptyRoutesError extends Error {}
export class DuplicateRoutesError extends Error {}

const methods: RouteMethod[] = ['get', 'post', 'put', 'patch', 'delete'];

function filesWithExtensionsWithoutExtensions(
  path: string,
  extensions: string[],
): string[] {
  const extensionsSet = new Set(extensions.map((e) => `.${e.toLowerCase()}`));
  const allFiles: string[] = [];

  globSync('*', {
    withFileTypes: true,
    cwd: path,
    matchBase: true,
    nocase: true,
    nodir: true,
  }).map((value) => {
    const filePath: string = value.relative();
    const fileExtension: string = Path.extname(filePath).toLowerCase();

    if (extensionsSet.has(fileExtension)) {
      const fileBase: string = Path.basename(filePath);

      allFiles.push(
        Path.join(
          Path.dirname(filePath),
          fileBase.substring(0, fileBase.length - fileExtension.length),
        ),
      );
    }
  });

  return allFiles;
}

function findDuplicates(values: string[]): string[] {
  const counter: { [key: string]: number } = {};
  const duplicates: string[] = [];

  values.forEach((value) => {
    counter[value] = (counter[value] ?? 0) + 1;
  });
  for (const [key, count] of Object.entries(counter)) {
    if (1 < count) {
      duplicates.push(key);
    }
  }

  return duplicates;
}

export function setUpRoutes(router: Router, path: string): Router {
  const allFiles = filesWithExtensionsWithoutExtensions(path, ['js', 'ts']);
  const duplicates = findDuplicates(allFiles);

  if (0 === allFiles.length) {
    throw new EmptyRoutesError();
  }

  if (duplicates.length) {
    throw new DuplicateRoutesError(
      `Duplicate routes: ${duplicates.toString()}`,
    );
  }

  const allowedMethodsByRoute: Record<string, RouteMethod[]> = {};

  for (const file of allFiles) {
    const matches = file.match(
      /^(?<route>.*)\/(?<method>get|post|put|patch|delete)$/i,
    );

    if (matches?.groups) {
      const method: RouteMethod = matches.groups['method'] as RouteMethod;
      const route: string = `/${matches.groups['route']}`;
      const handler =
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        (require(Path.resolve(path, file)) as { default: RequestHandler })
          .default;
      router[method](route, handler);
      log(`Created ${method.toUpperCase()} route for ${route}`);
      if (undefined === allowedMethodsByRoute[route]) {
        allowedMethodsByRoute[route] = [];
      }
      allowedMethodsByRoute[route]!.push(method);
    } else {
      warn(`Skipping ${file} as it doesn't comply to routes conventions.`);
    }
  }
  log('Allowed methods %O', allowedMethodsByRoute);
  for (const [route, allowedMethods] of Object.entries(allowedMethodsByRoute)) {
    methods
      .filter((m) => !allowedMethods.includes(m))
      .forEach((m) => {
        router[m](route, (_req, res) => {
          res
            .status(405)
            .header('Allow', `OPTIONS, ${allowedMethods.toString()}`)
            .send();
        });
        log(`Created ${m.toUpperCase()} route for ${route}`);
      });
  }

  return router;
}

export async function setUpSubscriptions<
  Context extends DefaultContext = DefaultContext,
>(
  ctx: Context,
  readNdk: NDK,
  writeNDK: NDK,
  path: string,
): Promise<NDK | null> {
  const allFiles = filesWithExtensionsWithoutExtensions(path, ['js', 'ts']);
  const duplicates = findDuplicates(allFiles);

  if (duplicates.length) {
    duplicates.forEach((duplicate) => {
      warn(`Found duplicate subscription ${duplicate}`);
    });
    return null;
  }

  if (!lastHandledTracker && 0 < allFiles.length) {
    lastHandledTracker = new LastHandledTracker(readNdk, writeNDK, allFiles);
    await lastHandledTracker.fetchLastHandled();
  }

  allFiles.forEach((file) => {
    const matches = file.match(/^(?<name>[^/]*)$/i);
    const lastHandled: number = lastHandledTracker!.get(file);

    if (matches?.groups) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { filter, getHandler } = require(
        Path.resolve(path, file),
      ) as SubHandling<Context>;
      if (lastHandled) {
        filter.since = lastHandled - CREATED_AT_TOLERANCE;
      } else {
        delete filter.since;
      }
      readNdk
        .subscribe(filter, {
          closeOnEose: false,
        })
        .on('event', async (nostrEvent: NostrEvent): Promise<void> => {
          try {
            const handler: (nostrEvent: NostrEvent) => Promise<void> =
              getHandler(ctx, 0);
            await handler(nostrEvent);
            lastHandledTracker!.hit(file, nostrEvent.created_at);
          } catch (e) {
            warn(
              `Unexpected exception found when handling ${matches.groups?.['name']}: %O`,
              e,
            );
          }
        });

      log(`Created ${matches.groups['name']} subscription`);
    } else {
      warn(
        `Skipping ${file} as it doesn't comply to subscription conventions.`,
      );
    }
  });

  return readNdk;
}

export function requiredEnvVar(key: string): string {
  const envVar = process.env[key];
  if (undefined === envVar) {
    throw new Error(`Environment process ${key} must be defined`);
  }
  return envVar;
}

export function requiredProp<T extends object, V>(obj: T, key: keyof T): V {
  if (!Object.hasOwn(obj, key)) {
    throw new Error(
      `Expected ${String(key)} of ${JSON.stringify(obj)} to be defined`,
    );
  }
  return obj[key] as V;
}

export function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function isEmpty(obj: object): boolean {
  for (const _ in obj) {
    return false;
  }
  return true;
}

export function shuffled<T>(array: Array<T>): Array<T> {
  const result: Array<T> = Array.from(array);
  for (let i = result.length - 1; 0 < i; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function uuid2suuid(uuid: string): string | null {
  if (!uuid.match(uuidRegex)) {
    return null;
  }

  let n: bigint = uuid
    .replace(/-/g, '')
    .match(/../g)!
    .map((hexPair: string) => BigInt(parseInt(hexPair, 16)))
    .reduce((acc: bigint, curr: bigint) => acc * 256n + curr);
  let suuid: string = '';
  do {
    [suuid, n] = [sAlpha[Number(n % sAlphaLength)] + suuid, n / sAlphaLength];
  } while (n);
  return suuid.padStart(22, sAlpha[0]);
}

export function suuid2uuid(suuid: string): string | null {
  const chars: string[] | null = suuid.match(/./g);
  if (!chars || !chars.every((c) => sAlpha.includes(c))) {
    return null;
  }

  const n: bigint = chars
    .map((char: string) => BigInt(sAlpha.indexOf(char)))
    .reduce((acc: bigint, curr: bigint) => acc * sAlphaLength + curr, 0n);
  if (0xffffffffffffffffffffffffffffffffn < n) {
    return null;
  }
  const uuid: string = n.toString(16).padStart(32, '0');

  return (
    uuid.substring(0, 8) +
    '-' +
    uuid.substring(8, 12) +
    '-' +
    uuid.substring(12, 16) +
    '-' +
    uuid.substring(16, 20) +
    '-' +
    uuid.substring(20, 32)
  );
}

export function generateSuuid(): string {
  return uuid2suuid(uuidv4()) as string;
}

export function jsonParseOrNull<T>(
  text: string,
  reviver?: (this: T, key: string, value: unknown) => T,
): T | null {
  try {
    return JSON.parse(text, reviver) as T;
  } catch (_e) {
    return null;
  }
}

export function jsonStringify(value: unknown): string {
  return JSON.stringify(
    value,
    (_, v) => (typeof v === 'bigint' ? String(v) : v) as unknown,
  );
}

export function urlToDirname(url: string): string {
  return Path.dirname(fileURLToPath(url));
}
