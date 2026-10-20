/**
 * Gosaki-only public presentation tweaks applied after shared convert.
 * Does not modify header-transform.mjs or other sites.
 */

import fs from "node:fs";
import path from "node:path";

export const GOSAKI_APPLE_TOUCH_ICON_FILE = "apple-touch-icon.png";
export const GOSAKI_APPLE_TOUCH_PUBLIC_REL = `images/wix-local/${GOSAKI_APPLE_TOUCH_ICON_FILE}`;
const APPLE_TOUCH_SOURCE_REL = `assets/gosaki-piano/wix-local/${GOSAKI_APPLE_TOUCH_ICON_FILE}`;

const NAV_UL_RE = /(<nav\b[^>]*\bglobal-nav\b[^>]*>\s*<ul>)([\s\S]*?)(<\/ul>)/;
const CONTACT_LI_RE = />\s*Contact\s*<\/a>/;

/**
 * Move the Contact list item to the end of the global nav.
 * DOM order becomes Home, About, Schedule, Discography, Link, Contact.
 * @param {string} source
 */
export function moveGosakiContactNavItemLast(source) {
  const match = source.match(NAV_UL_RE);
  if (!match || match.index == null) {
    return { html: source, applied: false, reason: "global nav missing" };
  }
  const items = match[2].match(/<li\b[\s\S]*?<\/li>/g) ?? [];
  const contactIndex = items.findIndex((item) => CONTACT_LI_RE.test(item));
  if (contactIndex < 0) {
    return { html: source, applied: false, reason: "contact item missing" };
  }
  if (contactIndex === items.length - 1) {
    return { html: source, applied: true, unchanged: true };
  }
  const contact = items[contactIndex];
  const ordered = [...items.slice(0, contactIndex), ...items.slice(contactIndex + 1), contact];
  const inner = `\n${ordered.map((item) => `        ${item.trim()}`).join("\n")}\n      `;
  const html = `${source.slice(0, match.index)}${match[1]}${inner}${match[3]}${source.slice(match.index + match[0].length)}`;
  return { html, applied: true, unchanged: false };
}

const KV_CAPTION_HTML =
  '<p class="gosaki-kv-caption"><span class="gosaki-kv-caption__role">Pianist</span><span class="gosaki-kv-caption__name">Saki Goto</span></p>';

/**
 * Insert the two-line hero caption inside the home key visual.
 * A single ::after cannot size the two lines differently.
 * @param {string} source
 */
export function injectGosakiKvCaption(source) {
  if (source.includes('class="gosaki-kv-caption"')) {
    return { html: source, applied: true, unchanged: true };
  }
  const open = source.match(/<div\b[^>]*\bid="comp-mbl1cpz3"[^>]*>/);
  if (!open || open.index == null) {
    return { html: source, applied: false, reason: "home kv missing" };
  }
  const at = open.index + open[0].length;
  const html = `${source.slice(0, at)}${KV_CAPTION_HTML}${source.slice(at)}`;
  return { html, applied: true, unchanged: false };
}

/**
 * Point apple-touch-icon at the 180px PNG. Leave favicon.ico on rel=icon.
 * @param {string} source
 */
export function retargetGosakiAppleTouchIcon(source) {
  const pngExpr = `{import.meta.env.BASE_URL + "${GOSAKI_APPLE_TOUCH_PUBLIC_REL}"}`;
  let html = source.replace(
    /appleTouchIcon=\{import\.meta\.env\.BASE_URL \+ "images\/wix-local\/favicon\.ico"\}/g,
    `appleTouchIcon=${pngExpr}`,
  );
  html = html.replace(
    /(rel="apple-touch-icon"[^>]*href=)(?:"[^"]*favicon\.ico"|\{import\.meta\.env\.BASE_URL \+ "images\/wix-local\/favicon\.ico"\})/g,
    `$1${pngExpr}`,
  );
  html = html.replace(
    /(href=)(?:"[^"]*favicon\.ico"|\{import\.meta\.env\.BASE_URL \+ "images\/wix-local\/favicon\.ico"\})([^>]*rel="apple-touch-icon")/g,
    `$1${pngExpr}$2`,
  );
  return { html, applied: html !== source };
}

function walkTextFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walkTextFiles(abs, acc);
    } else if (/\.(astro|html)$/.test(name)) acc.push(abs);
  }
  return acc;
}

/**
 * @param {string} outDir
 * @param {string} toolRoot
 */
export function applyGosakiPublicPresentation(outDir, toolRoot) {
  const headerPath = path.join(outDir, "src/components/Header.astro");
  /** @type {{ applied: boolean, reason?: string, unchanged?: boolean }} */
  let nav = { applied: false, reason: "header missing" };
  if (fs.existsSync(headerPath)) {
    const before = fs.readFileSync(headerPath, "utf8");
    nav = moveGosakiContactNavItemLast(before);
    if (nav.applied && nav.html && nav.html !== before) {
      fs.writeFileSync(headerPath, nav.html, "utf8");
    }
  }

  const homePath = path.join(outDir, "src/pages/index.astro");
  /** @type {{ applied: boolean, reason?: string, unchanged?: boolean }} */
  let kv = { applied: false, reason: "home page missing" };
  if (fs.existsSync(homePath)) {
    const before = fs.readFileSync(homePath, "utf8");
    kv = injectGosakiKvCaption(before);
    if (kv.applied && kv.html && kv.html !== before) {
      fs.writeFileSync(homePath, kv.html, "utf8");
    }
  }

  const sourceIcon = path.join(toolRoot, APPLE_TOUCH_SOURCE_REL);
  const destIcon = path.join(outDir, "public", GOSAKI_APPLE_TOUCH_PUBLIC_REL);
  let iconCopied = false;
  if (fs.existsSync(sourceIcon)) {
    fs.mkdirSync(path.dirname(destIcon), { recursive: true });
    fs.copyFileSync(sourceIcon, destIcon);
    iconCopied = true;
  }
  let appleTouchFiles = 0;
  for (const file of walkTextFiles(path.join(outDir, "src"))) {
    const before = fs.readFileSync(file, "utf8");
    const next = retargetGosakiAppleTouchIcon(before);
    if (next.applied) {
      fs.writeFileSync(file, next.html, "utf8");
      appleTouchFiles += 1;
    }
  }

  return {
    applied: nav.applied === true || kv.applied === true || iconCopied,
    nav,
    kv,
    appleTouch: {
      copied: iconCopied,
      filesRewritten: appleTouchFiles,
      publicPath: GOSAKI_APPLE_TOUCH_PUBLIC_REL,
    },
  };
}
