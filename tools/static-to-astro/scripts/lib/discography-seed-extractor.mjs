import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { htmlFileToAstroRoute } from "./static-site-analyzer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const require = createRequire(path.join(REPO_ROOT, "package.json"));
const cheerio = require("cheerio");

/**
 * @param {string} text e.g. "2023.7.26"
 */
export function parseReleaseDateText(text) {
  const m = (text ?? "").trim().match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (!m) return { iso: null, year: null };
  const month = m[2].padStart(2, "0");
  const day = m[3].padStart(2, "0");
  return { iso: `${m[1]}-${month}-${day}`, year: Number(m[1]) };
}

/**
 * @param {string} h3 e.g. "「Continuous」/ ごさきりかこTrio Feat.石川周之介"
 */
export function parseDiscographyHeading(h3) {
  const raw = (h3 ?? "").trim();
  const m = raw.match(/^[「『](.+?)[」』]\s*\/\s*(.+)$/);
  if (m) {
    return { title: m[1].trim(), artist: m[2].trim(), heading: raw };
  }
  return { title: raw || null, artist: null, heading: raw };
}

/**
 * @param {string} line Release paragraph text (without <strong>Release</strong>)
 */
export function parseReleaseLine(line) {
  const raw = (line ?? "").replace(/^Release\s*/i, "").trim();
  const { iso, year } = parseReleaseDateText(raw);
  const catalog = raw.match(/\b([A-Z]{2,10}-\d{3,6})\b/);
  const price = raw.match(/(\d{1,3}(?:,\d{3})*)\s*\([^)]*tax[^)]*\)/i);

  let label = null;
  if (iso) {
    const afterDate = raw.replace(/^\d{4}\.\d{1,2}\.\d{1,2}\s*/, "");
    const parts = afterDate.split(/\s{2,}|\u3000+/).map((p) => p.trim()).filter(Boolean);
    const withoutCatalog = parts.filter((p) => !catalog || !p.includes(catalog[1]));
    const withoutPrice = withoutCatalog.filter((p) => !price || !p.includes(price[1]));
    if (withoutPrice.length && !/^\d/.test(withoutPrice[0])) {
      label = withoutPrice[0];
    }
  }

  return {
    release_date: iso,
    year,
    catalog_number: catalog?.[1] ?? null,
    label,
    release_line_extra: raw,
  };
}

function classifyLink(href, label) {
  const h = (href ?? "").toLowerCase();
  const l = (label ?? "").toLowerCase();
  if (/tunecore|spotify|apple\.com\/music|youtube\.com|listen/.test(h)) {
    return "streaming";
  }
  if (/base\.shop|store|shop|purchase|bandcamp/.test(h) || l.includes("ショップ")) {
    return "purchase";
  }
  return "other";
}

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {import('cheerio').Element} itemEl
 * @param {object} ctx
 */
function parseDiscographyItem($, itemEl, ctx) {
  const body = $(itemEl).find(".discography-item__body").first();
  const h3 = body.find("h3").first().text().trim();
  const { title, artist, heading } = parseDiscographyHeading(h3);

  const coverImg = $(itemEl).find(".discography-item__cover img").first();
  const cover_image = coverImg.attr("src")?.trim() || null;
  const cover_alt = coverImg.attr("alt")?.trim() || null;

  let release_date = null;
  let year = null;
  let catalog_number = null;
  let label = null;
  /** @type {string[] & { _releaseDisplay?: string }} */
  const descriptionParts = [];
  const tracks = [];
  let streaming_url = null;
  let purchase_url = null;
  let inTrackList = false;

  body.children().each((_, child) => {
    const tag = child.tagName?.toLowerCase();
    const $c = $(child);
    const text = $c.text().replace(/\s+/g, " ").trim();

    if (tag === "h3") return;

    if (tag === "p") {
      if ($c.find("strong").text().includes("Release")) {
        const releaseText = text.replace(/^Release\s*/i, "").trim();
        const parsed = parseReleaseLine(releaseText);
        release_date = parsed.release_date;
        year = parsed.year;
        catalog_number = parsed.catalog_number;
        label = parsed.label;
        descriptionParts._releaseDisplay = releaseText;
        return;
      }
      if ($c.find("strong").text().includes("Track List")) {
        inTrackList = true;
        return;
      }
      const link = $c.find("a[href]").first();
      if (link.length) {
        const href = link.attr("href")?.trim();
        const linkLabel = link.text().trim();
        const kind = classifyLink(href, linkLabel);
        if (kind === "streaming" && !streaming_url) streaming_url = href ?? null;
        else if (kind === "purchase" && !purchase_url) purchase_url = href ?? null;
        else descriptionParts.push(`${linkLabel}: ${href}`);
        return;
      }
      if (!inTrackList && text) descriptionParts.push(text);
      return;
    }

    if (tag === "ul" && inTrackList) {
      $c.find("> li").each((i, li) => {
        const trackTitle = $(li).text().trim();
        if (trackTitle) tracks.push({ number: i + 1, title: trackTitle });
      });
      inTrackList = false;
    }
  });

  const release_display = descriptionParts._releaseDisplay ?? null;
  delete descriptionParts._releaseDisplay;

  ctx.index += 1;
  return {
    id: `discography-${String(ctx.index).padStart(3, "0")}`,
    title,
    artist,
    heading,
    release_date,
    year,
    label,
    catalog_number,
    release_display,
    description: descriptionParts.length ? descriptionParts.join("\n") : null,
    cover_image,
    cover_alt,
    tracks,
    streaming_url,
    purchase_url,
    sort_order: ctx.index,
    source_file: ctx.sourceFile,
    source_route: ctx.sourceRoute,
    published: true,
  };
}

