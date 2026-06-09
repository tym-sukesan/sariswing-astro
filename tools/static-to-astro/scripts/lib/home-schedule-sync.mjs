import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const require = createRequire(path.join(REPO_ROOT, "package.json"));
const cheerio = require("cheerio");

export function normalizeVenue(venue) {
  return (venue ?? "").replace(/\s+/g, " ").trim();
}

/**
 * @param {string} text e.g. "3月25日(水)　LIVE"
 * @param {number} defaultYear
 */
export function parseHomeDateText(text, defaultYear = 2026) {
  const m = (text ?? "").match(/(\d{1,2})月(\d{1,2})日/);
  if (!m) return { iso: null, display: text?.trim() || null };
  const month = m[1].padStart(2, "0");
  const day = m[2].padStart(2, "0");
  return { iso: `${defaultYear}-${month}-${day}`, display: text.trim() };
}

/**
 * @param {string} text e.g. "OPEN 18:00 / START 19:00"
 */
export function parseHomeOpenStart(text) {
  const raw = (text ?? "").trim();
  const open = raw.match(/OPEN\s*([0-9]{1,2}:[0-9]{2})/i);
  const start = raw.match(/START\s*([0-9]{1,2}:[0-9]{2})/i);
  return { open_time: open?.[1] ?? null, start_time: start?.[1] ?? null };
}

function parseHomeCharge(text) {
  const raw = (text ?? "").replace(/^CHARGE\s*/i, "").trim();
  return raw || null;
}

function extractBandFromPerformers(text) {
  const m = (text ?? "").match(/[『「]([^』」]+)[』」]/);
  return m ? m[1].trim() : null;
}

/**
 * @param {string} indexHtmlPath
 */
export function detectHomeScheduleRegion(indexHtmlPath) {
  const html = fs.readFileSync(indexHtmlPath, "utf8");
  const $ = cheerio.load(html);
  const section = $("section.home-schedule").first();
  const cmsMarker = html.includes("CMS_TARGET: HOME_LIVE_SCHEDULE");

  return {
    detected: section.length > 0,
    cmsTarget: cmsMarker,
    heading: section.find("h2.section-heading").first().text().trim() || null,
    selector: "section.home-schedule",
    cardCount: section.find("article.schedule-card").length,
  };
}

/**
 * @param {string} indexHtmlPath
 * @param {number} defaultYear
 */
export function extractHomeScheduleCards(indexHtmlPath, defaultYear = 2026) {
  const html = fs.readFileSync(indexHtmlPath, "utf8");
  const $ = cheerio.load(html);
  const cards = [];

  $("section.home-schedule article.schedule-card").each((i, el) => {
    const body = $(el).find(".schedule-card__body").first();
    const dateText = body.find(".schedule-card__date").first().text().trim();
    const { iso, display } = parseHomeDateText(dateText, defaultYear);
    const venue = body.find(".schedule-card__venue").first().text().trim() || null;
    const metaLines = body
      .find(".schedule-card__meta")
      .map((_, m) => $(m).text().replace(/\s+/g, " ").trim())
      .get();

    let open_time = null;
    let start_time = null;
    let price = null;
    let phone = null;

    for (const line of metaLines) {
      if (/^OPEN/i.test(line)) {
        const t = parseHomeOpenStart(line);
        open_time = t.open_time;
        start_time = t.start_time;
      } else if (/^CHARGE/i.test(line)) {
        price = parseHomeCharge(line);
      } else if (/^☎/.test(line)) {
        phone = line.replace(/^☎︎?/, "").trim();
      }
    }

    const performers = body.find(".schedule-card__performers").first().text().trim() || null;
    const address = body.find(".schedule-card__address").first().text().trim() || null;
    const image = $(el).find(".schedule-card__flyer img").first().attr("src")?.trim() || null;

    cards.push({
      home_order: i + 1,
      home_date_display: display,
      date_iso: iso,
      venue,
      venue_normalized: normalizeVenue(venue),
      open_time,
      start_time,
      price,
      performers,
      performers_band: extractBandFromPerformers(performers),
      address,
      phone,
      image,
    });
  });

  return cards;
}

/**
 * @param {object} homeCard
 * @param {object} schedule
 */
