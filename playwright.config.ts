import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load .env before anything else — required for env.ts validation
dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],

  globalSetup: './tests/global.setup.ts',

  use: {
    baseURL: 'https://demo.nopcommerce.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth/storageState.json',
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'auth/storageState.firefox.json',
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'auth/storageState.webkit.json',
      },
    },
  ],
});