/**
 * @param {string} filePath absolute path to discography.html
 */
export function extractDiscographyFromHtmlFile(filePath) {
  const fileName = path.basename(filePath);
  const sourceRoute = htmlFileToAstroRoute(fileName);
  const html = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(html);
  const ctx = { index: 0, sourceFile: fileName, sourceRoute };

  const items = [];
  $("main .discography-list > li.discography-item").each((_, el) => {
    items.push(parseDiscographyItem($, el, ctx));
  });

  return { source_file: fileName, source_route: sourceRoute, items };
}

export function extractDiscographySeeds(inputDir) {
  const inputAbs = path.resolve(inputDir);
  const filePath = path.join(inputAbs, "discography.html");
  if (!fs.existsSync(filePath)) {
    throw new Error(`discography.html not found: ${filePath}`);
  }

  const { items, source_file, source_route } = extractDiscographyFromHtmlFile(filePath);
  const stats = {
    total: items.length,
    withTitle: items.filter((i) => i.title).length,
    withArtist: items.filter((i) => i.artist).length,
    withReleaseDate: items.filter((i) => i.release_date).length,
    withCatalog: items.filter((i) => i.catalog_number).length,
    withLabel: items.filter((i) => i.label).length,
    withCover: items.filter((i) => i.cover_image).length,
    withTracks: items.filter((i) => i.tracks?.length > 0).length,
    withStreaming: items.filter((i) => i.streaming_url).length,
    withPurchase: items.filter((i) => i.purchase_url).length,
    trackCount: items.reduce((n, i) => n + (i.tracks?.length ?? 0), 0),
  };

  return { inputDir: inputAbs, source_file, source_route, items, stats };
}