export function scoreHomeToScheduleMatch(homeCard, schedule) {
  let score = 0;
  if (homeCard.date_iso && schedule.date === homeCard.date_iso) score += 10;
  if (
    homeCard.venue_normalized &&
    normalizeVenue(schedule.venue) === homeCard.venue_normalized
  ) {
    score += 10;
  }
  if (homeCard.open_time && schedule.open_time === homeCard.open_time) score += 2;
  if (homeCard.start_time && schedule.start_time === homeCard.start_time) score += 2;
  if (homeCard.performers_band && schedule.description?.includes(homeCard.performers_band)) {
    score += 3;
  }
  if (homeCard.performers_band && schedule.title?.includes(homeCard.performers_band)) {
    score += 2;
  }
  return score;
}

/**
 * @param {Array<object>} homeCards
 * @param {Array<object>} schedules
 */
export function matchHomeCardsToSchedules(homeCards, schedules) {
  const matches = [];
  const usedIds = new Set();

  for (const home of homeCards) {
    let best = null;
    let bestScore = 0;

    for (const s of schedules) {
      if (usedIds.has(s.id)) continue;
      const score = scoreHomeToScheduleMatch(home, s);
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }

    const matched = best && bestScore >= 18;
    if (matched) {
      usedIds.add(best.id);
      matches.push({ home, schedule: best, score: bestScore, method: "案A" });
    } else {
      matches.push({ home, schedule: null, score: bestScore, method: "案A-unmatched" });
    }
  }

  return matches;
}

/**
 * Fallback: mark next N upcoming events by date.
 */
