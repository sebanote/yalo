import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * CheckoutPage
 * ────────────
 * Page Object Model for /checkout
 *
 * The checkout is a 6-step accordion:
 *   1. Billing address   ← fully mapped from snapshot
 *   2. Shipping address  ← collapsed in snapshot, mapped from heading only
 *   3. Shipping method   ← collapsed in snapshot, mapped from heading only
 *   4. Payment method    ← collapsed in snapshot, mapped from heading only
 *   5. Payment info      ← collapsed in snapshot, mapped from heading only
 *   6. Confirm order     ← collapsed in snapshot, mapped from heading only
 *
 * Steps 2–6 need re-snapshotting after each Continue click to map their fields.
 *
 * Snapshot refs (step 1):
 *   - Ship to same addr  → ref=e70  (checkbox)
 *   - First name         → ref=e76  (textbox "First name:")
 *   - Last name          → ref=e79  (textbox "Last name:")
 *   - Email              → ref=e82  (textbox "Email:")
 *   - Company            → ref=e85  (textbox "Company:")
 *   - Country            → ref=e88  (combobox "Country:")
 *   - State / province   → ref=e91  (combobox "State / province:")
 *   - City               → ref=e94  (textbox "City:")
 *   - Address 1          → ref=e97  (textbox "Address 1:")
 *   - Address 2          → ref=e100 (textbox "Address 2:")
 *   - Zip / postal code  → ref=e103 (textbox "Zip / postal code:")
 *   - Phone number       → ref=e106 (textbox "Phone number:")
 *   - Fax number         → ref=e109 (textbox "Fax number:")
 *   - Continue button    → ref=e111 (button "Continue")
 */
export class CheckoutPage extends BasePage {

  // ── Step headings (for asserting active step) ─────────────────
  readonly billingAddressHeading: Locator;
  readonly shippingAddressHeading: Locator;
  readonly shippingMethodHeading: Locator;
  readonly paymentMethodHeading: Locator;
  readonly paymentInfoHeading: Locator;
  readonly confirmOrderHeading: Locator;

  // ── Step 1: Billing address ───────────────────────────────────
  readonly shipToSameAddressCheckbox: Locator;
  readonly billingFirstNameInput: Locator;
  readonly billingLastNameInput: Locator;
  readonly billingEmailInput: Locator;
  readonly billingCompanyInput: Locator;
  readonly billingCountrySelect: Locator;
  readonly billingStateSelect: Locator;
  readonly billingCityInput: Locator;
  readonly billingAddress1Input: Locator;
  readonly billingAddress2Input: Locator;
  readonly billingZipInput: Locator;
  readonly billingPhoneInput: Locator;
  readonly billingFaxInput: Locator;
  readonly billingContinueButton: Locator;

  // ── Order confirmation ─────────────────────────────────────────
  readonly confirmOrderButton: Locator;
  readonly orderSuccessMessage: Locator;

  constructor(page: Page) {
    super(page);

    const main = page.getByRole('main');

    // Step headings
    this.billingAddressHeading  = main.getByRole('heading', { name: 'Billing address' });
    this.shippingAddressHeading = main.getByRole('heading', { name: 'Shipping address' });
    this.shippingMethodHeading  = main.getByRole('heading', { name: 'Shipping method' });
    this.paymentMethodHeading   = main.getByRole('heading', { name: 'Payment method' });
    this.paymentInfoHeading     = main.getByRole('heading', { name: 'Payment information' });
    this.confirmOrderHeading    = main.getByRole('heading', { name: 'Confirm order' });

    // Step 1 — Billing address
    // Scoped to the billing listitem to avoid conflicts when shipping address
    // section expands with identical field labels
    const billingStep = main.getByRole('listitem').filter({
      has: page.getByRole('heading', { name: 'Billing address' }),
    });

    this.shipToSameAddressCheckbox = billingStep.getByRole('checkbox', { name: 'Ship to the same address' });
    this.billingFirstNameInput     = billingStep.getByLabel('First name:');
    this.billingLastNameInput      = billingStep.getByLabel('Last name:');
    this.billingEmailInput         = billingStep.getByLabel('Email:');
    this.billingCompanyInput       = billingStep.getByLabel('Company:');
    this.billingCountrySelect      = billingStep.getByLabel('Country:');
    this.billingStateSelect        = billingStep.getByLabel('State / province:');
    this.billingCityInput          = billingStep.getByLabel('City:');
    this.billingAddress1Input      = billingStep.getByLabel('Address 1:');
    this.billingAddress2Input      = billingStep.getByLabel('Address 2:');
    this.billingZipInput           = billingStep.getByLabel('Zip / postal code:');
    this.billingPhoneInput         = billingStep.getByLabel('Phone number:');
    this.billingFaxInput           = billingStep.getByLabel('Fax number:');
    this.billingContinueButton     = billingStep.getByRole('button', { name: 'Continue' });

    // Confirm order (step 6 — button rendered when step is active)
    this.confirmOrderButton  = main.getByRole('button', { name: 'Confirm' });
    this.orderSuccessMessage = main.locator('.order-completed .title');
  }

  // ── Actions ───────────────────────────────────────────────────

  async navigate(): Promise<void> {
    await this.goto('/checkout');
    await this.waitForPageLoad();
  }

  async fillBillingAddress(details: {
    firstName?: string;
    lastName?: string;
    email?: string;
    company?: string;
    country?: string;
    state?: string;
    city: string;
    address1: string;
    address2?: string;
    zip: string;
    phone: string;
    fax?: string;
    shipToSameAddress?: boolean;
  }): Promise<void> {
    if (details.shipToSameAddress === false) {
      await this.shipToSameAddressCheckbox.uncheck();
    }
    if (details.firstName)  await this.billingFirstNameInput.fill(details.firstName);
    if (details.lastName)   await this.billingLastNameInput.fill(details.lastName);
    if (details.email)      await this.billingEmailInput.fill(details.email);
    if (details.company)    await this.billingCompanyInput.fill(details.company);
    if (details.country)    await this.billingCountrySelect.selectOption({ label: details.country });
    if (details.state)      await this.billingStateSelect.selectOption({ label: details.state });

    await this.billingCityInput.fill(details.city);
    await this.billingAddress1Input.fill(details.address1);
    if (details.address2)   await this.billingAddress2Input.fill(details.address2);
    await this.billingZipInput.fill(details.zip);
    await this.billingPhoneInput.fill(details.phone);
    if (details.fax)        await this.billingFaxInput.fill(details.fax);
  }

  async continueBilling(): Promise<void> {
    await this.billingContinueButton.click();
    await this.waitForPageLoad();
  }

  async confirmOrder(): Promise<void> {
    await this.confirmOrderButton.click();
    await this.waitForPageLoad();
  }

  // ── State queries ─────────────────────────────────────────────

  async isOrderSuccessful(): Promise<boolean> {
    return this.orderSuccessMessage.isVisible();
  }
}