import fs from "node:fs/promises";
import path from "node:path";
import { buildPageAssetCandidates } from "./asset-inference.ts";
import type {
  AssetCandidate,
  AssetMap,
  InferredRole,
  RenderedEventBlock,
} from "./asset-map-types.ts";
import {
  applyEventImageMatching,
  isReportableEventMatch,
} from "./event-image-matching.ts";
import { enrichAuditPages, OUTPUT_DIR } from "./page-analysis.ts";
import type { AuditResult, AuditSuccess } from "./audit-site-types.ts";

const ALL_ROLES: InferredRole[] = [
  "hero",
  "profile-photo",
  "schedule-flyer",
  "album-jacket",
  "discography-cover",
  "logo",
  "sns-icon",
  "decorative",
  "content-image",
  "unknown",
];

function markdownEscapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function truncateUrl(url: string, max = 72): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 3)}...`;
}

function countByRole(candidates: AssetCandidate[]): Record<InferredRole, number> {
  const counts = Object.fromEntries(ALL_ROLES.map((role) => [role, 0])) as Record<
    InferredRole,
    number
  >;
  for (const candidate of candidates) {
    counts[candidate.inferredRole] += 1;
  }
  return counts;
}

function formatRendered(candidate: AssetCandidate): string {
  const r = candidate.rendered;
  if (!r) return "—";
  const size =
    r.renderedWidth != null && r.renderedHeight != null
      ? `${r.renderedWidth}×${r.renderedHeight}`
      : "—";
  const pos =
    r.x != null && r.y != null ? ` at x=${r.x},y=${r.y}` : "";
  const fold = r.isAboveFold ? " above-fold" : "";
  return `${size}${pos}${fold}`;
}

function formatSources(candidate: AssetCandidate): string {
  if (!candidate.sources || candidate.sources.length === 0) return "—";
  return candidate.sources.join(", ");
}

function formatAssetTableRow(candidate: AssetCandidate): string {
  const size =
    candidate.width && candidate.height
      ? `${candidate.width}×${candidate.height}`
      : "—";
  const notes = candidate.notes.join(" ") || "—";
  return `| ${candidate.inferredRole} | ${candidate.confidence} | ${markdownEscapeCell(candidate.relatedContentLabel ?? "—")} | \`${truncateUrl(candidate.imageUrl)}\` | ${markdownEscapeCell(candidate.alt ?? "—")} | ${size} | ${formatRendered(candidate)} | ${formatSources(candidate)} | ${markdownEscapeCell(notes)} |`;
}

function buildHighConfidenceSection(candidates: AssetCandidate[]): string[] {
  const rows = candidates.filter(
    (item) =>
      item.confidence === "high" &&
      item.inferredRole !== "sns-icon" &&
      item.inferredRole !== "decorative",
  );

  if (rows.length === 0) {
    return ["_None identified at high confidence._", ""];
  }

  return [
    "| Page | Role | Related content | Image |",
    "|---|---|---|---|",
    ...rows.map(
      (item) =>
        `| ${markdownEscapeCell(item.pageRoute)} | ${item.inferredRole} | ${markdownEscapeCell(item.relatedContentLabel ?? "—")} | \`${truncateUrl(item.imageUrl)}\` |`,
    ),
    "",
  ];
}

function formatEventMatchNotes(image: AssetCandidate): string {
  const warnings = image.eventMatch?.warnings ?? [];
  const conflict = warnings.filter((w) => w.startsWith("alt-date"));
  if (conflict.length > 0) {
    return markdownEscapeCell(
      `alt-date-conflict: ${conflict.filter((w) => w !== "alt-date-conflict").join(", ")}`,
    );
  }
  return markdownEscapeCell(image.notes[0] ?? image.eventMatch?.matchedText?.[0] ?? "—");
}

function buildRenderedEventBlocksSection(blocks: RenderedEventBlock[]): string[] {
  if (blocks.length === 0) {
    return ["_No rendered event blocks detected._", ""];
  }

  return [
    "| Page | Event | Venue | Position | Signals |",
    "|---|---|---|---|---|",
    ...blocks.map((block) => {
      const eventLabel = [block.eventDate, block.eventDateLabel, block.eventTitle]
        .filter(Boolean)
        .join(" / ");
      const position = `y=${block.y ?? "—"} h=${block.height ?? "—"}`;
      return `| ${markdownEscapeCell(block.pageRoute)} | ${markdownEscapeCell(eventLabel || "—")} | ${markdownEscapeCell(block.venue ?? "—")} | ${position} | ${markdownEscapeCell(block.signals.join(", "))} |`;
    }),
    "",
  ];
}

