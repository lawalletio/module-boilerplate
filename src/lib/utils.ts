import { Router } from 'express';
import { globSync } from 'glob';
import NDK from '@nostr-dev-kit/ndk';

import Path from 'path';

type RouteMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

const filesWithExtensionsWithoutExtensions = (
  path: string,
  extensions: string[],
) => {
  const extensionsSet = new Set(
    extensions.map((extension) => `.${extension.toLowerCase()}`),
  );

  const allFiles: string[] = [];

  globSync('*', {
    withFileTypes: true,
    cwd: path,
    matchBase: true,
    nocase: true,
    nodir: true,
  }).map((value) => {
    const filePath = value.relative();
    const fileExtension = Path.extname(filePath).toLowerCase();

    if (extensionsSet.has(fileExtension)) {
      const fileBase = Path.basename(filePath);

      allFiles.push(
        Path.join(
          Path.dirname(filePath),
          fileBase.substring(0, fileBase.length - fileExtension.length),
        ),
      );
    }
  });

  return allFiles;
};

const findDuplicates = (values: string[]) => {
  const counter: { [key: string]: number } = {};
  const duplicates: string[] = [];

  values.forEach((value) => {
    counter[value] = (counter[value] ?? 0) + 1;
  });
  for (const key in counter) {
    if (1 < counter[key]) {
      duplicates.push(key);
    }
  }

  return duplicates;
};

export const setUpRoutes = (router: Router, path: string): Router | null => {
  const allFiles = filesWithExtensionsWithoutExtensions(path, ['js', 'ts']);
  const duplicates = findDuplicates(allFiles);

  if (duplicates.length) {
    duplicates.forEach((duplicate) =>
      console.warn(`Found duplicate route ${duplicate}`),
    );
    return null;
  }

  allFiles.forEach(async (file) => {
    const matches = file.match(
      /^(?<route>.*)\/(?<method>get|post|put|patch|delete)$/i,
    );

    if (matches?.groups) {
      const method: RouteMethod = matches.groups.method as RouteMethod;
      const route: string = `/${matches.groups.route}`;

      router[method](route, (await require(Path.resolve(path, file))).default);
      console.info(`Created ${method.toUpperCase()} route for ${route}`);
    } else {
      console.warn(
        `Skipping ${file} as it doesn't comply to routes conventions.`,
      );
    }
  });

  return router;
};

export const setUpSubscriptions = (ndk: NDK, path: string): NDK | null => {
  const allFiles = filesWithExtensionsWithoutExtensions(path, ['js', 'ts']);
  const duplicates = findDuplicates(allFiles);

  if (duplicates.length) {
    duplicates.forEach((duplicate) =>
      console.warn(`Found duplicate subscription ${duplicate}`),
    );
    return null;
  }

  allFiles.forEach(async (file) => {
    const matches = file.match(/^(?<name>[^/]*)$/i);

    if (matches?.groups) {
      let { filter, handler } = await require(Path.resolve(path, file));
      ndk.subscribe(filter).on('event', handler);

      console.info(`Created ${matches.groups.name} subscription`);
    } else {
      console.warn(
        `Skipping ${file} as it doesn't comply to subscription conventions.`,
      );
    }
  });

  return ndk;
};
