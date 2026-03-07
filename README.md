# Playwright Test Framework

End-to-end test framework for [nopCommerce demo store](https://demo.nopcommerce.com) built with Playwright + TypeScript. Runs tests across Chromium, Firefox, and WebKit with stealth browser support to bypass bot detection, and uses `storageState` to avoid logging in on every test.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Debugging](#debugging)
- [How It Works](#how-it-works)
- [Extending the Framework](#extending-the-framework)
  - [Adding a New Page Object](#adding-a-new-page-object)
  - [Adding a New Test Suite](#adding-a-new-test-suite)
  - [Writing an Unauthenticated Test](#writing-an-unauthenticated-test)

---

## Project Structure

```
playwright-framework/
├── pages/
│   ├── BasePage.ts              # Base class all POMs extend
│   └── LoginPage.ts             # Login page POM
├── tests/
│   └── e2e/
│       └── login.spec.ts        # Login test suite
├── fixtures/
│   └── pages.fixture.ts         # Custom test fixtures (stealth browser, credentials, page objects)
├── utils/
│   ├── env.ts                   # Env var validation — fails fast if vars are missing
│   └── stealthBrowser.ts        # playwright-extra stealth browser setup (shared)
├── auth/                        # Saved session files — gitignored, created by global setup
│   ├── storageState.json
│   ├── storageState.firefox.json
│   └── storageState.webkit.json
├── global.setup.ts              # Runs once before all tests — logs in and saves sessions
├── playwright.config.ts         # Playwright configuration — projects, storageState, reporters
├── .env                         # Local credentials — gitignored, you create this
├── .env.example                 # Template for .env
└── CLAUDE.md                    # Context file for Claude Code CLI
```

---

## Installation

### Prerequisites
- Node.js 18+
- npm

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install

# 3. Set up your environment variables
cp .env.example .env
```

Open `.env` and fill in your credentials — do not wrap values in quotes:

```dotenv
TEST_EMAIL=your-email@example.com
TEST_PASSWORD=your-password
```

> ⚠️ `.env` is gitignored. Never commit real credentials.

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TEST_EMAIL` | ✅ | Login email for test account |
| `TEST_PASSWORD` | ✅ | Login password for test account |

Tests fail immediately at startup if either variable is missing.

### Playwright Config (`playwright.config.ts`)

- **Base URL**: `https://demo.nopcommerce.com`
- **Projects**: Chromium, Firefox, WebKit — each with its own `storageState` file
- **Global setup**: Runs `global.setup.ts` before all tests to save auth sessions
- **Reporters**: HTML report + list output
- **Retries**: 2 retries on CI, 0 locally
- **Traces**: Captured on first retry
- **Screenshots**: Captured on failure

---

## Running Tests

```bash
# Run all tests across all browsers
npm test

# Run a specific test file
npx playwright test tests/e2e/login.spec.ts

# Run on a single browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run in headed mode (see the browser)
npx playwright test --headed

# Run with verbose list output
npx playwright test --reporter=list

# Open the HTML report after a run
npm run report
```

---

## Debugging

### Playwright Inspector (step through tests)

```bash
npx playwright test --debug
```

Opens the Playwright Inspector — you can step through each action, inspect locators, and see the page state at every point.

### UI Mode (interactive test runner)

```bash
npx playwright test --ui
```

A visual interface to run, filter, and watch tests. Shows a timeline of actions and a live browser preview. Best for local development.

### Headed mode (watch the browser)

```bash
npx playwright test --headed
```

### Slow motion (see each action)

```bash
npx playwright test --headed -- --slowMo=500
```

### Trace Viewer (post-mortem debugging)

Traces are automatically captured on first retry. After a failure:

```bash
npm run report
```

Click on a failed test → open the trace → replay every action with DOM snapshots, network requests, and console logs.

### Detection Signal Warnings

`BasePage` logs a warning to the console if a `401`, `403`, or `429` response is received during any navigation. If you see these in your output, it may indicate bot detection or session expiry:

```
⚠️  Detection signal: HTTP 403 on https://demo.nopcommerce.com/login
```

---

## How It Works

### Authentication via `storageState`

`global.setup.ts` runs **once** before all tests. It logs in using stealth browsers for each of the three browsers and saves the session (cookies + localStorage) to `auth/storageState.json`, `auth/storageState.firefox.json`, and `auth/storageState.webkit.json`.

Each project in `playwright.config.ts` loads its matching file, so tests start already authenticated — no login step needed.

Sessions are re-created on every test run. Stale files are cleared automatically before saving.

### Stealth Browsers

All browsers — in both `global.setup.ts` and test runs — launch via `playwright-extra` with `puppeteer-extra-plugin-stealth` applied. This patches automation signals (`navigator.webdriver`, canvas fingerprint, Chrome runtime, plugins etc.) to avoid bot detection.

Per-browser stealth configuration lives in `utils/stealthBrowser.ts`:

- **Chromium**: Full stealth with a `userAgent` API shim (Puppeteer API compatibility)
- **Firefox / WebKit**: Stealth minus `user-agent-override` (incompatible API on these engines, not needed for bot detection)

### Page Object Model (POM)

Each page of the app has a corresponding class in `/pages` that extends `BasePage`.

**Rules:**
- POMs own **locators** (as `readonly` properties) and **actions** (navigate, fill, click)
- POMs do **not** contain assertions — tests do
- Tests access locators directly: `expect(loginPage.logoutLink).toBeVisible()`

### Fixtures (`fixtures/pages.fixture.ts`)

The custom fixture extends Playwright's base `test` with:

| Fixture | Type | Description |
|---|---|---|
| `loginPage` | `LoginPage` | Login POM backed by the stealth page |
| `credentials` | `Credentials` | Email + password from env vars |
| `stealthContext` | `BrowserContext` | Stealth browser context — loads storageState from project config by default, or uses `stealthStorageState` override |
| `stealthPage` | `Page` | Page from the stealth context |

The fixture reads `storageState` from `testInfo.project.use.storageState` — whatever is set in `playwright.config.ts` — so authenticated suites need no extra configuration.

---

## Extending the Framework

### Adding a New Page Object

1. Create `pages/MyPage.ts` extending `BasePage`:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  readonly someButton: Locator;
  readonly someInput: Locator;

  constructor(page: Page) {
    super(page);
    this.someButton = page.getByRole('button', { name: 'Submit' });
    this.someInput  = page.getByLabel('Email');
  }

  async navigate(): Promise<void> {
    await this.goto('/my-page');
    await this.waitForPageLoad();
  }

  async fillAndSubmit(value: string): Promise<void> {
    await this.someInput.fill(value);
    await this.someButton.click();
    await this.waitForPageLoad();
  }
}
```

2. Add it to the fixture in `fixtures/pages.fixture.ts`:

```typescript
import { MyPage } from '../pages/MyPage';

// Add to PageFixtures type
type PageFixtures = {
  loginPage: LoginPage;
  myPage: MyPage;       // ← add
  credentials: Credentials;
};

// Add fixture implementation
myPage: async ({ stealthPage }, use) => {
  await use(new MyPage(stealthPage));
},
```

---

### Adding a New Test Suite

Create `tests/e2e/my-feature.spec.ts`:

```typescript
import { test, expect } from '../../fixtures/pages.fixture';

// Authenticated by default — storageState loaded from playwright.config.ts
test.describe('My Feature', () => {

  test('should do something', async ({ myPage }) => {
    await myPage.navigate();
    await expect(myPage.someButton).toBeVisible();
  });

});
```

---

### Writing an Unauthenticated Test

Use `test.use({ storageState: { cookies: [], origins: [] } })` at the top of your describe block. This tells the fixture to launch a clean browser context with no session loaded:

```typescript
import { test, expect } from '../../fixtures/pages.fixture';

test.describe('Login Workflow', () => {

  // Empty object = clean context, no session loaded — unauthenticated
  test.use({ stealthStorageState: { cookies: [], origins: [] } });

  test('should login successfully', async ({ loginPage, credentials }) => {
    await loginPage.navigate();
    await loginPage.login(credentials.email, credentials.password);
    await expect(loginPage.page).toHaveURL('/');
    await expect(loginPage.logoutLink.or(loginPage.myAccountLink).first()).toBeVisible();
  });

});
```

> Stealth is still fully applied in unauthenticated suites — bot detection is bypassed regardless of auth state.
>
> ⚠️ Note: `test.use({ storageState: ... })` (Playwright's built-in option) does **not** work here because the stealth fixture manages its own browser context. Always use `stealthStorageState` instead.

---

## Using playwright-cli to Capture Snapshots

`playwright-cli` is used to inspect live pages and generate locators for new Page Object Models. It opens a real headed browser, lets you navigate manually (bypassing bot detection), and takes a structured snapshot of the page's accessibility tree.

### Workflow

**Step 1 — Open the page you want to inspect**

```bash
npx playwright-cli open --headed https://demo.nopcommerce.com/your-page
```

**Step 2 — Navigate and log in manually if needed**

Once the browser opens, interact with the page as a real user — log in, navigate to the target page, etc.

**Step 3 — Take a snapshot from a second terminal**

```bash
npx playwright-cli snapshot
```

This outputs the full accessibility tree of the current page — every element, role, label, and ref. Paste it into Claude to generate a Page Object Model with accurate locators.

**Step 4 — Build the POM from the snapshot**

Use the snapshot output to identify the correct `getByRole` / `getByLabel` selectors for your page. See [Adding a New Page Object](#adding-a-new-page-object) for the POM structure to follow.

### Things to watch for in snapshots

- **Duplicate element names** — the same link text (e.g. "My account") can appear in both the header and footer. Always scope locators to the correct region using `page.getByRole('banner')` or `page.getByRole('contentinfo')`.
- **Dynamic refs** (e.g. `ref=e13`) — these are snapshot-specific and change between sessions. Never use them as locators — use semantic selectors (`getByRole`, `getByLabel`, `getByText`) instead.

### Snapshot files are gitignored

`playwright-cli` saves snapshots and console logs to `.playwright-cli/` in your project root. These files are gitignored — do not commit them. They go stale as the UI changes and expose internal page structure.