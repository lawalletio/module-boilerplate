import { Router } from 'express';
import { globSync } from 'glob';

type RouteMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export const setUpRoutes = (router: Router, relativePath: string): Router => {
  globSync('*.{ts,js}', {
    withFileTypes: true,
    cwd: relativePath,
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
