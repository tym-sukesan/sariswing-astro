import fs from "node:fs/promises";
import path from "node:path";
import {
  enrichAuditPages,
  isScheduleRelatedPageType,
  OUTPUT_DIR,
  pageShortName,
  type EnrichedAuditPage,
} from "./page-analysis.ts";
import type { AuditResult } from "./audit-site-types.ts";

const PROTOTYPE_DIR = "tools/site-audit/prototype-static/";

function markdownEscapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function cmsCommentsForPage(page: EnrichedAuditPage): string[] {
  const comments: string[] = [];
  const { pageType, metadata } = page;

  if (pageType === "Home" && /\bnews\b|ニュース/.test(page.textSample.toLowerCase())) {
    comments.push("<!-- CMS_TARGET: NEWS_LIST -->");
  }
  if (pageType === "News") {
    comments.push("<!-- CMS_TARGET: NEWS_LIST -->");
  }
  if (pageType === "Schedule" || pageType === "Schedule Month") {
    comments.push("<!-- CMS_TARGET: SCHEDULE_LIST -->");
  }
  if (pageType === "Links") {
    comments.push("<!-- CMS_TARGET: EXTERNAL_LINKS_LIST -->");
  }
  if (pageType === "Profile/About") {
    comments.push("<!-- CMS_TARGET: PROFILE_CONTENT -->");
  }
  if (metadata.detectedEmbeds.includes("instagram")) {
    comments.push("<!-- EXTERNAL_EMBED: INSTAGRAM -->");
  }
  if (metadata.detectedEmbeds.includes("hubspot")) {
    comments.push("<!-- EXTERNAL_EMBED: HUBSPOT_FORM -->");
  }
  if (metadata.detectedEmbeds.includes("youtube")) {
    comments.push("<!-- EXTERNAL_EMBED: YOUTUBE -->");
  }
  if (metadata.detectedEmbeds.includes("spotify")) {
    comments.push("<!-- EXTERNAL_EMBED: SPOTIFY -->");
  }
  if (metadata.detectedEmbeds.includes("googleMaps")) {
    comments.push("<!-- EXTERNAL_EMBED: GOOGLE_MAPS -->");
  }

  return comments;
}

function buildExternalServiceNotes(pages: EnrichedAuditPage[]): string[] {
  const lines: string[] = [];
  const embedServices = new Set(pages.flatMap((page) => page.metadata.detectedEmbeds));
  const linkServices = new Set(pages.flatMap((page) => page.metadata.detectedExternalLinks));

  if (embedServices.has("instagram")) {
    lines.push(
      "- **Instagram embedded widget**: In the prototype, use a placeholder block or the existing embed snippet from audit HTML. Final migration may keep embed or CMS-managed config.",
    );
  }
  if (linkServices.has("instagram")) {
    lines.push(
      "- **Instagram external links**: Keep as footer/social navigation links across pages.",
    );
  }
  if (embedServices.has("hubspot")) {
    lines.push(
      "- **HubSpot form**: Prototype may use a placeholder. Final migration should keep the existing HubSpot embed (no form rebuild in Astro).",
    );
  }
  for (const service of embedServices) {
    if (service === "instagram" || service === "hubspot") continue;
    lines.push(
      `- **${service} embed**: Use placeholder or audited embed markup; confirm licensing and third-party terms.`,
    );
  }
  for (const service of linkServices) {
    if (service === "instagram") continue;
    lines.push(`- **${service} external links**: Preserve as standard anchor links.`);
  }

  if (lines.length === 0) {
    lines.push("- No external embeds detected in audit metadata.");
  }

  return lines;
}

