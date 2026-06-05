import fs from "node:fs/promises";
import path from "node:path";
import type { AuditResult } from "./audit-site-types.ts";
import {
  enrichAuditPages,
  OUTPUT_DIR,
  pageTypeLabel,
  PAGE_TYPE_PRIORITY,
  type EnrichedAuditPage,
  type Priority,
  isScheduleRelatedPageType,
} from "./page-analysis.ts";

type CmsTarget = {
  name: string;
  relatedRoutes: string[];
  reason: string;
  priority: Priority;
};

function markdownEscapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function buildSearchBlob(page: EnrichedAuditPage): string {
  return [
    page.metadata.url,
    page.metadata.finalUrl,
    page.metadata.title,
    page.metadata.metaDescription ?? "",
    ...page.metadata.h1,
    ...page.metadata.h2,
    ...page.metadata.h3,
    page.textSample,
  ]
    .join(" ")
    .toLowerCase();
}

function collectCmsTargets(pages: EnrichedAuditPage[]): CmsTarget[] {
  const targets: CmsTarget[] = [];

  const schedulePages = pages.filter((page) => isScheduleRelatedPageType(page.pageType));
  if (schedulePages.length > 0) {
    targets.push({
      name: "Schedule",
      relatedRoutes: schedulePages.map((page) => page.route),
      reason:
        "Live schedule index and monthly archive pages; content is updated frequently.",
      priority: "High",
    });
  }

  const newsPages = pages.filter((page) => page.pageType === "News");
  const homeWithNews = pages.filter(
    (page) =>
      page.pageType === "Home" &&
      /\bnews\b|ニュース/.test(buildSearchBlob(page)),
  );
  const newsRoutes = [
    ...new Set([...newsPages, ...homeWithNews].map((page) => page.route)),
  ];
  if (newsRoutes.length > 0) {
    targets.push({
      name: "News",
      relatedRoutes: newsRoutes,
      reason: "News index or news sections detected on the site.",
      priority: "High",
    });
  }

  const aboutPages = pages.filter((page) => page.pageType === "Profile/About");
  if (aboutPages.length > 0) {
    targets.push({
      name: "Profile/About",
      relatedRoutes: aboutPages.map((page) => page.route),
      reason: "Profile or biography content may need occasional updates.",
      priority: "Medium",
    });
  }

  const discographyPages = pages.filter((page) => page.pageType === "Discography/Works");
  if (discographyPages.length > 0) {
    targets.push({
      name: "Discography/Works",
      relatedRoutes: discographyPages.map((page) => page.route),
      reason: "Works or release-related pages detected.",
      priority: "Medium",
    });
  }

  const linksPages = pages.filter((page) => page.pageType === "Links");
  if (linksPages.length > 0) {
    targets.push({
      name: "Links / External Links",
      relatedRoutes: linksPages.map((page) => page.route),
      reason: "Curated external links page; update when partner URLs change.",
      priority: "Low",
    });
  }

  const embedPages = pages.filter((page) => page.metadata.detectedEmbeds.length > 0);
  const embedServices = [...new Set(embedPages.flatMap((page) => page.metadata.detectedEmbeds))];

  if (embedServices.includes("instagram")) {
    targets.push({
      name: "Instagram Embed",
      relatedRoutes: embedPages
        .filter((page) => page.metadata.detectedEmbeds.includes("instagram"))
        .map((page) => page.route),
      reason: "Embedded Instagram widgets detected (iframe/script/embed markup).",
      priority: "Medium",
    });
  }

  for (const service of embedServices.filter((name) => name !== "instagram" && name !== "hubspot")) {
    const label = `${service.charAt(0).toUpperCase()}${service.slice(1)} Embed`;
    targets.push({
      name: label,
      relatedRoutes: embedPages
        .filter((page) => page.metadata.detectedEmbeds.includes(service))
        .map((page) => page.route),
      reason: `Embedded ${service} content detected.`,
      priority: "Medium",
    });
  }

  const hubspotPages = pages.filter((page) => page.metadata.detectedEmbeds.includes("hubspot"));
  if (hubspotPages.length > 0) {
    targets.push({
      name: "Contact Embed",
      relatedRoutes: hubspotPages.map((page) => page.route),
      reason: "HubSpot form or embed detected; keep existing embed rather than rebuilding the form.",
      priority: "Medium",
    });
  }

  const hasExternalSocial = pages.some((page) => page.metadata.detectedExternalLinks.length > 0);
  if (hasExternalSocial) {
    const services = [...new Set(pages.flatMap((page) => page.metadata.detectedExternalLinks))];
    targets.push({
      name: "SNS/External Links",
      relatedRoutes: pages
        .filter((page) => page.metadata.detectedExternalLinks.length > 0)
        .map((page) => page.route),
      reason: `External service links detected (${services.join(", ")}).`,
      priority: "Low",
    });
  }

  return targets;
}

