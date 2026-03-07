import { test, expect } from '../../fixtures/pages.fixture';

test.describe('Login Workflow', () => {

  // Empty object = clean context, no session — unauthenticated
  test.use({ stealthStorageState: { cookies: [], origins: [] } });

  test('should login successfully with valid credentials', async ({ loginPage, credentials }) => {
    // Step 1 — Navigate to the login page
    await loginPage.navigate();

    // Step 2 — Enter valid credentials and submit
    await loginPage.login(credentials.email, credentials.password);

    // Step 3 — Validate login was successful
    await expect(loginPage.page).toHaveURL('/');
    await expect(loginPage.logoutLink).toBeVisible();
    await expect(loginPage.myAccountLink).toBeVisible();
  });

});