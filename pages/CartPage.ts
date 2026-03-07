import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * CartPage
 * ────────
 * Page Object Model for /cart
 *
 * Snapshot refs:
 *   - Cart table       → ref=e62  (table)
 *   - Cart rows        → ref=e80  (rowgroup — cart items)
 *   - Qty input        → ref=e92, e108 (textbox "Qty.")
 *   - Remove button    → ref=e96, e112 (button "Remove")
 *   - Continue shopping→ ref=e115 (button)
 *   - Discount input   → ref=e130 (textbox "Enter discount coupon code")
 *   - Apply coupon     → ref=e131 (button)
 *   - Gift card input  → ref=e136 (textbox "Enter gift card code")
 *   - Add gift card    → ref=e137 (button)
 *   - Terms checkbox   → ref=e160
 *   - Checkout button  → ref=e163
 *   - Total            → ref=e155 (strong inside Total row)
 */
export class CartPage extends BasePage {

  // ── Cart table ────────────────────────────────────────────────
  readonly cartTable: Locator;
  readonly cartRows: Locator;

  // ── Order summary ─────────────────────────────────────────────
  readonly subTotal: Locator;
  readonly orderTotal: Locator;

  // ── Discount & gift cards ─────────────────────────────────────
  readonly discountCodeInput: Locator;
  readonly applyCouponButton: Locator;
  readonly giftCardInput: Locator;
  readonly addGiftCardButton: Locator;

  // ── Actions ───────────────────────────────────────────────────
  readonly continueShoppingButton: Locator;
  readonly termsCheckbox: Locator;
  readonly checkoutButton: Locator;

  // ── Empty cart ────────────────────────────────────────────────
  readonly emptyCartMessage: Locator;

  constructor(page: Page) {
    super(page);

    const main                = page.getByRole('main');

    this.cartTable            = main.getByRole('table').first();
    this.cartRows             = main.getByRole('row').filter({ has: page.getByRole('button', { name: 'Remove' }) });

    this.subTotal             = main.getByRole('row', { name: /Sub-Total/ }).getByRole('cell').last();
    this.orderTotal           = main.getByRole('row', { name: /^Total:/ }).locator('strong');

    this.discountCodeInput    = main.getByRole('textbox', { name: 'Enter discount coupon code' });
    this.applyCouponButton    = main.getByRole('button', { name: 'Apply coupon' });
    this.giftCardInput        = main.getByRole('textbox', { name: 'Enter gift card code' });
    this.addGiftCardButton    = main.getByRole('button', { name: 'Add gift card' });

    this.continueShoppingButton = main.getByRole('button', { name: 'Continue shopping' });
    this.termsCheckbox        = main.getByRole('checkbox', { name: /I agree with the terms of service/ });
    this.checkoutButton       = main.getByRole('button', { name: 'Checkout' });

    this.emptyCartMessage     = main.locator('.no-data');
  }

  // ── Actions ───────────────────────────────────────────────────

  async navigate(): Promise<void> {
    await this.goto('/cart');
    await this.waitForPageLoad();
  }

  async updateQuantity(rowIndex: number, quantity: number): Promise<void> {
    const row = this.cartRows.nth(rowIndex);
    await row.getByRole('textbox', { name: 'Qty.' }).fill(String(quantity));
  }

  async removeItem(rowIndex: number): Promise<void> {
    await this.cartRows.nth(rowIndex).getByRole('button', { name: 'Remove' }).click();
    await this.waitForPageLoad();
  }

  async applyDiscountCode(code: string): Promise<void> {
    await this.discountCodeInput.fill(code);
    await this.applyCouponButton.click();
    await this.waitForPageLoad();
  }

  async applyGiftCard(code: string): Promise<void> {
    await this.giftCardInput.fill(code);
    await this.addGiftCardButton.click();
    await this.waitForPageLoad();
  }

  async proceedToCheckout(): Promise<void> {
    await this.termsCheckbox.check();
    await this.checkoutButton.click();
    await this.waitForPageLoad();
  }

  // ── State queries ─────────────────────────────────────────────

  async getItemCount(): Promise<number> {
    return this.cartRows.count();
  }

  async getOrderTotal(): Promise<string> {
    return this.orderTotal.innerText();
  }

  async isEmpty(): Promise<boolean> {
    return this.emptyCartMessage.isVisible();
  }

  async getCartItemNames(): Promise<string[]> {
    const rows = await this.cartRows.all();
    return Promise.all(rows.map(row => row.getByRole('link').first().innerText()));
  }
}