function buildExternalServicesTable(pages: EnrichedAuditPage[]): string[] {
  const rows: string[] = [];
  const seen = new Set<string>();

  const migrationNotes: Record<string, string> = {
    instagram: "Keep or replace with CMS-managed embed; verify Instagram API/embed policy.",
    youtube: "Keep embed or link; consider Astro-friendly embed component.",
    spotify: "Keep embed URL in CMS or static frontmatter.",
    soundcloud: "Keep embed URL in CMS or static frontmatter.",
    bandcamp: "Keep embed URL in CMS or static frontmatter.",
    googleMaps: "Keep embed or replace with static map image + link.",
    hubspot: "Keep existing embed code; no need to rebuild form in Astro.",
  };

  for (const page of pages) {
    for (const service of page.metadata.detectedEmbeds) {
      const key = `${service}:embed:${page.route}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(
        `| ${markdownEscapeCell(service)} | Embedded widget | ${markdownEscapeCell(page.route)} | ${markdownEscapeCell(migrationNotes[service] ?? "Review embed migration approach.")} |`,
      );
    }

    for (const service of page.metadata.detectedExternalLinks) {
      const key = `${service}:link:${page.route}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const note =
        service === "instagram"
          ? "Keep as footer/social link."
          : "Keep as external link; no CMS required unless URLs change often.";
      rows.push(
        `| ${markdownEscapeCell(service)} | External link | ${markdownEscapeCell(page.route)} | ${markdownEscapeCell(note)} |`,
      );
    }
  }

  if (rows.length === 0) {
    return ["| _None detected_ | — | — | — |"];
  }

  return rows;
}

function buildOpenQuestions(
  pages: EnrichedAuditPage[],
  cmsTargets: CmsTarget[],
): string[] {
  const questions = [
    "画像素材の使用許可・元データ（高解像度）は揃っているか？",
    "ロゴやメインビジュアルの元画像はあるか？",
    "既存サイトの文章をそのまま流用してよいか（著作権・許諾）？",
    "News / Schedule の過去データをどこまで移行するか？",
    "独自ドメイン・DNS・現行ホスティング契約の移行手順は決まっているか？",
  ];

  const totalImages = pages.reduce((sum, page) => sum + page.metadata.images.length, 0);
  if (totalImages > 0) {
    questions.unshift("各ページの画像をそのまま使うか、撮影し直し・差し替えが必要か？");
  }

  if (cmsTargets.some((target) => target.name === "Contact Embed")) {
    questions.push("Contactフォームは HubSpot 埋め込みの継続でよいか？");
  }

  if (cmsTargets.some((target) => target.name === "Instagram Embed")) {
    questions.push("Instagram 埋め込みは現行方式を継続するか、別実装に置き換えるか？");
  }

  if (pages.some((page) => isScheduleRelatedPageType(page.pageType))) {
    questions.push("Schedule の更新頻度と、CMS で管理する項目（会場・チケットURL等）の範囲は？");
    questions.push(
      "月別スケジュール URL（/YYYY-MM/）はレガシー互換のまま維持するか、/schedule/YYYY-MM/ に正規化するか？",
    );
  }

  if (pages.some((page) => page.pageType === "News")) {
    questions.push("News のカテゴリ・一覧ページ・個別記事URLの構成は現行と同じでよいか？");
  }

  if (pages.some((page) => page.pageType === "Links")) {
    questions.push("Links ページの外部リンク一覧は CMS 管理にするか、静的更新でよいか？");
  }

  return [...new Set(questions)];
}

