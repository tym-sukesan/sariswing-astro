/**
 * Gosaki home representative SEO.
 * Strengthens the top page for 後藤沙紀 / Saki Goto / 公式サイト.
 * Runs at convert time on generated src/pages/index.astro. Does not edit output by hand.
 */

import fs from "node:fs";
import path from "node:path";

export const GOSAKI_HOME_REPRESENTATIVE_TITLE = "後藤沙紀 | Saki Goto 公式サイト";
export const GOSAKI_HOME_REPRESENTATIVE_DESCRIPTION =
  "ジャズピアニスト後藤沙紀（Saki Goto）の公式サイトです。プロフィール、演奏スケジュール、ディスコグラフィーをご覧いただけます。";
export const GOSAKI_HOME_SEO_MARKER = 'data-gosaki-home-seo="representative"';
const FALLBACK_CANONICAL = "https://www.gosaki-piano.com/";

/**
 * Replace a string attribute, or insert it when the open tag does not have one.
 * Matches both multiline generator props and one-line `<BaseLayout title="...">`.
 * @param {string} open
 * @param {string} name
 * @param {string} value
 */
function upsertLayoutAttr(open, name, value) {
  const re = new RegExp(`(\\s${name}=")([^"]*)(")`);
  if (re.test(open)) return open.replace(re, `$1${value}$3`);
  return open.replace(/>$/, `\n  ${name}="${value}"\n>`);
}

/**
 * @param {string} canonical
 */
export function buildGosakiHomeRepresentativeJsonLd(canonical) {
  const url = String(canonical || FALLBACK_CANONICAL).trim() || FALLBACK_CANONICAL;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: GOSAKI_HOME_REPRESENTATIVE_TITLE,
        url,
        inLanguage: "ja",
      },
      {
        "@type": "Person",
        name: "後藤沙紀",
        alternateName: ["Saki Goto", "GOTO SAKI"],
        jobTitle: "Pianist",
        url,
      },
    ],
  };
}

/**
 * @param {string} source
 */
export function patchGosakiHomeRepresentativeSeo(source) {
  const match = source.match(/<BaseLayout\b[\s\S]*?>/);
  if (!match || match.index == null) {
    throw new Error("home page missing BaseLayout");
  }
  let open = match[0];
  open = upsertLayoutAttr(open, "title", GOSAKI_HOME_REPRESENTATIVE_TITLE);
  open = upsertLayoutAttr(open, "description", GOSAKI_HOME_REPRESENTATIVE_DESCRIPTION);
  open = upsertLayoutAttr(open, "ogTitle", GOSAKI_HOME_REPRESENTATIVE_TITLE);
  open = upsertLayoutAttr(open, "ogDescription", GOSAKI_HOME_REPRESENTATIVE_DESCRIPTION);
  const canonical = open.match(/\n\s*canonical="([^"]*)"/)?.[1] || FALLBACK_CANONICAL;
  const script = `<script type="application/ld+json" is:inline ${GOSAKI_HOME_SEO_MARKER}>\n${JSON.stringify(buildGosakiHomeRepresentativeJsonLd(canonical), null, 2)}\n</script>`;
  let next = `${source.slice(0, match.index)}${open}${source.slice(match.index + match[0].length)}`;
  const existing = /<script type="application\/ld\+json" is:inline data-gosaki-home-seo="representative">[\s\S]*?<\/script>/;
  if (existing.test(next)) {
    next = next.replace(existing, script);
  } else {
    const at = next.indexOf(open);
    next = `${next.slice(0, at + open.length)}\n${script}${next.slice(at + open.length)}`;
  }
  return next;
}

/**
 * @param {string} outDir
 */
export function applyGosakiHomeRepresentativeSeo(outDir) {
  const pagePath = path.join(outDir, "src/pages/index.astro");
  if (!fs.existsSync(pagePath)) {
    return { applied: false, reason: "home page missing", pagePath };
  }
  const before = fs.readFileSync(pagePath, "utf8");
  const after = patchGosakiHomeRepresentativeSeo(before);
  if (after !== before) fs.writeFileSync(pagePath, after, "utf8");
  return { applied: true, pagePath, unchanged: after === before };
}
