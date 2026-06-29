import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  analyzeStaticSite,
  collectInlineHeadStyles,
  layoutImportFromPagePath,
} from "./static-site-analyzer.mjs";
import {
  applyBaseUrlToPages,
  applyBaseUrlToSeo,
  normalizeBaseUrl,
  pagesNeedingDomainReview,
} from "./base-url.mjs";
import { formatConversionReport } from "./conversion-report.mjs";
import {
  buildSeoPublishReadiness,
  generateRobotsTxt,
} from "./seo-publish.mjs";
import {
  appendWixStagingVisualOverrides,
} from "./wix-staging-visual-overrides.mjs";
import {
  isBlockedExternalStylesheetHref,
  sanitizeWixFontCss,
} from "./wix-font-safety.mjs";
import { normalizeDeployBase } from "./deploy-base.mjs";
import {
  runBuildVerification,
  verifyGeneratedStructure,
} from "./site-verification.mjs";
import { generateHeaderAstro } from "./header-transform.mjs";
import {
  cmsKitScheduleMonthRoute,
  parseScheduleMonthSourcePath,
  detectScheduleMonthPages,
  SCHEDULE_INDEX_ROUTE,
  LIVE_CRAWL_MONTH_FILENAME,
} from "./schedule-pages.mjs";
import { analyzeJavaScript, jsPublicPath } from "./js-analysis.mjs";
import {
  collectInternalSeoAssetPaths,
  listMissingSeoFields,
  seoToLayoutProps,
} from "./seo-extract.mjs";
import { escapeAstroPropString, transformHtmlFragment } from "./path-transform.mjs";
import {
  applyAdminCmsTemplateBundle,
  generateAstroConfigWithAdminCms,
  generatePackageJsonWithAdminCms,
  resolveAdminCmsTemplateRoot,
} from "./admin-cms-template.mjs";
import {
  buildSiteProfileSummary,
  resolveSiteProfile,
} from "./site-profile-loader.mjs";
import {
  applyScheduleDataViews,
  scheduleMonthsFromDetected,
} from "./schedule-seed-extractor.mjs";
import {
  applyGosakiAboutBandProfiles,
  isGosakiPianoFixture,
} from "./gosaki-about-band-profiles.mjs";
import { applyGosakiAboutContent } from "./gosaki-about-content.mjs";
import { applyGosakiHomeYouTubeEmbed } from "./gosaki-home-youtube-embed.mjs";
import { applyGosakiContactHubspotEmbed } from "./gosaki-contact-hubspot-embed.mjs";
import { applyGosakiScheduleDataPages } from "./gosaki-schedule-data-pages.mjs";
import {
  injectDiscographyDataSourceMarker,
  patchGosakiDiscographyPurchaseUrls,
} from "./supabase-discography-read.mjs";
import { applyGosakiStagingReadOnlyAdmin } from "./gosaki-staging-read-only-admin.mjs";
import { generateGosakiFooterAstro } from "./gosaki-footer-social.mjs";

