import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage
 * ─────────
 * Page Object Model for /login
 *
 * Responsibilities:
 *   - Expose locators as getters (for tests to assert on directly)
 *   - Encapsulate actions (navigate, fill form, submit)
 *
 * NOT responsible for assertions — those live in the test.
 */
export class LoginPage extends BasePage {

  // ── Locators ─────────────────────────────────────────────────
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  // Header locators — scoped to <banner> to avoid matching footer duplicates.
  // Snapshot shows "My account" and "Log out" appear in both header (ref=e17/e19)
  // and footer menu (ref=e127). Scoping to banner ensures we target the header only.
  readonly logoutLink: Locator;
  readonly myAccountLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput         = page.getByLabel('Email:');
    this.passwordInput      = page.getByLabel('Password:');
    this.rememberMeCheckbox = page.getByLabel('Remember me?');
    this.loginButton        = page.getByRole('button', { name: 'Log in' });
    this.registerButton     = page.getByRole('button', { name: 'Register' });
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
    this.errorMessage       = page.locator('.message-error');

    // Scoped to header banner (ref=e7) — avoids ambiguity with footer links
    const header            = page.getByRole('banner');
    this.logoutLink         = header.getByRole('link', { name: 'Log out' });
    this.myAccountLink      = header.getByRole('link', { name: 'My account' });
  }

  // ── Actions ──────────────────────────────────────────────────

  async navigate(): Promise<void> {
    await this.goto('/login');
    // Wait for the login button to be visible rather than networkidle —
    // Firefox holds background connections open on the demo site causing
    // networkidle to hang indefinitely, closing the context mid-test.
    await this.loginButton.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.waitForPageLoad();
  }

  async loginWithRememberMe(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.rememberMeCheckbox.check();
    await this.loginButton.click();
    await this.waitForPageLoad();
  }

  // ── State queries ─────────────────────────────────────────────

  getCurrentUrl(): string {
    return this.page.url();
  }
}