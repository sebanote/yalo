import { test, expect } from '../../fixtures/pages.fixture';

/**
 * Login
 * ─────────────────────────────────────────────────────────────
 * 1. User can login successfully with valid credentials
 */

// ── Unauthenticated suite ─────────────────────────────────────
test.describe('Login', () => {
  test.use({ stealthStorageState: { cookies: [], origins: [] } });

  test('1. User can login successfully with valid credentials', async ({ loginPage, credentials }) => {
    await test.step('Navigate to login page', async () => {
      await loginPage.navigate();
    });

    await test.step('Enter valid credentials and submit', async () => {
      await loginPage.login(credentials.email, credentials.password);
    });

    await test.step('Verify user is redirected to home and session is active', async () => {
      await expect(loginPage.page).toHaveURL('/');
      await expect(loginPage.logoutLink.or(loginPage.myAccountLink).first()).toBeVisible();
    });
  });
});