/**
 * Gosaki initial public cutover — Option D.
 * Remove stale Wix Home "THIS WEEK'S LIVE SCHEDULE" (heading + rule + repeater)
 * so March/July crawl cards are not published. Leave a slot for a later
 * published upcoming-N section. YouTube stays on Home via a separate inject.
 *
 * Gosaki-only. Not a CMS Kit core hook.
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "../../package.json"));
const cheerio = require("cheerio");

export const INITIAL_PUBLIC_CUTOVER_HOME_SCHEDULE = "Option D";

export const GOSAKI_HOME_SCHEDULE_SLOT = "<!--GOSAKI_HOME_SCHEDULE_SLOT-->";
export const GOSAKI_HOME_THIS_WEEK_HIDDEN_CLASS = "gosaki-home-this-week-hidden";

export const GOSAKI_STALE_THIS_WEEK_SECTION_ID = "comp-m8y3dzb6";
export const GOSAKI_STALE_THIS_WEEK_HEADING_ID = "comp-m8y5bex0";
export const GOSAKI_STALE_THIS_WEEK_RULE_ID = "comp-m8y5l5fs";
export const GOSAKI_STALE_THIS_WEEK_REPEATER_ID = "comp-m8y53dj5";

const STALE_IDS = [
  GOSAKI_STALE_THIS_WEEK_HEADING_ID,
  GOSAKI_STALE_THIS_WEEK_RULE_ID,
  GOSAKI_STALE_THIS_WEEK_REPEATER_ID,
];

/**
 * @param {string} bodyPart
 * @returns {{ open: string, inner: string } | null}
 */
function splitBaseLayoutOpenAndInner(bodyPart) {
  const match = bodyPart.match(/^(\s*<BaseLayout[\s\S]*?>)([\s\S]*)$/);
  if (!match) return null;
  return { open: match[1], inner: match[2] };
}

/**
 * @param {string} html
 */
export function homeHasVisibleStaleThisWeek(html) {
  if (/THIS WEEK/i.test(html)) return true;
  if (/3月25|3月27|3月31/.test(html)) return true;
  const $ = cheerio.load(`<div id="gosaki-home-root">${html}</div>`, { xml: false });
  const root = $("#gosaki-home-root");
  if (root.find(`#${GOSAKI_STALE_THIS_WEEK_HEADING_ID}`).length) return true;
  if (root.find(`#${GOSAKI_STALE_THIS_WEEK_RULE_ID}`).length) return true;
  if (root.find(`#${GOSAKI_STALE_THIS_WEEK_REPEATER_ID}`).length) return true;
  return false;
}

/**
 * Remove stale THIS WEEK DOM from a Home body fragment. Inserts a future
 * schedule slot. Does not hide YouTube. Does not touch Schedule hub/months.
 *
 * @param {string} bodyHtml
 * @returns {{ html: string, removedIds: string[], slotInserted: boolean, sectionMarked: boolean }}
 */
export function hideGosakiStaleThisWeekInHomeBody(bodyHtml) {
  const $ = cheerio.load(`<div id="gosaki-home-root">${bodyHtml}</div>`, { xml: false });
  const root = $("#gosaki-home-root");
  /** @type {string[]} */
  const removedIds = [];

  const heading = root.find(`#${GOSAKI_STALE_THIS_WEEK_HEADING_ID}`).first();
  const rule = root.find(`#${GOSAKI_STALE_THIS_WEEK_RULE_ID}`).first();
  const repeater = root.find(`#${GOSAKI_STALE_THIS_WEEK_REPEATER_ID}`).first();
  const section = root.find(`#${GOSAKI_STALE_THIS_WEEK_SECTION_ID}`).first();

  const insertBefore = heading.length ? heading : rule.length ? rule : repeater;
  const currentHtml = () => root.html() ?? "";
  let slotInserted = currentHtml().includes(GOSAKI_HOME_SCHEDULE_SLOT);

  if (!slotInserted && insertBefore.length) {
    insertBefore.before(GOSAKI_HOME_SCHEDULE_SLOT);
    slotInserted = true;
  }

  for (const id of STALE_IDS) {
    const node = root.find(`#${id}`);
    if (node.length) {
      node.remove();
      removedIds.push(id);
    }
  }

  if (section.length) {
    section.addClass(GOSAKI_HOME_THIS_WEEK_HIDDEN_CLASS);
    if (!currentHtml().includes(GOSAKI_HOME_SCHEDULE_SLOT)) {
      section.prepend(`\n${GOSAKI_HOME_SCHEDULE_SLOT}\n`);
      slotInserted = true;
    }
  } else if (!currentHtml().includes(GOSAKI_HOME_SCHEDULE_SLOT)) {
    root.prepend(`\n${GOSAKI_HOME_SCHEDULE_SLOT}\n`);
    slotInserted = true;
  }

  return {
    html: root.html() ?? bodyHtml,
    removedIds,
    slotInserted,
    sectionMarked: Boolean(section.length),
  };
}

