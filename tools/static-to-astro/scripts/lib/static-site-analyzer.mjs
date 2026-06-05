import { createRequire } from "node:module";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractSeo } from "./seo-extract.mjs";
import { applyBaseUrlToPages } from "./base-url.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const require = createRequire(path.join(REPO_ROOT, "package.json"));
const cheerio = require("cheerio");

export const HEADER_PATTERNS = [
  { selector: "header", reason: "semantic <header>" },
  { selector: '[role="banner"]', reason: 'role="banner"' },
  { selector: "#header, #site-header, .site-header, .global-header, .page-header", reason: "id/class header" },
];

export const FOOTER_PATTERNS = [
  { selector: "footer", reason: "semantic <footer>" },
  { selector: '[role="contentinfo"]', reason: 'role="contentinfo"' },
  { selector: "#footer, #site-footer, .site-footer, .page-footer", reason: "id/class footer" },
];

export const MAIN_PATTERNS = [
  { selector: "main", reason: "semantic <main>" },
  { selector: '[role="main"]', reason: 'role="main"' },
  { selector: "#main, #content, .main-content, .page-content, .content-area", reason: "id/class main" },
];

const SPA_INDICATORS = [
  /id=["']root["']/i,
  /id=["']app["']/i,
  /data-reactroot/i,
  /__NEXT_DATA__/i,
  /ng-app/i,
  /data-v-app/i,
];

export function walkHtmlFiles(dir, base = dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(full, base, files);
    } else if (entry.isFile() && /\.html?$/i.test(entry.name)) {
      files.push(path.relative(base, full).split(path.sep).join("/"));
    }
  }
  return files.sort();
}

export function normalizeFragment(html) {
  return html.replace(/\s+/g, " ").trim();
}

export function normalizeForSharedCompare(html) {
  return normalizeFragment(html)
    .replace(/\s+aria-current="[^"]*"/gi, "")
    .replace(/\bis-current\b/g, "")
    .replace(/\s+class="\s*"/gi, "");
}

export function fingerprint(html, { shared = false } = {}) {
  const source = shared ? normalizeForSharedCompare(html) : normalizeFragment(html);
  return crypto.createHash("sha256").update(source).digest("hex").slice(0, 16);
}

export function resolveRef(ref, pageRelPath) {
  const trimmed = (ref ?? "").trim();
  if (!trimmed || trimmed.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(trimmed)) {
    return { href: trimmed, kind: "special" };
  }
  if (/^https?:\/\//i.test(trimmed)) return { href: trimmed, kind: "external" };
  const pageDir = path.posix.dirname(pageRelPath.replace(/\\/g, "/"));
  const joined = path.posix.normalize(path.posix.join(pageDir === "." ? "" : pageDir, trimmed));
  return { href: joined.startsWith("/") ? joined : `/${joined}`, kind: "internal" };
}

export function htmlFileToAstroRoute(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  if (normalized === "index.html") return "/";
  const base = normalized.replace(/\.html?$/i, "");
  if (base.endsWith("/index")) {
    return `/${base.slice(0, -"/index".length)}/`;
  }
  return `/${base}/`;
}

export function htmlFileToPagePath(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  if (normalized === "index.html") return "index.astro";
  const base = normalized.replace(/\.html?$/i, "");
  return `${base}/index.astro`;
}

export function layoutImportFromPagePath(pagePath) {
  const dirDepth = pagePath.split("/").length - 1;
  const ups = dirDepth + 1;
  return `${"../".repeat(ups)}layouts/BaseLayout.astro`;
}

function findCandidates($, patterns) {
  const seen = new Set();
  const results = [];

  for (const { selector, reason } of patterns) {
    $(selector).each((_, el) => {
      const tag = el.tagName?.toLowerCase() ?? "unknown";
      const id = $(el).attr("id");
      const className = $(el).attr("class");
      const key = `${tag}#${id ?? ""}.${(className ?? "").split(/\s+/).slice(0, 2).join(".")}`;
      if (seen.has(key)) return;
      seen.add(key);
      const outer = $.html(el) ?? "";
      results.push({
        selector,
        reason,
        tag,
        id: id ?? null,
        classes: className ? className.split(/\s+/).filter(Boolean) : [],
        snippetLength: outer.length,
        fingerprint: fingerprint(outer, { shared: true }),
        outerHtml: outer,
        snippetPreview: normalizeFragment(outer).slice(0, 120) + (outer.length > 120 ? "…" : ""),
      });
    });
  }

  return results;
}

function collectImages($, pageRelPath) {
  const images = [];
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    const resolved = resolveRef(src, pageRelPath);
    images.push({
      src,
      resolved: resolved.href,
      kind: resolved.kind,
      alt: $(el).attr("alt") ?? "",
    });
  });
  return images;
}

