import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * CartPage
 * ────────
 * Page Object Model for /cart
 *
 * Snapshot refs (full cart):
 *   - Cart table       → ref=e62  (table)
 *   - Cart rows        → ref=e80  (rowgroup — cart items)
 *   - Qty input        → ref=e95, e114, e133 (textbox "Qty.")
 *   - Remove button    → ref=e99, e118, e137 (button "Remove")
 *   - Continue shopping→ ref=e140 (button)
 *   - Discount input   → ref=e155 (textbox "Enter discount coupon code")
 *   - Apply coupon     → ref=e156 (button)
 *   - Gift card input  → ref=e161 (textbox "Enter gift card code")
 *   - Add gift card    → ref=e162 (button)
 *   - Terms checkbox   → ref=e185
 *   - Checkout button  → ref=e188
 *   - Total            → ref=e180 (strong inside Total row)
 *
 * Snapshot refs (empty cart):
 *   - Empty message    → ref=e60 (generic: "Your Shopping Cart is empty!")
 *
 * nopCommerce cart mutation mechanics (confirmed via DOM inspection):
 *
 *   addToCart    → true AJAX, no page reload
 *                  wait: #bar-notification visible→hidden (handled in ProductPage)
 *
 *   removeItem   → checks a hidden checkbox + triggers hidden #updatecart submit
 *                  this is a full form POST — the page reloads to /cart
 *                  wait: click → row detached → cartTable or emptyMessage visible
 *
 *   updateQty    → same hidden #updatecart form POST mechanism as removeItem
 *                  wait: press → input detached → cartTable visible
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
    this.cartRows             = main.getByRole('row').filter({
      has: page.getByRole('button', { name: 'Remove' }),
    });

    this.subTotal             = main.getByRole('row', { name: /Sub-Total/ }).getByRole('cell').last();
    this.orderTotal           = main.getByRole('row', { name: /^Total:/ }).locator('strong');

    this.discountCodeInput    = main.getByRole('textbox', { name: 'Enter discount coupon code' });
    this.applyCouponButton    = main.getByRole('button', { name: 'Apply coupon' });
    this.giftCardInput        = main.getByRole('textbox', { name: 'Enter gift card code' });
    this.addGiftCardButton    = main.getByRole('button', { name: 'Add gift card' });

    this.continueShoppingButton = main.getByRole('button', { name: 'Continue shopping' });
    this.termsCheckbox        = main.getByRole('checkbox', {
      name: /I agree with the terms of service/,
    });
    this.checkoutButton       = main.getByRole('button', { name: 'Checkout' });

    this.emptyCartMessage     = main.getByText('Your Shopping Cart is empty!');
  }

  // ── Actions ───────────────────────────────────────────────────

  async navigate(): Promise<void> {
    await this.goto('/cart');
    // Wait for cart table or empty message rather than networkidle —
    // Firefox holds background connections open on the demo site causing
    // networkidle to hang indefinitely.
    await Promise.race([
      this.cartTable.waitFor({ state: 'visible', timeout: 15_000 }),
      this.emptyCartMessage.waitFor({ state: 'visible', timeout: 15_000 }),
    ]);
  }

  /**
   * Update the quantity of a cart row.
   *
   * Pressing Enter on the qty input triggers the hidden #updatecart button,
   * which submits a full form POST back to /cart — the page fully reloads.
   * Press Enter → wait for input to detach → wait for cartTable to re-appear.
   */
  async updateQuantity(rowIndex: number, quantity: number): Promise<void> {
    const qtyInput = this.cartRows.nth(rowIndex).getByRole('textbox', { name: 'Qty.' });
    await qtyInput.fill(String(quantity));

    // The qty input onchange is guarded by __cfRLUnblockHandlers.
    // Set the flag then trigger the change event so the original handler fires,
    // submitting the form with the anti-forgery token intact.
    await this.page.evaluate(() => {
      (window as any).__cfRLUnblockHandlers = true;
    });
    await qtyInput.dispatchEvent('change');

    await qtyInput.waitFor({ state: 'detached', timeout: 20_000 });
    await this.cartTable.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * Remove a cart row.
   *
   * The Remove button checks a hidden checkbox then triggers the hidden
   * #updatecart submit — a full form POST that reloads /cart.
   * Click → wait for row to detach → wait for cartTable or emptyMessage.
   */
  async removeItem(rowIndex: number): Promise<void> {
    const row = this.cartRows.nth(rowIndex);
    const removeBtn = row.getByRole('button', { name: 'Remove' });

    // The Remove button onclick is guarded by `if (!window.__cfRLUnblockHandlers) return false`.
    // On stealth browsers this flag is not set so the handler exits early.
    // We set the flag, then click — the original onclick runs and submits
    // the form with the anti-forgery token intact (bypassing via evaluate
    // would skip the token and the server silently no-ops the POST).
    await this.page.evaluate(() => {
      (window as any).__cfRLUnblockHandlers = true;
    });
    await removeBtn.click();

    await Promise.race([
      row.waitFor({ state: 'detached', timeout: 20_000 }),
      this.emptyCartMessage.waitFor({ state: 'visible', timeout: 20_000 }),
    ]);
    await Promise.race([
      this.cartTable.waitFor({ state: 'visible', timeout: 15_000 }),
      this.emptyCartMessage.waitFor({ state: 'visible', timeout: 15_000 }),
    ]);
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
    const isEmpty = await this.emptyCartMessage.isVisible();
    if (isEmpty) return 0;
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
    // Product name is the link inside the 3rd cell (Product(s) column — ref=e86, e102)
    return Promise.all(rows.map(row =>
      row.getByRole('cell').nth(2).getByRole('link').first().innerText()
    ));
  }
}