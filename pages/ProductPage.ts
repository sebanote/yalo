import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ProductPage
 * ───────────
 * Page Object Model for individual product pages e.g. /apple-iphone-16-128gb
 *
 * Snapshot refs (Apple iPhone 16 128GB):
 *   - Product title    → ref=e83  (heading level=1)
 *   - Price            → ref=e93
 *   - Quantity input   → ref=e96  (textbox "Enter a quantity")
 *   - Add to cart      → ref=e97  (button "Add to cart")
 *   - Add to wishlist  → ref=e103 (button "Add to wishlist")
 *   - Add to compare   → ref=e105 (button "Add to compare list")
 *   - Review title     → ref=e190 (textbox "Review title:")
 *   - Review text      → ref=e193 (textbox "Review text:")
 *   - Submit review    → ref=e207 (button "Submit review")
 *   - Breadcrumb       → ref=e55  (list)
 *
 * #bar-notification anatomy:
 *   Outer container (#bar-notification) is ALWAYS in the DOM — never
 *   hidden/removed. Waiting on it with state:'hidden' never resolves.
 *
 *   When an add-to-cart succeeds the server injects an inner child:
 *     <div class="bar-notification success" style="display:block;">...</div>
 *
 *   When dismissed the inner child is removed, leaving the outer container
 *   empty. The correct wait target is the inner .bar-notification.success
 *   child, not the outer wrapper.
 */
export class ProductPage extends BasePage {

  // ── Product details ───────────────────────────────────────────
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly productDescription: Locator;
  readonly skuLabel: Locator;

  // ── Actions ───────────────────────────────────────────────────
  readonly quantityInput: Locator;
  readonly addToCartButton: Locator;
  readonly addToWishlistButton: Locator;
  readonly addToCompareButton: Locator;
  readonly emailFriendButton: Locator;

  // ── Review form ───────────────────────────────────────────────
  readonly reviewTitleInput: Locator;
  readonly reviewTextInput: Locator;
  readonly submitReviewButton: Locator;

  // ── Breadcrumb ────────────────────────────────────────────────
  readonly breadcrumb: Locator;

  // ── Notifications ─────────────────────────────────────────────
  /**
   * The inner success banner injected after a successful add-to-cart.
   * This element is created and removed dynamically — it does not exist
   * in the DOM until the server responds, and is removed on dismiss.
   * Use this (not #bar-notification) as the AJAX commit signal.
   */
  readonly addToCartNotification: Locator;

  constructor(page: Page) {
    super(page);

    // Scoped to main to avoid ambiguity with related product buttons
    const main                = page.getByRole('main');

    this.productTitle         = main.getByRole('heading', { level: 1 });
    this.productPrice         = main.locator('.price.actual-price').first();
    this.productDescription   = main.locator('.full-description');
    this.skuLabel             = main.locator('.sku .value');

    this.quantityInput        = main.getByRole('textbox', { name: 'Enter a quantity' });
    // Scoped to the product overview block to avoid matching related product buttons
    const overview            = main.locator('.product-essential, .overview').first();
    this.addToCartButton      = overview.getByRole('button', { name: 'Add to cart' });
    this.addToWishlistButton  = overview.getByRole('button', { name: 'Add to wishlist' });
    this.addToCompareButton   = overview.getByRole('button', { name: 'Add to compare list' });
    this.emailFriendButton    = main.getByRole('button', { name: 'Email a friend' });

    this.reviewTitleInput     = main.getByLabel('Review title:');
    this.reviewTextInput      = main.getByLabel('Review text:');
    this.submitReviewButton   = main.getByRole('button', { name: 'Submit review' });

    this.breadcrumb           = main.locator('.breadcrumb');

    // Inner child of #bar-notification — dynamically injected on success,
    // removed on dismiss. The outer #bar-notification wrapper is always
    // present so cannot be used as a reliable visible/hidden signal.
    this.addToCartNotification = this.page.locator('#bar-notification .bar-notification.success');
  }

  // ── Actions ───────────────────────────────────────────────────

  async navigate(productSlug: string): Promise<void> {
    await this.goto(`/${productSlug}`);
    await this.waitForPageLoad();
  }

  async setQuantity(quantity: number): Promise<void> {
    await this.quantityInput.fill(String(quantity));
  }

  /**
   * Clicks "Add to cart" and waits for the server to confirm the add.
   *
   * nopCommerce POSTs to the cart via AJAX and then injects a child
   * div.bar-notification.success inside #bar-notification.
   * That child is removed from the DOM when the bar is dismissed.
   *
   * Wait for the inner child to appear — that confirms the server
   * committed the add. The bar never auto-fades; navigate away immediately.
   */
  async addToCart(quantity?: number): Promise<void> {
    if (quantity !== undefined) await this.setQuantity(quantity);
    await this.addToCartButton.click();

    // Inner child appears → server confirmed the cart write.
    // We do not wait for detach — the bar only dismisses on manual close
    // or when a subsequent add replaces it; it never auto-fades.
    // Navigating away immediately after attach is sufficient.
    await this.addToCartNotification.waitFor({ state: 'attached', timeout: 10_000 });
  }

  async addToWishlist(): Promise<void> {
    await this.addToWishlistButton.click();
    await this.waitForPageLoad();
  }

  async submitReview(details: {
    title: string;
    text: string;
    rating: 'Bad' | 'Not good' | 'Not bad but also not excellent' | 'Good' | 'Excellent';
  }): Promise<void> {
    await this.reviewTitleInput.fill(details.title);
    await this.reviewTextInput.fill(details.text);
    await this.page.getByRole('radio', { name: details.rating }).check();
    await this.submitReviewButton.click();
    await this.waitForPageLoad();
  }

  // ── State queries ─────────────────────────────────────────────

  async getTitle(): Promise<string> {
    return this.productTitle.innerText();
  }

  async getPrice(): Promise<string> {
    return this.productPrice.innerText();
  }

  async getQuantity(): Promise<string> {
    return this.quantityInput.inputValue();
  }
}