export function writeDiscographySeedJson(items, outDir) {
  const outAbs = path.resolve(outDir);
  fs.mkdirSync(outAbs, { recursive: true });
  const jsonPath = path.join(outAbs, "discography.json");
  fs.writeFileSync(jsonPath, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  return jsonPath;
}

const DISCOGRAPHY_LIST_ASTRO = `---
/**
 * Discography releases from JSON seed (Phase 3-D).
 */
import { resolvePublicImageUrl } from "../lib/resolve-public-image.ts";
import discography from "../data/discography.json";

interface Track {
  number: number;
  title: string;
}

interface Release {
  id: string;
  title: string | null;
  artist: string | null;
  heading?: string | null;
  release_date: string | null;
  year: number | null;
  label: string | null;
  catalog_number: string | null;
  release_display?: string | null;
  description: string | null;
  cover_image: string | null;
  cover_alt?: string | null;
  tracks: Track[];
  streaming_url: string | null;
  purchase_url: string | null;
}

const releases = (discography as Release[]).sort(
  (a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99),
);

---

<ul class="discography-list">
  {
    releases.map((r) => {
      const coverSrc = resolvePublicImageUrl(r.cover_image);
      return (
      <li class="discography-item">
        <div class="discography-item__cover">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={r.cover_alt ?? r.title ?? "Release cover"}
              width="260"
              height="260"
              loading="lazy"
            />
          ) : (
            <div class="flyer-placeholder" role="img" aria-label="Cover pending">
              Cover pending
            </div>
          )}
        </div>
        <div class="discography-item__body">
          <h3>{r.heading ?? (r.title && r.artist ? \`「\${r.title}」/ \${r.artist}\` : r.title)}</h3>
          {r.release_display && (
            <p>
              <strong>Release</strong> {r.release_display}
            </p>
          )}
          {r.description &&
            r.description.split(/\\n/).map((line) => <p>{line}</p>)}
          {r.tracks?.length > 0 && (
            <>
              <p>
                <strong>Track List</strong>
              </p>
              <ul>
                {r.tracks.map((t) => (
                  <li>{t.title}</li>
                ))}
              </ul>
            </>
          )}
          {r.purchase_url && (
            <p>
              <a href={r.purchase_url} rel="noopener noreferrer">
                オンラインショップ
              </a>
            </p>
          )}
          {r.streaming_url && (
            <p>
              <a href={r.streaming_url} rel="noopener noreferrer">
                各種サブスク
              </a>
            </p>
          )}
        </div>
      </li>
      );
    })
  }
</ul>
`;

const DISCOGRAPHY_PAGE_ASTRO = `---
import BaseLayout from "../../layouts/BaseLayout.astro";
import DiscographyList from "../../components/DiscographyList.astro";
---

<BaseLayout
  title="Discography | saki-goto"
  canonical="https://www.gosaki-piano.com/discography/"
  ogTitle="Discography | saki-goto"
  ogType="website"
  ogUrl="https://www.gosaki-piano.com/discography/"
  twitterCard="summary_large_image"
  lang="ja"
>
  <h1 class="page-heading">Discography</h1>
  <section class="section-block">
    <!-- CMS_TARGET: DISCOGRAPHY_LIST (data-driven Phase 3-D) -->
    <DiscographyList />
  </section>
</BaseLayout>
`;

export function applyDiscographyDataViews(astroProjectDir) {
  const astroAbs = path.resolve(astroProjectDir);
  fs.mkdirSync(path.join(astroAbs, "src", "components"), { recursive: true });
  fs.writeFileSync(
    path.join(astroAbs, "src", "components", "DiscographyList.astro"),
    DISCOGRAPHY_LIST_ASTRO,
    "utf8",
  );
  fs.writeFileSync(
    path.join(astroAbs, "src", "pages", "discography", "index.astro"),
    DISCOGRAPHY_PAGE_ASTRO,
    "utf8",
  );
  return {
    componentPath: path.join(astroAbs, "src", "components", "DiscographyList.astro"),
    pagePath: path.join(astroAbs, "src", "pages", "discography", "index.astro"),
    replacement: "replaced",
  };
}

export function formatDiscographySeedReport({
  inputDir,
  source_file,
  items,
  stats,
  jsonPath,
  replacement,
}) {
  const pct = (n) => (stats.total ? ((n / stats.total) * 100).toFixed(0) : "0");

  return [
    "# Discography Seed Report",
    "",
    "Generated by static-to-astro (Phase 3-D).",
    "",
    "## Metadata",
    "",
    `- **Input directory:** \`${inputDir}\``,
    `- **Source file:** \`${source_file}\``,
    `- **Extracted at:** ${new Date().toISOString()}`,
    `- **Output:** \`${jsonPath}\``,
    `- **Index page:** ${replacement} (\`DiscographyList.astro\`)`,
    "",
    "## Extraction summary",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| Releases | ${stats.total} |`,
    `| Total tracks | ${stats.trackCount} |`,
    `| With \`title\` | ${stats.withTitle} (${pct(stats.withTitle)}%) |`,
    `| With \`artist\` | ${stats.withArtist} (${pct(stats.withArtist)}%) |`,
    `| With \`release_date\` | ${stats.withReleaseDate} (${pct(stats.withReleaseDate)}%) |`,
    `| With \`catalog_number\` | ${stats.withCatalog} (${pct(stats.withCatalog)}%) |`,
    `| With \`label\` | ${stats.withLabel} (${pct(stats.withLabel)}%) |`,
    `| With \`cover_image\` | ${stats.withCover} (${pct(stats.withCover)}%) |`,
    `| With \`tracks[]\` | ${stats.withTracks} (${pct(stats.withTracks)}%) |`,
    `| With \`streaming_url\` | ${stats.withStreaming} |`,
    `| With \`purchase_url\` | ${stats.withPurchase} |`,
    "",
    "### Releases",
    "",
    "| id | title | artist | release_date | tracks | purchase | streaming |",
    "| --- | --- | --- | --- | ---: | --- | --- |",
    ...items.map(
      (r) =>
        `| ${r.id} | ${r.title ?? "—"} | ${r.artist ?? "—"} | ${r.release_date ?? "—"} | ${r.tracks?.length ?? 0} | ${r.purchase_url ? "yes" : "—"} | ${r.streaming_url ? "yes" : "—"} |`,
    ),
    "",
    "## Successfully extracted fields",
    "",
    "- `id`, `sort_order`, `source_file`, `source_route`, `published`",
    "- `title` / `artist` from `h3` (`「Title」/ Artist`)",
    "- `release_date`, `year`, `catalog_number`, `label` from Release line (best effort)",
    "- `description` — credit lines and non-link notes (e.g. venue-only purchase)",
    "- `cover_image` / `cover_alt` from jacket `<img>`",
    "- `tracks[]` — `{ number, title }` from Track List `<ul>`",
    "- `purchase_url` / `streaming_url` — link heuristics (BASE shop, TuneCore, etc.)",
    "",
    "## Fields often empty or partial",
    "",
    "- `label` — omitted when Release line format is ambiguous",
    "- `streaming_url` / `purchase_url` — plain text links (e.g. ライブ会場でご購入) stay in `description`",
    "- Price text — not a separate JSON field (remains inside Release line in UI via catalog/date only)",
    "",
    "## cover_image handling",
    "",
    "Wix static URLs are preserved as-is in JSON. Supabase migration should upload to Storage and replace `cover_image_url`.",
    "",
    "## Supabase schema proposal",
    "",
    "### `discography`",
    "",
    "```sql",
    "create table discography (",
    "  id uuid primary key default gen_random_uuid(),",
    "  legacy_id text unique,",
    "  title text not null,",
    "  artist text,",
    "  release_date date,",
    "  label text,",
    "  catalog_number text,",
    "  description text,",
    "  cover_image_url text,",
    "  streaming_url text,",
    "  purchase_url text,",
    "  sort_order int default 0,",
    "  published boolean default true,",
    "  created_at timestamptz default now(),",
    "  updated_at timestamptz default now()",
    ");",
    "```",
    "",
    "### `discography_tracks`",
    "",
    "```sql",
    "create table discography_tracks (",
    "  id uuid primary key default gen_random_uuid(),",
    "  discography_id uuid references discography(id) on delete cascade,",
    "  track_number int not null,",
    "  title text not null,",
    "  sort_order int default 0",
    ");",
    "```",
    "",
    "## Manual review checklist",
    "",
    "- [ ] Release line price / SOLD OUT notes — verify display",
    "- [ ] Fourth release: venue-only purchase text in `description`",
    "- [ ] External image URLs — migrate before production",
    "- [ ] Link labels fixed to オンラインショップ / 各種サブスク when URLs present",
    "",
    "## Phase 3-E suggestions",
    "",
    "- Supabase seed import from `discography.json`",
    "- Admin UI for releases + track editor",
    "- News / Profile JSON seeds",
    "- Unify `extract-*-seed` into convert pipeline flag",
    "",
  ].join("\n");
}

export function appendDiscographySeedToConversionReport(astroDir, summary) {
  const conversionPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(conversionPath)) return;

  const block = [
    "",
    "## Discography seed (Phase 3-D)",
    "",
    `- **Seed report:** \`${summary.reportRel}\``,
    `- **discography.json:** ${summary.jsonWritten ? "yes" : "no"} (\`${summary.jsonRel}\`)`,
    `- **Releases extracted:** ${summary.releaseCount}`,
    `- **Data-driven pages:** \`${summary.pageRoute}\` (${summary.replacement})`,
    `- **Component:** \`src/components/DiscographyList.astro\``,
    `- **Still HTML-based:** ${summary.stillStatic || "—"}`,
    "",
    "### Phase 3-E (planned)",
    "",
    "- Supabase `discography` + `discography_tracks` import",
    "- Admin UI prototype (tooling only)",
    "- News CMS seed / Profile single-row seed",
    "",
  ].join("\n");

  let content = fs.readFileSync(conversionPath, "utf8");
  const marker = "## Discography seed (Phase 3-D)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(conversionPath, content, "utf8");
}

