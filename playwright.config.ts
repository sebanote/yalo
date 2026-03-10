import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load .env before anything else — required for env.ts validation
dotenv.config({quiet: true});

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],

  globalSetup: './tests/global.setup.ts',

  // 60s covers the worst case: Firefox beforeEach clearing 3-4 items via
  // full page reloads (≈8s each) before the test body even starts.
  timeout: 60_000,

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