export async function writeMigrationBrief(
  results: AuditResult[],
  capturedAt: string,
): Promise<void> {
  const failures = results.filter((result) => !result.ok);
  const sourceUrls = results.map((result) => result.url);
  const enrichedPages = await enrichAuditPages(results);
  const cmsTargets = collectCmsTargets(enrichedPages);

  const hasRouteNotes = enrichedPages.some((page) => page.routeNotes !== "—");

  const lines: string[] = [
    "# Migration Brief",
    "",
    "Rule-based migration planning notes generated from site-audit output.",
    "Use with `report.md`, `json/`, `text/`, and screenshots when rebuilding in Astro.",
    "",
    "## 1. Audit Summary",
    "",
    `- Captured at: ${capturedAt}`,
    `- Total pages: ${results.length}`,
    `- Successful pages: ${enrichedPages.length}`,
    `- Failed pages: ${failures.length}`,
    "- Source URLs:",
    ...sourceUrls.map((url) => `  - ${url}`),
    "",
    "## 2. Proposed Astro Pages",
    "",
    hasRouteNotes
      ? "| Source URL | Proposed Astro Route | Page Type | Priority | Route notes |"
      : "| Source URL | Proposed Astro Route | Page Type | Priority |",
    hasRouteNotes
      ? "|---|---|---|---|---|"
      : "|---|---|---|---|",
  ];

  for (const page of enrichedPages) {
    if (hasRouteNotes) {
      lines.push(
        `| ${markdownEscapeCell(page.metadata.url)} | ${markdownEscapeCell(page.route)} | ${pageTypeLabel(page.pageType)} | ${PAGE_TYPE_PRIORITY[page.pageType]} | ${markdownEscapeCell(page.routeNotes)} |`,
      );
    } else {
      lines.push(
        `| ${markdownEscapeCell(page.metadata.url)} | ${markdownEscapeCell(page.route)} | ${pageTypeLabel(page.pageType)} | ${PAGE_TYPE_PRIORITY[page.pageType]} |`,
      );
    }
  }

  if (enrichedPages.length === 0) {
    lines.push(
      hasRouteNotes
        ? "| _No successful pages_ | — | — | — | — |"
        : "| _No successful pages_ | — | — | — |",
    );
  }

  lines.push(
    "",
    "## 3. Suggested CMS Targets",
    "",
    "| CMS Target | Related Pages | Reason | Priority |",
    "|---|---|---|---|",
  );

  if (cmsTargets.length === 0) {
    lines.push("| _None suggested_ | — | — | — |");
  } else {
    for (const target of cmsTargets) {
      lines.push(
        `| ${markdownEscapeCell(target.name)} | ${markdownEscapeCell(target.relatedRoutes.join(", "))} | ${markdownEscapeCell(target.reason)} | ${target.priority} |`,
      );
    }
  }

  lines.push(
    "",
    "## 4. Static Content Candidates",
    "",
    "Likely safe to implement as static Astro content or layout components first:",
    "",
    "- Site navigation and footer (shared across pages)",
    "- Branding elements: logo, site title, base typography/colors (match audited screenshots)",
    "- Fixed CTAs and hero copy on Home (unless CMS-managed later)",
    "- External SNS / shop links in header or footer",
  );

  if (enrichedPages.some((page) => page.pageType === "Profile/About")) {
    lines.push("- Profile/About body sections that change rarely (split CMS later if needed)");
  }

  if (enrichedPages.some((page) => page.pageType === "Links")) {
    lines.push("- Links / external links page (static list or low-priority CMS later)");
  }

  if (cmsTargets.some((target) => target.name === "Contact Embed")) {
    lines.push("- HubSpot form embed snippet on Contact (keep third-party embed; no form rebuild)");
  }

  if (cmsTargets.some((target) => target.name === "Instagram Embed")) {
    lines.push("- Instagram embed blocks (keep embed code or replace with CMS-managed embed config)");
  }

  lines.push(
    "",
    "## 5. External Services / Embeds",
    "",
    "| Service | Type | Pages | Migration Note |",
    "|---|---|---|---|",
    ...buildExternalServicesTable(enrichedPages),
    "",
    "## 6. Assets Overview",
    "",
    "| Page | Images | Links | Iframes | Notes |",
    "|---|---:|---:|---:|---|",
  );

  for (const page of enrichedPages) {
    const embeds =
      page.metadata.detectedEmbeds.length > 0
        ? `embeds: ${page.metadata.detectedEmbeds.join(", ")}`
        : "no embeds";
    lines.push(
      `| ${markdownEscapeCell(page.route)} | ${page.metadata.images.length} | ${page.metadata.links.length} | ${page.metadata.iframes.length} | ${markdownEscapeCell(embeds)} |`,
    );
  }

  if (enrichedPages.length === 0) {
    lines.push("| _No data_ | 0 | 0 | 0 | — |");
  }

  const prioritizedRoutes = enrichedPages
    .filter((page) => PAGE_TYPE_PRIORITY[page.pageType] === "High")
    .map((page) => page.route)
    .join(", ");

  lines.push(
    "",
    "## 7. Rebuild Notes for Cursor",
    "",
    "- Preserve current visual direction; do not redesign from scratch.",
    "- Rebuild with clean Astro components and layouts.",
    "- Avoid copying Wix/third-party generated markup directly into Astro.",
    "- Use extracted text and authorized assets only.",
    "- Keep external embeds such as HubSpot and Instagram where appropriate.",
    `- Prioritize: ${prioritizedRoutes || "Home, About, Schedule, News, Contact"}.`,
    "- Separate static layout/chrome from CMS-managed collections (Schedule, News, etc.).",
    "- Reference `tools/site-audit/output/screenshots/` for layout fidelity.",
    "- Reference `tools/site-audit/output/json/` for headings, links, and embed inventory.",
    "- Monthly schedule archives (`/YYYY-MM/`) may be normalized to `/schedule/YYYY-MM/` in Astro while keeping legacy redirects.",
    "",
    "## 8. Open Questions",
    "",
    ...buildOpenQuestions(enrichedPages, cmsTargets).map((question) => `- ${question}`),
    "",
  );

  const briefPath = path.join(OUTPUT_DIR, "migration-brief.md");
  await fs.writeFile(briefPath, `${lines.join("\n")}`, "utf8");
}