function collectLinks($, pageRelPath) {
  const links = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const resolved = resolveRef(href, pageRelPath);
    links.push({
      href,
      resolved: resolved.href,
      kind: resolved.kind,
      text: $(el).text().replace(/\s+/g, " ").trim().slice(0, 80),
    });
  });
  return links;
}

function detectPageIssues({ html, $, jsRefs, links }) {
  const issues = [];
  const manual = [];

  if (SPA_INDICATORS.some((re) => re.test(html))) {
    issues.push({ type: "spa", message: "SPA / フレームワークの痕跡" });
  }

  const forms = $("form").length;
  if (forms > 0) {
    issues.push({ type: "form", message: `フォーム ${forms} 件` });
    manual.push({ type: "form", message: "フォームの action / method を確認" });
  }

  const iframes = $("iframe").length;
  if (iframes > 0) {
    issues.push({ type: "iframe", message: `iframe ${iframes} 件` });
  }

  if (jsRefs.some((j) => j.kind === "external")) {
    issues.push({ type: "external-js", message: "外部 JS あり" });
  }

  return { issues, manual };
}

/**
 * Returns inner HTML of the page content region.
 * The outer <main> wrapper is re-applied in BaseLayout.astro (<main><slot /></main>)
 * so CSS selectors like `main { max-width: ... }` keep working after header/footer split.
 */
export function extractMainHtml($, headerSelector, footerSelector) {
  const mainEl = $("main").first();
  if (mainEl.length) {
    return mainEl.html()?.trim() ?? "";
  }

  for (const sel of MAIN_PATTERNS.map((p) => p.selector)) {
    const el = $(sel).first();
    if (el.length) return el.html()?.trim() ?? "";
  }

  const $body = $("body").clone();
  if (headerSelector) $body.find(headerSelector).first().remove();
  if (footerSelector) $body.find(footerSelector).first().remove();
  $body.find("header").remove();
  $body.find("footer").remove();
  $body.find("script").remove();
  $body.find('link[rel*="stylesheet"]').remove();
  return $body.html()?.trim() ?? "";
}

export function extractSharedHtml($, candidates, fingerprintKey) {
  if (!candidates?.length || !fingerprintKey) return null;
  const match = candidates.find((c) => c.fingerprint === fingerprintKey);
  if (!match) return candidates[0]?.outerHtml ?? null;
  const el = $(match.selector).filter((_, node) => {
    const outer = $.html(node) ?? "";
    return fingerprint(outer, { shared: true }) === fingerprintKey;
  }).first();
  if (el.length) return $.html(el) ?? match.outerHtml;
  return match.outerHtml;
}

