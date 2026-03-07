import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * CustomerInfoPage
 * ────────────────
 * Page Object Model for /customer/info
 *
 * Snapshot refs:
 *   - First name  → ref=e95  (textbox "First name:")
 *   - Last name   → ref=e98  (textbox "Last name:")
 *   - Email       → ref=e101 (textbox "Email:")
 *   - Company     → ref=e107 (textbox "Company name:")
 *   - Newsletter  → ref=e116 (checkbox "Newsletter")
 *   - Save        → ref=e118 (button "Save")
 *   - Male radio  → ref=e90
 *   - Female radio→ ref=e92
 */
export class CustomerInfoPage extends BasePage {

  // ── Sidebar navigation ────────────────────────────────────────
  readonly sidebar: Locator;
  readonly customerInfoLink: Locator;
  readonly addressesLink: Locator;
  readonly ordersLink: Locator;
  readonly changePasswordLink: Locator;

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

  // ── Form actions ──────────────────────────────────────────────
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);

    // Sidebar — scoped to complementary region to avoid footer duplicates
    const sidebar          = page.getByRole('complementary');
    this.sidebar           = sidebar;
    this.customerInfoLink  = sidebar.getByRole('link', { name: 'Customer info' });
    this.addressesLink     = sidebar.getByRole('link', { name: 'Addresses' });
    this.ordersLink        = sidebar.getByRole('link', { name: 'Orders' });
    this.changePasswordLink = sidebar.getByRole('link', { name: 'Change password' });

    // Personal details
    this.genderMaleRadio   = page.getByRole('radio', { name: 'Male' });
    this.genderFemaleRadio = page.getByRole('radio', { name: 'Female' });
    this.firstNameInput    = page.getByLabel('First name:');
    this.lastNameInput     = page.getByLabel('Last name:');
    this.emailInput        = page.getByLabel('Email:');

    // Company
    this.companyNameInput  = page.getByLabel('Company name:');

    // Newsletter
    this.newsletterCheckbox = page.getByLabel('Newsletter');

    // Actions
    this.saveButton        = page.getByRole('button', { name: 'Save' });
  }

  // ── Actions ───────────────────────────────────────────────────

  async navigate(): Promise<void> {
    await this.goto('/customer/info');
    await this.waitForPageLoad();
  }

  async updatePersonalDetails(details: {
    gender?: 'Male' | 'Female';
    firstName?: string;
    lastName?: string;
    email?: string;
    companyName?: string;
  }): Promise<void> {
    if (details.gender === 'Male') await this.genderMaleRadio.check();
    if (details.gender === 'Female') await this.genderFemaleRadio.check();
    if (details.firstName !== undefined) await this.firstNameInput.fill(details.firstName);
    if (details.lastName !== undefined)  await this.lastNameInput.fill(details.lastName);
    if (details.email !== undefined)     await this.emailInput.fill(details.email);
    if (details.companyName !== undefined) await this.companyNameInput.fill(details.companyName);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
    await this.waitForPageLoad();
  }

  // ── State queries ─────────────────────────────────────────────

  async getFirstName(): Promise<string> {
    return this.firstNameInput.inputValue();
  }

  async getLastName(): Promise<string> {
    return this.lastNameInput.inputValue();
  }

  async getEmail(): Promise<string> {
    return this.emailInput.inputValue();
  }
}