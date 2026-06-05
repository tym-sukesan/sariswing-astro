import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { htmlFileToAstroRoute, walkHtmlFiles } from "./static-site-analyzer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const require = createRequire(path.join(REPO_ROOT, "package.json"));
const cheerio = require("cheerio");

/** @typedef {'High'|'Medium'|'Low'|'Manual'} CmsPriority */
/** @typedef {'schedule'|'news'|'profile'|'discography'|'lesson'|'contact'|'sns_embed'|'home'|'navigation'|'static'} CmsCategory */

export const CMS_CATEGORIES = {
  schedule: "Schedule / Live events",
  news: "News / Blog",
  profile: "Profile / About",
  discography: "Discography / Works",
  lesson: "Lesson / Service / Price",
  contact: "Contact / Form",
  sns_embed: "SNS / Embed",
  home: "Home (mixed content)",
  navigation: "Navigation / chrome",
  static: "Static / rarely updated",
};

const CMS_TARGET_MAP = {
  SCHEDULE_MONTH_LIST: { category: "schedule", priority: "High", label: "Monthly schedule list" },
  SCHEDULE_INDEX: { category: "schedule", priority: "High", label: "Schedule index (month links)" },
  HOME_LIVE_SCHEDULE: { category: "schedule", priority: "High", label: "Home weekly live schedule" },
  DISCOGRAPHY_LIST: { category: "discography", priority: "Medium", label: "Discography releases" },
  PROFILE_CONTENT: { category: "profile", priority: "Medium", label: "Artist profile biography" },
  CONTACT_CONTENT: { category: "contact", priority: "Manual", label: "Contact copy and form area" },
  EXTERNAL_LINKS: { category: "static", priority: "Low", label: "External links list" },
};

const FILENAME_RULES = [
  { pattern: /^schedule-\d{4}-\d{2}\.html$/i, category: "schedule", priority: "High", reason: "Monthly schedule page filename" },
  { pattern: /^schedule/i, category: "schedule", priority: "High", reason: "Schedule-related filename" },
  { pattern: /^(news|blog|post|article)/i, category: "news", priority: "High", reason: "News/blog filename" },
  { pattern: /^(about|profile|biography)/i, category: "profile", priority: "Medium", reason: "Profile/about filename" },
  { pattern: /^(discography|works|music|gallery)/i, category: "discography", priority: "Medium", reason: "Discography/works filename" },
  { pattern: /^(lesson|service|price|course|class)/i, category: "lesson", priority: "Medium", reason: "Lesson/service filename" },
  { pattern: /^contact/i, category: "contact", priority: "Manual", reason: "Contact page filename" },
  { pattern: /^link/i, category: "static", priority: "Low", reason: "Link collection page" },
  { pattern: /^index\.html$/i, category: "home", priority: "Low", reason: "Home page (mixed)" },
];

const CONTENT_SIGNALS = [
  { re: /schedule-list|schedule-card|schedule-card__date/i, category: "schedule", priority: "High", reason: "Schedule list markup" },
  { re: /会場|開場|開演|料金|出演/i, category: "schedule", priority: "High", reason: "Japanese live-event fields" },
  { re: /\d{4}\.\d{2}\.\d{2}|\d{1,2}月\d{1,2}日/i, category: "schedule", priority: "Medium", reason: "Date patterns in content" },
  { re: /discography-list|discography-item/i, category: "discography", priority: "Medium", reason: "Discography list markup" },
  { re: /Release|Track List|album/i, category: "discography", priority: "Medium", reason: "Release metadata" },
  { re: /profile-section|profile-body|biography/i, category: "profile", priority: "Medium", reason: "Profile section markup" },
  { re: /お知らせ|更新情報|(?:^|\s)news(?:\s|$)|\/news\/|blog-post|article-list/i, category: "news", priority: "High", reason: "News/blog section keywords" },
  { re: /\blesson\b|レッスン|\bcourse\b|trial lesson|体験レッスン|料金表|レッスン料/i, category: "lesson", priority: "Medium", reason: "Lesson/service keywords" },
  { re: /<form\b|contact-form|inquiry|お問い合わせ/i, category: "contact", priority: "Manual", reason: "Form or inquiry UI" },
  { re: /<iframe\b|embed/i, category: "contact", priority: "Manual", reason: "Embedded form/widget" },
  { re: /instagram|youtube|facebook\.com|twitter\.com|x\.com/i, category: "sns_embed", priority: "Low", reason: "Social / video links" },
];