function analyzePage(siteDir, relPath) {
  const abs = path.join(siteDir, relPath);
  const html = fs.readFileSync(abs, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });

  const title = $("title").first().text().trim() || null;
  const description =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;

  const cssRefs = [];
  $('link[rel*="stylesheet"][href]').each((_, el) => {
    const raw = $(el).attr("href");
    if (!raw) return;
    const resolved = resolveRef(raw, relPath);
    cssRefs.push({ raw, resolved: resolved.href, kind: resolved.kind });
  });

  const jsRefs = [];
  $("script[src]").each((_, el) => {
    const raw = $(el).attr("src");
    if (!raw) return;
    const resolved = resolveRef(raw, relPath);
    jsRefs.push({ raw, resolved: resolved.href, kind: resolved.kind });
  });

  const images = collectImages($, relPath);
  const links = collectLinks($, relPath);
  const headerCandidates = findCandidates($, HEADER_PATTERNS);
  const footerCandidates = findCandidates($, FOOTER_PATTERNS);
  const mainCandidates = findCandidates($, MAIN_PATTERNS);
  const { issues, manual } = detectPageIssues({ html, $, jsRefs, links });
  const seo = extractSeo($, relPath);

  return {
    relPath,
    astroRoute: htmlFileToAstroRoute(relPath),
    pagePath: htmlFileToPagePath(relPath),
    title,
    description,
    seo,
    cssRefs,
    jsRefs,
    images,
    links,
    headerCandidates,
    footerCandidates,
    mainCandidates,
    issues,
    manual,
    hasForm: $("form").length > 0,
    hasIframe: $("iframe").length > 0,
    headings: $("h1, h2, h3")
      .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
      .get()
      .slice(0, 12),
    $,
    html,
  };
}

export function pickBestSharedCandidate(pages, field) {
  const counts = new Map();
  for (const page of pages) {
    const list = page[field];
    if (!list?.length) continue;
    for (const candidate of list) {
      const key = candidate.fingerprint;
      const prev = counts.get(key) ?? { candidate, pages: [] };
      if (!prev.pages.includes(page.relPath)) prev.pages.push(page.relPath);
      counts.set(key, prev);
    }
  }
  const sorted = [...counts.values()].sort((a, b) => b.pages.length - a.pages.length);
  return sorted[0] ?? null;
}

function checkAssetExists(siteDir, rel, pageRelPath, type, missing) {
  const abs = path.join(siteDir, rel);
  if (!fs.existsSync(abs)) {
    missing.push({
      file: pageRelPath,
      asset: rel,
      type,
      message: `Missing ${type}: ${rel}`,
    });
  }
}

