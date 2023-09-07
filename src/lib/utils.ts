import { Router } from "express";
import { globSync } from "glob";

import path from "path";

type RouteMethod = "get" | "post" | "put" | "patch" | "delete";

export const generateRoutes = (relativePath: string): Router => {
  const router = Router();

  globSync(`*.js`, {
    withFileTypes: true,
    cwd: relativePath,
    matchBase: true,
    nocase: true,
    nodir: true,
  }).forEach(async (value) => {
    const filePath = value.relative();
    const matches = filePath.match(/(get|post|put|patch|delete)\.js/i);

    if (matches) {
      const method: RouteMethod = matches[1] as RouteMethod;

      router[method](filePath, (await require(value.fullpath())).default);
      console.info(`Created ${method.toUpperCase()} route for ${filePath}`);
    } else {
      console.warn(
        `Skipping ${filePath} as it doesn't correspond to a valid HTTP method.`,
      );
    }
  });

  return router;
};
