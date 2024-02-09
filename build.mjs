#!/usr/bin/env node

import { writeFileSync } from 'fs';

import { build } from 'esbuild';

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
};

const results = await Promise.all([
  build({
    ...buildOptions,
    format: 'esm',
    outfile: './dist/index.js',
    packages: 'external',
  }),
]);

writeFileSync('./dist/meta.json', JSON.stringify(results[0].metafile));
