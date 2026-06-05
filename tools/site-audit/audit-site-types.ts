import type { RenderedEventBlock } from "./asset-map-types.ts";
import type { RenderedAssetCapture } from "./rendered-assets.ts";

export type PageMetadata = {
  title: string;
  metaDescription: string | null;
  h1: string[];
  h2: string[];
  h3: string[];
  images: Array<{
    src: string;
    alt: string;
    width: number | null;
    height: number | null;
  }>;
  /** Images captured from live DOM after scroll/lazy-load (desktop viewport). */
  renderedAssets?: RenderedAssetCapture[];
  /** Live schedule event blocks with rendered positions (Home / Schedule Month). */
  renderedEventBlocks?: RenderedEventBlock[];
  links: Array<{ href: string; text: string }>;
  iframes: Array<{ src: string; title: string }>;
  scripts: Array<{ src: string }>;
};

export type AuditMetadata = PageMetadata & {
  url: string;
  finalUrl: string;
  /** Union of detectedEmbeds + detectedExternalLinks (backward compatible). */
  possibleEmbeds: string[];
  detectedEmbeds: string[];
  detectedExternalLinks: string[];
  capturedAt: string;
};

export type AuditSuccess = {
  ok: true;
  url: string;
  slug: string;
  metadata: AuditMetadata;
  paths: {
    desktopScreenshot: string;
    mobileScreenshot: string;
    html: string;
    text: string;
    json: string;
  };
};

export type AuditFailure = {
  ok: false;
  url: string;
  slug: string;
  error: string;
};

export type AuditResult = AuditSuccess | AuditFailure;
