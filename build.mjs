#! /usr/bin/env node

import { writeFileSync } from 'fs';

import { context, build } from 'esbuild';

const buildOptions = {
  bundle: true,
  entryPoints: ['./src/index.ts'],
  globalName: 'moduleBoilerplate',
  logLevel: 'debug',
  metafile: true,
  platform: 'node',
  sourcemap: 'linked',
  sourcesContent: false,
  tsconfig: './tsconfig.build.json',
  format: 'esm',
  outfile: './dist/index.mjs',
  packages: 'external',
  logOverride: {
    'unsupported-dynamic-import': 'silent',
  },
};

for (const arg of process.argv) {
  switch (arg) {
    case '-w':
    case '--watch':
      await (await context(buildOptions)).watch();
      break;
    default:
      writeFileSync(
        './dist/meta.json',
        JSON.stringify((await build(buildOptions)).metafile),
      );
  }
}