function buildEventImageMatchingSummary(assetMap: AssetMap): string[] {
  const rows: string[] = [];

  for (const page of assetMap.pages) {
    for (const image of page.images) {
      if (!isReportableEventMatch(image)) continue;
      const eventLabel = [
        image.eventMatch!.eventDate ?? image.eventMatch!.eventDateLabel,
        image.eventMatch!.eventTitle,
      ]
        .filter(Boolean)
        .join(" / ");
      rows.push(
        `| ${markdownEscapeCell(page.route)} | ${markdownEscapeCell(eventLabel || "—")} | \`${truncateUrl(image.imageUrl)}\` | ${image.eventMatch!.matchMethod} | ${image.eventMatch!.matchConfidence} | ${formatEventMatchNotes(image)} |`,
      );
    }

    for (const cross of page.scheduleCrossPageCandidates ?? []) {
      rows.push(
        `| ${markdownEscapeCell(page.route)} | ${markdownEscapeCell(cross.eventLabel)} | \`${truncateUrl(cross.sourceImageUrl)}\` | ${cross.matchMethod} | ${cross.confidence} | ${markdownEscapeCell(cross.note)} |`,
      );
    }
  }

  if (rows.length === 0) {
    return ["_No event-image matches recorded._", ""];
  }

  return [
    "| Page | Event | Matched Image | Match Method | Confidence | Notes |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
  ];
}

function buildNoPhotoPlaceholderSection(candidates: AssetCandidate[]): string[] {
  const rows = candidates.filter(
    (item) =>
      item.warnings?.includes("no-photo-placeholder") ||
      isNoPhotoCandidate(item),
  );

  if (rows.length === 0) {
    return ["_None detected._", ""];
  }

  return [
    "| Page | Related Event | Image | Notes |",
    "|---|---|---|---|",
    ...rows.map((item) => {
      const eventLabel =
        item.eventMatch?.eventDateLabel ??
        item.relatedContentLabel ??
        "—";
      return `| ${markdownEscapeCell(item.pageRoute)} | ${markdownEscapeCell(eventLabel)} | \`${truncateUrl(item.imageUrl)}\` | Do not treat as flyer |`;
    }),
    "",
  ];
}

function isNoPhotoCandidate(item: AssetCandidate): boolean {
  const blob = `${item.alt ?? ""} ${item.imageUrl}`.toLowerCase();
  return /no\s*photo|no%20photo|placeholder|写真なし/.test(blob);
}

function buildLowConfidenceSection(candidates: AssetCandidate[]): string[] {
  const rows = candidates.filter(
    (item) =>
      item.confidence === "low" ||
      item.inferredRole === "unknown" ||
      (item.inferredRole === "schedule-flyer" && item.confidence !== "high"),
  );

  if (rows.length === 0) {
    return ["_None flagged._", ""];
  }

  return [
    "| Page | Role | Confidence | Related content | Notes |",
    "|---|---|---|---|---|",
    ...rows.map(
      (item) =>
        `| ${markdownEscapeCell(item.pageRoute)} | ${item.inferredRole} | ${item.confidence} | ${markdownEscapeCell(item.relatedContentLabel ?? "—")} | ${markdownEscapeCell(item.notes.join(" "))} |`,
    ),
    "",
  ];
}

async function readPageHtml(slug: string): Promise<string> {
  try {
    return await fs.readFile(path.join(OUTPUT_DIR, "html", `${slug}.html`), "utf8");
  } catch {
    return "";
  }
}

export async function buildAssetMap(results: AuditResult[], generatedAt: string): Promise<AssetMap> {
  const successes = results.filter((result): result is AuditSuccess => result.ok);
  const pages = await enrichAuditPages(results);
  const assetPages = [];

  for (const page of pages) {
    const html = await readPageHtml(page.slug);
    const images = buildPageAssetCandidates({
      pageType: page.pageType,
      pageUrl: page.metadata.finalUrl || page.url,
      pageRoute: page.route,
      metadata: page.metadata,
      textSample: page.textSample,
      html,
      renderedAssets: page.metadata.renderedAssets ?? [],
    });

    const includeEventBlocks =
      page.pageType === "Home" || page.pageType === "Schedule Month";

    assetPages.push({
      sourceUrl: page.url,
      route: page.route,
      pageType: page.pageLabel,
      images,
      renderedEventBlocks: includeEventBlocks
        ? (page.metadata.renderedEventBlocks ?? [])
        : undefined,
    });
  }

  const totalImages = assetPages.reduce((sum, page) => sum + page.images.length, 0);
  const totalRenderedCaptures = successes.reduce(
    (sum, result) => sum + (result.metadata.renderedAssets?.length ?? 0),
    0,
  );
  const allCandidates = assetPages.flatMap((page) => page.images);
  const renderedOnlyImages = allCandidates.filter(
    (item) =>
      item.sources?.some((tag) =>
        ["rendered-img", "rendered-picture", "computed-background"].includes(tag),
      ) &&
      !item.sources.includes("json-image") &&
      !item.sources.includes("html-img"),
  ).length;

  const baseMap: AssetMap = {
    generatedAt,
    totalPages: assetPages.length,
    totalImages,
    totalRenderedCaptures,
    renderedOnlyImages,
    pages: assetPages,
  };

  return applyEventImageMatching(baseMap, pages);
}


