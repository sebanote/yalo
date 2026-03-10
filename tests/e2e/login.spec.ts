import { test, expect } from '../../fixtures/pages.fixture';

/**
 * Login
 * ─────────────────────────────────────────────────────────────
 * Unauthenticated user
 * 1.  Valid credentials log the user in
 */

test.describe('Login — unauthenticated user', () => {

  // All tests in this block run without any stored session
  test.use({ stealthStorageState: { cookies: [], origins: [] } });

  test('1. Valid credentials log the user in', async ({ loginPage, credentials }) => {
    await test.step('Navigate to login page', async () => {
      await loginPage.navigate();
    });

    await test.step('Submit valid credentials', async () => {
      await loginPage.login(credentials.email, credentials.password);
    });

    await test.step('Verify redirect away from /login', async () => {
      await expect(loginPage.page).not.toHaveURL(/\/login/);
    });

    await test.step('Verify authenticated header state', async () => {
      await expect(loginPage.myAccountLink).toBeVisible();
      await expect(loginPage.logoutLink).toBeVisible();
    });
  });

});


  