export const SUPABASE_TABLE_PROPOSALS = [
  {
    name: "schedules",
    description: "Individual live events (replaces monthly HTML pages + home teaser cards).",
    columns: [
      "id (uuid, PK)",
      "event_date (date, required)",
      "title (text)",
      "subtitle (text)",
      "venue (text)",
      "open_time (text)",
      "start_time (text)",
      "price (text)",
      "performers (text)",
      "description (text)",
      "venue_url (text)",
      "flyer_image_url (text)",
      "month_slug (text, e.g. 2026-07)",
      "sort_order (int)",
      "published (boolean)",
      "created_at (timestamptz)",
      "updated_at (timestamptz)",
    ],
  },
  {
    name: "schedule_months",
    description: "Optional: month landing metadata if month pages remain as views.",
    columns: [
      "id (uuid, PK)",
      "year_month (text, unique, e.g. 2026-07)",
      "heading (text)",
      "published (boolean)",
      "created_at (timestamptz)",
      "updated_at (timestamptz)",
    ],
  },
  {
    name: "news",
    description: "News / blog posts when a news section is added.",
    columns: [
      "id (uuid, PK)",
      "title (text)",
      "slug (text, unique)",
      "body (text)",
      "excerpt (text)",
      "cover_image_url (text)",
      "published_at (timestamptz)",
      "published (boolean)",
      "created_at (timestamptz)",
      "updated_at (timestamptz)",
    ],
  },
  {
    name: "profiles",
    description: "About page biography and portrait (single-row or locale-keyed).",
    columns: [
      "id (uuid, PK)",
      "display_name (text)",
      "body (text)",
      "photo_url (text)",
      "locale (text, default ja)",
      "published (boolean)",
      "updated_at (timestamptz)",
    ],
  },
  {
    name: "discography",
    description: "Albums / releases on discography page.",
    columns: [
      "id (uuid, PK)",
      "title (text)",
      "release_date (date)",
      "catalog_number (text)",
      "price (text)",
      "cover_image_url (text)",
      "credits (text)",
      "track_list (jsonb)",
      "streaming_url (text)",
      "sort_order (int)",
      "published (boolean)",
      "created_at (timestamptz)",
      "updated_at (timestamptz)",
    ],
  },
  {
    name: "external_links",
    description: "Curated outbound links (Link page + optional footer).",
    columns: [
      "id (uuid, PK)",
      "title (text)",
      "description (text)",
      "url (text)",
      "category (text)",
      "sort_order (int)",
      "published (boolean)",
    ],
  },
  {
    name: "site_settings",
    description: "Contact intro copy, hero image URL, SNS URLs (not form submissions).",
    columns: [
      "id (text, PK, e.g. default)",
      "contact_intro (text)",
      "hero_image_url (text)",
      "facebook_url (text)",
      "instagram_url (text)",
      "x_url (text)",
      "updated_at (timestamptz)",
    ],
  },
];

function walkAstroPages(astroDir) {
  const pagesDir = path.join(astroDir, "src", "pages");
  if (!fs.existsSync(pagesDir)) return [];

  const files = [];
  function walk(dir, base = pagesDir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, base);
      else if (entry.isFile() && /\.astro$/i.test(entry.name)) {
        files.push(path.relative(base, full).split(path.sep).join("/"));
      }
    }
  }
  walk(pagesDir);
  return files.sort();
}

function astroPageToRoute(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  if (normalized === "index.astro") return "/";
  const dir = normalized.replace(/\/index\.astro$/i, "").replace(/\.astro$/i, "");
  return `/${dir}/`;
}

function extractCmsTargets(html) {
  const targets = [];
  const re = /<!--\s*CMS_TARGET:\s*([A-Z0-9_]+)\s*-->/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    const meta = CMS_TARGET_MAP[id] ?? {
      category: "static",
      priority: "Manual",
      label: `Unknown CMS_TARGET: ${id}`,
    };
    targets.push({ id, ...meta });
  }
  return targets;
}