export function applyFallbackHomeSelection(schedules, count = 3) {
  const sorted = [...schedules]
    .filter((s) => s.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const today = "2026-03-01";
  const upcoming = sorted.filter((s) => s.date >= today).slice(0, count);
  if (upcoming.length < count) {
    return sorted.slice(-count);
  }
  return upcoming;
}

export function applyHomeFlagsToSchedules(schedules, matchResults, { fallbackUsed = false } = {}) {
  const updated = schedules.map((s) => ({
    ...s,
    show_on_home: false,
    home_order: null,
    home_date_display: null,
    home_performers: null,
    home_address: null,
    home_phone: null,
    home_image: null,
  }));

  const byId = new Map(updated.map((s) => [s.id, s]));
  let order = 1;

  for (const row of matchResults) {
    if (!row.schedule) continue;
    const s = byId.get(row.schedule.id);
    if (!s) continue;
    s.show_on_home = true;
    s.home_order = row.home.home_order ?? order;
    s.home_date_display = row.home.home_date_display;
    s.home_performers = row.home.performers;
    s.home_address = row.home.address;
    s.home_phone = row.home.phone;
    s.home_image = row.home.image;
    order += 1;
  }

  if (fallbackUsed) {
    const fallback = applyFallbackHomeSelection(updated, 3);
    fallback.forEach((ev, i) => {
      const s = byId.get(ev.id);
      if (s) {
        s.show_on_home = true;
        s.home_order = i + 1;
      }
    });
  }

  return [...byId.values()];
}

const HOME_SCHEDULE_ASTRO = `---
/**
 * Home featured / weekly schedule from schedules.json (Phase 3-C).
 */
import { withBase } from "../lib/with-base.ts";
import { resolvePublicImageUrl } from "../lib/resolve-public-image.ts";
import schedules from "../data/schedules.json";

interface ScheduleEvent {
  id: string;
  date: string | null;
  date_display?: string | null;
  home_date_display?: string | null;
  title?: string | null;
  venue?: string | null;
  open_time?: string | null;
  start_time?: string | null;
  price?: string | null;
  description?: string | null;
  home_performers?: string | null;
  home_address?: string | null;
  home_phone?: string | null;
  home_image?: string | null;
  source_route?: string;
  month?: string;
  show_on_home?: boolean;
  home_order?: number | null;
}

const homeEvents = (schedules as ScheduleEvent[])
  .filter((s) => s.show_on_home)
  .sort((a, b) => (a.home_order ?? 99) - (b.home_order ?? 99));

const latestMonth = homeEvents[0]?.month ?? "2026-07";
const monthRoute = \`/schedule-\${latestMonth}/\`;
---

<section class="section-block home-schedule">
  <h2 class="section-heading">This Week's Live Schedule</h2>
  <!-- CMS_TARGET: HOME_LIVE_SCHEDULE (data-driven Phase 3-C) -->
  <div class="surface-block">
    {
      homeEvents.map((ev) => {
        const flyerSrc = resolvePublicImageUrl(ev.home_image);
        return (
        <article class="schedule-card">
          <div class="schedule-card__body">
            <p class="schedule-card__date">
              <a href={withBase(ev.source_route ?? "/")}>{ev.home_date_display ?? ev.date_display ?? ev.date}</a>
            </p>
            {ev.venue && <p class="schedule-card__venue">{ev.venue}</p>}
            {(ev.open_time || ev.start_time) && (
              <p class="schedule-card__meta">
                OPEN {ev.open_time ?? "—"} / START {ev.start_time ?? "—"}
              </p>
            )}
            {ev.price && <p class="schedule-card__meta">CHARGE {ev.price}</p>}
            {ev.home_performers && (
              <p class="schedule-card__performers">{ev.home_performers}</p>
            )}
            {ev.home_address && <p class="schedule-card__address">{ev.home_address}</p>}
            {ev.home_phone && <p class="schedule-card__meta">☎︎{ev.home_phone}</p>}
          </div>
          <div class="schedule-card__flyer">
            {flyerSrc ? (
              <img src={flyerSrc} alt="" width="259" height="259" loading="lazy" />
            ) : (
              <div class="flyer-placeholder" role="img" aria-label="Flyer pending">
                Flyer / Image pending
              </div>
            )}
          </div>
        </article>
        );
      })
    }
  </div>
  <p class="prototype-note">
    Phase 3-C: featured events from <code>schedules.json</code> (<code>show_on_home</code>).
    <a href={withBase("/schedule/")}>Schedule index</a>
    {" · "}
    <a href={withBase(monthRoute)}>月別スケジュール（{latestMonth.replace("-", ".")} ほか）</a>
  </p>
</section>
`;

const INDEX_ASTRO_TEMPLATE = `---
import BaseLayout from "../layouts/BaseLayout.astro";
import HomeSchedule from "../components/HomeSchedule.astro";
---

<BaseLayout
  title="Goto Saki Official Web Site"
  description="pianist GOTO SAKIのOfficial Web Site。プロフィールや演奏スケジュール等がご覧いただけます。"
  canonical="https://www.gosaki-piano.com/"
  ogTitle="Goto Saki Official Web Site"
  ogDescription="pianist GOTO SAKIのOfficial Web Site。プロフィールや演奏スケジュール等がご覧いただけます。"
  ogType="website"
  ogUrl="https://www.gosaki-piano.com/"
  twitterCard="summary_large_image"
  lang="ja"
>
  <section class="main-visual" aria-label="Main visual">
    <!-- VISUAL_ASSET: ASSET_MAP_MATCHED -->
    <img
      class="hero-image"
      src="https://static.wixstatic.com/media/26e086_0cea05e5141a49b99220e7383f218a99~mv2.jpg/v1/fill/w_1340,h_620,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/250428_0179re.jpg"
      alt="後藤沙紀 ピアノ演奏（Home main visual）"
      width="1340"
      height="620"
    />
  </section>

  <HomeSchedule />
</BaseLayout>
`;

export function writeHomeScheduleArtifacts(astroDir) {
  const astroAbs = path.resolve(astroDir);
  fs.writeFileSync(
    path.join(astroAbs, "src", "components", "HomeSchedule.astro"),
    HOME_SCHEDULE_ASTRO,
    "utf8",
  );
  fs.writeFileSync(path.join(astroAbs, "src", "pages", "index.astro"), INDEX_ASTRO_TEMPLATE, "utf8");
  return {
    componentPath: path.join(astroAbs, "src", "components", "HomeSchedule.astro"),
    indexPath: path.join(astroAbs, "src", "pages", "index.astro"),
    replacement: "replaced",
  };
}

export function appendHomeSchedulePhaseToSeedReport(reportPath, summary) {
  const reportAbs = path.resolve(reportPath);
  let content = fs.existsSync(reportAbs) ? fs.readFileSync(reportAbs, "utf8") : "";

  const marker = "## Phase 3-C: Home schedule (data-driven)";
  const block = [
    "",
    "## Phase 3-C: Home schedule (data-driven)",
    "",
    `- **Detected region:** ${summary.regionDetected ? "yes" : "no"} (\`section.home-schedule\`, CMS_TARGET: HOME_LIVE_SCHEDULE)`,
    `- **Home cards in index.html:** ${summary.homeCardCount}`,
    `- **Matched to schedules.json:** ${summary.matchedCount} / ${summary.homeCardCount}`,
    `- **Matching method:** ${summary.matchingMethod}`,
    `- **\`show_on_home: true\` count:** ${summary.showOnHomeCount}`,
    `- **Index page:** ${summary.indexReplacement} (\`src/pages/index.astro\` → \`HomeSchedule.astro\`)`,
    `- **Component:** \`src/components/HomeSchedule.astro\``,
    "",
    "### Home featured event IDs",
    "",
    ...summary.matchedIds.map((id) => `- \`${id}\``),
    "",
    "### Still static on Home",
    "",
    "- Hero main visual (`section.main-visual`) — image URL remains in index.astro",
    "",
    "### Supabase fields (Home / featured)",
    "",
    "| JSON (Phase 3-C) | Supabase column (proposal) |",
    "| --- | --- |",
    "| `show_on_home` | `show_on_home boolean default false` |",
    "| `home_order` | `home_sort_order int` |",
    "| `home_date_display` | optional `home_date_label text` (UI override) |",
    "| `home_image` | `home_flyer_url text` or Storage object |",
    "| `home_performers` / `home_address` | optional denormalized display fields, or derive from `description` |",
    "",
    "### Phase 3-D suggestions",
    "",
    "- Discography JSON seed + component",
    "- Supabase import + Storage for flyers",
    "- Admin UI to toggle `show_on_home` and reorder `home_order`",
    "",
  ].join("\n");

  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}\n`;
  }
  fs.writeFileSync(reportAbs, content, "utf8");
}

export function appendHomeScheduleToConversionReport(astroDir, summary) {
  const conversionPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(conversionPath)) return;

  const block = [
    "",
    "## Home schedule (Phase 3-C)",
    "",
    `- **Seed report section:** \`${summary.reportRel}\` (Phase 3-C)`,
    `- **\`show_on_home\` events:** ${summary.showOnHomeCount}`,
    `- **Matching:** ${summary.matchingMethod}`,
    `- **Component:** \`src/components/HomeSchedule.astro\``,
    `- **Index:** ${summary.indexReplacement} — Home schedule block uses JSON`,
    `- **Still static on \`/\`:** hero image only`,
    "",
    "### Phase 3-D (planned)",
    "",
    "- Discography data-driven seed",
    "- Supabase `schedules.show_on_home` + admin reorder",
    "",
  ].join("\n");

  let content = fs.readFileSync(conversionPath, "utf8");
  const marker = "## Home schedule (Phase 3-C)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(conversionPath, content, "utf8");
}

