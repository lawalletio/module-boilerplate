/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  coveragePathIgnorePatterns: ['\\.test\\.ts'],
  coverageDirectory: '<rootDir>/dist/.coverage',
  coverageProvider: 'babel',
  extensionsToTreatAsEsm: ['.ts'],
  logHeapUsage: true,
  passWithNoTests: true,
  //preset: 'ts-jest',
  randomize: true,
  resetModules: true,
  restoreMocks: false,
  rootDir: '.',
  setupFiles: ['dotenv/config'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  transform: {
    '\\.ts': [
      'ts-jest',
      {
        diagnostics: {
          ignoreCodes: [1343],
        },
        astTransformers: {
          before: [
            {
              path: 'ts-jest-mock-import-meta',
            },
          ],
        },
      },
    ],
  },
  maxWorkers: 1,
};