export function checkMissingAssets(siteDir, pages) {
  const missing = [];
  for (const page of pages) {
    for (const img of page.images) {
      if (img.kind !== "internal" || !img.resolved) continue;
      checkAssetExists(siteDir, img.resolved.replace(/^\//, ""), page.relPath, "image", missing);
    }
    for (const ref of [...page.cssRefs, ...page.jsRefs]) {
      if (ref.kind !== "internal" || !ref.resolved || ref.resolved.startsWith("(")) continue;
      const rel = ref.resolved.replace(/^\//, "");
      const type = ref.resolved.includes(".css") ? "css" : "js";
      checkAssetExists(siteDir, rel, page.relPath, type, missing);
    }
    const seo = page.seo;
    if (seo) {
      for (const [raw, type] of [
        [seo.ogImageRaw, "og:image"],
        [seo.faviconRaw, "favicon"],
        [seo.appleTouchIconRaw, "apple-touch-icon"],
      ]) {
        if (!raw || /^https?:\/\//i.test(raw) || raw.startsWith("data:")) continue;
        const resolved = resolveRef(raw, page.relPath);
        if (resolved.kind === "internal") {
          checkAssetExists(siteDir, resolved.href.replace(/^\//, ""), page.relPath, type, missing);
        }
      }
    }
  }
  return missing;
}

function buildLinkGraph(pages) {
  const htmlSet = new Set(pages.map((p) => p.relPath));
  const nodes = pages.map((p) => ({ file: p.relPath, route: p.astroRoute, outbound: [] }));
  const byFile = Object.fromEntries(nodes.map((n) => [n.file, n]));

  for (const page of pages) {
    for (const link of page.links) {
      if (link.kind !== "internal") continue;
      let target = link.href.replace(/^\//, "");
      const addEdge = (t) => {
        const key = `${link.href}\0${t}`;
        if (!byFile[page.relPath]._seen) byFile[page.relPath]._seen = new Set();
        if (byFile[page.relPath]._seen.has(key)) return;
        byFile[page.relPath]._seen.add(key);
        byFile[page.relPath].outbound.push({ href: link.href, target: t, text: link.text });
      };
      if (htmlSet.has(target)) addEdge(target);
      else if (htmlSet.has(target.replace(/\/$/, ".html"))) addEdge(target.replace(/\/$/, ".html"));
    }
  }
  for (const node of nodes) delete node._seen;
  return nodes;
}

function collectSiteAssets(pages, missingAssets) {
  const css = new Set();
  const js = new Set();
  const images = new Set();

  for (const page of pages) {
    for (const c of page.cssRefs) {
      if (c.kind === "internal" && c.resolved && !c.resolved.startsWith("(")) css.add(c.resolved);
    }
    for (const j of page.jsRefs) {
      if (j.kind === "internal") js.add(j.resolved);
    }
    for (const img of page.images) {
      if (img.kind === "internal") images.add(img.resolved);
    }
  }

  return {
    css: [...css],
    js: [...js],
    images: [...images],
    missing: missingAssets.map((m) => ({
      file: m.file,
      path: m.asset,
      type: m.type,
      message: m.message,
    })),
  };
}

function buildRisks(pages, missingAssets) {
  const risks = [];

  for (const page of pages) {
    for (const issue of page.issues) {
      risks.push({ type: issue.type, message: issue.message, file: page.relPath });
    }
    for (const m of page.manual) {
      risks.push({ type: m.type, message: m.message, file: page.relPath });
    }
  }
  for (const m of missingAssets) {
    risks.push({ type: "missing-asset", message: m.message, file: m.file });
  }

  return risks;
}

/**
 * @param {string} siteDir Absolute path to static site root
 */
export function analyzeStaticSite(siteDir) {
  const htmlFiles = walkHtmlFiles(siteDir);
  if (!htmlFiles.length) {
    throw new Error(`No HTML files found under ${siteDir}`);
  }

  const rawPages = htmlFiles.map((rel) => analyzePage(siteDir, rel));
  const sharedHeader = pickBestSharedCandidate(rawPages, "headerCandidates");
  const sharedFooter = pickBestSharedCandidate(rawPages, "footerCandidates");

  const headerSelector = sharedHeader?.candidate?.selector ?? null;
  const footerSelector = sharedFooter?.candidate?.selector ?? null;
  const headerFp = sharedHeader?.candidate?.fingerprint ?? null;
  const footerFp = sharedFooter?.candidate?.fingerprint ?? null;

  let headerHtml = null;
  let footerHtml = null;

  if (sharedHeader && rawPages.length) {
    const sample = rawPages.find((p) => sharedHeader.pages.includes(p.relPath)) ?? rawPages[0];
    headerHtml = extractSharedHtml(sample.$, sample.headerCandidates, headerFp);
  }
  if (sharedFooter && rawPages.length) {
    const sample = rawPages.find((p) => sharedFooter.pages.includes(p.relPath)) ?? rawPages[0];
    footerHtml = extractSharedHtml(sample.$, sample.footerCandidates, footerFp);
  }

  const pages = rawPages.map((page) => {
    const mainHtml = extractMainHtml(page.$, headerSelector, footerSelector);
    const bodyHtml = page.$("body").html()?.trim() ?? "";
    return {
      sourcePath: page.relPath,
      route: page.astroRoute,
      pagePath: page.pagePath,
      title: page.title,
      description: page.description,
      seo: {
        title: page.seo.title,
        description: page.seo.description,
        canonical: page.seo.canonical,
        ogTitle: page.seo.ogTitle,
        ogDescription: page.seo.ogDescription,
        ogImage: page.seo.ogImage,
        ogType: page.seo.ogType,
        ogUrl: page.seo.ogUrl,
        twitterCard: page.seo.twitterCard,
        favicon: page.seo.favicon,
        lang: page.seo.lang,
      },
      css: page.cssRefs.map((c) => ({ raw: c.raw, path: c.resolved, kind: c.kind })),
      js: page.jsRefs.map((j) => ({ raw: j.raw, path: j.resolved, kind: j.kind })),
      images: page.images,
      links: page.links,
      hasForm: page.hasForm,
      hasIframe: page.hasIframe,
      headings: page.headings,
      seo: page.seo,
      mainHtml,
      bodyHtml,
    };
  });

  const missingAssets = checkMissingAssets(siteDir, rawPages);
  const linkGraph = buildLinkGraph(rawPages);

  return {
    generatedAt: new Date().toISOString(),
    inputDir: siteDir,
    htmlFiles,
    pages,
    rawPages,
    common: {
      header: {
        detected: Boolean(headerHtml),
        selector: headerSelector,
        fingerprint: headerFp,
        pagesMatched: sharedHeader?.pages.length ?? 0,
        pageCount: pages.length,
        html: headerHtml,
      },
      footer: {
        detected: Boolean(footerHtml),
        selector: footerSelector,
        fingerprint: footerFp,
        pagesMatched: sharedFooter?.pages.length ?? 0,
        pageCount: pages.length,
        html: footerHtml,
      },
    },
    assets: collectSiteAssets(rawPages, missingAssets),
    risks: buildRisks(rawPages, missingAssets),
    sharedHeader,
    sharedFooter,
    missingAssets,
    linkGraph,
  };
}

export function buildJsonReport(analysis, { baseUrl = null } = {}) {
  const pages = applyBaseUrlToPages(analysis.pages, baseUrl);
  return {
    generatedAt: analysis.generatedAt,
    inputDir: analysis.inputDir,
    baseUrl: baseUrl || null,
    pages: pages.map((p) => ({
      sourcePath: p.sourcePath,
      route: p.route,
      title: p.title,
      description: p.description,
      seo: {
        title: p.seo.title,
        description: p.seo.description,
        canonical: p.seo.canonical,
        ogTitle: p.seo.ogTitle,
        ogDescription: p.seo.ogDescription,
        ogImage: p.seo.ogImage,
        ogType: p.seo.ogType,
        ogUrl: p.seo.ogUrl,
        twitterCard: p.seo.twitterCard,
        favicon: p.seo.favicon,
        lang: p.seo.lang,
      },
      css: p.css,
      js: p.js,
      images: p.images,
      links: p.links,
      hasForm: p.hasForm,
      hasIframe: p.hasIframe,
      mainHtml: p.mainHtml,
      bodyHtml: p.bodyHtml,
    })),
    common: {
      header: {
        detected: analysis.common.header.detected,
        selector: analysis.common.header.selector,
        pagesMatched: analysis.common.header.pagesMatched,
        html: analysis.common.header.html,
      },
      footer: {
        detected: analysis.common.footer.detected,
        selector: analysis.common.footer.selector,
        pagesMatched: analysis.common.footer.pagesMatched,
        html: analysis.common.footer.html,
      },
    },
    assets: analysis.assets,
    risks: analysis.risks,
  };
}

export function formatMarkdownReport(analysis) {
  const { inputDir, pages, sharedHeader, sharedFooter, missingAssets, linkGraph } = analysis;
  const lines = [];
  const now = analysis.generatedAt;

  lines.push("# Static Site Analysis Report", "");
  lines.push(`- Generated: ${now}`);
  lines.push(`- Input: \`${inputDir}\``);
  lines.push(`- HTML pages: ${pages.length}`, "");
  lines.push("## Summary", "");
  lines.push("| File | Astro route (proposed) | Title |");
  lines.push("| --- | --- | --- |");
  for (const p of pages) {
    lines.push(`| ${p.sourcePath} | ${p.route} | ${p.title ?? "—"} |`);
  }
  lines.push("");

  if (sharedHeader) {
    lines.push("## Shared header (cross-page)", "");
    lines.push(`- Match: **${sharedHeader.pages.length}/${pages.length}** pages`);
    lines.push(`- Selector hint: \`${sharedHeader.candidate.selector}\` (${sharedHeader.candidate.reason})`);
    lines.push(`- Fingerprint: \`${sharedHeader.candidate.fingerprint}\``, "");
  }

  if (sharedFooter) {
    lines.push("## Shared footer (cross-page)", "");
    lines.push(`- Match: **${sharedFooter.pages.length}/${pages.length}** pages`);
    lines.push(`- Selector hint: \`${sharedFooter.candidate.selector}\` (${sharedFooter.candidate.reason})`);
    lines.push(`- Fingerprint: \`${sharedFooter.candidate.fingerprint}\``, "");
  }

  lines.push("## Link structure", "");
  for (const node of linkGraph) {
    lines.push(`### ${node.file} → ${node.route}`, "");
    if (!node.outbound.length) {
      lines.push("_No internal HTML links detected._", "");
      continue;
    }
    for (const edge of node.outbound) {
      lines.push(`- \`${edge.href}\` → \`${edge.target}\`${edge.text ? ` — ${edge.text}` : ""}`);
    }
    lines.push("");
  }

  for (const page of analysis.rawPages) {
    lines.push(`## Page: ${page.relPath}`, "");
    lines.push(`- Proposed Astro route: \`${page.astroRoute}\``);
    lines.push(`- Title: ${page.title ?? "—"}`);
    lines.push(`- Meta description: ${page.description ?? "—"}`, "");

    if (page.headings.length) {
      lines.push("### Headings", "");
      for (const h of page.headings) lines.push(`- ${h}`);
      lines.push("");
    }

    lines.push("### CSS references", "");
    if (!page.cssRefs.length) lines.push("- _none_");
    else for (const c of page.cssRefs) lines.push(`- \`${c.raw}\` (${c.kind}) → ${c.resolved}`);
    lines.push("");

    lines.push("### JS references", "");
    if (!page.jsRefs.length) lines.push("- _none_");
    else for (const j of page.jsRefs) lines.push(`- \`${j.raw}\` (${j.kind}) → ${j.resolved}`);
    lines.push("");

    lines.push("### Images", "");
    if (!page.images.length) lines.push("- _none_");
    else {
      for (const img of page.images) {
        lines.push(`- \`${img.src}\` (${img.kind})${img.alt ? ` — alt: ${img.alt}` : ""}`);
      }
    }
    lines.push("");

    const section = (name, candidates) => {
      lines.push(`### ${name}`, "");
      if (!candidates.length) {
        lines.push("- _No strong candidate — manual review required._", "");
        return;
      }
      for (const c of candidates.slice(0, 3)) {
        lines.push(
          `- \`${c.tag}\`${c.id ? ` #${c.id}` : ""}${c.classes.length ? ` .${c.classes.join(".")}` : ""} — ${c.reason} (fp: \`${c.fingerprint}\`)`,
        );
        lines.push(`  - preview: ${c.snippetPreview}`);
      }
      lines.push("");
    };

    section("Header candidates", page.headerCandidates);
    section("Footer candidates", page.footerCandidates);
    section("Main candidates", page.mainCandidates);

    if (page.issues.length || page.manual.length) {
      lines.push("### Issues on this page", "");
      for (const i of page.issues) lines.push(`- ⚠️ ${i.message}`);
      for (const m of page.manual) lines.push(`- 👁 Manual: ${m.message}`);
      lines.push("");
    }
  }

  lines.push("## Site-wide issues", "");
  const allIssues = analysis.risks.filter((r) => r.type !== "missing-asset");
  const missing = analysis.risks.filter((r) => r.type === "missing-asset");

  if (!allIssues.length && !missing.length) {
    lines.push("_No major blockers detected._", "");
  } else {
    if (allIssues.length) {
      lines.push("### Conversion risks", "");
      for (const i of allIssues) lines.push(`- [${i.file}] ${i.message}`);
      lines.push("");
    }
    if (missing.length) {
      lines.push("### Missing local assets", "");
      for (const m of missing) lines.push(`- \`${m.message}\` (${m.file})`);
      lines.push("");
    }
  }

  lines.push("## Next steps", "");
  lines.push("- Run `convert-static-to-astro.mjs` to generate Astro scaffold", "");

  return lines.join("\n");
}
