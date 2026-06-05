import fs from "node:fs/promises";
import path from "node:path";
import {
  aggregateClasses,
  aggregateCssClues,
  analyzeHtml,
  capBackgroundImageCandidates,
  partitionCssClues,
  summarizeBackgroundExtraction,
  type AggregatedCssClues,
  type BackgroundImageCandidate,
  type ClassAggregate,
  type PageHtmlAnalysis,
} from "./html-analysis.ts";
import {
  enrichAuditPages,
  OUTPUT_DIR,
  pageShortName,
} from "./page-analysis.ts";
import type { AuditResult } from "./audit-site-types.ts";

function markdownEscapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function formatValueTable(
  rows: Array<{ value: string; count: number }>,
  notes = "From inline/style blocks in audited HTML",
): string[] {
  if (rows.length === 0) return ["| _None detected_ | — | — |"];
  return rows.map(
    (row) =>
      `| ${markdownEscapeCell(row.value)} | ${row.count} | ${notes} |`,
  );
}

function formatTokenTable(
  tokenType: string,
  rows: Array<{ value: string; count: number }>,
  notes = "Top values by frequency",
): string[] {
  if (rows.length === 0) return [];
  return [
    `### ${tokenType}`,
    "",
    "| Value | Count | Notes |",
    "|---|---:|---|",
    ...formatValueTable(rows, notes),
    "",
  ];
}

function buildUsefulVisualSummary(clues: AggregatedCssClues): string[] {
  return [
    "| Token Type | Values | Notes |",
    "|---|---|---|",
    ...clues.colors.slice(0, 8).map(
      (row) =>
        `| color | ${markdownEscapeCell(row.value)} (${row.count}) | text color candidate |`,
    ),
    ...clues.backgroundColors.slice(0, 6).map(
      (row) =>
        `| background-color | ${markdownEscapeCell(row.value)} (${row.count}) | background candidate |`,
    ),
    ...clues.fontFamilies.slice(0, 4).map(
      (row) =>
        `| font-family | ${markdownEscapeCell(row.value)} (${row.count}) | typography candidate |`,
    ),
    ...clues.fontSizes.slice(0, 6).map(
      (row) =>
        `| font-size | ${markdownEscapeCell(row.value)} (${row.count}) | type scale candidate |`,
    ),
    ...clues.maxWidths.slice(0, 6).map(
      (row) =>
        `| max-width | ${markdownEscapeCell(row.value)} (${row.count}) | content width candidate |`,
    ),
    ...clues.spacing.slice(0, 6).map(
      (row) =>
        `| padding/margin | ${markdownEscapeCell(row.value)} (${row.count}) | spacing candidate |`,
    ),
    ...clues.borderRadii.slice(0, 4).map(
      (row) =>
        `| border-radius | ${markdownEscapeCell(row.value)} (${row.count}) | radius candidate |`,
    ),
    "",
  ];
}

function buildDesignTokenSection(clues: AggregatedCssClues): string[] {
  const partitioned = partitionCssClues(clues);

  return [
    "### Useful visual clues",
    "",
    "Prioritized values that are likely helpful when rebuilding (real colors, sizes, fonts).",
    "",
    ...buildUsefulVisualSummary(partitioned.useful),
    "#### Useful visual clues (detailed)",
    "",
    ...formatTokenTable("Colors", partitioned.useful.colors),
    ...formatTokenTable("Background colors", partitioned.useful.backgroundColors),
    ...formatTokenTable("Font families", partitioned.useful.fontFamilies),
    ...formatTokenTable("Font sizes", partitioned.useful.fontSizes),
    ...formatTokenTable("Max widths", partitioned.useful.maxWidths),
    ...formatTokenTable("Padding / margin", partitioned.useful.spacing),
    ...formatTokenTable("Border radius", partitioned.useful.borderRadii),
    "",
    "### Raw / framework token clues",
    "",
    "Wix/CSS variables and internal values (reference only; do not copy into Astro as-is).",
    "",
    ...formatTokenTable("Colors (raw)", partitioned.raw.colors.slice(0, 12)),
    ...formatTokenTable("Background colors (raw)", partitioned.raw.backgroundColors.slice(0, 12)),
    ...formatTokenTable("Font families (raw)", partitioned.raw.fontFamilies.slice(0, 8)),
    ...formatTokenTable("Font sizes (raw)", partitioned.raw.fontSizes.slice(0, 12)),
    ...formatTokenTable("Max widths (raw)", partitioned.raw.maxWidths.slice(0, 10)),
    ...formatTokenTable("Padding / margin (raw)", partitioned.raw.spacing.slice(0, 12)),
  ];
}

