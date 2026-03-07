import { FullConfig } from '@playwright/test';
import { chromium, firefox, webkit, STEALTH_LAUNCH_ARGS } from '../utils/stealthbrowser';
import { LoginPage } from '../pages/LoginPage';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '../utils/env';

const EMAIL    = env.TEST_EMAIL;
const PASSWORD = env.TEST_PASSWORD;

const AUTH_DIR = 'auth';
const LOGIN_TIMEOUT = 30_000;
const MAX_RETRIES = 2;

function prepareAuthDir(outputPath: string): void {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
    console.log(`🗑️  Cleared stale auth file: ${outputPath}`);
  }
}

async function saveAuthForBrowser(
  browser: typeof chromium | typeof firefox | typeof webkit,
  outputPath: string,
  browserName: string,
  attempt = 1
): Promise<void> {
  console.log(`🔐 [${browserName}] Starting auth setup (attempt ${attempt}/${MAX_RETRIES + 1})`);
  prepareAuthDir(outputPath);

  const instance = await browser.launch({
    headless: true,
    args: STEALTH_LAUNCH_ARGS,
  });

  try {
    const page = await instance.newPage();
    page.setDefaultTimeout(LOGIN_TIMEOUT);

    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(EMAIL, PASSWORD);

    await page.context().storageState({ path: outputPath });
    console.log(`✅ [${browserName}] Auth state saved → ${outputPath}`);

  } catch (error) {
    console.error(`❌ [${browserName}] Auth setup failed on attempt ${attempt}: ${error}`);

    if (attempt <= MAX_RETRIES) {
      console.log(`🔄 [${browserName}] Retrying...`);
      await instance.close();
      return saveAuthForBrowser(browser, outputPath, browserName, attempt + 1);
    }

    throw new Error(
      `[${browserName}] Auth setup failed after ${MAX_RETRIES + 1} attempts. ` +
      `Original error: ${error}`
    );
  } finally {
    await instance.close();
  }
}

export default async function globalSetup(_config: FullConfig) {
  console.log('🚀 Global setup: saving auth state for all browsers...');

  await saveAuthForBrowser(chromium, path.join(AUTH_DIR, 'storageState.json'),         'chromium');
  await saveAuthForBrowser(firefox,  path.join(AUTH_DIR, 'storageState.firefox.json'), 'firefox');
  await saveAuthForBrowser(webkit,   path.join(AUTH_DIR, 'storageState.webkit.json'),  'webkit');

  console.log('✅ Global setup complete.');
}