function buildCmsPreparationSection(pages: EnrichedAuditPage[]): string[] {
  const hasSchedule = pages.some((page) => isScheduleRelatedPageType(page.pageType));
  const hasNews = pages.some(
    (page) =>
      page.pageType === "News" ||
      (page.pageType === "Home" && /\bnews\b|ニュース/.test(page.textSample.toLowerCase())),
  );
  const hasAbout = pages.some((page) => page.pageType === "Profile/About");
  const hasInstagramEmbed = pages.some((page) =>
    page.metadata.detectedEmbeds.includes("instagram"),
  );
  const hasHubspot = pages.some((page) => page.metadata.detectedEmbeds.includes("hubspot"));

  const lines = [
    "Structure HTML so future Astro/CMS integration is straightforward:",
    "",
  ];

  if (hasSchedule) {
    lines.push("- **Schedule** will likely become CMS-driven data later.");
  }
  if (hasNews) {
    lines.push("- **News** will likely become CMS-driven data later.");
  }
  if (hasAbout) {
    lines.push("- **Profile/About** is a CMS management candidate for occasional updates.");
  }
  if (hasInstagramEmbed) {
    lines.push("- **Instagram embed** may remain a third-party embed or become CMS-managed configuration.");
  }
  if (hasHubspot) {
    lines.push("- **Contact form (HubSpot)** should remain an external embed in production.");
  }

  lines.push(
    "",
    "Add HTML comments at CMS/embed boundaries. Examples:",
    "",
    "```html",
    "<!-- CMS_TARGET: NEWS_LIST -->",
    "<!-- CMS_TARGET: SCHEDULE_LIST -->",
    "<!-- CMS_TARGET: PROFILE_CONTENT -->",
    "<!-- EXTERNAL_EMBED: HUBSPOT_FORM -->",
    "<!-- EXTERNAL_EMBED: INSTAGRAM -->",
    "```",
    "",
    "Per-page suggested comments:",
    "",
  );

  for (const page of pages) {
    const comments = cmsCommentsForPage(page);
    lines.push(
      `- **${pageShortName(page.pageType)}** (\`${page.prototypeFile}\`): ${
        comments.length > 0 ? comments.join(" ") : "_No CMS/embed comments required_"
      }`,
    );
  }

  return lines;
}