const TRAILING_SLASH = "always";
const GLOBAL_CSS_PATH = "src/styles/global.css";
const TOOL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function copyPublicStagingLibs(outDir) {
  const libNames = ["resolve-public-seo.ts", "with-base.ts"];
  for (const name of libNames) {
    const src = path.join(TOOL_ROOT, "templates/admin-cms/src/lib", name);
    const dest = path.join(outDir, "src/lib", name);
    if (!fs.existsSync(src)) continue;
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function rmDirRecursive(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}

function collectCssFiles(siteDir, analysis) {
  const files = new Set();
  for (const p of analysis.rawPages) {
    for (const ref of p.cssRefs) {
      if (ref.kind === "internal" && ref.resolved && !ref.resolved.startsWith("(")) {
        files.add(ref.resolved.replace(/^\//, ""));
      }
    }
  }
  return [...files];
}

function collectExternalStylesheets(rawPages) {
  const byHref = new Map();
  for (const page of rawPages) {
    for (const ref of page.cssRefs) {
      if (ref.kind !== "external") continue;
      const prev = byHref.get(ref.raw) ?? { href: ref.raw, pages: [] };
      if (!prev.pages.includes(page.relPath)) prev.pages.push(page.relPath);
      byHref.set(ref.raw, prev);
    }
    page.$('link[rel="preconnect"], link[rel="dns-prefetch"]').each((_, el) => {
      const href = page.$(el).attr("href");
      if (!href || !/^https?:\/\//i.test(href)) return;
      const key = `preconnect:${href}`;
      const prev = byHref.get(key) ?? { href, rel: page.$(el).attr("rel"), pages: [], isPreconnect: true };
      if (!prev.pages.includes(page.relPath)) prev.pages.push(page.relPath);
      byHref.set(key, prev);
    });
  }
  return [...byHref.values()];
}

function collectForms(rawPages) {
  const forms = [];
  for (const page of rawPages) {
    page.$("form").each((_, el) => {
      forms.push({
        file: page.relPath,
        action: page.$(el).attr("action") ?? "",
        method: (page.$(el).attr("method") ?? "get").toUpperCase(),
      });
    });
  }
  return forms;
}

function collectIframes(rawPages) {
  const iframes = [];
  for (const page of rawPages) {
    page.$("iframe").each((_, el) => {
      iframes.push({
        file: page.relPath,
        src: page.$(el).attr("src") ?? "",
        title: page.$(el).attr("title") ?? "",
      });
    });
  }
  return iframes;
}

function cssExpectsMainWrapper(globalCss) {
  return /\bmain\s*\{[^}]*max-width/i.test(globalCss);
}

function buildGlobalCss(siteDir, cssRelPaths, inlineHeadStyles = []) {
  const parts = [
    "/* Generated by static-to-astro — Phase 2-D+ */",
    "/* Consolidated from static site stylesheets */",
    "",
  ];

  for (const rel of cssRelPaths) {
    const abs = path.join(siteDir, rel);
    if (!fs.existsSync(abs)) {
      parts.push(`/* MISSING: ${rel} */`, "");
      continue;
    }
    const content = fs.readFileSync(abs, "utf8");
    parts.push(`/* --- source: ${rel} --- */`, content, "");
  }

  if (inlineHeadStyles.length) {
    parts.push("/* --- inline head styles (Wix / live-crawl) --- */", "");
    for (const style of inlineHeadStyles) {
      const label = style.dataUrl
        ? `/* source: ${style.dataUrl} */`
        : "/* source: inline head style */";
      parts.push(label, sanitizeWixFontCss(style.content), "");
    }
  }

  return parts.join("\n");
}

function copyJsAssetsToOutput(siteDir, outputDir, jsAnalysis) {
  const copied = [];
  const destBase = path.join(outputDir, "public/assets/js");
  ensureDir(destBase);

  const allEntries = [
    ...jsAnalysis.layoutScripts.map((e) => ({ ...e, scope: "global" })),
    ...jsAnalysis.sharedPartialScripts.map((e) => ({ ...e, scope: "shared-partial" })),
    ...jsAnalysis.pageSpecificScripts.map((e) => ({ ...e, scope: "page-specific", file: e.file })),
  ];

  const seen = new Set();
  for (const entry of allEntries) {
    if (seen.has(entry.resolved)) continue;
    seen.add(entry.resolved);

    const rel = entry.resolved.replace(/^\//, "");
    const src = path.join(siteDir, rel);
    if (!fs.existsSync(src)) continue;

    const destRel = rel.replace(/^js\//, "");
    const dest = path.join(destBase, destRel);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);

    const to = jsPublicPath(entry.resolved);
    copied.push({
      from: rel,
      to,
      scope: entry.scope ?? "global",
      file: entry.file,
    });
  }

  return copied;
}

function copySeoAssets(siteDir, analysis, outputDir) {
  const copied = [];
  const relPaths = collectInternalSeoAssetPaths(analysis.pages);

  for (const rel of relPaths) {
    const src = path.join(siteDir, rel);
    if (!fs.existsSync(src)) continue;

    let destRel = rel;
    if (!destRel.startsWith("images/") && !destRel.startsWith("assets/") && !/favicon|icon/i.test(destRel)) {
      if (/\.(svg|ico|png|jpe?g|webp)$/i.test(destRel)) {
        destRel = destRel.includes("/") ? destRel : destRel;
      }
    }

    const dest = path.join(outputDir, "public", destRel);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    copied.push({ from: rel, to: `/${destRel.replace(/\\/g, "/")}` });
  }

  return copied;
}

function copyImageAssets(siteDir, analysis, outputDir) {
  const copied = new Set();

  const copyFile = (rel) => {
    const normalized = rel.replace(/^\//, "");
    const src = path.join(siteDir, normalized);
    if (!fs.existsSync(src)) return;

    let destRel = normalized;
    if (!destRel.startsWith("images/") && !destRel.startsWith("assets/")) {
      destRel = `images/${path.basename(normalized)}`;
    }
    const dest = path.join(outputDir, "public", destRel);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    copied.add(destRel);
  };

  for (const imgPath of analysis.assets.images) {
    copyFile(imgPath);
  }

  for (const dir of ["images", "assets"]) {
    const abs = path.join(siteDir, dir);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) continue;
    walkFiles(abs, (file) => {
      const rel = path.posix.join(dir, path.relative(abs, file).split(path.sep).join("/"));
      if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(rel)) copyFile(`/${rel}`);
    });
  }

  return [...copied];
}

function walkFiles(dir, onFile) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, onFile);
    else onFile(full);
  }
}

function generateGitignore() {
  return `node_modules/
dist/
.astro/
.env
.env.local
.DS_Store
`;
}

function generateBaseLayout({ layoutScripts, externalCss, wixStaticExport = false }) {
  const externalLinks = externalCss
    .filter((c) => !c.isPreconnect)
    .map((c) => `    <link rel="stylesheet" href="${c.href}" />`)
    .join("\n");

  const preconnects = externalCss
    .filter((c) => c.isPreconnect)
    .map((c) => `    <link rel="${c.rel || "preconnect"}" href="${c.href}" />`)
    .join("\n");

  const scriptLines = layoutScripts.length
    ? layoutScripts
        .map(
          (s) =>
            `    <!-- Local JS (all pages) — copied from static site -->\n    <script is:inline src="${s.to}"></script>`,
        )
        .join("\n")
    : "";

  const externalBlock = [preconnects, externalLinks].filter(Boolean).join("\n");
  const externalComment = externalBlock
    ? `    <!-- External CSS/fonts preserved from source HTML -->\n${externalBlock}`
    : "";

  return `---
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
import { resolvePublicSeoUrls } from "../lib/resolve-public-seo.ts";
import "../styles/global.css";

interface Props {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: string;
  favicon?: string;
  appleTouchIcon?: string;
  lang?: string;
  robots?: string;
}

const {
  title = "Untitled",
  description = "",
  canonical = "",
  ogTitle = title,
  ogDescription = description,
  ogImage = "",
  ogType = "website",
  ogUrl = canonical,
  twitterCard = "summary_large_image",
  favicon = "",
  appleTouchIcon = "",
  lang = "ja",
  robots = "",
} = Astro.props;

const seoResolved = resolvePublicSeoUrls({
  canonical,
  ogUrl,
  pathname: Astro.url.pathname,
});
const resolvedCanonical = seoResolved.canonical;
const resolvedOgUrl = seoResolved.ogUrl;
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    {robots ? (
      <meta name="robots" content={robots} />
    ) : (
      import.meta.env.BASE_URL !== "/" && (
        <meta name="robots" content="noindex,nofollow,noarchive" />
      )
    )}
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    {resolvedCanonical && <link rel="canonical" href={resolvedCanonical} />}
    <meta property="og:title" content={ogTitle} />
    {ogDescription && <meta property="og:description" content={ogDescription} />}
    {ogImage && <meta property="og:image" content={ogImage} />}
    <meta property="og:type" content={ogType} />
    {resolvedOgUrl && <meta property="og:url" content={resolvedOgUrl} />}
    {twitterCard && <meta name="twitter:card" content={twitterCard} />}
    {twitterCard && ogTitle && <meta name="twitter:title" content={ogTitle} />}
    {twitterCard && ogDescription && <meta name="twitter:description" content={ogDescription} />}
    {twitterCard && ogImage && <meta name="twitter:image" content={ogImage} />}
    {favicon && <link rel="icon" href={favicon} />}
    {appleTouchIcon && <link rel="apple-touch-icon" href={appleTouchIcon} />}
${externalComment}
  </head>
  <body${wixStaticExport ? ' class="wix-static-export device-desktop responsive"' : ""}>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
${scriptLines}
  </body>
</html>
`;
}

const LAYOUT_PROP_KEYS = [
  "title",
  "description",
  "canonical",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "ogType",
  "ogUrl",
  "twitterCard",
  "favicon",
  "appleTouchIcon",
  "lang",
  "robots",
];

function formatBaseLayoutOpen(props) {
  const lines = LAYOUT_PROP_KEYS.filter((key) => props[key] !== undefined && props[key] !== "")
    .map((key) => `  ${key}="${escapeAstroPropString(props[key])}"`);
  if (!lines.length) return "<BaseLayout>";
  return `<BaseLayout\n${lines.join("\n")}\n>`;
}

function generateComponent(html, placeholder, linkTransformContext = {}) {
  let body;
  if (html?.trim()) {
    const stripped = html
      .replace(/\s+aria-current="[^"]*"/gi, "")
      .replace(/\bis-current\b/g, "")
      .replace(/\s+class="\s*"/gi, "");
    body = transformHtmlFragment(stripped, "index.html", linkTransformContext);
  } else {
    body = `<!-- ${placeholder} — not detected; replace manually -->`;
  }

  return `${body}\n`;
}

function escapeHtmlText(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {ReturnType<typeof detectScheduleMonthPages>} scheduleMonths
 * @param {string | null} baseUrl
 * @param {string} deployBase
 */
function generateScheduleIndexPage(scheduleMonths, baseUrl, deployBase) {
  const layoutImport = layoutImportFromPagePath("schedule/index.astro");
  const route = SCHEDULE_INDEX_ROUTE;
  const seo = applyBaseUrlToSeo(
    {
      title: "Schedule | saki-goto",
      description: "",
      canonical: "",
      ogTitle: "Schedule | saki-goto",
      ogDescription: "",
      ogImage: "",
      ogType: "website",
      ogUrl: "",
      twitterCard: "summary_large_image",
      favicon: "",
      appleTouchIcon: "",
      lang: "ja",
    },
    route,
    baseUrl,
    deployBase,
  );
  const layoutOpen = formatBaseLayoutOpen(seoToLayoutProps(seo));

  const listItems = scheduleMonths
    .map(
      (m) =>
        `      <a href={withBase('${escapeHtmlText(m.route)}')} class="gosaki-schedule-month-link">${escapeHtmlText(m.label)}</a>`,
    )
    .join("\n");

  const content = `  <section class="gosaki-schedule-hub">
    <h1 class="gosaki-schedule-hub__title">Schedule</h1>
    <div class="gosaki-schedule-months">
      <!-- CMS_TARGET: SCHEDULE_INDEX -->
${listItems}
    </div>
  </section>`;

  return `---
import BaseLayout from "${layoutImport}";
import { withBase } from "../../lib/with-base.ts";
---

${layoutOpen}
${content}
</BaseLayout>
`;
}

/**
 * Thin legacy compatibility page for Wix `/YYYY-MM/` URLs (G-9c0b).
 * @param {{ route: string, year: string, month: string, label: string }} monthEntry
 * @param {string | null} baseUrl
 * @param {string} deployBase
 */
function generateScheduleLegacyMonthStubPage(monthEntry, baseUrl, deployBase) {
  const { year, month, label, route: canonicalRoute } = monthEntry;
  const legacyPagePath = `${year}-${month}/index.astro`;
  const layoutImport = layoutImportFromPagePath(legacyPagePath);
  const withBaseImportDepth = legacyPagePath.split("/").length;
  const withBaseImport = `${"../".repeat(withBaseImportDepth)}lib/with-base.ts`;

  const seo = applyBaseUrlToSeo(
    {
      title: `Schedule ${label} | saki-goto`,
      description: `The schedule page for ${label} has moved.`,
      canonical: "",
      ogTitle: `Schedule ${label} | saki-goto`,
      ogDescription: `The schedule page for ${label} has moved.`,
      ogImage: "",
      ogType: "website",
      ogUrl: "",
      twitterCard: "summary_large_image",
      favicon: "",
      appleTouchIcon: "",
      lang: "ja",
    },
    canonicalRoute,
    baseUrl,
    deployBase,
  );
  const layoutProps = {
    ...seoToLayoutProps(seo),
    robots: "noindex,follow",
  };
  const layoutOpen = formatBaseLayoutOpen(layoutProps);

  const content = `  <section class="gosaki-schedule-legacy-stub">
    <h1 class="gosaki-schedule-legacy-stub__title">Schedule page moved</h1>
    <p class="gosaki-schedule-legacy-stub__message">This schedule page has moved to a new location.</p>
    <p><a href={withBase('${escapeHtmlText(canonicalRoute)}')} class="gosaki-schedule-legacy-stub__link">Go to ${escapeHtmlText(label)} schedule</a></p>
  </section>`;

  return `---
import BaseLayout from "${layoutImport}";
import { withBase } from "${withBaseImport}";
---

${layoutOpen}
${content}
</BaseLayout>
`;
}

function generatePage(page, mainHtml, pageScripts = [], linkTransformContext = {}) {
  const layoutImport = layoutImportFromPagePath(page.pagePath);
  const content = transformHtmlFragment(mainHtml, page.sourcePath, linkTransformContext);
  const layoutProps = seoToLayoutProps(page.seo);
  if (page.seo.appleTouchIcon) {
    layoutProps.appleTouchIcon = page.seo.appleTouchIcon;
  }
  const layoutOpen = formatBaseLayoutOpen(layoutProps);

  const pageScriptBlock =
    pageScripts.length > 0
      ? `\n${pageScripts
          .map(
            (s) =>
              `<!-- Page-specific JS: ${s.from} -->\n<script is:inline src="${s.to}"></script>`,
          )
          .join("\n")}`
      : "";

  return `---
import BaseLayout from "${layoutImport}";
---

${layoutOpen}
${content}
</BaseLayout>${pageScriptBlock}
`;
}

function buildSeoReportRows(pages) {
  return pages.map((page) => {
    const props = seoToLayoutProps(page.seo);
    const missing = listMissingSeoFields(page.seo);
    return {
      file: page.sourcePath,
      route: page.route,
      title: props.title,
      description: props.description,
      canonical: props.canonical,
      ogUrl: props.ogUrl,
      ogTitle: props.ogTitle,
      ogDescription: props.ogDescription,
      ogImage: props.ogImage,
      favicon: props.favicon,
      lang: props.lang,
      missing,
      canonicalOriginal: page.seo.canonicalOriginal ?? "",
      ogUrlOriginal: page.seo.ogUrlOriginal ?? "",
      ogImageOriginal: page.seo.ogImageOriginal ?? "",
      baseUrlApplied: page.seo.baseUrlApplied ?? false,
    };
  });
}

function generatePackageJson(baseUrl) {
  const dependencies = {
    astro: "^5.7.0",
  };
  if (normalizeBaseUrl(baseUrl)) {
    dependencies["@astrojs/sitemap"] = "^3.7.0";
  }

  return JSON.stringify(
    {
      name: "generated-static-astro",
      private: true,
      type: "module",
      scripts: {
        dev: "astro dev",
        build: "astro build",
        preview: "astro preview",
      },
      dependencies,
      devDependencies: {},
    },
    null,
    2,
  );
}

/**
 * @param {string | null} baseUrl
 * @param {string | null | undefined} deployBase
 * @param {{ excludeLegacyMonthRoutesFromSitemap?: boolean }} [options]
 */
function generateAstroConfig(baseUrl, deployBase = "/", options = {}) {
  const site = normalizeBaseUrl(baseUrl);
  const base = normalizeDeployBase(deployBase);
  const baseLine = base !== "/" ? `  base: "${base}",\n` : "";
  const sitemapIntegration = options.excludeLegacyMonthRoutesFromSitemap
    ? `  integrations: [sitemap({
    filter: (page) => {
      try {
        const pathname = new URL(page).pathname;
        const p = pathname.endsWith("/") ? pathname : \`\${pathname}/\`;
        if (/^\\/\\d{4}-\\d{2}\\/$/.test(p)) return false;
        return !(/\\/\\d{4}-\\d{2}\\/$/.test(p) && !/\\/schedule\\/\\d{4}-\\d{2}\\/$/.test(p));
      } catch {
        return true;
      }
    },
  })],`
    : `  integrations: [sitemap()],`;

  if (!site) {
    return `import { defineConfig } from "astro/config";

// Generated by static-to-astro (Phase 2-F)
export default defineConfig({
${baseLine}  trailingSlash: "${TRAILING_SLASH}",
});
`;
  }

  return `import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Generated by static-to-astro (Phase 2-F)
export default defineConfig({
  site: "${site}",
${baseLine}  trailingSlash: "${TRAILING_SLASH}",
${sitemapIntegration}
});
`;
}

function generateTsConfig() {
  return JSON.stringify(
    {
      extends: "astro/tsconfigs/strict",
      include: [".astro/types.d.ts", "**/*"],
      exclude: ["dist"],
    },
    null,
    2,
  );
}

function buildManualReviewItems({
  missingAssets,
  jsAnalysis,
  forms,
  iframes,
  externalCss,
  seoMissingFields,
  baseUrl,
  scheduleIndexGenerated,
}) {
  const items = [];
  if (scheduleIndexGenerated) {
    items.push("Schedule hub at `/schedule/` — month pages linked from index; header uses single Schedule link.");
  }
  if (missingAssets.length) {
    items.push(`**${missingAssets.length} missing asset(s)** — see table above; add files or fix HTML references.`);
  }
  if (forms.length) {
    items.push("Contact/form pages need a new form backend (action URLs are not migrated automatically).");
  }
  if (iframes.length) {
    items.push("Iframe embeds (maps, widgets) — verify CSP and third-party availability in production.");
  }
  if (jsAnalysis.externalScripts.length) {
    items.push(`${jsAnalysis.externalScripts.length} external script(s) — not copied; keep or replace manually.`);
  }
  if (jsAnalysis.inlineScripts.length) {
    items.push(`${jsAnalysis.inlineScripts.length} inline script block(s) — reimplement in Astro/client script if needed.`);
  }
  if (jsAnalysis.sharedPartialScripts.length) {
    for (const s of jsAnalysis.sharedPartialScripts) {
      items.push(`JS \`${s.resolved}\` used on ${s.pages.length} pages only — loaded in BaseLayout; confirm scope.`);
    }
  }
  if (jsAnalysis.pageSpecificScripts.length) {
    items.push(`${jsAnalysis.pageSpecificScripts.length} page-specific JS file(s) — script tags added on those pages only.`);
  }
  if (externalCss.length) {
    items.push("External CSS/font links preserved in BaseLayout — review privacy and performance.");
  }
  if (seoMissingFields?.length) {
    items.push(`${seoMissingFields.length} page(s) missing some SEO fields in source HTML — see SEO section.`);
  }
  if (!baseUrl) {
    items.push("**baseUrl not specified** — canonical / og:url / og:image need production URL verification (see baseUrl section).");
  } else {
    items.push(`baseUrl \`${baseUrl}\` applied — verify domain before deploy.`);
  }
  return items;
}

/**
 * @param {string} inputDir
 * @param {string} outputDir
 * @param {{ dryRun?: boolean, baseUrl?: string | null }} options
 */
function fixtureLabelFromPath(siteDir) {
  const base = path.basename(siteDir);
  if (base === "gosaki-static-site") return "gosaki-static-site";
  return base;
}

function toCanonicalScheduleMonthPage(page, baseUrl, deployBase) {
  const parsed = parseScheduleMonthSourcePath(page.sourcePath);
  if (!parsed) return page;
  const route = cmsKitScheduleMonthRoute(parsed.year, parsed.month);
  return {
    ...page,
    route,
    astroRoute: route,
    pagePath: `schedule/${parsed.year}-${parsed.month}/index.astro`,
    seo: applyBaseUrlToSeo(page.seo, route, baseUrl, deployBase),
  };
}

function resolveProductionOrigin(siteDir, options) {
  if (options.productionBaseUrl) {
    return normalizeBaseUrl(options.productionBaseUrl);
  }
  const manifestPath = path.join(siteDir, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      if (manifest.origin) return String(manifest.origin).replace(/\/+$/, "");
      if (manifest.startUrl) return normalizeBaseUrl(manifest.startUrl);
    } catch {
      /* ignore malformed manifest */
    }
  }
  return null;
}

export function generateAstroProject(inputDir, outputDir, options = {}) {
  const siteDir = path.resolve(inputDir);
  const outDir = path.resolve(outputDir);
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? null);
  const deployBase = normalizeDeployBase(options.deployBase ?? "/");
  const withAdminCms = Boolean(options.withAdminCms);
  const siteProfileResolved = resolveSiteProfile({
    siteProfileId: options.siteProfile ?? null,
    withAdminCms,
    toolRoot: TOOL_ROOT,
  });
  const siteProfileSummary = buildSiteProfileSummary(siteProfileResolved.profile, {
    source: siteProfileResolved.source,
  });

  const analysis = analyzeStaticSite(siteDir);
  analysis.pages = applyBaseUrlToPages(analysis.pages, baseUrl, deployBase);
  if (isGosakiPianoFixture(siteDir)) {
    analysis.pages = analysis.pages.map((page) => toCanonicalScheduleMonthPage(page, baseUrl, deployBase));
  }
  const domainReviewPages = baseUrl ? [] : pagesNeedingDomainReview(analysis.pages);
  const jsAnalysis = analyzeJavaScript(analysis.rawPages);
  const externalCss = collectExternalStylesheets(analysis.rawPages).filter(
    (entry) => !isBlockedExternalStylesheetHref(entry.href),
  );
  const forms = collectForms(analysis.rawPages);
  const iframes = collectIframes(analysis.rawPages);
  const missingAssets = analysis.missingAssets;

  if (options.dryRun) {
    return { analysis, dryRun: true, files: [], jsAnalysis, missingAssets, baseUrl };
  }

  rmDirRecursive(outDir);
  ensureDir(outDir);

  const cssRelPaths = collectCssFiles(siteDir, analysis);
  const inlineHeadStyles = collectInlineHeadStyles(analysis.rawPages);
  const wixStaticExport = inlineHeadStyles.length > 0;
  const globalCss = sanitizeWixFontCss(
    appendWixStagingVisualOverrides(
      buildGlobalCss(siteDir, cssRelPaths, inlineHeadStyles),
      { inlineHeadStyleCount: inlineHeadStyles.length, siteSlug: fixtureLabelFromPath(siteDir) },
    ),
  );
  const mainWrapperApplied = cssExpectsMainWrapper(globalCss);
  writeFile(path.join(outDir, "src/styles/global.css"), globalCss);

  const jsCopied = copyJsAssetsToOutput(siteDir, outDir, jsAnalysis);
  const layoutScripts = jsAnalysis.layoutScripts.map((s) => ({
    from: s.resolved.replace(/^\//, ""),
    to: jsPublicPath(s.resolved),
  }));

  for (const partial of jsAnalysis.sharedPartialScripts) {
    if (!layoutScripts.some((l) => l.to === jsPublicPath(partial.resolved))) {
      layoutScripts.push({
        from: partial.resolved.replace(/^\//, ""),
        to: jsPublicPath(partial.resolved),
      });
    }
  }

  const imagesCopied = copyImageAssets(siteDir, analysis, outDir);
  const seoAssetsCopied = copySeoAssets(siteDir, analysis, outDir);
  ensureDir(path.join(outDir, "public/assets"));

  const productionOrigin = resolveProductionOrigin(siteDir, options);
  /** @type {{ productionOrigin: string | null }} */
  const linkTransformContext = { productionOrigin };

  const headerHtml = analysis.common.header.html;
  const footerHtml = analysis.common.footer.html;
  const scheduleMonthPages = detectScheduleMonthPages(analysis.pages);
  const scheduleHub = scheduleMonthPages.length > 0;

  const gosakiScheduleBundle = options.gosakiScheduleBundle ?? null;
  const gosakiDiscographyBundle = options.gosakiDiscographyBundle ?? null;
  const useGosakiScheduleData =
    isGosakiPianoFixture(siteDir) &&
    gosakiScheduleBundle &&
    (gosakiScheduleBundle.scheduleDataSource === "supabase" ||
      gosakiScheduleBundle.scheduleDataSource === "static-fallback") &&
    gosakiScheduleBundle.schedules.length > 0;

  const gosakiDataMonthRoutes = useGosakiScheduleData
    ? new Set(gosakiScheduleBundle.months.map((m) => m.route))
    : null;

  const headerResult = generateHeaderAstro(headerHtml, "Header", {
    scheduleHub,
    productionOrigin,
  });
  writeFile(path.join(outDir, "src/components/Header.astro"), headerResult.content);
  writeFile(
    path.join(outDir, "src/components/Footer.astro"),
    isGosakiPianoFixture(siteDir)
      ? generateGosakiFooterAstro(footerHtml, linkTransformContext)
      : generateComponent(footerHtml, "Footer", linkTransformContext),
  );
  writeFile(
    path.join(outDir, "src/layouts/BaseLayout.astro"),
    generateBaseLayout({ layoutScripts, externalCss, wixStaticExport }),
  );
  copyPublicStagingLibs(outDir);

  const pageScriptMap = new Map();
  for (const entry of jsAnalysis.pageSpecificScripts) {
    const scripts = pageScriptMap.get(entry.file) ?? [];
    scripts.push({ from: entry.resolved.replace(/^\//, ""), to: jsPublicPath(entry.resolved) });
    pageScriptMap.set(entry.file, scripts);
  }

  const writtenPages = [];
  /** @type {{ discographyDataSource?: string, rowCount?: number, patchCount?: number } | null} */
  let gosakiDiscographyDataSummary = null;
  for (const page of analysis.pages) {
    if (useGosakiScheduleData && gosakiDataMonthRoutes?.has(page.route)) {
      continue;
    }
    const pageFile = path.join(outDir, "src/pages", page.pagePath);
    const pageScripts = pageScriptMap.get(page.sourcePath) ?? [];
    let mainHtml = page.mainHtml;
    if (
      isGosakiPianoFixture(siteDir) &&
      page.route === "/discography/" &&
      gosakiDiscographyBundle?.discographyDataSource === "supabase" &&
      gosakiDiscographyBundle.releases.length > 0
    ) {
      const patched = patchGosakiDiscographyPurchaseUrls(
        mainHtml,
        gosakiDiscographyBundle.releases,
      );
      mainHtml = patched.html;
      mainHtml = injectDiscographyDataSourceMarker(mainHtml, "supabase");
      gosakiDiscographyDataSummary = {
        discographyDataSource: "supabase",
        rowCount: gosakiDiscographyBundle.releases.length,
        patchCount: patched.patches.length,
      };
    }
    writeFile(pageFile, generatePage(page, mainHtml, pageScripts, linkTransformContext));
    writtenPages.push(pageFile);
  }

  let scheduleIndexGenerated = false;
  let legacyMonthStubsGenerated = 0;
  /** @type {{ scheduleDataSource?: string, eventCount?: number, fallbackReason?: string | null } | null} */
  let gosakiScheduleDataSummary = null;
  if (scheduleHub) {
    if (useGosakiScheduleData) {
      gosakiScheduleDataSummary = applyGosakiScheduleDataPages(outDir, gosakiScheduleBundle, {
        baseUrl,
        deployBase,
      });
      writtenPages.push(gosakiScheduleDataSummary.hubPath, ...gosakiScheduleDataSummary.monthPaths);
      scheduleIndexGenerated = true;
    } else {
      const scheduleIndexPath = path.join(outDir, "src/pages/schedule/index.astro");
      writeFile(scheduleIndexPath, generateScheduleIndexPage(scheduleMonthPages, baseUrl, deployBase));
      writtenPages.push(scheduleIndexPath);
      scheduleIndexGenerated = true;
    }

    if (isGosakiPianoFixture(siteDir)) {
      for (const monthEntry of scheduleMonthPages) {
        const parsed = parseScheduleMonthSourcePath(monthEntry.sourcePath);
        if (!parsed || !LIVE_CRAWL_MONTH_FILENAME.test(parsed.basename)) continue;
        const legacyPagePath = `${parsed.year}-${parsed.month}/index.astro`;
        const legacyFile = path.join(outDir, "src/pages", legacyPagePath);
        writeFile(
          legacyFile,
          generateScheduleLegacyMonthStubPage(monthEntry, baseUrl, deployBase),
        );
        writtenPages.push(legacyFile);
        legacyMonthStubsGenerated += 1;
      }
    }
  }

  let gosakiBandProfilesSummary = { applied: false };
  let gosakiAboutContentSummary = { applied: false };
  let gosakiYoutubeEmbedSummary = { applied: false };
  let gosakiContactHubspotSummary = { applied: false };
  let gosakiReadOnlyAdminSummary = { applied: false };
  if (isGosakiPianoFixture(siteDir)) {
    gosakiBandProfilesSummary = applyGosakiAboutBandProfiles(outDir, TOOL_ROOT);
    if (gosakiBandProfilesSummary.applied) {
      writtenPages.push(path.join(outDir, gosakiBandProfilesSummary.componentPath));
      writtenPages.push(path.join(outDir, gosakiBandProfilesSummary.dataPath));
    }
    gosakiAboutContentSummary = applyGosakiAboutContent(outDir, TOOL_ROOT);
    if (gosakiAboutContentSummary.applied) {
      writtenPages.push(path.join(outDir, gosakiAboutContentSummary.dataPath));
    }
    gosakiYoutubeEmbedSummary = applyGosakiHomeYouTubeEmbed(outDir, TOOL_ROOT);
    if (gosakiYoutubeEmbedSummary.applied) {
      writtenPages.push(path.join(outDir, gosakiYoutubeEmbedSummary.componentPath));
      writtenPages.push(path.join(outDir, gosakiYoutubeEmbedSummary.dataPath));
      writtenPages.push(path.join(outDir, gosakiYoutubeEmbedSummary.libPath));
    }
    gosakiContactHubspotSummary = applyGosakiContactHubspotEmbed(outDir, TOOL_ROOT);
    if (gosakiContactHubspotSummary.applied) {
      writtenPages.push(path.join(outDir, gosakiContactHubspotSummary.dataPath));
    }
    gosakiReadOnlyAdminSummary = applyGosakiStagingReadOnlyAdmin(outDir, TOOL_ROOT);
    if (gosakiReadOnlyAdminSummary.applied) {
      writtenPages.push(path.join(outDir, gosakiReadOnlyAdminSummary.pagePath));
      writtenPages.push(path.join(outDir, gosakiReadOnlyAdminSummary.libPath));
    }
  }

  writeFile(path.join(outDir, "package.json"), generatePackageJson(baseUrl));
  writeFile(
    path.join(outDir, "astro.config.mjs"),
    generateAstroConfig(baseUrl, deployBase, {
      excludeLegacyMonthRoutesFromSitemap: legacyMonthStubsGenerated > 0,
    }),
  );
  writeFile(path.join(outDir, "tsconfig.json"), generateTsConfig());
  writeFile(path.join(outDir, ".gitignore"), generateGitignore());

  let adminCmsSummary = { applied: false };

  if (withAdminCms) {
    adminCmsSummary = applyAdminCmsTemplateBundle(outDir, {
      templateRoot: resolveAdminCmsTemplateRoot(TOOL_ROOT),
      fixtureLabel: fixtureLabelFromPath(siteDir),
      toolRoot: TOOL_ROOT,
      siteProfile: siteProfileResolved.profile,
      siteProfileSummary,
    });
    writeFile(path.join(outDir, "package.json"), generatePackageJsonWithAdminCms(baseUrl));
    writeFile(
      path.join(outDir, "astro.config.mjs"),
      generateAstroConfigWithAdminCms(baseUrl, TRAILING_SLASH, deployBase),
    );

    if (scheduleHub) {
      const months = scheduleMonthsFromDetected(scheduleMonthPages);
      writeFile(
        path.join(outDir, "src/data/schedule-months.json"),
        `${JSON.stringify(months, null, 2)}\n`,
      );
      applyScheduleDataViews(outDir, months);
    }
  }

  const robotsTxt = generateRobotsTxt(baseUrl, deployBase);
  if (robotsTxt) {
    writeFile(path.join(outDir, "public/robots.txt"), robotsTxt);
  }

  const generatedAt = new Date().toISOString();
  const seoByPage = buildSeoReportRows(analysis.pages);
  const seoMissingFields = seoByPage.filter((r) => r.missing.length > 0);

  const manualReview = buildManualReviewItems({
    missingAssets,
    jsAnalysis,
    forms,
    iframes,
    externalCss,
    seoMissingFields,
    baseUrl,
    scheduleIndexGenerated,
    gosakiScheduleDataSummary,
  });

  const totalPageCount =
    analysis.pages.length + (scheduleIndexGenerated ? 1 : 0) + legacyMonthStubsGenerated;
  const sourceHtmlCount = analysis.rawPages?.length ?? analysis.pages.length;

  const structureVerification = verifyGeneratedStructure(outDir, {
    scheduleIndexExpected: scheduleIndexGenerated,
  });

  let buildVerification = null;
  if (options.verifyBuild) {
    buildVerification = runBuildVerification(outDir);
  }

  const seoPublishReadiness = buildSeoPublishReadiness(baseUrl, {
    trailingSlash: TRAILING_SLASH,
    buildVerification,
    deployBase,
  });

  const conversionReport = formatConversionReport({
    inputDir: siteDir,
    generatedAt,
    outputDir: outDir,
    pages: analysis.pages,
    totalPageCount,
    sourceHtmlCount,
    fixtureLabel: fixtureLabelFromPath(siteDir),
    structureVerification,
    buildVerification,
    scheduleMonthPages,
    scheduleIndexGenerated,
    headerMonthlyLinksExcluded: scheduleHub && headerResult.monthlyLinksExcluded > 0,
    monthlyLinksExcludedFromHeader: headerResult.monthlyLinksExcluded,
    cssFiles: cssRelPaths,
    inlineHeadStyles: inlineHeadStyles.map((s) => ({
      dataUrl: s.dataUrl || null,
      bytes: s.content.length,
      pages: s.pages,
    })),
    cssCopiedTo: GLOBAL_CSS_PATH,
    jsCopied,
    jsAnalysis: {
      layoutScripts,
      pageSpecificScripts: jsAnalysis.pageSpecificScripts.map((s) => ({
        file: s.file,
        from: s.resolved.replace(/^\//, ""),
        to: jsPublicPath(s.resolved),
      })),
    },
    imagesCopied,
    missingAssets,
    forms,
    iframes,
    externalJs: jsAnalysis.externalScripts,
    inlineScripts: jsAnalysis.inlineScripts,
    externalCss: externalCss.filter((c) => !c.isPreconnect),
    manualReview,
    trailingSlash: TRAILING_SLASH,
    seoByPage,
    seoAssetsCopied,
    seoMissingFields,
    headerNavActive: Boolean(headerHtml),
    baseUrl,
    domainReviewPages,
    mainWrapperApplied,
    seoPublishReadiness,
    adminCmsSummary,
    siteProfileSummary,
  });

  writeFile(path.join(outDir, "CONVERSION_REPORT.md"), conversionReport);

  return {
    analysis,
    outputDir: outDir,
    cssFiles: cssRelPaths,
    inlineHeadStyles,
    jsCopied,
    jsAnalysis,
    layoutScripts,
    imagesCopied,
    seoAssetsCopied,
    writtenPages,
    pageCount: totalPageCount,
    scheduleMonthPages,
    scheduleIndexGenerated,
    legacyMonthStubsGenerated,
    structureVerification,
    buildVerification,
    seoPublishReadiness,
    missingAssets,
    forms,
    iframes,
    conversionReport,
    generatedAt,
    baseUrl,
    adminCmsSummary,
    siteProfileSummary,
    gosakiBandProfilesSummary,
    gosakiScheduleDataSummary,
    gosakiScheduleBundle,
    gosakiDiscographyDataSummary,
    gosakiDiscographyBundle,
  };
}

export function printGenerationSummary(result) {
  const {
    outputDir,
    pageCount,
    cssFiles,
    jsCopied,
    imagesCopied,
    writtenPages,
    analysis,
    missingAssets,
    jsAnalysis,
    baseUrl,
  } = result;

  console.log("static-to-astro convert (Phase 2-F)");
  console.log("");
  console.log(`  Output:  ${outputDir}`);
  if (baseUrl) console.log(`  baseUrl: ${baseUrl}`);
  else console.log(`  baseUrl: (not set — see CONVERSION_REPORT.md)`);
  console.log(`  Pages:  ${pageCount}${result.scheduleIndexGenerated ? " (includes /schedule/ index)" : ""}`);
  if (result.scheduleMonthPages?.length) {
    console.log(`  Schedule: ${result.scheduleMonthPages.length} month page(s) → hub at /schedule/`);
  }
  if (result.gosakiScheduleDataSummary?.scheduleDataSource) {
    console.log(
      `  Schedule data: scheduleDataSource=${result.gosakiScheduleDataSummary.scheduleDataSource} (${result.gosakiScheduleDataSummary.eventCount ?? 0} events)`,
    );
  } else if (result.gosakiScheduleBundle?.scheduleDataSource === "wix-html") {
    console.log(
      `  Schedule data: scheduleDataSource=wix-html (Wix HTML month pages; ${result.gosakiScheduleBundle.fallbackReason ?? "no extractor data"})`,
    );
  }
  if (result.gosakiDiscographyDataSummary?.discographyDataSource) {
    console.log(
      `  Discography data: discographyDataSource=${result.gosakiDiscographyDataSummary.discographyDataSource} (${result.gosakiDiscographyDataSummary.rowCount ?? 0} releases, ${result.gosakiDiscographyDataSummary.patchCount ?? 0} purchase_url patch(es))`,
    );
  } else if (result.gosakiDiscographyBundle?.discographyDataSource === "wix-html") {
    console.log(
      `  Discography data: discographyDataSource=wix-html (${result.gosakiDiscographyBundle.fallbackReason ?? "no supabase data"})`,
    );
  }
  if (result.seoPublishReadiness?.sitemapIntegrationEnabled) {
    console.log(`  SEO:     site=${result.seoPublishReadiness.baseUrl} robots.txt + @astrojs/sitemap`);
  }
  if (result.adminCmsSummary?.applied) {
    console.log(
      `  Admin:   CMS template applied (${result.adminCmsSummary.copiedFilesCount} files, @astrojs/node)`,
    );
  }
  if (result.siteProfileSummary?.active) {
    console.log(
      `  Profile: ${result.siteProfileSummary.profileId} (${result.siteProfileSummary.label})`,
    );
  }
  if (result.buildVerification) {
    const sm = result.buildVerification.sitemapFiles?.length
      ? result.buildVerification.sitemapFiles.join(", ")
      : "none";
    console.log(
      `  Build:   ${result.buildVerification.buildSuccess ? "success" : "FAILED"} (schedule index: ${result.buildVerification.distScheduleIndexExists ? "yes" : "no"}, sitemap: ${sm})`,
    );
  }
  const inlineCount = result.inlineHeadStyles?.length ?? 0;
  console.log(
    `  CSS:    ${cssFiles.length} file(s) + ${inlineCount} inline head block(s) → ${GLOBAL_CSS_PATH}`,
  );
  console.log(`  JS:     ${jsCopied.length} copied → public/assets/js/`);
  console.log(`          ${jsAnalysis.layoutScripts.length} in BaseLayout, ${jsAnalysis.pageSpecificScripts.length} page-specific`);
  console.log(`  Images: ${imagesCopied.length} file(s) → public/images/`);
  console.log(`  SEO:    ${result.seoAssetsCopied?.length ?? 0} og/favicon asset(s) copied`);
  console.log(`  Report: CONVERSION_REPORT.md (includes SEO section)`);
  console.log("");

  if (missingAssets.length) {
    console.log("  ╔══════════════════════════════════════════════════════════╗");
    console.log(`  ║  ⚠️  MISSING ASSETS: ${missingAssets.length} item(s) — see CONVERSION_REPORT.md     ║`);
    console.log("  ╚══════════════════════════════════════════════════════════╝");
    console.log("");
    for (const m of missingAssets) {
      console.log(`    ✗ [${m.file}] ${m.type}: ${m.asset}`);
    }
    console.log("");
  }

  const otherRisks = analysis.risks.filter((r) => r.type !== "missing-asset");
  if (otherRisks.length) {
    console.log("  Other risks / manual review:");
    for (const r of otherRisks.slice(0, 10)) {
      console.log(`    - [${r.file}] ${r.type}: ${r.message}`);
    }
    if (otherRisks.length > 10) console.log(`    ... and ${otherRisks.length - 10} more (see CONVERSION_REPORT.md)`);
    console.log("");
  }

  console.log("  Generated pages:");
  for (const p of writtenPages) {
    console.log(`    - ${path.relative(outputDir, p)}`);
  }
  console.log("");
  console.log("  Next:");
  console.log(`    cd ${path.relative(process.cwd(), outputDir) || "."}`);
  console.log("    npm install && npm run build");
}
