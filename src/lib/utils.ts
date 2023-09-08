import { Router } from 'express';
import { globSync } from 'glob';
import NDK from '@nostr-dev-kit/ndk';

type RouteMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export const setUpRoutes = (router: Router, path: string): Router => {
  globSync('*.{ts,js}', {
    withFileTypes: true,
    cwd: path,
    matchBase: true,
    nocase: true,
    nodir: true,
  }).forEach(async (value) => {
    const filePath = value.relative();
    const matches = filePath.match(
      /^(?<route>.*)\/(?<method>get|post|put|patch|delete)\.(?:ts|js)/i,
    );

    if (matches?.groups) {
      const method: RouteMethod = matches.groups.method as RouteMethod;
      const route: string = `/${matches.groups.route}`;

      router[method](route, (await require(value.fullpath())).default);
      console.info(`Created ${method.toUpperCase()} route for ${route}`);
    } else {
      console.warn(
        `Skipping ${filePath} as it doesn't comply to routes conventions.`,
      );
    }
  });

  return router;
};

export const setUpSubscriptions = (ndk: NDK, path: string): NDK => {
  globSync('*.{ts,js}', {
    withFileTypes: true,
    cwd: path,
    matchBase: true,
    nocase: true,
    nodir: true,
  }).forEach(async (value) => {
    const filePath = value.relative();
    const matches = filePath.match(/^(?<name>[^/]*)\.(?:ts|js)/i);

    if (matches?.groups) {
      let { filter, handler } = await require(value.fullpath());
      ndk.subscribe(filter).on('event', handler);

      console.info(`Created ${matches.groups.name} subscription`);
    } else {
      console.warn(
        `Skipping ${filePath} as it doesn't comply to subscription conventions.`,
      );
    }
  });

  return ndk;
};
