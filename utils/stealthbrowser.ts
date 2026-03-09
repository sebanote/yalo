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
stealthWebkit.enabledEvasions.delete('disable-blink-features');
webkit.use(stealthWebkit);

// Chromium-only flags — do NOT pass to Firefox or WebKit
export const CHROMIUM_LAUNCH_ARGS = [
  '--disable-blink-features=AutomationControlled',
  '--no-sandbox',
  '--disable-setuid-sandbox',
];

// Firefox and WebKit reject Chromium-specific flags
export const FIREFOX_LAUNCH_ARGS: string[] = [];
export const WEBKIT_LAUNCH_ARGS: string[] = [];

export const LAUNCH_ARGS_FOR_BROWSER: Record<string, string[]> = {
  chromium: CHROMIUM_LAUNCH_ARGS,
  firefox:  FIREFOX_LAUNCH_ARGS,
  webkit:   WEBKIT_LAUNCH_ARGS,
};

/** @deprecated Use LAUNCH_ARGS_FOR_BROWSER instead */
export const STEALTH_LAUNCH_ARGS = CHROMIUM_LAUNCH_ARGS;

export { chromium, firefox, webkit };