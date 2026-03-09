import { test as base, BrowserContext, Page, expect } from '@playwright/test';
import { chromium, firefox, webkit, STEALTH_LAUNCH_ARGS } from '../utils/stealthbrowser';
import { LoginPage } from '../pages/LoginPage';
import { credentials } from '../utils/credentials';
import * as path from 'path';
import * as fs from 'fs';

const BROWSER_FOR_PROJECT: Record<string, typeof chromium> = {
  chromium,
  firefox,
  webkit,
};

// Mirrors storageState paths set in playwright.config.ts.
// Single source of truth is the config — this map must match it.
const STORAGE_STATE_FOR_PROJECT: Record<string, string> = {
  chromium: 'auth/storageState.json',
  firefox:  'auth/storageState.firefox.json',
  webkit:   'auth/storageState.webkit.json',
};

import { Credentials } from '../utils/credentials';
type StealthOptions = {
  /**
   * Controls the storageState for the stealth browser context.
   *
   * Default (undefined) → loads storageState from playwright.config.ts project
   * Empty object        → clean context, no session (unauthenticated suites)
   *
   * Usage in unauthenticated suites:
   *   test.use({ stealthStorageState: { cookies: [], origins: [] } });
   */
  stealthStorageState: string | { cookies: any[]; origins: any[] } | undefined;
};

type PageFixtures = {
  loginPage: LoginPage;
  credentials: Credentials;
};

type BrowserFixtures = {
  stealthContext: BrowserContext;
  stealthPage: Page;
};

export const test = base.extend<PageFixtures & BrowserFixtures & StealthOptions>({

  // Default undefined → falls back to project storageState from config
  stealthStorageState: [undefined, { option: true }],

  credentials: async ({}, use) => {
    await use(credentials.default);
  },

  stealthContext: async ({ stealthStorageState }, use, testInfo) => {
    const projectName = testInfo.project.name.toLowerCase();
    const stealthBrowser = BROWSER_FOR_PROJECT[projectName] ?? chromium;

    if (!BROWSER_FOR_PROJECT[projectName]) {
      console.warn(
        `⚠️  Unknown project "${testInfo.project.name}" — falling back to Chromium. ` +
        `Expected one of: ${Object.keys(BROWSER_FOR_PROJECT).join(', ')}`
      );
    }

    // Respect the --headed CLI flag.
    // stealthBrowser.launch() creates its own browser outside Playwright's
    // managed context, so the --headed flag is ignored unless we detect it
    // manually. We check process.argv since testInfo.project.use.headless
    // is not reliably populated at runtime for custom fixture contexts.
    const isHeaded = process.argv.includes('--headed') || process.env.HEADED === '1';

    const browser = await stealthBrowser.launch({
      headless: !isHeaded,
      args: STEALTH_LAUNCH_ARGS,
    });

    const isEmptyState = (s: any) =>
      s && typeof s === 'object' &&
      Array.isArray(s.cookies) && s.cookies.length === 0 &&
      Array.isArray(s.origins) && s.origins.length === 0;

    // Resolution order:
    // 1. Empty object { cookies: [], origins: [] } → clean context (unauthenticated)
    // 2. String path → load that specific file
    // 3. undefined → load from STORAGE_STATE_FOR_PROJECT map (authenticated default)
    let resolvedPath: string | undefined;

    if (isEmptyState(stealthStorageState)) {
      resolvedPath = undefined; // clean context
    } else if (typeof stealthStorageState === 'string') {
      resolvedPath = stealthStorageState;
    } else {
      resolvedPath = STORAGE_STATE_FOR_PROJECT[projectName];
    }

    const contextOptions: Record<string, any> = {};
    if (resolvedPath && fs.existsSync(path.resolve(resolvedPath))) {
      contextOptions.storageState = resolvedPath;
    }

    const context = await browser.newContext(contextOptions);
    await use(context);
    await context.close();
    await browser.close();
  },

  stealthPage: async ({ stealthContext }, use) => {
    const page = await stealthContext.newPage();
    await use(page);
    await page.close();
  },

  loginPage: async ({ stealthPage }, use) => {
    await use(new LoginPage(stealthPage));
  },

});

export { expect };