import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'intl-phone-input',
      preset: 'jest-preset-angular',
      rootDir: 'projects/intl-phone-input',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/../../setup-jest.ts'],
      transform: {
        '^.+\\.(ts|js|mjs|html|svg)$': [
          'jest-preset-angular',
          {
            tsconfig: '<rootDir>/tsconfig.spec.json',
            stringifyContentPathRegex: '\\.(html|svg)$',
          },
        ],
      },
      moduleNameMapper: {
        '^angular-imask$': '<rootDir>/__mocks__/angular-imask.ts',
        'intl-phone-input': '<rootDir>/src/public-api.ts',
      },
      coverageDirectory: '<rootDir>/../../coverage/intl-phone-input',
      collectCoverageFrom: [
        'src/lib/**/*.ts',
        '!src/lib/**/*.module.ts',
        '!src/public-api.ts',
      ],
    },
  ],
};

export default config;