function analyzePageContent($, html, fileName) {
  const signals = [];
  const mainText = $("main").text() ?? "";
  const mainHtml = $("main").html() ?? "";
  const scheduleCardCount = $(".schedule-card, .schedule-list > li").length;
  const isSchedulePage = /schedule/i.test(fileName);

  for (const rule of CONTENT_SIGNALS) {
    if (rule.category === "schedule" && rule.reason.includes("Japanese live-event")) {
      if (!isSchedulePage && scheduleCardCount === 0) continue;
    }
    if (rule.re.test(mainHtml) || rule.re.test(mainText)) {
      signals.push({ category: rule.category, priority: rule.priority, reason: rule.reason });
    }
  }

  if (scheduleCardCount > 0) {
    signals.push({
      category: "schedule",
      priority: scheduleCardCount >= 3 ? "High" : "Medium",
      reason: `${scheduleCardCount} schedule card(s) in DOM`,
    });
  }

  const discographyCount = $(".discography-item").length;
  if (discographyCount > 0) {
    signals.push({
      category: "discography",
      priority: "Medium",
      reason: `${discographyCount} discography item(s)`,
    });
  }

  if ($("form").length || $(".contact-form-placeholder").length) {
    signals.push({ category: "contact", priority: "Manual", reason: "Form or form placeholder present" });
  }

  if ($("iframe").length) {
    signals.push({ category: "contact", priority: "Manual", reason: "iframe embed detected" });
  }

  const snsInFooter = $("footer a[href*='instagram'], footer a[href*='youtube'], footer .social-links").length;
  if (snsInFooter > 0) {
    signals.push({ category: "sns_embed", priority: "Low", reason: "Footer social links" });
  }

  for (const rule of FILENAME_RULES) {
    if (rule.pattern.test(fileName)) {
      signals.push({ category: rule.category, priority: rule.priority, reason: rule.reason });
    }
  }

  return signals;
}

function mergePriority(a, b) {
  const order = { High: 4, Manual: 3.5, Medium: 3, Low: 1 };
  return (order[a] ?? 0) >= (order[b] ?? 0) ? a : b;
}

