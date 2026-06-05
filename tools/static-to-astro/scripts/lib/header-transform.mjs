import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { htmlHrefToRoute } from "./path-transform.mjs";
import { isScheduleMonthNavTarget, SCHEDULE_INDEX_ROUTE } from "./schedule-pages.mjs";
import { toPublicSeoPath } from "./seo-extract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const require = createRequire(path.join(REPO_ROOT, "package.json"));
const cheerio = require("cheerio");

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
    const route = htmlHrefToRoute(href, "index.html");
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
    const stripped = headerHtml
      .replace(/\s+aria-current="[^"]*"/gi, "")
      .replace(/\bis-current\b/g, "")
      .replace(/\s+class="\s*"/gi, "");
    return {
      content: `---
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

  shell = shell.replace(/href="([^"]+\.html[^"]*)"/g, (_, href) => `href="${htmlHrefToRoute(href, "index.html")}"`);

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
    return `        <li><a href="${safeRoute}" class:list={{ 'is-current': ${activeExpr} }}>${safeText}</a></li>`;
  });

  const navBlock = `  <nav${navClass}${navAria}>
    <ul>
${navLines.join("\n")}
    </ul>
  </nav>`;

  shell = shell.replace("<!-- STATIC_TO_ASTRO_NAV -->", navBlock);

  const scheduleHelper = scheduleHub
    ? `
function scheduleNavActive() {
  const path = currentPath.endsWith("/") ? currentPath : \`\${currentPath}/\`;
  if (path === "/schedule/") return true;
  return /^\\/schedule-\\d{4}-\\d{2}\\//i.test(path);
}
`
    : "";

  return {
    content: `---
const currentPath = Astro.url.pathname;

function navActive(href) {
  const path = currentPath;
  const normalized = href.endsWith("/") ? href : \`\${href}/\`;
  if (normalized === "/" || normalized === "") {
    return path === "/" || path === "";
  }
  return path === normalized || path.startsWith(normalized);
}
${scheduleHelper}---
${shell}
`,
    monthlyLinksExcluded,
    scheduleHubApplied: scheduleHub,
  };
}
