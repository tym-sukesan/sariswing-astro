import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { htmlHrefToRoute } from "./path-transform.mjs";
import { isScheduleMonthNavTarget, SCHEDULE_INDEX_ROUTE } from "./schedule-pages.mjs";
import { toPublicSeoPath } from "./seo-extract.mjs";
import { sanitizeWixFontHtml } from "./wix-font-safety.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "../..");
const require = createRequire(path.join(TOOL_ROOT, "package.json"));
const cheerio = require("cheerio");

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wrap gosaki header logo h1 with a home link (G-8e). Regex-only — cheerio corrupts Astro nav attrs. */
function wrapHeaderLogoWithHomeLink(html) {
  if (!html?.includes('id="comp-mbdw9tzc"') || html.includes("site-logo-link")) return html;
  const blockRe =
    /(<div id="comp-mbdw9tzc"[^>]*>)([\s\S]*?)(<\/div><!--\/\$-->\s*<div id="comp-mbdw7xid")/;
  const match = html.match(blockRe);
  if (!match) return html;
  const inner = match[2];
  if (!inner.includes("<h1") || inner.includes("site-logo-link")) return html;
  const wrappedInner = inner.replace(
    /(<h1[\s\S]*?<\/h1>)/,
    '<a href={withBase("/")} class="site-logo-link">$1</a>',
  );
  return html.replace(blockRe, `$1${wrappedInner}$3`);
}

/** Month-only nav labels like `2026.07`. */
function isMonthOnlyNavLabel(text) {
  return /^\d{4}\.\d{1,2}$/.test(text.trim());
}

/**
 * Site-neutral: hand-authored headers that already ship desktop + mobile nav
 * (e.g. `.nav-desktop` + `details.nav-mobile`) must keep that DOM so source CSS works.
 * Wix/Gosaki headers do not match this pattern and keep the nav-toggle rewrite path.
 *
 * @param {import('cheerio').CheerioAPI} $
 * @param {import('cheerio').Cheerio} nav
 */
export function hasSourceDualResponsiveNav($, nav) {
  if (!nav?.length) return false;
  return nav.find(".nav-desktop").length > 0 && nav.find("details.nav-mobile").length > 0;
}

/**
 * @param {{ route: string, text: string, href: string }} link
 * @param {{ scheduleHub?: boolean, productionOrigin?: string | null }} options
 * @returns {{ route: string, text: string, href: string } | null | "month"}
 */
function normalizeNavLink(link, options = {}) {
  const scheduleHub = options.scheduleHub ?? false;
  const isMonthLink =
    isScheduleMonthNavTarget(link.href, link.route) || isMonthOnlyNavLabel(link.text);
  if (isMonthLink) return "month";

  const isScheduleTrigger =
    /^schedule$/i.test(link.text) || (scheduleHub && isScheduleMonthNavTarget(link.href, link.route));
  if (isScheduleTrigger || (/^schedule$/i.test(link.text) && scheduleHub)) {
    return { route: SCHEDULE_INDEX_ROUTE, text: "Schedule", href: SCHEDULE_INDEX_ROUTE };
  }
  return link;
}

/**
 * Collect links from one list root only (no cross-list merge).
 * @param {import('cheerio').CheerioAPI} $
 * @param {import('cheerio').Cheerio} listRoot
 * @param {{ scheduleHub?: boolean, productionOrigin?: string | null }} options
 */