function buildLayoutSection(clues: AggregatedCssClues): string[] {
  const flexCount = clues.displays
    .filter((row) => row.value.includes("flex"))
    .reduce((sum, row) => sum + row.count, 0);
  const gridCount = clues.displays
    .filter((row) => row.value.includes("grid"))
    .reduce((sum, row) => sum + row.count, 0);

  return [
    "| Layout Feature | Count / Values | Notes |",
    "|---|---|---|",
    `| display: flex | ${flexCount || "—"} | ${clues.displays.filter((r) => r.value.includes("flex")).map((r) => r.value).join(", ") || "not prominent"} |`,
    `| display: grid | ${gridCount || "—"} | ${clues.displays.filter((r) => r.value.includes("grid")).map((r) => r.value).join(", ") || "not prominent"} |`,
    `| position | ${clues.positions.map((r) => `${r.value} (${r.count})`).join("; ") || "—"} | position usage |`,
    `| max-width | ${clues.maxWidths.slice(0, 4).map((r) => r.value).join(", ") || "—"} | content width |`,
    `| width | ${clues.widths.slice(0, 4).map((r) => r.value).join(", ") || "—"} | common widths |`,
    `| height / min-height | ${clues.heights.slice(0, 4).map((r) => r.value).join(", ") || "—"} | height clues |`,
    `| object-fit | ${clues.objectFits.map((r) => r.value).join(", ") || "—"} | image fit |`,
    `| gap | ${clues.gaps.map((r) => r.value).join(", ") || "—"} | grid/flex gap |`,
    `| align-items / justify-content | ${clues.alignments.map((r) => r.value).join(", ") || "—"} | flex alignment |`,
    `| grid-template-columns | ${clues.gridColumns.map((r) => r.value).join(", ") || "—"} | grid patterns |`,
    "",
  ];
}

function formatClassTable(classes: ClassAggregate[], limit: number): string[] {
  const rows = classes.slice(0, limit);
  if (rows.length === 0) return ["| _None_ | — | — | — |"];
  return rows.map(
    (row) =>
      `| \`${markdownEscapeCell(row.name)}\` | ${row.totalCount} | ${row.pages.join(", ")} | ${row.kind === "generated" ? "Wix/framework generated" : "structural clue"} |`,
  );
}

function buildEmbedNotes(
  pages: Awaited<ReturnType<typeof enrichAuditPages>>,
): string[] {
  const rows: string[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    for (const service of page.metadata.detectedEmbeds) {
      const key = `${service}:embed:${page.route}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const note =
        service === "instagram"
          ? "Placeholder or existing embed continuation; grid layout on home"
          : service === "hubspot"
            ? "Keep HubSpot embed; do not rebuild form HTML"
            : "Review embed approach before Astro migration";
      rows.push(
        `| ${service} | ${markdownEscapeCell(page.route)} | Embedded widget | ${note} |`,
      );
    }

    for (const service of page.metadata.detectedExternalLinks) {
      const key = `${service}:link:${page.route}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(
        `| ${service} | ${markdownEscapeCell(page.route)} | External link | Keep as footer/social links |`,
      );
    }
  }

  if (rows.length === 0) return ["| _None_ | — | — | — |"];
  return rows;
}

function formatBackgroundImageTable(candidates: BackgroundImageCandidate[]): string[] {
  if (candidates.length === 0) {
    return ["| _None detected in HTML inline/style blocks_ | — | — | — | — | — |"];
  }

  return candidates.map(
    (row) =>
      `| ${markdownEscapeCell(row.pagePath)} | ${row.source} | ${markdownEscapeCell(row.selectorOrElement)} | ${markdownEscapeCell(row.imageUrl)} | ${row.cssProperty} | ${markdownEscapeCell(row.note ?? "")} |`,
  );
}

function buildStylesheetHrefTable(
  pages: Array<{ route: string; analysis: PageHtmlAnalysis }>,
): string[] {
  const rows: string[] = [];

  for (const { route, analysis } of pages) {
    for (const href of analysis.stylesheetHrefs) {
      rows.push(
        `| ${markdownEscapeCell(route)} | ${markdownEscapeCell(href)} | External CSS not fetched; may contain background images |`,
      );
    }
  }

  if (rows.length === 0) {
    return ["| _None_ | — | — |"];
  }

  return rows;
}

