import { Page, Locator } from '@playwright/test';

/**
 * BasePage
 * ────────
 * All Page Object Models extend this class.
 * Provides shared navigation, waiting helpers, and the baseURL.
 */
export class BasePage {
  readonly page: Page;
  readonly baseURL: string = 'https://demo.nopcommerce.com';

  constructor(page: Page) {
    this.page = page;
    // Listener registered once in the constructor — not per goto() call —
    // to avoid stacking duplicate listeners on every navigation.
    this.page.on('response', (res) => {
      const status = res.status();
      if ([401, 403, 429].includes(status)) {
        console.warn(`⚠️  Detection signal: HTTP ${status} on ${res.url()}`);
      }
    });
  }

  /**
   * Navigate to a path relative to baseURL.
   * e.g. this.goto('/login') → https://demo.nopcommerce.com/login
   */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(`${this.baseURL}${path}`);
  }

  /** Wait for the page to reach a stable network state */
  async waitForPageLoad(): Promise<void> {
    try {
      await this.page.waitForLoadState('networkidle');
    } catch (error: any) {
      // Firefox can close/recreate the page mid-navigation during redirects,
      // orphaning the waitForLoadState call. If the page is gone, wait for
      // domcontentloaded on the current page instead which is more resilient.
      if (error.message?.includes('closed')) {
        await this.page.waitForLoadState('domcontentloaded');
      } else {
        throw error;
      }
    }
  }

  /** Return the current page URL */
  getCurrentURL(): string {
    return this.page.url();
  }

  /** Get a locator scoped to this page */
  getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }
}