function buildCandidatesForPage({ source, fileName, route, html, astroPage }) {
  const $ = cheerio.load(html);
  const cmsTargets = extractCmsTargets(html);
  const contentSignals = analyzePageContent($, html, fileName);

  /** @type {Map<string, object>} */
  const byKey = new Map();

  function upsert(entry) {
    const key = `${entry.category}:${entry.sectionId ?? entry.label}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...entry, signals: [...(entry.signals ?? [])] });
      return;
    }
    existing.priority = mergePriority(existing.priority, entry.priority);
    existing.signals.push(...(entry.signals ?? []));
  }

  for (const t of cmsTargets) {
    upsert({
      category: t.category,
      sectionId: t.id,
      label: t.label,
      priority: t.priority,
      cmsTarget: t.id,
      signals: [`CMS_TARGET:${t.id}`],
      recommendCms: t.priority !== "Low",
    });
  }

  for (const s of contentSignals) {
    upsert({
      category: s.category,
      sectionId: null,
      label: s.reason,
      priority: s.priority,
      cmsTarget: null,
      signals: [s.reason],
      recommendCms: s.priority === "High" || s.priority === "Medium",
    });
  }

  const candidates = [...byKey.values()].map((c) => ({
    ...c,
    route,
    fileName,
    source,
    astroPage: astroPage ?? null,
  }));

  const pagePriority = candidates.reduce((best, c) => mergePriority(best, c.priority), "Low");

  return {
    route,
    fileName,
    source,
    astroPage,
    title: $("title").text().trim() || fileName,
    pagePriority,
    candidates,
    scheduleEventCount: $(".schedule-card, .schedule-list > li").length,
    hasForm: $("form, .contact-form-placeholder, iframe").length > 0,
  };
}

function analyzeHtmlDir(inputDir) {
  const inputAbs = path.resolve(inputDir);
  const htmlFiles = walkHtmlFiles(inputAbs);
  const pages = [];

  for (const rel of htmlFiles) {
    const full = path.join(inputAbs, rel);
    const html = fs.readFileSync(full, "utf8");
    pages.push(
      buildCandidatesForPage({
        source: "static-html",
        fileName: rel,
        route: htmlFileToAstroRoute(rel),
        html,
      }),
    );
  }

  return { inputDir: inputAbs, pages };
}

function analyzeAstroDir(astroDir, staticPages) {
  const astroAbs = path.resolve(astroDir);
  const astroFiles = walkAstroPages(astroAbs);
  const routeToStatic = new Map(staticPages.map((p) => [p.route, p]));

  const astroOnly = [];

  for (const rel of astroFiles) {
    const route = astroPageToRoute(rel);
    const full = path.join(astroAbs, "src", "pages", rel);
    const content = fs.readFileSync(full, "utf8");
    const htmlLike = content.replace(/\{[^}]*\}/g, " ");

    const targets = extractCmsTargets(content);
    if (targets.length === 0 && !/schedule/i.test(rel)) continue;

    const existing = routeToStatic.get(route);
    if (existing) {
      for (const t of targets) {
        const found = existing.candidates.find((c) => c.cmsTarget === t.id);
        if (found) {
          found.astroPage = rel;
          found.signals.push(`astro:${rel}`);
        } else {
          existing.candidates.push({
            category: t.category,
            sectionId: t.id,
            label: t.label,
            priority: t.priority,
            cmsTarget: t.id,
            signals: [`CMS_TARGET:${t.id}`, `astro-only-in-source-check`],
            recommendCms: true,
            route,
            fileName: existing.fileName,
            source: "static-html+astro",
            astroPage: rel,
          });
        }
      }
      existing.astroPage = rel;
    } else {
      astroOnly.push(
        buildCandidatesForPage({
          source: "astro-only",
          fileName: rel,
          route,
          html: `<main>${htmlLike}</main>`,
          astroPage: rel,
        }),
      );
    }
  }

  return { astroDir: astroAbs, astroOnly };
}

export function analyzeCmsCandidates({ inputDir, astroDir = null }) {
  const { inputDir: inputAbs, pages } = analyzeHtmlDir(inputDir);
  let astroOnly = [];

  if (astroDir) {
    const astro = analyzeAstroDir(astroDir, pages);
    astroOnly = astro.astroOnly;
  }

  const allPages = [...pages, ...astroOnly];
  const allCandidates = allPages.flatMap((p) => p.candidates);

  const byCategory = {};
  for (const cat of Object.keys(CMS_CATEGORIES)) {
    byCategory[cat] = allCandidates.filter((c) => c.category === cat);
  }

  /** Dedupe for summary counts: one entry per route + category */
  const deduped = [];
  const dedupeMap = new Map();
  for (const c of allCandidates) {
    const key = `${c.route}::${c.category}`;
    const existing = dedupeMap.get(key);
    if (!existing) {
      dedupeMap.set(key, { ...c, signals: [...c.signals] });
    } else {
      existing.priority = mergePriority(existing.priority, c.priority);
      existing.recommendCms = existing.recommendCms || c.recommendCms;
      if (c.cmsTarget && !existing.cmsTarget) existing.cmsTarget = c.cmsTarget;
      existing.signals.push(...c.signals);
    }
  }
  for (const v of dedupeMap.values()) deduped.push(v);

  const priorityCounts = { High: 0, Medium: 0, Low: 0, Manual: 0 };
  for (const c of deduped) {
    priorityCounts[c.priority] = (priorityCounts[c.priority] ?? 0) + 1;
  }

  const topHigh = deduped
    .filter((c) => c.priority === "High" && c.recommendCms)
    .sort((a, b) => a.route.localeCompare(b.route));

  const categoryRollup = [];
  for (const cat of Object.keys(CMS_CATEGORIES)) {
    const items = deduped.filter((c) => c.category === cat);
    if (!items.length) continue;
    const priority = items.reduce((best, c) => mergePriority(best, c.priority), "Low");
    categoryRollup.push({ category: cat, label: CMS_CATEGORIES[cat], priority, routes: [...new Set(items.map((i) => i.route))] });
  }

  const deferCms = deduped.filter((c) => c.priority === "Low");
  const manualReview = deduped.filter((c) => c.priority === "Manual");

  return {
    analyzedAt: new Date().toISOString(),
    inputDir: inputAbs,
    astroDir: astroDir ? path.resolve(astroDir) : null,
    pages: allPages,
    candidates: allCandidates,
    dedupedCandidates: deduped,
    byCategory,
    categoryRollup,
    priorityCounts,
    topHigh,
    deferCms,
    manualReview,
  };
}

export function formatCmsCandidatesReport(analysis) {
  const {
    analyzedAt,
    inputDir,
    astroDir,
    pages,
    candidates,
    dedupedCandidates,
    byCategory,
    categoryRollup,
    priorityCounts,
    topHigh,
    deferCms,
    manualReview,
  } = analysis;

  const lines = [
    "# CMS Candidates Report",
    "",
    "Generated by static-to-astro (Phase 3-A).",
    "",
    "## Metadata",
    "",
    `- **Input directory:** \`${inputDir}\``,
    `- **Astro directory:** ${astroDir ? `\`${astroDir}\`` : "— (not provided)"}`,
    `- **Analyzed at:** ${analyzedAt}`,
    `- **HTML pages:** ${pages.filter((p) => p.source !== "astro-only").length}`,
    `- **Astro-only pages:** ${pages.filter((p) => p.source === "astro-only").length}`,
    "",
    "## CMS candidate summary",
    "",
    "| Priority | Count | Meaning |",
    "| --- | ---: | --- |",
    "| High | " + priorityCounts.High + " | Frequent updates; strong CMS value |",
    "| Medium | " + priorityCounts.Medium + " | Occasional updates |",
    "| Low | " + priorityCounts.Low + " | Can remain static for now |",
    "| Manual | " + priorityCounts.Manual + " | Human decision required |",
    "",
    "**Total candidate regions (raw signals):** " + candidates.length,
    "**Deduped route×category entries:** " + dedupedCandidates.length,
    "",
    "### Category rollup",
    "",
    "| Category | Priority | Routes |",
    "| --- | --- | --- |",
  ];

  for (const row of categoryRollup.sort((a, b) => {
    const order = { High: 4, Medium: 3, Manual: 2, Low: 1 };
    return (order[b.priority] ?? 0) - (order[a.priority] ?? 0);
  })) {
    lines.push(`| ${row.category} | ${row.priority} | ${row.routes.map((r) => `\`${r}\``).join(", ")} |`);
  }
  lines.push("", "### Top CMS priorities (High)", "");

  if (topHigh.length) {
    for (const c of topHigh) {
      lines.push(`- **${c.route}** — ${c.label} (\`${c.cmsTarget ?? c.category}\`)`);
    }
  } else {
    lines.push("_No High-priority candidates detected._");
  }
  lines.push("");

  lines.push("## Page inventory", "", "| Route | Source file | Page priority | Schedule cards | Notes |", "| --- | --- | --- | ---: | --- |");
  for (const p of pages.sort((a, b) => a.route.localeCompare(b.route))) {
    const notes = [];
    if (p.hasForm) notes.push("form/embed");
    if (p.source === "astro-only") notes.push("astro-only");
    lines.push(
      `| \`${p.route}\` | \`${p.fileName}\` | ${p.pagePriority} | ${p.scheduleEventCount || "—"} | ${notes.join(", ") || "—"} |`,
    );
  }
  lines.push("");

  lines.push("## Candidates by category", "");
  for (const [cat, label] of Object.entries(CMS_CATEGORIES)) {
    const items = byCategory[cat] ?? [];
    if (!items.length) continue;
    lines.push(`### ${cat} — ${label}`, "");
    lines.push("| Route | Section | Priority | CMS_TARGET | Recommend CMS | Signals |", "| --- | --- | --- | --- | --- | --- |");
    for (const c of items) {
      lines.push(
        `| \`${c.route}\` | ${c.label} | ${c.priority} | ${c.cmsTarget ?? "—"} | ${c.recommendCms ? "yes" : "no"} | ${c.signals.slice(0, 3).join("; ")} |`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## CMS化優先度（ページ単位の目安）",
    "",
    "| Area | Suggested priority | Rationale |",
    "| --- | --- | --- |",
    "| Schedule monthly pages (`schedule-YYYY-MM`) | **High** | Many events per month; dates, venues, fees change often |",
    "| Home weekly schedule (`HOME_LIVE_SCHEDULE`) | **High** | Subset of schedule; should sync with `schedules` table |",
    "| Schedule index (`/schedule/`, Astro) | **High** | Generated month list; drive from CMS or derived query |",
    "| Discography | **Medium** | Updates on new releases only |",
    "| About / Profile | **Medium** | Biography changes occasionally |",
    "| Contact / Form | **Manual** | Form backend, spam, legal — not just CMS fields |",
    "| Link / external URLs | **Low** | Rarely changes; simple table or static |",
    "| Footer SNS links | **Low** | `site_settings` or static config |",
    "| Home hero image | **Low** | Visual asset; optional CMS media library later |",
    "",
  );

  lines.push("## Supabase table proposals (design only)", "");
  lines.push("_No database or Supabase connection in Phase 3-A — documentation only._", "");
  for (const table of SUPABASE_TABLE_PROPOSALS) {
    lines.push(`### \`${table.name}\``, "", table.description, "", "```txt");
    for (const col of table.columns) {
      lines.push(col);
    }
    lines.push("```", "");
  }

  lines.push("## Manual review checklist", "");
  for (const c of manualReview) {
    lines.push(`- [ ] \`${c.route}\` — ${c.label} (${c.priority})`);
  }
  if (!manualReview.length) lines.push("_No Manual-priority items._");
  lines.push("");

  lines.push("## Defer CMS (Low / static for now)", "");
  for (const c of deferCms) {
    lines.push(`- \`${c.route}\` — ${c.label}`);
  }
  lines.push("");

  lines.push(
    "## Not in scope this phase",
    "",
    "- Supabase connection, migrations, RLS",
    "- Admin UI / Auth",
    "- Data migration from HTML",
    "- Form submission backend",
    "- Astro CMS components",
    "",
    "## Next phase (3-B) suggestions",
    "",
    "1. Finalize Supabase schema from this report (start with `schedules` + `discography`)",
    "2. Seed script: parse `schedule-*.html` → JSON rows",
    "3. Astro content layer or API fetch for schedule list components",
    "4. Contact: choose form provider (Supabase Edge, external SaaS) before CMS fields",
    "5. Optional admin UI prototype in `tools/static-to-astro/` only",
    "",
  );

  return lines.join("\n");
}

export function writeCmsCandidatesReport({ analysis, outPath, astroDirForConversion = null }) {
  const outAbs = path.resolve(outPath);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  const content = formatCmsCandidatesReport(analysis);
  fs.writeFileSync(outAbs, content, "utf8");

  const conversionDir = astroDirForConversion ? path.resolve(astroDirForConversion) : null;
  if (conversionDir) {
    appendCmsCandidatesToConversionReport(conversionDir, {
      reportPath: outAbs,
      analysis,
    });
  }

  return { reportPath: outAbs, analysis };
}

export function appendCmsCandidatesToConversionReport(astroDir, { reportPath, analysis }) {
  const conversionPath = path.join(astroDir, "CONVERSION_REPORT.md");
  if (!fs.existsSync(conversionPath)) return;

  const relReport = path.relative(astroDir, reportPath);
  const { priorityCounts, topHigh } = analysis;
  const topList = topHigh.length
    ? topHigh.slice(0, 5).map((c) => `\`${c.route}\` (${c.label})`).join(", ")
    : "—";

  const block = [
    "",
    "## CMS candidates (Phase 3-A)",
    "",
    `- **Report:** \`${relReport}\``,
    `- **High candidates:** ${priorityCounts.High}`,
    `- **Medium candidates:** ${priorityCounts.Medium}`,
    `- **Low candidates:** ${priorityCounts.Low}`,
    `- **Manual candidates:** ${priorityCounts.Manual}`,
    `- **Top priorities:** ${topList}`,
    "",
    "### Phase 3-B (planned)",
    "",
    "- Supabase schema + seed from static HTML",
    "- Schedule / discography Astro components wired to data",
    "- Contact form backend decision",
    "- Admin UI prototype (tooling only, not production `src/`)",
    "",
  ].join("\n");

  let content = fs.readFileSync(conversionPath, "utf8");
  const marker = "## CMS candidates (Phase 3-A)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(conversionPath, content, "utf8");
}
