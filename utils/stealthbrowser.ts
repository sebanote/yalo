import { chromium, firefox, webkit } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// ── Chromium: full stealth with userAgent shim ───────────────────────────────
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

// ── Firefox: stealth without evasions that require Chromium APIs ──────────────
// - user-agent-override: calls browser().userAgent() which returns null on Firefox
// - disable-blink-features: injects --disable-blink-features=AutomationControlled
//   which is a Chromium-only flag — Firefox ignores it but it's cleaner to remove it
const stealthFirefox = StealthPlugin();
stealthFirefox.enabledEvasions.delete('defaultArgs');
stealthFirefox.enabledEvasions.delete('chrome.app');
stealthFirefox.enabledEvasions.delete('chrome.csi');
stealthFirefox.enabledEvasions.delete('chrome.loadTimes');
stealthFirefox.enabledEvasions.delete('chrome.runtime');
stealthFirefox.enabledEvasions.delete('user-agent-override');
stealthFirefox.enabledEvasions.delete('webgl.vendor');
stealthFirefox.enabledEvasions.delete('media.codecs');
firefox.use(stealthFirefox);

// ── WebKit: stealth with only JS-level evasions ──────────────────────────────
// playwright-extra injects --disable-blink-features=AutomationControlled at the
// launcher level independently of the stealth plugin evasions system. WebKit
// actively rejects this flag and crashes. We intercept it by hooking into the
// webkit launcher and stripping the offending flag before launch.
const stealthWebkit = StealthPlugin();
stealthWebkit.enabledEvasions.delete('defaultArgs');
stealthWebkit.enabledEvasions.delete('chrome.app');
stealthWebkit.enabledEvasions.delete('chrome.csi');
stealthWebkit.enabledEvasions.delete('chrome.loadTimes');
stealthWebkit.enabledEvasions.delete('chrome.runtime');
stealthWebkit.enabledEvasions.delete('user-agent-override');
stealthWebkit.enabledEvasions.delete('webgl.vendor');
stealthWebkit.enabledEvasions.delete('media.codecs');
webkit.use(stealthWebkit);

// Strip Chromium-only flags that playwright-extra injects at the launcher level.
// This hook runs after all plugins have applied their args, giving us a clean
// opportunity to remove flags that WebKit rejects before the browser is launched.
const originalWebkitLaunch = webkit.launch.bind(webkit);
(webkit as any).launch = (options: any = {}) => {
  const filteredArgs = (options.args ?? []).filter(
    (arg: string) => !arg.startsWith('--disable-blink-features')
  );
  return originalWebkitLaunch({ ...options, args: filteredArgs });
};

// ── Launch args ───────────────────────────────────────────────────────────────
// Chromium-only flags — do NOT pass to Firefox or WebKit
export const CHROMIUM_LAUNCH_ARGS = [
  '--disable-blink-features=AutomationControlled',
  '--no-sandbox',
  '--disable-setuid-sandbox',
];

// Firefox and WebKit reject Chromium-specific flags
export const FIREFOX_LAUNCH_ARGS: string[] = [];
export const WEBKIT_LAUNCH_ARGS: string[]  = [];

export const LAUNCH_ARGS_FOR_BROWSER: Record<string, string[]> = {
  chromium: CHROMIUM_LAUNCH_ARGS,
  firefox:  FIREFOX_LAUNCH_ARGS,
  webkit:   WEBKIT_LAUNCH_ARGS,
};

/** @deprecated Use LAUNCH_ARGS_FOR_BROWSER instead */
export const STEALTH_LAUNCH_ARGS = CHROMIUM_LAUNCH_ARGS;

export { chromium, firefox, webkit };