export async function writeRebuildPrompt(results: AuditResult[]): Promise<void> {
  const pages = await enrichAuditPages(results);
  const desktopScreenshots = pages.map((page) => page.paths.desktopScreenshot);
  const mobileScreenshots = pages.map((page) => page.paths.mobileScreenshot);

  const lines: string[] = [
    "# Static Rebuild Prompt",
    "",
    "> Paste this document into Cursor to generate a static HTML/CSS prototype.",
    "> Generated from site-audit output. Do not modify Sariswing production code.",
    "",
    "## Role",
    "",
    "あなたは、既存ミュージシャン公式サイトを、ブラウザから読み取れる情報と許可済み素材をもとに、クリーンな静的HTML/CSSとして再構築するフロントエンドエンジニアです。",
    "",
    "## Goal",
    "",
    "既存サイトのデザインや構成を尊重しながら、Wix / Studio / WordPress等の生成コードをコピーせず、軽量で読みやすい静的HTML/CSSプロトタイプを作成してください。",
    "",
    "今回の目的は、最終的なAstro化・CMS化の前に、まず見た目と情報構造を確認できる静的プロトタイプを作ることです。",
    "",
    "## Important Rules",
    "",
    "- 既存サイトのコードをそのままコピーしない",
    "- Wix / Studio / WordPress 等の生成HTMLやCSSを移植しない",
    "- Wix generated classes must not be reused in HTML/CSS",
    "- `implementation-brief.md` is for analysis only (structure/spacing/typography clues), not a copy source",
    "- Use meaningful new class names (`site-header`, `global-nav`, `schedule-card`, etc.)",
    "- Prefer normalized CMS-friendly structures over Wix DOM structure",
    "- `implementation-brief.md` を DOM構造・class傾向・余白・色・タイポグラフィ・レイアウト・レスポンシブの参考に使う（コピー元ではない）",
    "- 分析結果をもとに、クリーンで保守しやすい静的HTML/CSSとして再構築する",
    "- ブラウザから見える構成・雰囲気・情報設計を参考に、クリーンに再実装する",
    "- 使用する画像・文章・ロゴ・素材は、サイト所有者が利用許可を持つものだけを使う",
    "- CSS background images listed in `implementation-brief.md` (Background Image Clues) must be reviewed",
    "- Do not ignore visual assets just because they are not `<img>` tags",
    "- If a background image appears to be part of the hero, key visual, section background, or decorative design, reproduce it with clean CSS",
    "- Use screenshots to decide whether each background image is important",
    "- Do not copy original CSS directly; use the detected image URL and layout clue as reference only",
    "- Use `asset-map.md` / `asset-map.json` to match images to hero sections, schedule cards, discography items, profile sections, and links",
    "- Avoid placeholders when a medium/high confidence asset match exists",
    "- For low-confidence assets, use placeholders and mark for review",
    "- Do not reuse images unless the site owner has permission to use them in the rebuilt site",
    "- Use screenshots to verify visual placement",
    "- Use rendered asset data from asset-map.json when placing images.",
    "- Rendered asset positions and sizes are useful for matching flyers, album jackets, hero images, and profile photos.",
    "- If a rendered asset has medium/high confidence, avoid replacing it with a placeholder.",
    "- Use `eventMatch` data from `asset-map.md` / `asset-map.json` when placing schedule flyer images.",
    "- When placing schedule flyer images, prefer `rendered-event-block` or `rendered-order` matches over `alt-text-date` if they conflict.",
    "- If asset-map reports `alt-date-conflict`, follow rendered event block placement and mark as review if necessary.",
    "- NO PHOTO assets should be attached to the corresponding event as a missing-image state, not treated as real flyers.",
    "- Use Rendered Event Blocks (`renderedEventBlocks`) to preserve the visual order of Home weekly schedules.",
    "- Do not treat NO PHOTO / placeholder images as real flyers.",
    "- If a Home schedule flyer has a `crossPageMatches` entry for a Schedule Month event, it may be used as a candidate but should be marked for review unless confidence is high.",
    "- For medium/high event-image matches, avoid generic placeholders.",
    "- For low confidence or missing images, use a clearly marked placeholder and add `ASSET_REVIEW_REQUIRED`.",
    "- Use only accepted eventMatch entries for placing schedule flyer images.",
    "- Do not use SNS icons, logos, decorative images, or nav/footer images as event flyers.",
    "- If an image has event-match skipped warnings, do not use it as a flyer.",
    "- NO PHOTO / placeholder assets should represent missing image state, not real flyers.",
    "- 外部サービス埋め込みは必要に応じて placeholder または既存埋め込み継続前提にする",
    "- まずは静的HTML/CSSのみ作る（不要なJavaScriptは使わない）",
    "- Astro化、Supabase CMS化、GitHub Actions、デプロイ設定は今回行わない",
    "- **Sariswing本体**の `src/` / `public/` / `supabase/` / GitHub Actions は変更しない",
    "- 作業対象は **`tools/site-audit/prototype-static/`** のみ",
    "",
    "## Source Materials",
    "",
    "Read these audit artifacts before building:",
    "",
    "- `tools/site-audit/output/migration-brief.md` — page types, CMS targets, embed inventory",
    "- `tools/site-audit/output/implementation-brief.md` — DOM structure, classes, CSS/layout/style clues",
    "- `tools/site-audit/output/report.md` — per-page audit summary",
    "- `tools/site-audit/output/json/*.json` — titles, headings, links, images, embed flags",
    "- `tools/site-audit/output/text/*.txt` — visible page text (body.innerText)",
    "- `tools/site-audit/output/asset-map.md` — image-to-content matching (human-readable)",
    "- `tools/site-audit/output/asset-map.json` — image roles, nearby text, confidence (machine-readable)",
    "- Desktop screenshots:",
    ...desktopScreenshots.map((filePath) => `  - \`${filePath}\``),
    "- Mobile screenshots:",
    ...mobileScreenshots.map((filePath) => `  - \`${filePath}\``),
    "",
    "## Pages to Rebuild",
    "",
    "| Page | Source URL | Prototype File | Priority |",
    "|---|---|---|---|",
  ];

  for (const page of pages) {
    lines.push(
      `| ${markdownEscapeCell(pageShortName(page.pageType))} | ${markdownEscapeCell(page.url)} | ${markdownEscapeCell(page.prototypeFile)} | ${page.priority} |`,
    );
  }

  if (pages.length === 0) {
    lines.push("| _No pages audited_ | — | — | — |");
  }

  lines.push(
    "",
    "## Output Directory",
    "",
    "Create the static prototype here:",
    "",
    "```text",
    "tools/site-audit/prototype-static/",
    "  index.html",
    "  about.html",
    "  schedule.html",
    "  news.html",
    "  contact.html",
    "  assets/",
    "  css/",
    "    style.css",
    "  README.md",
    "```",
    "",
    "Use the **Prototype File** names from the table above. Add or adjust files if the audited site has additional page types.",
    "",
    "## Design Direction",
    "",
    "Use audit screenshots, `migration-brief.md`, and `implementation-brief.md` as references:",
    "",
    "- 既存サイトの視覚的方向性を保つ",
    "- 大幅なリデザインはしない",
    "- 余白、色味、フォントサイズ感、ナビゲーション構成を参考にする",
    "- Screenshots を主な視覚ソースとし、Wix class/CSS は構造推定の補助に留める",
    "- Wix 生成 class 名（hash / comp-* / itemDepth* 等）は再構築に使わない",
    "- `implementation-brief.md` の Background Image Clues を確認し、CSS `background-image` / `background: url(...)` の重要ビジュアルを見落とさない",
    "- PC / mobile 両方で自然に見えるレスポンシブCSSにする（mobile screenshots を必ず確認）",
    "- コードはシンプルに保つ",
    "- 不要なJavaScriptは使わない",
    "- 画像は audit JSON の `images` または許可済みの同等素材を使用",
    "- `asset-map.md` / `asset-map.json` で hero・スケジュールフライヤー・ジャケット・プロフィール写真の対応を確認する",
    "- medium/high confidence のマッチがある場合は placeholder を避ける",
    "- low confidence の画像は placeholder にし、要確認とする",
    "- asset-map の rendered 情報（位置・サイズ・近接テキスト）を優先して画像を配置する",
    "- `eventMatch` / `crossPageMatches` / `scheduleCrossPageCandidates` を参照し、スケジュールフライヤーを配置する（accepted のみ）",
    "- SNSアイコン・ロゴ・装飾・ナビ/フッター画像をフライヤーとして使わない",
    "- NO PHOTO / placeholder は実フライヤーとして使わない",
    "- `rendered-event-block` / `rendered-order` を `alt-text-date` より優先する（衝突時）",
    "- `alt-date-conflict` がある場合は rendered event block の日付に従い、要確認とする",
    "- `renderedEventBlocks` で Home 週間スケジュールの表示順を維持する",
    "",
    "## CMS Preparation Notes",
    "",
    ...buildCmsPreparationSection(pages),
    "",
    "## Page Content Sources",
    "",
    "For each page, use the matching audit files:",
    "",
  );

  for (const page of pages) {
    lines.push(
      `### ${pageShortName(page.pageType)}`,
      "",
      `- Source URL: ${page.url}`,
      `- Prototype file: \`${PROTOTYPE_DIR}${page.prototypeFile}\``,
      `- Text: \`${page.paths.text}\``,
      `- JSON: \`${page.paths.json}\``,
      `- HTML (reference only, do not copy markup verbatim): \`${page.paths.html}\``,
      `- Desktop screenshot: \`${page.paths.desktopScreenshot}\``,
      `- Mobile screenshot: \`${page.paths.mobileScreenshot}\``,
      `- Title (from audit): ${page.metadata.title || "_n/a_"}`,
      `- H1: ${page.metadata.h1.length > 0 ? page.metadata.h1.join(" / ") : "_n/a_"}`,
      "",
    );
  }

  lines.push(
    "## External Services",
    "",
    "Handle third-party services as follows:",
    "",
    ...buildExternalServiceNotes(pages),
    "",
    "## Final Task for Cursor",
    "",
    "Execute the following:",
    "",
    "1. Read `migration-brief.md`, `implementation-brief.md`, `asset-map.md`, `report.md`, JSON, text, and screenshots listed above.",
    "2. Build a static HTML/CSS prototype under `tools/site-audit/prototype-static/`.",
    "3. Respect the existing site's visual direction; do not redesign from scratch.",
    "4. Write clean, semantic HTML and a single shared stylesheet (`css/style.css`).",
    "5. Do not copy Wix/third-party generated code from `output/html/` verbatim.",
    "6. Use authorized text from `output/text/` and image URLs from audit JSON only if permitted.",
    "7. Add CMS/embed HTML comments where noted in **CMS Preparation Notes**.",
    "8. Do **not** modify Sariswing production paths (`src/`, `public/`, `supabase/`, GitHub Actions).",
    "9. When finished, report:",
    "   - List of files created",
    "   - How each page maps to the source site",
    "   - What was placeholder vs. reproduced from audit content",
    "   - Any open questions before Astro/CMS migration",
    "",
  );

  const promptPath = path.join(OUTPUT_DIR, "rebuild-prompt.md");
  await fs.writeFile(promptPath, `${lines.join("\n")}`, "utf8");
}