export function runHomeScheduleSync({
  inputDir,
  schedulesPath,
  astroDir,
  reportPath,
  defaultYear = 2026,
}) {
  const indexPath = path.join(path.resolve(inputDir), "index.html");
  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html not found: ${indexPath}`);
  }

  const region = detectHomeScheduleRegion(indexPath);
  const homeCards = extractHomeScheduleCards(indexPath, defaultYear);
  const schedulesAbs = path.resolve(schedulesPath);
  const schedules = JSON.parse(fs.readFileSync(schedulesAbs, "utf8"));

  let matchResults = matchHomeCardsToSchedules(homeCards, schedules);
  let matchingMethod = "案A（index.html ↔ schedules.json: 日付 + 会場 + 補助シグナル）";
  let fallbackUsed = false;

  const unmatched = matchResults.filter((r) => !r.schedule);
  if (unmatched.length > 0) {
    matchingMethod += ` — ${unmatched.length}件未一致のため案B（直近イベント仮選定）を併用`;
    fallbackUsed = true;
    const fallbackEvents = applyFallbackHomeSelection(schedules, homeCards.length);
    matchResults = homeCards.map((home, i) => ({
      home,
      schedule: fallbackEvents[i] ?? null,
      score: 0,
      method: "案B",
    }));
  }

  const updated = applyHomeFlagsToSchedules(schedules, matchResults, { fallbackUsed });
  fs.writeFileSync(schedulesAbs, `${JSON.stringify(updated, null, 2)}\n`, "utf8");

  const artifacts = writeHomeScheduleArtifacts(astroDir);
  const showOnHome = updated.filter((s) => s.show_on_home);
  const matchedIds = showOnHome.map((s) => s.id);

  const astroAbs = path.resolve(astroDir);
  const summary = {
    regionDetected: region.detected,
    homeCardCount: homeCards.length,
    matchedCount: matchResults.filter((r) => r.schedule && r.method !== "案B").length,
    showOnHomeCount: showOnHome.length,
    matchingMethod,
    indexReplacement: artifacts.replacement,
    matchedIds,
    reportRel: path.relative(astroAbs, path.resolve(reportPath)),
  };

  appendHomeSchedulePhaseToSeedReport(reportPath, summary);
  appendHomeScheduleToConversionReport(astroAbs, summary);

  return { ...summary, homeCards, matchResults, schedulesPath: schedulesAbs, artifacts };
}
