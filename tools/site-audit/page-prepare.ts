import type { Page, Response } from "playwright";
import {
  IMAGE_LOAD_TIMEOUT_MS,
  NAV_TIMEOUT_MS,
  NETWORK_IDLE_TIMEOUT_MS,
  POST_SCROLL_WAIT_MS,
  TOP_SCROLL_SETTLE_MS,
} from "./audit-config.ts";
import { readBrowserScript } from "./browser-scripts.ts";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function gotoAndWaitForNetworkIdle(
  page: Page,
  url: string,
  contextLabel: string,
): Promise<Response | null> {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: NAV_TIMEOUT_MS,
  });

  try {
    await page.waitForLoadState("networkidle", { timeout: NETWORK_IDLE_TIMEOUT_MS });
  } catch {
    console.warn(
      `[site-audit] ${contextLabel}: networkidle not reached within ${NETWORK_IDLE_TIMEOUT_MS}ms, continuing.`,
    );
  }

  return response;
}

export async function scrollPageGradually(page: Page): Promise<void> {
  const script = await readBrowserScript("scroll-page.js");
  await page.evaluate(script);
}

export async function waitForPrimaryImages(page: Page, contextLabel: string): Promise<void> {
  const script = await readBrowserScript("wait-for-images.js");

  try {
    await page.waitForFunction(script, { timeout: IMAGE_LOAD_TIMEOUT_MS });
  } catch {
    console.warn(
      `[site-audit] ${contextLabel}: image load wait timed out after ${IMAGE_LOAD_TIMEOUT_MS}ms, continuing.`,
    );
  }
}

export async function scrollToTop(page: Page): Promise<void> {
  const script = await readBrowserScript("scroll-to-top.js");
  await page.evaluate(script);
  await sleep(TOP_SCROLL_SETTLE_MS);
}

export async function prepareViewportForCapture(
  page: Page,
  url: string,
  contextLabel: string,
): Promise<Response | null> {
  const response = await gotoAndWaitForNetworkIdle(page, url, contextLabel);
  await scrollPageGradually(page);
  await sleep(POST_SCROLL_WAIT_MS);
  await waitForPrimaryImages(page, contextLabel);
  await scrollToTop(page);
  return response;
}
