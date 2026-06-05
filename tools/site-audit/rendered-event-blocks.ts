import type { Page } from "playwright";
import {
  normalizeEventDate,
  parseYearMonthFromRoute,
} from "./asset-context.ts";
import type { Confidence, RenderedEventBlock } from "./asset-map-types.ts";
import { readBrowserScript } from "./browser-scripts.ts";

type BrowserEventBlockRow = {
  eventDateLabel?: string;
  eventTitle?: string;
  venue?: string;
  text?: string;
  headings?: string[];
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  sectionHint?: string | null;
  selectorHint?: string | null;
  confidence?: string;
  signals?: string[];
  elementTag?: string;
};

type BrowserExtractResult = {
  viewportWidth?: number;
  viewportHeight?: number;
  blocks?: BrowserEventBlockRow[];
  warnings?: string[];
};

const MIN_DEDUP_HEIGHT = 40;
const MIN_DEDUP_WIDTH = 200;
const TEXT_SIMILARITY_THRESHOLD = 0.85;

function normalizeTextKey(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function textSimilarity(a: string, b: string): number {
  const left = normalizeTextKey(a);
  const right = normalizeTextKey(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  if (longer.includes(shorter) && shorter.length / longer.length >= 0.6) {
    return shorter.length / longer.length;
  }
  return 0;
}

function blockCenterY(block: RenderedEventBlock): number {
  return (block.y ?? 0) + (block.height ?? 0) / 2;
}

function isNavFooterBlock(block: RenderedEventBlock): boolean {
  const blob = [
    block.sectionHint ?? "",
    block.selectorHint ?? "",
    block.text,
    ...block.headings,
  ]
    .join(" ")
    .toLowerCase();
  return /\b(?:footer|header|\bnav\b|social|sns|menu|copyright)\b/.test(blob);
}

/**
 * Deduplicate nested Wix wrappers: prefer smallest sufficient block per event date.
 */
export function dedupeRenderedEventBlocks(
  blocks: RenderedEventBlock[],
  viewportHeight = 900,
): RenderedEventBlock[] {
  const maxHeight = Math.max(viewportHeight * 0.92, 900);
  const filtered = blocks.filter((block) => {
    if (isNavFooterBlock(block)) return false;
    const height = block.height ?? 0;
    const width = block.width ?? 0;
    if (height < MIN_DEDUP_HEIGHT || width < MIN_DEDUP_WIDTH) return false;
    if (height >= maxHeight) return false;
    return true;
  });

  const byDateKey = new Map<string, RenderedEventBlock[]>();

  for (const block of filtered) {
    const key =
      block.eventDate ??
      block.eventDateLabel ??
      normalizeTextKey(block.text).slice(0, 80);
    const group = byDateKey.get(key) ?? [];
    group.push(block);
    byDateKey.set(key, group);
  }

  const chosen: RenderedEventBlock[] = [];

  for (const group of byDateKey.values()) {
    const sorted = [...group].sort((a, b) => {
      const heightA = a.height ?? 99999;
      const heightB = b.height ?? 99999;
      if (heightA !== heightB) return heightA - heightB;
      return (a.y ?? 0) - (b.y ?? 0);
    });

    let pick = sorted[0];
    for (const candidate of sorted) {
      const h = candidate.height ?? 0;
      if (h >= MIN_DEDUP_HEIGHT && h <= maxHeight * 0.75) {
        pick = candidate;
        break;
      }
    }
    chosen.push(pick);
  }

  const dedupedText: RenderedEventBlock[] = [];
  for (const block of chosen) {
    const duplicate = dedupedText.find(
      (existing) =>
        (existing.eventDate &&
          block.eventDate &&
          existing.eventDate === block.eventDate) ||
        textSimilarity(existing.text, block.text) >= TEXT_SIMILARITY_THRESHOLD,
    );
    if (!duplicate) dedupedText.push(block);
  }

  return dedupedText.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
}

function mapBrowserBlock(
  row: BrowserEventBlockRow,
  context: {
    pageUrl: string;
    pageRoute: string;
    pageType: string;
  },
): RenderedEventBlock | null {
  const text = (row.text ?? "").trim();
  const eventDateLabel = (row.eventDateLabel ?? "").trim();
  if (!text || !eventDateLabel) return null;

  const routeContext = parseYearMonthFromRoute(context.pageRoute);
  const eventDate =
    normalizeEventDate(eventDateLabel, {
      year: routeContext?.year ?? 2026,
      month: routeContext?.month,
    }) ?? undefined;

  const confidence: Confidence =
    row.confidence === "high" || row.confidence === "low"
      ? row.confidence
      : "medium";

  return {
    pageUrl: context.pageUrl,
    pageRoute: context.pageRoute,
    pageType: context.pageType,
    eventDate,
    eventDateLabel,
    eventTitle: row.eventTitle?.trim() || undefined,
    venue: row.venue?.trim() || undefined,
    text,
    headings: row.headings ?? [],
    x: row.x ?? null,
    y: row.y ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    sectionHint: row.sectionHint ?? undefined,
    selectorHint: row.selectorHint ?? undefined,
    confidence,
    signals: row.signals ?? [],
  };
}

/**
 * Extract live event block candidates from the live DOM (desktop) after lazy-load prep.
 */
export async function extractRenderedEventBlocks(
  page: Page,
  options: {
    pageUrl: string;
    pageRoute: string;
    pageType: string;
  },
): Promise<RenderedEventBlock[]> {
  try {
    const script = (await readBrowserScript("extract-rendered-event-blocks.js")).trim();
    const raw = (await page.evaluate(script)) as BrowserExtractResult | null;

    if (!raw || !Array.isArray(raw.blocks)) {
      console.warn(
        "[site-audit] Rendered event block extraction returned no data (invalid shape).",
      );
      return [];
    }

    if (raw.warnings && raw.warnings.length > 0) {
      for (const warning of raw.warnings) {
        console.warn(`[site-audit] Rendered event block warning: ${warning}`);
      }
    }

    const mapped = raw.blocks
      .map((row) => mapBrowserBlock(row, options))
      .filter((block): block is RenderedEventBlock => block != null);

    const deduped = dedupeRenderedEventBlocks(mapped, raw.viewportHeight ?? 900);

    if (deduped.length > 0) {
      console.log(
        `[site-audit] Rendered event blocks (${options.pageRoute}): ${deduped.length} block(s)`,
      );
    }

    return deduped;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[site-audit] Rendered event block extraction failed (${message}).`);
    return [];
  }
}

export function findNearestEventBlock(
  imageY: number,
  imageHeight: number,
  blocks: RenderedEventBlock[],
  usedBlockKeys: Set<string>,
): { block: RenderedEventBlock; deltaY: number } | null {
  if (blocks.length === 0) return null;

  const imageCenterY = imageY + imageHeight / 2;
  let best: { block: RenderedEventBlock; deltaY: number } | null = null;

  for (const block of blocks) {
    if (block.y == null || block.height == null) continue;
    const key = block.eventDate ?? block.eventDateLabel;
    if (usedBlockKeys.has(key)) continue;

    const deltaY = Math.abs(imageCenterY - blockCenterY(block));
    if (!best || deltaY < best.deltaY) {
      best = { block, deltaY };
    }
  }

  return best;
}

export const RENDERED_EVENT_BLOCK_MAX_DELTA_Y = 450;
