import type { Page } from "playwright";
import { readBrowserScript } from "./browser-scripts.ts";

export type RenderedAssetSource = "rendered-img" | "rendered-picture" | "computed-background";

export type RenderedAssetCapture = {
  imageUrl: string;
  currentSrc?: string | null;
  src?: string | null;
  srcset?: string | null;
  alt?: string | null;
  naturalWidth?: number | null;
  naturalHeight?: number | null;
  renderedWidth?: number | null;
  renderedHeight?: number | null;
  x?: number | null;
  y?: number | null;
  viewportWidth?: number;
  viewportHeight?: number;
  isVisible: boolean;
  isAboveFold?: boolean;
  elementTag?: string;
  selectorHint?: string;
  nearbyText: string[];
  nearbyHeadings: string[];
  linkedHref?: string | null;
  source: RenderedAssetSource;
  domOrder?: number;
};

export type ViewportType = "desktop" | "mobile";

type BrowserAssetRow = {
  imageUrl: string;
  currentSrc?: string | null;
  src?: string | null;
  srcset?: string | null;
  alt?: string | null;
  naturalWidth?: number | null;
  naturalHeight?: number | null;
  renderedWidth?: number | null;
  renderedHeight?: number | null;
  x?: number | null;
  y?: number | null;
  isVisible?: boolean;
  isAboveFold?: boolean;
  elementTag?: string;
  selectorHint?: string;
  nearbyText?: string[];
  nearbyHeadings?: string[];
  linkedHref?: string | null;
  source?: string;
  domOrder?: number;
};

type BrowserExtractResult = {
  viewportWidth?: number;
  viewportHeight?: number;
  assets?: BrowserAssetRow[];
  warnings?: string[];
};

function resolveAgainstBase(value: string, baseUrl: string): string {
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return value;
  }
}

function normalizeSource(value: string | undefined): RenderedAssetSource {
  if (value === "rendered-picture" || value === "computed-background") {
    return value;
  }
  return "rendered-img";
}

function mapBrowserAsset(
  asset: BrowserAssetRow,
  baseUrl: string,
  viewport: { width?: number; height?: number },
): RenderedAssetCapture {
  let linkedHref: string | null = null;
  if (asset.linkedHref) {
    linkedHref = resolveAgainstBase(asset.linkedHref, baseUrl);
  }

  return {
    imageUrl: resolveAgainstBase(asset.imageUrl, baseUrl),
    currentSrc: asset.currentSrc
      ? resolveAgainstBase(asset.currentSrc, baseUrl)
      : null,
    src: asset.src ? resolveAgainstBase(asset.src, baseUrl) : null,
    srcset: asset.srcset ?? null,
    alt: asset.alt ?? null,
    naturalWidth: asset.naturalWidth ?? null,
    naturalHeight: asset.naturalHeight ?? null,
    renderedWidth: asset.renderedWidth ?? null,
    renderedHeight: asset.renderedHeight ?? null,
    x: asset.x ?? null,
    y: asset.y ?? null,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    isVisible: asset.isVisible !== false,
    isAboveFold: asset.isAboveFold,
    elementTag: asset.elementTag,
    selectorHint: asset.selectorHint,
    nearbyText: asset.nearbyText ?? [],
    nearbyHeadings: asset.nearbyHeadings ?? [],
    linkedHref,
    source: normalizeSource(asset.source),
    domOrder: asset.domOrder,
  };
}

/**
 * Extract image candidates from the live DOM (desktop page) after lazy-load prep.
 * Never throws — returns [] on failure so audit can continue.
 */
export async function extractRenderedAssets(
  page: Page,
  options: { baseUrl: string; viewportType?: ViewportType },
): Promise<RenderedAssetCapture[]> {
  const viewportType = options.viewportType ?? "desktop";

  try {
    const script = (await readBrowserScript("extract-rendered-assets.js")).trim();
    const raw = (await page.evaluate(script)) as BrowserExtractResult | null;

    if (!raw || !Array.isArray(raw.assets)) {
      console.warn(
        "[site-audit] Rendered asset extraction returned no data (invalid shape).",
      );
      return [];
    }

    if (raw.warnings && raw.warnings.length > 0) {
      for (const warning of raw.warnings) {
        console.warn(`[site-audit] Rendered asset warning: ${warning}`);
      }
    }

    const captures = raw.assets.map((asset) =>
      mapBrowserAsset(asset, options.baseUrl, {
        width: raw.viewportWidth,
        height: raw.viewportHeight,
      }),
    );

    if (captures.length > 0) {
      console.log(
        `[site-audit] Rendered assets (${viewportType}): ${captures.length} candidate(s)`,
      );
    }

    return captures;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[site-audit] Rendered asset extraction failed (${message}).`);
    return [];
  }
}