export async function writeAssetMap(results: AuditResult[], capturedAt: string): Promise<AssetMap> {
  const assetMap = await buildAssetMap(results, capturedAt);
  const jsonPath = path.join(OUTPUT_DIR, "asset-map.json");
  const mdPath = path.join(OUTPUT_DIR, "asset-map.md");

  await fs.writeFile(jsonPath, `${JSON.stringify(assetMap, null, 2)}\n`, "utf8");
  await fs.writeFile(mdPath, `${buildAssetMapMarkdown(assetMap)}\n`, "utf8");

  const p1AppendixPath = path.join(OUTPUT_DIR, "prototype-comparison-p1-appendix.md");
  await fs.appendFile(
    p1AppendixPath,
    `\n### P1.1 Follow-up: Rendered event block matching\n\nGoal:\nUse on-screen event block positions to override misleading image filenames or alt text.\n\nExpected effect:\n3月25日 → Good Swing Jazz Band image\n3月27日 → Golden PODs image\n3月31日 → NO PHOTO placeholder\n`,
    "utf8",
  ).catch(() => undefined);

  return assetMap;
}

function buildAssetMapMarkdown(assetMap: AssetMap): string {
  const allCandidates = assetMap.pages.flatMap((page) => page.images);
  const roleCounts = countByRole(allCandidates);

  const lines: string[] = [
    "# Asset Map",
    "",
    "Generated from site-audit output.",
    "",
    "## 1. Summary",
    "",
    `- Generated at: ${assetMap.generatedAt}`,
    `- Total pages: ${assetMap.totalPages}`,
    `- Total images: ${assetMap.totalImages}`,
    "- Role counts:",
  ];

  for (const role of ALL_ROLES) {
    lines.push(`  - ${role}: ${roleCounts[role]}`);
  }

  if (assetMap.totalRenderedCaptures != null) {
    lines.push(`- Rendered DOM captures (desktop): ${assetMap.totalRenderedCaptures}`);
  }
  if (assetMap.renderedOnlyImages != null) {
    lines.push(`- Images found only via rendered DOM: ${assetMap.renderedOnlyImages}`);
  }

  lines.push(
    "",
    "## Rendered Asset Capture Notes",
    "",
    "- Rendered assets were extracted after page scroll/lazy-load preparation.",
    "- `img.currentSrc`, natural size, rendered size, and position were captured where available.",
    "- Use rendered asset data to reduce placeholders when rebuilding.",
    "- If an image appears in screenshots but not in asset-map, manual review may still be required.",
    "",
    "## 2. Page Assets",
    "",
  );

  for (const page of assetMap.pages) {
    lines.push(`### ${page.route}`, "");
    lines.push(`Page type: ${page.pageType}`, "");

    const scheduleFlyers = page.images.filter((img) => img.inferredRole === "schedule-flyer");
    if (page.pageType.includes("Schedule Month") && scheduleFlyers.length === 0) {
      lines.push(
        "_Note: No schedule-flyer `<img>` captured on this month page. Event text may exist without paired flyer URLs in saved HTML (common on Wix). Check Home weekly schedule, `asset-map.json` on `/`, and screenshots._",
        "",
      );
    }

    if (page.images.length === 0) {
      lines.push("_No images detected on this page._", "");
      continue;
    }
    lines.push(
      "| Role | Confidence | Related content | Image | Alt | Size | Rendered | Source | Notes |",
      "|---|---|---|---|---|---|---|---|---|",
      ...page.images.map(formatAssetTableRow),
      "",
    );
  }

  lines.push(
    "## 3. Rendered Event Blocks",
    "",
    "_Live schedule event blocks detected from rendered DOM (Home / Schedule Month)._",
    "",
    ...buildRenderedEventBlocksSection(assetMap.renderedEventBlocks ?? []),
  );

  if (assetMap.eventImageMatching) {
    const e = assetMap.eventImageMatching;
    const skipReasonLines = Object.entries(e.eventMatchSkippedReasons ?? {})
      .filter(([, count]) => (count ?? 0) > 0)
      .map(([reason, count]) => `  - ${reason}: ${count}`);
    lines.push(
      "## 4. Event Image Matching Summary",
      "",
      `- eventMatchCandidates: ${e.eventMatchCandidates}`,
      `- eventMatchAccepted: ${e.eventMatchAccepted}`,
      `- eventMatchSkipped: ${e.eventMatchSkipped}`,
      "- eventMatchSkippedReasons:",
      ...(skipReasonLines.length > 0 ? skipReasonLines : ["  - _none_"]),
      `- renderedEventBlocks: ${e.renderedEventBlocks ?? 0}`,
      `- renderedEventMatches: ${e.renderedEventMatches ?? 0}`,
      `- altDateConflicts: ${e.altDateConflicts ?? 0}`,
      `- noPhotoEventMatches: ${e.noPhotoEventMatches ?? 0}`,
      `- Cross-page candidates: ${e.crossPageMatchCount}`,
      `- NO PHOTO / placeholder assets: ${e.noPhotoPlaceholderCount}`,
      "",
      "_Prefer `rendered-event-block` / `rendered-order` over `alt-text-date` when they conflict._",
      "",
      ...buildEventImageMatchingSummary(assetMap),
      "## 5. No Photo / Placeholder Assets",
      "",
      ...buildNoPhotoPlaceholderSection(allCandidates),
    );
  }

  lines.push(
    "## 6. High Confidence Assets",
    "",
    ...buildHighConfidenceSection(allCandidates),
    "## 7. Low Confidence / Needs Review",
    "",
    ...buildLowConfidenceSection(allCandidates),
    "## 8. Rebuild Guidance",
    "",
    "- Use this asset map to reduce image placeholders.",
    "- Use `renderedEventBlocks` and **accepted** `eventMatch` entries for schedule flyer placement.",
    "- When `alt-date-conflict` appears in `eventMatch.warnings`, follow rendered event block dates over filename/alt hints.",
    "- Use only **accepted** `eventMatch` entries (`eventMatchAccepted` in asset-map) for placing schedule flyer images.",
    "- Do not use SNS icons, logos, decorative images, or nav/footer images as event flyers.",
    "- If `matchConfidence` is medium/high on an accepted schedule-flyer match, avoid unrelated placeholders.",
    "- If an asset has `no-photo-placeholder` in `warnings` or `eventMatch.warnings`, treat it as missing flyer state, not as a real flyer.",
    "- `crossPageMatches` / `scheduleCrossPageCandidates` can be used as candidates, but mark for review unless confidence is high.",
    "- Match schedule flyer images to nearby event dates when confidence is medium/high.",
    "- Match discography images to nearby album titles when confidence is medium/high.",
    "- Do not assume all images are reusable without owner permission.",
    "- For low-confidence images, use placeholder or ask for confirmation.",
    "- Use screenshots to verify visual placement.",
    "- See `asset-map.json` for machine-readable image-to-content mapping.",
    "- Wix sites may omit event flyers from saved HTML; cross-check Home weekly schedule, rendered assets, and screenshots.",
    "- Prefer `rendered-img` / `rendered-picture` sources when matching flyers and jackets to layout.",
    "",
  );

  return lines.join("\n");
}