export function runDiscographySeedPipeline({ inputDir, outDir, reportPath, astroDir }) {
  const extracted = extractDiscographySeeds(inputDir);
  const jsonPath = writeDiscographySeedJson(extracted.items, outDir);

  const astroProjectDir = astroDir ?? path.resolve(outDir, "../..");
  const artifacts = applyDiscographyDataViews(astroProjectDir);

  const reportContent = formatDiscographySeedReport({
    inputDir: extracted.inputDir,
    source_file: extracted.source_file,
    items: extracted.items,
    stats: extracted.stats,
    jsonPath,
    replacement: artifacts.replacement,
  });

  const reportAbs = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(reportAbs), { recursive: true });
  fs.writeFileSync(reportAbs, reportContent, "utf8");

  const astroAbs = path.resolve(astroProjectDir);
  appendDiscographySeedToConversionReport(astroAbs, {
    reportRel: path.relative(astroAbs, reportAbs),
    jsonRel: path.relative(astroAbs, jsonPath),
    jsonWritten: true,
    releaseCount: extracted.stats.total,
    pageRoute: "/discography/",
    replacement: artifacts.replacement,
    stillStatic: "none on /discography/ (hero N/A)",
  });

  return {
    ...extracted,
    jsonPath,
    reportPath: reportAbs,
    artifacts,
  };
}
