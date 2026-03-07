import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * RegisterPage
 * ────────────
 * Page Object Model for /register
 *
 * Snapshot refs:
 *   - Gender Male    → ref=e67  (radio "Male")
 *   - Gender Female  → ref=e69  (radio "Female")
 *   - First name     → ref=e72  (textbox "First name:")
 *   - Last name      → ref=e75  (textbox "Last name:")
 *   - Email          → ref=e78  (textbox "Email:")
 *   - Company name   → ref=e84  (textbox "Company name:")
 *   - Newsletter     → ref=e93  (checkbox "Newsletter")
 *   - Password       → ref=e99  (textbox "Password:")
 *   - Confirm pass   → ref=e102 (textbox "Confirm password:")
 *   - Register btn   → ref=e104 (button "Register")
 */
export class RegisterPage extends BasePage {

  // ── Personal details ─────────────────────────────────────────
  readonly genderMaleRadio: Locator;
  readonly genderFemaleRadio: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;

  // ── Company details ───────────────────────────────────────────
  readonly companyNameInput: Locator;

  // ── Newsletter ────────────────────────────────────────────────
  readonly newsletterCheckbox: Locator;

  // ── Password ──────────────────────────────────────────────────
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;

  // ── Actions ───────────────────────────────────────────────────
  readonly registerButton: Locator;

  // ── Post-registration ─────────────────────────────────────────
  readonly successMessage: Locator;
  readonly errorSummary: Locator;

  constructor(page: Page) {
    super(page);
    this.genderMaleRadio      = page.getByRole('radio', { name: 'Male' });
    this.genderFemaleRadio    = page.getByRole('radio', { name: 'Female' });
    this.firstNameInput       = page.getByLabel('First name:');
    this.lastNameInput        = page.getByLabel('Last name:');
    this.emailInput           = page.getByLabel('Email:');
    this.companyNameInput     = page.getByLabel('Company name:');
    this.newsletterCheckbox   = page.getByLabel('Newsletter');
    this.passwordInput        = page.getByLabel('Password:', { exact: true });
    this.confirmPasswordInput = page.getByLabel('Confirm password:');
    this.registerButton       = page.getByRole('button', { name: 'Register' });
    this.successMessage       = page.locator('.result');
    this.errorSummary         = page.locator('.message-error');
  }

  // ── Actions ───────────────────────────────────────────────────

  async navigate(): Promise<void> {
    await this.goto('/register');
    await this.waitForPageLoad();
  }

  async register(details: {
    gender?: 'Male' | 'Female';
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword?: string;
    companyName?: string;
    newsletter?: boolean;
  }): Promise<void> {
    if (details.gender === 'Male')   await this.genderMaleRadio.check();
    if (details.gender === 'Female') await this.genderFemaleRadio.check();

    await this.firstNameInput.fill(details.firstName);
    await this.lastNameInput.fill(details.lastName);
    await this.emailInput.fill(details.email);

    if (details.companyName) {
      await this.companyNameInput.fill(details.companyName);
    }

    if (details.newsletter === false) {
      await this.newsletterCheckbox.uncheck();
    }

    await this.passwordInput.fill(details.password);
    await this.confirmPasswordInput.fill(details.confirmPassword ?? details.password);

    await this.registerButton.click();
    await this.waitForPageLoad();
  }

  // ── State queries ─────────────────────────────────────────────

  async isRegistrationSuccessful(): Promise<boolean> {
    return this.successMessage.isVisible();
  }
}