export function summarizeAssetMap(assetMap: AssetMap): void {
  const all = assetMap.pages.flatMap((p) => p.images);
  const counts = countByRole(all);
  console.log(`[site-audit] Asset map: ${assetMap.totalImages} image(s) across ${assetMap.totalPages} page(s)`);
  if (assetMap.totalRenderedCaptures != null) {
    console.log(`[site-audit] Rendered captures: ${assetMap.totalRenderedCaptures}`);
  }
  if (assetMap.renderedOnlyImages != null && assetMap.renderedOnlyImages > 0) {
    console.log(`[site-audit] Rendered-only images: ${assetMap.renderedOnlyImages}`);
  }
  console.log(
    `[site-audit] Roles: hero=${counts.hero}, profile=${counts["profile-photo"]}, schedule-flyer=${counts["schedule-flyer"]}, album=${counts["album-jacket"]}, discography=${counts["discography-cover"]}, sns=${counts["sns-icon"]}`,
  );
  if (assetMap.eventImageMatching) {
    const e = assetMap.eventImageMatching;
    console.log(
      `[site-audit] Event-image matching: candidates=${e.eventMatchCandidates}, accepted=${e.eventMatchAccepted}, skipped=${e.eventMatchSkipped}, rendered-blocks=${e.renderedEventBlocks ?? 0}, rendered-matches=${e.renderedEventMatches ?? 0}, alt-conflicts=${e.altDateConflicts ?? 0}, cross-page=${e.crossPageMatchCount}, no-photo=${e.noPhotoPlaceholderCount}`,
    );
  }
}
