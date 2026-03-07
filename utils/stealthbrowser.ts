import { chromium, firefox, webkit } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// ── Chromium: full stealth with userAgent shim ───────────────────────────────
// user-agent-override calls page.browser().userAgent() — a Puppeteer API.
// In Playwright, browser() returns null on Firefox/WebKit but works on Chromium.
// We shim the missing method for Chromium so the evasion runs correctly.
const stealthChromium = StealthPlugin();
const originalOnPageCreated = stealthChromium.onPageCreated?.bind(stealthChromium);
stealthChromium.onPageCreated = async (page: any) => {
  try {
    const browser = page.context().browser();
    if (browser && !browser.userAgent) {
      browser.userAgent = async () => page.evaluate(() => navigator.userAgent);
    }
  } catch (_) {}

  if (originalOnPageCreated) {
    await originalOnPageCreated(page);
  }
};
chromium.use(stealthChromium);

// ── Firefox / WebKit: stealth without user-agent-override ────────────────────
// browser() returns null on these engines so the shim can't work.
// user-agent-override is removed — Firefox and WebKit have distinct enough
// fingerprints that they pass Cloudflare without it anyway.
const stealthFirefox = StealthPlugin();
stealthFirefox.enabledEvasions.delete('user-agent-override');
firefox.use(stealthFirefox);

const stealthWebkit = StealthPlugin();
stealthWebkit.enabledEvasions.delete('user-agent-override');
webkit.use(stealthWebkit);

export const STEALTH_LAUNCH_ARGS = [
  '--disable-blink-features=AutomationControlled',
  '--no-sandbox',
  '--disable-setuid-sandbox',
];

export { chromium, firefox, webkit };