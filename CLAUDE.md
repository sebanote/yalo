# CLAUDE.md — Project Context for Claude Code

## App Under Test
- **URL**: https://demo.nopcommerce.com
- **Type**: E-commerce demo store (nopCommerce)

## Stack
- Playwright + TypeScript
- Node.js 18+
- `playwright-extra` + `puppeteer-extra-plugin-stealth` for bot detection bypass
- `dotenv` for environment variable loading

---

## Project Structure

```
pages/           → Page Object Models (one file per page, all extend BasePage)
tests/e2e/       → Test specs
fixtures/        → Custom Playwright fixtures
utils/           → Shared helpers (env validation, stealth browser setup)
auth/            → storageState session files (gitignored)
tests/global.setup.ts  → Runs once before all tests — saves auth sessions per browser
playwright.config.ts
```

---

## Conventions

### Page Object Models
- All POMs extend `BasePage` (located at `pages/BasePage.ts`)
- Locators are `readonly` public properties — never private
- Actions (navigate, fill, click, submit) are public async methods
- **No assertions in POMs** — locators are exposed for tests to assert on directly
- Locators use accessibility-first selectors: `getByRole`, `getByLabel`, `getByText`
- When a locator appears in multiple regions (e.g. header + footer), scope it to the correct region:
  ```typescript
  const header = page.getByRole('banner');
  this.myAccountLink = header.getByRole('link', { name: 'My account' });
  ```

### Tests
- Always import `test` and `expect` from `fixtures/pages.fixture.ts`, not from `@playwright/test`
- Assertions live in the test, not in the POM
- Credentials come from the `credentials` fixture — never hardcode them
- Authenticated by default (storageState loaded from config)
- For unauthenticated suites, override at the describe level:
  ```typescript
  test.use({ stealthStorageState: { cookies: [], origins: [] } });
  ```
  > ⚠️ Do NOT use `test.use({ storageState: ... })` — that is Playwright's built-in option and does not reach the stealth fixture.

### Fixtures (`fixtures/pages.fixture.ts`)
- Extends Playwright base test with: `loginPage`, `credentials`, `stealthContext`, `stealthPage`
- `stealthContext` reads `testInfo.project.use.storageState` from config by default
- Override with `test.use({ stealthStorageState: { cookies: [], origins: [] } })` for unauthenticated context
- `stealthStorageState` is a custom option (`{ option: true }`) — do NOT use Playwright's built-in `storageState` as it doesn't reach the stealth fixture
- Browser is resolved from project name → `BROWSER_FOR_PROJECT` map

### Stealth Browsers (`utils/stealthBrowser.ts`)
- Single source of truth for all stealth browser setup
- Chromium: full stealth + `userAgent` API shim
- Firefox/WebKit: stealth minus `user-agent-override` (Puppeteer API incompatibility)
- `STEALTH_LAUNCH_ARGS` exported for use in both fixture and global setup

### Environment Variables (`utils/env.ts`)
- All env vars accessed via `env.TEST_EMAIL`, `env.TEST_PASSWORD`
- Throws immediately at startup if a required var is missing
- Never use `process.env.X ?? 'fallback'` — fail fast instead

### Authentication
- `tests/global.setup.ts` saves a storageState file per browser before tests run
- Files saved to: `auth/storageState.json`, `auth/storageState.firefox.json`, `auth/storageState.webkit.json`
- `auth/` is gitignored — never commit session files

---

## Adding a New Page

1. Create `pages/NewPage.ts` extending `BasePage`
2. Add public readonly locators in the constructor
3. Add action methods (no assertions)
4. Add the fixture to `fixtures/pages.fixture.ts`:
   - Add type to `PageFixtures`
   - Add `myPage: async ({ stealthPage }, use) => { await use(new MyPage(stealthPage)); }`

## Adding a New Test Suite

Create `tests/e2e/feature.spec.ts` — authenticated by default, no extra config needed.
Add `test.use({ stealthStorageState: { cookies: [], origins: [] } })` only if the suite needs a clean session.

---

## Test Accounts (`utils/credentials.ts`)

All accounts live in `utils/credentials.ts` as a single typed object. Never hardcode credentials in tests.

- `requireEnv()` — use for accounts always needed. Throws at startup if missing.
- `optionalEnv()` — use for accounts only needed by specific tests. Throws only when that test runs.
- The `credentials` fixture always provides `credentials.default`.
- Import `credentials` directly in tests that need non-default accounts.

### Adding a new account
1. Add vars to `.env`, `.env.example`, and GitHub Actions secrets
2. Add entry to `utils/credentials.ts`
3. Import and use in the test — no fixture changes needed

---

## Headed Mode

`npm run test:headed` works via `cross-env HEADED=1` set in the npm script. The stealth fixture reads `process.env.HEADED === '1'` and passes `headless: false` to `stealthBrowser.launch()`.

Do NOT use either of these approaches — they do not work:
- `process.argv.includes('--headed')` — Playwright strips CLI flags before spawning worker processes
- `testInfo.project.use.headless` — not reliably populated at runtime for custom fixture contexts

---

## Using playwright-cli Snapshots

When asked to create a new POM, ask the user to provide a snapshot first:

```bash
npx playwright-cli open --headed https://demo.nopcommerce.com/target-page
# navigate manually, then in a second terminal:
npx playwright-cli snapshot
```

From the snapshot output:
- Use `getByRole` / `getByLabel` / `getByText` selectors — never use `ref=eXX` values
- Watch for duplicate element names across header/footer — scope to `page.getByRole('banner')` for header links
- `.playwright-cli/` is gitignored — never reference or commit snapshot files