/**
 * @param {string} pageContent Astro Home page
 */
export function hideGosakiStaleThisWeekInHomePage(pageContent) {
  if (!pageContent.includes("</BaseLayout>")) {
    const result = hideGosakiStaleThisWeekInHomeBody(pageContent);
    return result.html;
  }

  const closeTag = "</BaseLayout>";
  const closeIdx = pageContent.lastIndexOf(closeTag);
  if (closeIdx === -1) {
    const result = hideGosakiStaleThisWeekInHomeBody(pageContent);
    return result.html;
  }

  const beforeClose = pageContent.slice(0, closeIdx);
  const afterClose = pageContent.slice(closeIdx);
  const fmEnd = beforeClose.indexOf("---", 3);
  if (fmEnd < 0) {
    const result = hideGosakiStaleThisWeekInHomeBody(pageContent);
    return result.html;
  }
  const fmEndAfter = fmEnd + 3;
  const bodyPart = beforeClose.slice(fmEndAfter);
  const layout = splitBaseLayoutOpenAndInner(bodyPart);
  if (!layout) {
    const result = hideGosakiStaleThisWeekInHomeBody(pageContent);
    return result.html;
  }

  const hidden = hideGosakiStaleThisWeekInHomeBody(layout.inner);
  return beforeClose.slice(0, fmEndAfter) + layout.open + hidden.html + afterClose;
}

/**
 * @param {string} outDir generated Astro project
 * @param {{ homePagePath?: string }} [options]
 */
export function applyGosakiHomeStaleThisWeekHide(outDir, options = {}) {
  const homeRel = options.homePagePath ?? "src/pages/index.astro";
  const homePath = path.join(outDir, homeRel);
  if (!fs.existsSync(homePath)) {
    return {
      applied: false,
      reason: `Home page not found: ${homeRel}`,
      alreadyHidden: false,
      removedIds: [],
      slotInserted: false,
      homePagePath: homeRel,
      cutover: INITIAL_PUBLIC_CUTOVER_HOME_SCHEDULE,
    };
  }

  const before = fs.readFileSync(homePath, "utf8");
  const after = hideGosakiStaleThisWeekInHomePage(before);
  if (after !== before) {
    fs.writeFileSync(homePath, after, "utf8");
  }

  const wrap = (html) => {
    const $ = cheerio.load(`<div id="gosaki-home-root">${html}</div>`, { xml: false });
    return $;
  };
  const $before = wrap(before);
  const $after = wrap(after);
  const removedIds = STALE_IDS.filter(
    (id) => $before(`#${id}`).length > 0 && $after(`#${id}`).length === 0,
  );
  const stillVisible = homeHasVisibleStaleThisWeek(after);
  const slotInserted = after.includes(GOSAKI_HOME_SCHEDULE_SLOT);

  return {
    applied: true,
    reason: stillVisible ? "stale_this_week_still_visible" : null,
    alreadyHidden: removedIds.length === 0 && slotInserted && !stillVisible,
    removedIds,
    slotInserted,
    homePagePath: homeRel,
    cutover: INITIAL_PUBLIC_CUTOVER_HOME_SCHEDULE,
    staleVisibleAfter: stillVisible,
  };
}
