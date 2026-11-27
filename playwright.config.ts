import config from './e2e/playwright.config.ts';

export default {
  ...config,
  testDir: './e2e',
  use: {
    ...config.use,
    baseURL: 'http://localhost:5173',
  },
};
