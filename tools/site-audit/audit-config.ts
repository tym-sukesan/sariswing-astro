import { devices, type DeviceDescriptor } from "playwright";

/** Tunable capture settings (fixed for now; can be env-driven later). */
export const NAV_TIMEOUT_MS = 60_000;
export const NETWORK_IDLE_TIMEOUT_MS = 20_000;
export const POST_SCROLL_WAIT_MS = 3_000;
export const IMAGE_LOAD_TIMEOUT_MS = 10_000;
export const SCROLL_STEP_DELAY_MS = 250;
export const TOP_SCROLL_SETTLE_MS = 200;

export const DESKTOP_VIEWPORT = { width: 1440, height: 1200 };

/**
 * Playwright `devices` key for mobile screenshots.
 * Uses full device emulation (userAgent, isMobile, hasTouch, deviceScaleFactor, viewport).
 */
export const MOBILE_DEVICE_NAME = "iPhone SE";

/** Fallback when MOBILE_DEVICE_NAME is missing from the installed Playwright version. */
export const MOBILE_DEVICE_FALLBACK: DeviceDescriptor = {
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  viewport: { width: 375, height: 667 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
};

export function getMobileDeviceOptions(): DeviceDescriptor {
  const device = devices[MOBILE_DEVICE_NAME];
  if (device) {
    return device;
  }

  console.warn(
    `[site-audit] Playwright device "${MOBILE_DEVICE_NAME}" not found; using explicit mobile fallback.`,
  );
  return MOBILE_DEVICE_FALLBACK;
}