function collectNavLinksFromList($, listRoot, options = {}) {
  const productionOrigin = options.productionOrigin ?? null;
  /** @type {{ route: string, text: string, href: string }[]} */
  const links = [];
  let monthlyLinksExcluded = 0;
  const seen = new Set();

  listRoot.find("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const route = htmlHrefToRoute(href, "index.html", { productionOrigin });
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (!text) return;
    const normalized = normalizeNavLink({ route, text, href }, options);
    if (normalized === "month") {
      monthlyLinksExcluded += 1;
      return;
    }
    if (!normalized) return;
    const key = `${normalized.route}\0${normalized.text}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push(normalized);
  });

  return { links, monthlyLinksExcluded };
}

/**
 * @param {{ route: string, text: string }[]} links
 */
function renderNavListItems(links) {
  return links
    .map(({ route, text }) => {
      const safeRoute = escapeHtml(route);
      const safeText = escapeHtml(text);
      const isSchedule = safeText === "Schedule" && safeRoute === SCHEDULE_INDEX_ROUTE;
      const activeExpr = isSchedule ? "scheduleNavActive()" : `navActive('${safeRoute}')`;
      return `          <li><a href={withBase('${safeRoute}')} class:list={{ 'is-current': ${activeExpr} }}>${safeText}</a></li>`;
    })
    .join("\n");
}

function buildHeaderFrontmatter({ includeScheduleHelper }) {
  const scheduleHelper = includeScheduleHelper
    ? `
function scheduleNavActive() {
  const path = currentPath.endsWith("/") ? currentPath : \`\${currentPath}/\`;
  if (path === withBase("/schedule/")) return true;
  const prefix = import.meta.env.BASE_URL.replace(/\\/$/, "");
  if (new RegExp(\`^\${prefix}/schedule/\\\\d{4}-\\\\d{2}/\`, "i").test(path)) return true;
  if (new RegExp(\`^\${prefix}/schedule-\\\\d{4}-\\\\d{2}/\`, "i").test(path)) return true;
  return new RegExp(\`^\${prefix}/\\\\d{4}-\\\\d{2}/\`, "i").test(path);
}
`
    : "";

  return `---
import { withBase } from "../lib/with-base.ts";

const currentPath = Astro.url.pathname;

function navActive(href) {
  const normalized = withBase(href.endsWith("/") ? href : \`\${href}/\`);
  const path = currentPath.endsWith("/") ? currentPath : \`\${currentPath}/\`;
  if (normalized === withBase("/")) {
    return path === withBase("/");
  }
  return path === normalized || path.startsWith(normalized);
}
${scheduleHelper}---
`;
}

/**
 * Preserve source dual-nav markup (desktop ul + mobile details) with Astro active links.
 * Does not inject nav-toggle / global-nav / SITE_HEADER script.
 *
 * @param {string} headerHtml
 * @param {import('cheerio').CheerioAPI} $
 * @param {import('cheerio').Cheerio} nav
 * @param {{ scheduleHub?: boolean, productionOrigin?: string | null }} options
 */
function generatePreservedDualNavHeader(headerHtml, $, nav, options = {}) {
  const scheduleHub = options.scheduleHub ?? false;
  const productionOrigin = options.productionOrigin ?? null;

  const desktopRoot = nav.find(".nav-desktop").first();
  const mobileDetails = nav.find("details.nav-mobile").first();
  const mobileList = mobileDetails.find(".nav-mobile-list").first().length
    ? mobileDetails.find(".nav-mobile-list").first()
    : mobileDetails.find("ul").first();

  const desktop = collectNavLinksFromList($, desktopRoot, { scheduleHub, productionOrigin });
  const mobile = collectNavLinksFromList($, mobileList, { scheduleHub, productionOrigin });
  const monthlyLinksExcluded = desktop.monthlyLinksExcluded + mobile.monthlyLinksExcluded;

  let desktopLinks = desktop.links;
  let mobileLinks = mobile.links;
  let scheduleLinkAdded =
    desktopLinks.some((l) => l.text === "Schedule") || mobileLinks.some((l) => l.text === "Schedule");

  if (scheduleHub && !scheduleLinkAdded) {
    const scheduleLink = {
      route: SCHEDULE_INDEX_ROUTE,
      text: "Schedule",
      href: SCHEDULE_INDEX_ROUTE,
    };
    desktopLinks = [
      ...desktopLinks.slice(0, Math.min(2, desktopLinks.length)),
      scheduleLink,
      ...desktopLinks.slice(Math.min(2, desktopLinks.length)),
    ];
    mobileLinks = [
      ...mobileLinks.slice(0, Math.min(2, mobileLinks.length)),
      scheduleLink,
      ...mobileLinks.slice(Math.min(2, mobileLinks.length)),
    ];
    scheduleLinkAdded = true;
  }

  const navClass = nav.attr("class") ? ` class="${escapeHtml(nav.attr("class"))}"` : "";
  const navAria = nav.attr("aria-label")
    ? ` aria-label="${escapeHtml(nav.attr("aria-label"))}"`
    : ' aria-label="Main"';
  const desktopClass = desktopRoot.attr("class")
    ? ` class="${escapeHtml(desktopRoot.attr("class"))}"`
    : ' class="nav-desktop"';
  const mobileDetailsClass = mobileDetails.attr("class")
    ? ` class="${escapeHtml(mobileDetails.attr("class"))}"`
    : ' class="nav-mobile"';
  const mobileListClass = mobileList.attr("class")
    ? ` class="${escapeHtml(mobileList.attr("class"))}"`
    : ' class="nav-mobile-list"';

  // Keep summary markup (icon + label); strip accidental open state.
  let summaryHtml = mobileDetails.find("summary").first().html() ?? "Menu";
  summaryHtml = summaryHtml.replace(/\s+aria-current="[^"]*"/gi, "");

  const navBlock = `<nav${navClass}${navAria}>
        <ul${desktopClass}>
${renderNavListItems(desktopLinks)}
        </ul>
        <details${mobileDetailsClass}>
          <summary>
${summaryHtml}
          </summary>
          <ul${mobileListClass}>
${renderNavListItems(mobileLinks)}
          </ul>
        </details>
      </nav>`;

  nav.replaceWith("<!-- STATIC_TO_ASTRO_NAV -->");

  let shell = $("#__header_wrap").html() ?? "";
  shell = shell
    .replace(/\s+aria-current="[^"]*"/gi, "")
    .replace(/\bis-current\b/g, "")
    .replace(/\s+class="\s*"/gi, "");

  shell = shell.replace(/href="([^"]+\.html[^"]*)"/g, (_, href) =>
    `href="${htmlHrefToRoute(href, "index.html", { productionOrigin })}"`,
  );

  shell = shell.replace(/\ssrc="([^"]+)"/g, (match, src) => {
    if (/^(https?:|\/|data:)/i.test(src)) return match;
    return ` src="${toPublicSeoPath(`/${src.replace(/^\//, "")}`)}"`;
  });

  shell = sanitizeWixFontHtml(shell);
  shell = shell.replace("<!-- STATIC_TO_ASTRO_NAV -->", navBlock);
  shell = wrapHeaderLogoWithHomeLink(shell);
  shell = shell.replace(/<a href="\/">/g, '<a href={withBase("/")}>');

  return {
    content: `${buildHeaderFrontmatter({ includeScheduleHelper: scheduleLinkAdded })}${shell}
`,
    monthlyLinksExcluded,
    scheduleHubApplied: scheduleHub,
    navMode: "preserve-dual-nav",
  };
}

/**
 * Build Header.astro with pathname-based active nav.
 * Schedule month links are collapsed to a single /schedule/ link when scheduleMonths are provided.
 *
 * When source already has `.nav-desktop` + `details.nav-mobile`, preserve that structure
 * (site-neutral; required for hand-authored fixtures whose CSS targets those classes).
 *
 * @param {string | null} headerHtml
 * @param {string} placeholder
 * @param {{ scheduleHub?: boolean, productionOrigin?: string | null }} [options]
 * @returns {{ content: string, monthlyLinksExcluded: number, scheduleHubApplied: boolean, navMode?: string }}
 */
export function generateHeaderAstro(headerHtml, placeholder = "Header", options = {}) {
  const scheduleHub = options.scheduleHub ?? false;
  const productionOrigin = options.productionOrigin ?? null;

  if (!headerHtml?.trim()) {
    return {
      content: `---
const currentPath = Astro.url.pathname;
---
<!-- ${placeholder} — not detected; replace manually -->
`,
      monthlyLinksExcluded: 0,
      scheduleHubApplied: false,
      navMode: "empty",
    };
  }

  const $ = cheerio.load(`<div id="__header_wrap">${headerHtml}</div>`, { decodeEntities: false });
  const nav = $("nav").first();

  if (hasSourceDualResponsiveNav($, nav)) {
    return generatePreservedDualNavHeader(headerHtml, $, nav, { scheduleHub, productionOrigin });
  }

  const rawNavLinks = [];

  nav.find("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const route = htmlHrefToRoute(href, "index.html", { productionOrigin });
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (!text) return;
    rawNavLinks.push({ route, text, href });
  });

  const navLinks = [];
  let scheduleLinkAdded = false;
  let monthlyLinksExcluded = 0;

  for (const link of rawNavLinks) {
    const isMonthLink =
      isScheduleMonthNavTarget(link.href, link.route) || isMonthOnlyNavLabel(link.text);
    const isScheduleTrigger =
      /^schedule$/i.test(link.text) || (scheduleHub && isScheduleMonthNavTarget(link.href, link.route));

    if (isMonthLink) {
      monthlyLinksExcluded += 1;
      continue;
    }

    if (isScheduleTrigger || (/^schedule$/i.test(link.text) && scheduleHub)) {
      if (!scheduleLinkAdded) {
        navLinks.push({ route: SCHEDULE_INDEX_ROUTE, text: "Schedule", href: SCHEDULE_INDEX_ROUTE });
        scheduleLinkAdded = true;
      }
      continue;
    }

    navLinks.push(link);
  }

  if (scheduleHub && !scheduleLinkAdded) {
    navLinks.splice(Math.min(2, navLinks.length), 0, {
      route: SCHEDULE_INDEX_ROUTE,
      text: "Schedule",
      href: SCHEDULE_INDEX_ROUTE,
    });
    scheduleLinkAdded = true;
  }

  if (!navLinks.length) {
    const stripped = wrapHeaderLogoWithHomeLink(
      sanitizeWixFontHtml(
        headerHtml
          .replace(/\s+aria-current="[^"]*"/gi, "")
          .replace(/\bis-current\b/g, "")
          .replace(/\s+class="\s*"/gi, ""),
      ),
    );
    return {
      content: `---
import { withBase } from "../lib/with-base.ts";

const currentPath = Astro.url.pathname;
---
${stripped}
`,
      monthlyLinksExcluded,
      scheduleHubApplied: scheduleHub,
      navMode: "passthrough",
    };
  }

  const navAria = nav.attr("aria-label") ? ` aria-label="${escapeHtml(nav.attr("aria-label"))}"` : ' aria-label="Main navigation"';

  nav.replaceWith("<!-- STATIC_TO_ASTRO_NAV -->");

  let shell = $("#__header_wrap").html() ?? "";
  shell = shell
    .replace(/\s+aria-current="[^"]*"/gi, "")
    .replace(/\bis-current\b/g, "")
    .replace(/\bis-current\b/g, "")
    .replace(/\s+class="\s*"/gi, "");

  shell = shell.replace(/href="([^"]+\.html[^"]*)"/g, (_, href) =>
    `href="${htmlHrefToRoute(href, "index.html", { productionOrigin })}"`,
  );

  shell = shell.replace(/\ssrc="([^"]+)"/g, (match, src) => {
    if (/^(https?:|\/|data:)/i.test(src)) return match;
    return ` src="${toPublicSeoPath(`/${src.replace(/^\//, "")}`)}"`;
  });

  shell = sanitizeWixFontHtml(shell);

  const navLines = navLinks.map(({ route, text }) => {
    const safeRoute = escapeHtml(route);
    const safeText = escapeHtml(text);
    const isSchedule = safeText === "Schedule" && safeRoute === SCHEDULE_INDEX_ROUTE;
    const activeExpr = isSchedule
      ? "scheduleNavActive()"
      : `navActive('${safeRoute}')`;
    return `        <li><a href={withBase('${safeRoute}')} class:list={{ 'is-current': ${activeExpr} }}>${safeText}</a></li>`;
  });

  const navBlock = `  <button
    type="button"
    class="nav-toggle"
    aria-expanded="false"
    aria-controls="global-nav-panel"
    aria-label="Open menu"
  >
    <span class="nav-toggle__icon" aria-hidden="true">
      <span class="nav-toggle__bar"></span>
      <span class="nav-toggle__bar"></span>
      <span class="nav-toggle__bar"></span>
    </span>
    <span class="nav-toggle__label">MENU</span>
  </button>
  <nav id="global-nav-panel" class="global-nav"${navAria}>
    <ul>
${navLines.join("\n")}
    </ul>
  </nav>`;

  shell = shell.replace("<!-- STATIC_TO_ASTRO_NAV -->", navBlock);

  shell = wrapHeaderLogoWithHomeLink(shell);

  shell = shell.replace(/<a href="\/">/g, '<a href={withBase("/")}>');

  const includeScheduleHelper =
    scheduleLinkAdded || navLinks.some((link) => link.text === "Schedule");

  return {
    content: `${buildHeaderFrontmatter({ includeScheduleHelper })}${shell}
<script is:inline>
(function () {
  var header = document.getElementById("SITE_HEADER");
  if (!header) return;
  var toggle = header.querySelector(".nav-toggle");
  var panel = header.querySelector("#global-nav-panel");
  if (!toggle || !panel) return;

  function setOpen(open) {
    if (open) {
      header.classList.add("is-nav-open");
    } else {
      header.classList.remove("is-nav-open");
    }
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  toggle.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    setOpen(!header.classList.contains("is-nav-open"));
  });

  panel.addEventListener("click", function (event) {
    if (event.target.closest("a")) setOpen(false);
  });

  window.addEventListener("resize", function () {
    if (window.matchMedia("(min-width: 769px)").matches) setOpen(false);
  });
})();
</script>
`,
    monthlyLinksExcluded,
    scheduleHubApplied: scheduleHub,
    navMode: "nav-toggle-rewrite",
  };
}