export async function writeImplementationBrief(results: AuditResult[]): Promise<void> {
  const enrichedPages = await enrichAuditPages(results);
  const pageAnalyses: PageHtmlAnalysis[] = [];
  const htmlBodies: string[] = [];

  for (const page of enrichedPages) {
    const html = await fs.readFile(path.join(OUTPUT_DIR, "html", `${page.slug}.html`), "utf8");
    htmlBodies.push(html);
    pageAnalyses.push(analyzeHtml(page.slug, html, page.url, page.route));
  }

  const allBackgroundCandidates = capBackgroundImageCandidates(
    pageAnalyses.flatMap((page) => page.backgroundImages),
  );
  const backgroundStats = summarizeBackgroundExtraction(allBackgroundCandidates);

  const allStylesheets = [...new Set(pageAnalyses.flatMap((page) => page.stylesheetHrefs))].sort();
  const cssClues = aggregateCssClues(
    pageAnalyses.map((page) => page.styleText).join("\n"),
    htmlBodies,
  );
  const classAgg = aggregateClasses(pageAnalyses);

  const lines: string[] = [
    "# Implementation Brief",
    "",
    "## 1. Purpose",
    "",
    "この資料は、既存サイトのHTML構造・CSS傾向・デザイン要素を解析し、静的HTML/CSS再構築の参考にするためのものです。",
    "既存サイトのコードをコピー・移植する目的ではありません。",
    "",
    "分析は audit で取得した raw HTML（`<style>` / inline style / class / link stylesheet）と JSON メタデータに基づく要約です。",
    "",
    "## 2. Source Files",
    "",
    "- HTML files: `tools/site-audit/output/html/*.html`",
    "- JSON metadata: `tools/site-audit/output/json/*.json`",
    "- Text extracts: `tools/site-audit/output/text/*.txt`",
    "- Screenshots: `tools/site-audit/output/screenshots/desktop/*.png`, `mobile/*.png`",
    `- Stylesheet hrefs detected: ${allStylesheets.length > 0 ? allStylesheets.join(", ") : "_none_"}`,
    `- Inline style attributes: ${pageAnalyses.reduce((sum, page) => sum + page.inlineStyleCount, 0)} total across pages`,
    `- Embedded <style> blocks: ${pageAnalyses.reduce((sum, page) => sum + page.styleTagCount, 0)} block(s), ~${pageAnalyses.reduce((sum, page) => sum + page.styleTextLength, 0)} chars`,
    `- Background image candidates: ${allBackgroundCandidates.length} total (inline style: ${backgroundStats.inlineStyle}, style block: ${backgroundStats.styleBlock}; capped at ${allBackgroundCandidates.length} for brief)`,
    "",
    "Note: External CSS files are listed by URL only. **External CSS bodies were not fetched in this pass.** Background images inside linked stylesheets are not extracted unless they also appear in HTML `<style>` or inline `style`.",
    "",
    "## 3. Page Structure Summary",
    "",
  ];

  for (const page of enrichedPages) {
    const analysis = pageAnalyses.find((item) => item.slug === page.slug);
    if (!analysis) continue;

    lines.push(
      `### ${pageShortName(page.pageType)}`,
      "",
      `Source URL: ${page.url}`,
      `HTML: \`${page.paths.html}\``,
      `Screenshot: \`${page.paths.desktopScreenshot}\` (desktop), \`${page.paths.mobileScreenshot}\` (mobile)`,
      `JSON: \`${page.paths.json}\``,
      "",
      "DOM outline:",
      "",
      "```text",
      ...analysis.domOutline,
      "```",
      "",
      "Headings (h1–h3):",
      ...(analysis.headings.length > 0
        ? analysis.headings.map((heading) => `- ${heading}`)
        : ["- _None_"]),
      "",
      "Detected section candidates:",
      ...(analysis.sectionCandidates.length > 0
        ? analysis.sectionCandidates.map((section) => `- ${section}`)
        : ["- _None inferred_"]),
      "",
    );
  }

  lines.push(
    "## 4. Important Classes",
    "",
    "> These classes are structural clues only. Do not reuse Wix-generated class names in the rebuild.",
    "",
    "### Useful structural clues from classes",
    "",
    "Human-readable or `wixui-*` patterns that help infer layout/components. Not copy-paste targets for Astro CSS.",
    "",
    "| Class | Count | Pages | Note |",
    "|---|---:|---|---|",
    ...formatClassTable(classAgg.structuralClues, 30),
    "",
    "### Wix / Studio / framework generated classes (representative)",
    "",
    "| Class | Count | Pages | Note |",
    "|---|---:|---|---|",
    ...formatClassTable(classAgg.generated, 15),
    "",
    "Random hash classes (`N8MGzv`), `comp-*`, `itemDepth*`, `itemShared*`, `StylableHorizontalMenu*`, and Astro `[data-astro-cid-*]` are treated as generated.",
    "",
    "## 5. Design Tokens / Style Clues",
    "",
    ...buildDesignTokenSection(cssClues),
    "## 6. Layout Clues",
    "",
    ...buildLayoutSection(cssClues),
    "## 7. Responsive / Media Query Clues",
    "",
    "| Breakpoint | Occurrences | Notes |",
    "|---|---:|---|",
    ...(cssClues.mediaQueries.length > 0
      ? cssClues.mediaQueries.map(
          (row) =>
            `| ${markdownEscapeCell(row.value)} | ${row.count} | detected in <style> / inline CSS |`,
        )
      : ["| _None detected_ | — | — |"]),
    "",
    "## 8. Asset / Image Implementation Clues",
    "",
    "See `asset-map.md` / `asset-map.json` for image-to-content matching and inferred roles.",
    "Rendered asset data is available in asset-map.json and should be used for image placement decisions.",
    "Rendered Event Blocks are available in asset-map.md / asset-map.json and should be used to match schedule images by on-screen position, especially when image filenames conflict with visual placement.",
    "Event-image matching data (`eventMatch`, `crossPageMatches`, `scheduleCrossPageCandidates`) is available in asset-map.md / asset-map.json and should be used when reconstructing schedule cards.",
    "Prefer `rendered-event-block` / `rendered-order` over `alt-text-date` when asset-map reports a conflict; treat NO PHOTO as missing-image state for the matched event.",
    "Event-image matching excludes SNS icons, logos, decorative images, and small nav/footer assets to avoid false flyer matches.",
    "",
    "| Page | Images | Background image candidates | Iframes | object-fit | Notes |",
    "|---|---:|---:|---:|---|---|",
  );

  for (const page of enrichedPages) {
    const analysis = pageAnalyses.find((item) => item.slug === page.slug);
    if (!analysis) continue;
    const bgCount = analysis.backgroundImages.length;
    const bgNote =
      bgCount > 0
        ? "Hero/background candidates detected in HTML CSS"
        : `${page.metadata.images.length} <img> in JSON metadata`;
    lines.push(
      `| ${markdownEscapeCell(page.route)} | ${analysis.imageCount} | ${bgCount} | ${analysis.iframeCount} | ${analysis.objectFitValues.join(", ") || "—"} | ${markdownEscapeCell(bgNote)} |`,
    );
  }

  lines.push(
    "",
    "### Stylesheet hrefs with possible background assets",
    "",
    "| Page | Stylesheet URL | Note |",
    "|---|---|---|",
    ...buildStylesheetHrefTable(
      enrichedPages
        .map((page) => ({
          route: page.route,
          analysis: pageAnalyses.find((item) => item.slug === page.slug),
        }))
        .filter((entry): entry is { route: string; analysis: PageHtmlAnalysis } =>
          Boolean(entry.analysis),
        ),
    ),
    "",
    "## 9. Background Image Clues",
    "",
    "Candidates from HTML `style` attributes and embedded `<style>` blocks only. Use with screenshots to decide visual importance.",
    "",
    "If this table is empty, check **Stylesheet hrefs** above (external CSS not fetched), compare with `<img>` counts in section 8, and review screenshots. Wix/Thunderbolt sites often inject hero/section backgrounds via JavaScript into `#bgMedia` layers without persisting `url(...)` in saved HTML.",
    "",
    "| Page | Source | Selector / Element | Image URL | CSS Property | Notes |",
    "|---|---|---|---|---|---|",
    ...formatBackgroundImageTable(allBackgroundCandidates),
    "",
    "## 10. External Embed Implementation Notes",
    "",
    "| Service | Pages | Type | Implementation Note |",
    "|---|---|---|---|",
    ...buildEmbedNotes(enrichedPages),
    "",
    "## 11. Rebuild Guidance",
    "",
    "- Use this brief as reference only.",
    "- Treat Wix classes as analysis clues only.",
    "- Do not reuse Wix generated class names.",
    "- Prefer clean semantic classes such as `site-header`, `global-nav`, `hero`, `schedule-list`, `schedule-card`, `discography-list`, `contact-section`.",
    "- Use screenshots as the primary visual source.",
    "- Use Wix DOM/class/CSS analysis only to infer structure, spacing, typography, and responsive behavior.",
    "- Do not rely only on `<img>` tags; CSS background images may be key visual assets.",
    "- Treat `background-image` / `background: url(...)` candidates as possible hero, section, or decorative images.",
    "- Reproduce important background images with clean CSS where appropriate.",
    "- Use screenshots to decide whether a detected background image is visually important.",
    "- Do not copy generated HTML/CSS directly from audited files.",
    "- Preserve visual direction, spacing rhythm, layout hierarchy, and navigation structure.",
    "- Rebuild with clean semantic HTML where possible (`header`, `nav`, `main`, `section`, `footer`).",
    "- Keep CSS simple and maintainable; prefer one shared stylesheet in the prototype.",
    "- Avoid carrying over Wix / Studio / WordPress / Astro scoped class complexity into the prototype.",
    "- Keep `CMS_TARGET` and `EXTERNAL_EMBED` comments in the static prototype.",
    "- Combine this brief with screenshots and `migration-brief.md` when rebuilding.",
    "",
  );

  const briefPath = path.join(OUTPUT_DIR, "implementation-brief.md");
  await fs.writeFile(briefPath, `${lines.join("\n")}`, "utf8");
}
