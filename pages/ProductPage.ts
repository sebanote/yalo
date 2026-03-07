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
    this.addToCartButton      = main.locator('article').first().getByRole('button', { name: 'Add to cart' });
    this.addToWishlistButton  = main.locator('article').first().getByRole('button', { name: 'Add to wishlist' });
    this.addToCompareButton   = main.locator('article').first().getByRole('button', { name: 'Add to compare list' });
    this.emailFriendButton    = main.getByRole('button', { name: 'Email a friend' });

    this.reviewTitleInput     = main.getByLabel('Review title:');
    this.reviewTextInput      = main.getByLabel('Review text:');
    this.submitReviewButton   = main.getByRole('button', { name: 'Submit review' });

    this.breadcrumb           = main.locator('.breadcrumb');
    this.addToCartNotification = page.locator('#bar-notification');
  }

  // ── Actions ───────────────────────────────────────────────────

  async navigate(productSlug: string): Promise<void> {
    await this.goto(`/${productSlug}`);
    await this.waitForPageLoad();
  }

  async setQuantity(quantity: number): Promise<void> {
    await this.quantityInput.fill(String(quantity));
  }

  async addToCart(quantity?: number): Promise<void> {
    if (quantity !== undefined) await this.setQuantity(quantity);
    await this.addToCartButton.click();
    await this.waitForPageLoad();
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