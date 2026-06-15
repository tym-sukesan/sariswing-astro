import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { htmlHrefToRoute } from "./path-transform.mjs";
import { isScheduleMonthNavTarget, SCHEDULE_INDEX_ROUTE } from "./schedule-pages.mjs";
import { toPublicSeoPath } from "./seo-extract.mjs";

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
 * Build Header.astro with pathname-based active nav.
 * Schedule month links are collapsed to a single /schedule/ link when scheduleMonths are provided.
 *
 * @param {string | null} headerHtml
 * @param {string} placeholder
 * @param {{ scheduleHub?: boolean }} [options]
 */
/**
 * @returns {{ content: string, monthlyLinksExcluded: number, scheduleHubApplied: boolean }}
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
    };
  }

  const $ = cheerio.load(`<div id="__header_wrap">${headerHtml}</div>`, { decodeEntities: false });
  const nav = $("nav").first();
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
      headerHtml
        .replace(/\s+aria-current="[^"]*"/gi, "")
        .replace(/\bis-current\b/g, "")
        .replace(/\s+class="\s*"/gi, ""),
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
    };
  }

  const navClass = nav.attr("class") ? ` class="${nav.attr("class")}"` : "";
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

  const scheduleHelper = scheduleHub
    ? `
function scheduleNavActive() {
  const path = currentPath.endsWith("/") ? currentPath : \`\${currentPath}/\`;
  if (path === withBase("/schedule/")) return true;
  const prefix = import.meta.env.BASE_URL.replace(/\\/$/, "");
  return new RegExp(\`^\${prefix}/schedule-\\\\d{4}-\\\\d{2}/\`, "i").test(path);
}
`
    : "";

  return {
    content: `---
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
${shell}
<script is:inline>
(function () {
  var header = document.getElementById("SITE_HEADER");
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.getElementById("global-nav-panel");
  if (!header || !toggle || !panel) return;

  function setOpen(open) {
    header.classList.toggle("is-nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  toggle.addEventListener("click", function () {
    setOpen(!header.classList.contains("is-nav-open"));
  });

  panel.addEventListener("click", function (event) {
    if (event.target.closest("a")) setOpen(false);
  });

  window.addEventListener("resize", function () {
    if (window.matchMedia("(min-width: 768px)").matches) setOpen(false);
  });
})();
</script>
`,
    monthlyLinksExcluded,
    scheduleHubApplied: scheduleHub,
  };
}
