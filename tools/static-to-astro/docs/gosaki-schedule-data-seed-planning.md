# Gosaki schedule data seed planning (G-9b)

**Phase:** `G-9b-gosaki-schedule-data-seed-planning`  
**Date:** 2026-06-16  
**Prior:** `G-9a-gosaki-cms-scope-and-schedule-youtube-planning` (commit `77b57b8`)  
**Status:** planning + dry-run extractor implementation — **no DB write, no SQL execution, no FTP**

---

## 1. Purpose

Gosaki staging preview（静的 Wix HTML）は client-ready。次は **Schedule CMS** のため、Wix live-crawl fixture から Supabase 投入用 seed data を安全に抽出する設計を固定し、**dry-run extractor** を実装する。

本フェーズでは以下を行う:

- `fixtures/gosaki-piano/2026-03.html` … `2026-07.html` の DOM 構造確認
- 既存 `.schedule-card` extractor との差分整理
- Wix repeater 専用 parser 設計
- seed JSON 形式・`site_slug` migration 計画・seed SQL 方針（テンプレートのみ）
- 手動 review checklist
- dry-run verifier（36 passed）

**行わない:** DB write / Supabase SQL 実行 / FTP / `/admin` 変更 / generated output の commit

---

## 2. Fixture HTML structure (live crawl)

### 2.1 Target files

| File | Route | Repeater items | Notes |
| --- | --- | ---: | --- |
| `2026-03.html` | `/2026-03/` | 13 | |
| `2026-04.html` | `/2026-04/` | 10 | |
| `2026-05.html` | `/2026-05.html` | 12 | |
| `2026-06.html` | `/2026-06/` | 11 | |
| `2026-07.html` | `/2026-07/` | 14 | |
| **Total** | | **60** | matches manual fixture `gosaki-static-site/schedule-*.html` |

### 2.2 Wix DOM pattern (per event)

Each event is one `.wixui-repeater__item` inside `<fluid-columns-repeater>` (G-8g4 strips `visibility:hidden`).

```
.wixui-repeater__item
├── h1.wixui-rich-text__text     → date (+ optional inline title, e.g. "2026.07.09 (Thu) <Leader LIVE>")
├── h6.wixui-rich-text__text     → subtitle in angle brackets, e.g. "<Awesome Songbook>"
└── p.wixui-rich-text__text      → meta lines (one field per <p>):
    ├── 会場：…
    ├── 時間：開場 18:00 / 開演 19:30
    ├── 料金：…
    ├── 出演：…
    ├── Special Guest …          (optional)
    └── 会場website：https://…   (optional; may include <a href>)
```

**Images:** current live crawl has **0 flyer `<img>`** across all 60 events (placeholder-only on Wix). `image_url` → `null` for MVP seed.

**Month heading:** page-level `h2` (e.g. `July , 2026`) — not per-event.

### 2.3 Differences from manual fixture (`.schedule-card`)

| Aspect | Manual (`gosaki-static-site`) | Wix live crawl (`gosaki-piano`) |
| --- | --- | --- |
| Container | `main .schedule-list > li.schedule-card` | `fluid-columns-repeater .wixui-repeater__item` |
| Date | `.schedule-card__date` | `h1` (may include trailing title) |
| Title | `.schedule-card__title` or first `<…>` meta | `h1` remainder and/or `h6` subtitle |
| Meta | `.schedule-card__meta` lines | `p` lines (deduped) |
| Flyer | `.schedule-card__flyer img` | `img[src]` inside item (none in crawl) |
| Filename | `schedule-2026-07.html` | `2026-07.html` |
| Route | `/schedule-2026-07/` | `/2026-07/` (Gosaki convention) |

Event counts per month are **identical** between both fixture sets (verified in G-9b).

---

## 3. Extractor architecture

### 3.1 Strategy decision

**Recommendation:** separate Gosaki Wix module — **do not** add Wix branches into `parseScheduleCard()`.

| Module | Role |
| --- | --- |
| `schedule-seed-extractor.mjs` | Shared utilities: `parseScheduleDateText`, `parseScheduleTimeLine`; `.schedule-card` parser for manual fixtures |
| `gosaki-wix-schedule-extractor.mjs` | **New (G-9b):** Wix `wixui-repeater__item` parser |
| `extract-gosaki-schedule-seed.mjs` | CLI — dry-run default |
| `verify-gosaki-schedule-seed-extractor.mjs` | Fixture-based verifier |

**Rationale:**

- DOM shapes are incompatible (semantic cards vs Wix mesh/repeater)
- Route/filename conventions differ (`/YYYY-MM/` vs `/schedule-YYYY-MM/`)
- Shared time/date parsers avoid duplication
- Sariswing / manual gosaki path stays unchanged

### 3.2 Extraction algorithm (`parseGosakiWixRepeaterItem`)

1. Select `.wixui-repeater__item` for each event
2. **Date:** `parseScheduleDateText()` on `h1` text; strip trailing title after `YYYY.MM.DD (Dow)`
3. **Explicit title:** remainder of `h1` after date (strip `＜…＞` brackets) — e.g. `Leader LIVE`
4. **Subtitle:** `h6` with angle brackets — title if no h1 title; else prepend to `description`
5. **Meta:** deduped `p` text lines — same prefix rules as `.schedule-card` parser
6. **Time:** `parseScheduleTimeLine()` on `時間：` lines
7. **Image:** first `img[src]` in item (null in current crawl)
8. **legacy_id:** `schedule-YYYY-MM-NNN` (NNN = 1-based index within month file)
9. **site_slug:** `gosaki-piano` on every row

### 3.3 CLI usage

```bash
cd tools/static-to-astro

# Dry-run (default — no writes)
npm run extract:gosaki-schedule-seed

# Optional write to output/ (gitignored — do not commit)
node scripts/extract-gosaki-schedule-seed.mjs \
  --input-dir fixtures/gosaki-piano \
  --write --out-dir output/gosaki-schedule-seed
```

### 3.4 G-9b dry-run results

```
site_slug: gosaki-piano
Months: 5
Events: 60
Fields: date 60, title 60, venue 57, open 50, start 51, price 54, image 0
Warnings: 0

Per-month:
  2026-07: 14
  2026-06: 11
  2026-05: 12
  2026-04: 10
  2026-03: 13
```

---

## 4. Seed JSON format

### 4.1 `schedules.json` (array of events)

| Field | Type | Source | Notes |
| --- | --- | --- | --- |
| `site_slug` | `text` | constant | `'gosaki-piano'` |
| `legacy_id` | `text` | generated | `schedule-2026-07-001` … |
| `date` | `date` (ISO) | `h1` | `YYYY-MM-DD`; null if parse fails |
| `year` | `int` | filename | e.g. `2026` |
| `month` | `text` | filename | `YYYY-MM` |
| `title` | `text` | h1 remainder / h6 | angle-bracket acts |
| `venue` | `text` | `会場：` | |
| `open_time` | `text` | `時間：` | `HH:MM` or null |
| `start_time` | `text` | `時間：` | `HH:MM` or null |
| `price` | `text` | `料金：` | free-form |
| `description` | `text` | 出演 / Guest / 会場website / non-standard 時間 | `\n` joined |
| `image_url` | `text` | `img[src]` | Wix CDN URL or null |
| `source_file` | `text` | basename | `2026-07.html` |
| `source_route` | `text` | route | `/2026-07/` |
| `published` | `boolean` | default | `true` for seed |
| `sort_order` | `int` | index | `10, 20, 30…` within month |

**Not in Gosaki MVP seed:** `home_image_url`, `show_on_home`, `home_order` — all null/false in DB.

**`date_display`:** preserved in extractor output for UI/review; **not** a DB column (render from `date`).

### 4.2 `schedule-months.json` (array of months)

| Field | Type | Notes |
| --- | --- | --- |
| `site_slug` | `text` | `'gosaki-piano'` |
| `month` | `text` | `YYYY-MM` |
| `label` | `text` | `2026.07` display |
| `route` | `text` | `/2026-07/` |
| `heading` | `text` | page h2, e.g. `July , 2026` |
| `count` | `int` | events in month (review aid) |
| `source_file` | `text` | `2026-07.html` |
| `published` | `boolean` | `true` |
| `sort_order` | `int` | numeric sort key |

**CMS policy:** `schedule_months` remains **read-only / derived** — seed for reference only; hub derives months from `schedules.date` at build time (G-9a decision).

### 4.3 Example event (2026-07-001)

```json
{
  "site_slug": "gosaki-piano",
  "legacy_id": "schedule-2026-07-001",
  "date": "2026-07-03",
  "year": 2026,
  "month": "2026-07",
  "title": "<Awesome Songbook>",
  "venue": "用賀 キンのツボ",
  "open_time": "18:00",
  "start_time": "19:30",
  "price": "3,300円",
  "description": "出演：『Awesome Songbook』木村美保vo 丸山朝光vo,bjo 後藤沙紀pf\n会場website: https://kinnotsubo.com/",
  "image_url": null,
  "source_file": "2026-07.html",
  "source_route": "/2026-07/",
  "published": true,
  "sort_order": 10
}
```

---

## 5. OPEN / START parser policy

Extended `parseScheduleTimeLine()` in `schedule-seed-extractor.mjs` (shared):

| Input pattern | `open_time` | `start_time` | `time_note` |
| --- | --- | --- | --- |
| `開場 18:00 / 開演 19:30` | `18:00` | `19:30` | null |
| `OPEN 18:00 / START 19:30` | `18:00` | `19:30` | null |
| `開場 14:00 / START 14:45` (mixed) | `14:00` | `14:45` | null |
| `17:00〜19:00` (range) | null | null | full string → `description` as `時間：…` |
| `時間：` empty | null | null | null |
| `時間：OPEN 19:00` only | `19:00` | null | null |

**Current Gosaki live crawl:** all events use **開場 / 開演** (no OPEN/START in fixtures). Parser supports OPEN/START for future Wix exports and manual QA.

**Normalization:** times stored as `HH:MM` text (matches staging `public.schedules` schema). No timezone conversion.

**Non-standard times:** stored in `description` prefixed with `時間：` — same as manual fixture extractor (e.g. outdoor `17:00〜19:00`).

---

## 6. `site_slug` migration plan (NOT executed)

**Project:** `static-to-astro-cms-staging` only. **Do not** run on production.

### 6.1 SQL template

```sql
-- G-9b planning template — operator review only; NOT executed in G-9b
-- Project: static-to-astro-cms-staging

begin;

-- 1. Add column (nullable for existing Sariswing Kit test rows)
alter table public.schedules
  add column if not exists site_slug text;

comment on column public.schedules.site_slug is
  'CMS Kit site identifier, e.g. gosaki-piano. NULL = legacy Kit rows.';

-- 2. Index for public read + admin filter
create index if not exists schedules_site_slug_date_idx
  on public.schedules (site_slug, date);

create index if not exists schedules_site_slug_month_idx
  on public.schedules (site_slug, month);

-- 3. Optional: tag existing Kit test rows (review before run)
-- update public.schedules set site_slug = 'sariswing-kit'
-- where site_slug is null and legacy_id like 'schedule-%';

commit;
```

### 6.2 `legacy_id` uniqueness decision

| Option | Decision | Rationale |
| --- | --- | --- |
| **A. Keep global `UNIQUE (legacy_id)`** | **Recommended for G-9c seed** | Gosaki IDs (`schedule-2026-07-001`) do not collide with existing staging row `schedule-2026-07-010` (different NNN). Minimal migration risk. |
| **B. Migrate to `UNIQUE (site_slug, legacy_id)`** | Defer to multi-site RLS phase | Requires dropping/recreating unique constraint; coordinate with RLS policy update. |

**G-9c seed:** use global `legacy_id` unique + `site_slug = 'gosaki-piano'` on INSERT. App queries **must** filter `site_slug` even if RLS is broad.

### 6.3 RLS / GRANT

**This phase:** no RLS, GRANT, or REVOKE changes.

Future (post-seed read integration):

- Public read: `published = true` + app-side `site_slug` filter (MVP)
- Optional later: RLS policy `site_slug = current_setting(...)` or JWT claim

---

## 7. Seed SQL template policy (NOT executed)

**Executor:** operator manual run in Supabase SQL Editor on **staging only**. Cursor / CI must not execute.

### 7.1 Approach

| Topic | G-9c recommendation |
| --- | --- |
| Operation | `INSERT` only (first seed) |
| Re-run | `ON CONFLICT (legacy_id) DO NOTHING` or operator-reviewed `UPSERT` |
| `site_slug` | `'gosaki-piano'` on every row |
| `id` | `gen_random_uuid()` default |
| `schedule_months` | Optional INSERT for reference; **not** CMS-maintained |
| PoC rows | Do not modify `aa440e29-…` / G-6 test rows |

### 7.2 INSERT template (single row example)

```sql
-- G-9c template — NOT executed in G-9b
insert into public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, image_url,
  source_file, source_route, published, sort_order
) values (
  'schedule-2026-07-001',
  'gosaki-piano',
  '2026-07-03',
  2026,
  '2026-07',
  '<Awesome Songbook>',
  '用賀　キンのツボ',
  '18:00',
  '19:30',
  '3,300円',
  E'出演：『Awesome Songbook』木村美保vo …\n会場website: https://kinnotsubo.com/',
  null,
  '2026-07.html',
  '/2026-07/',
  true,
  10
)
on conflict (legacy_id) do nothing;
```

### 7.3 Pre-execution checklist (operator)

- [ ] Confirm project: **static-to-astro-cms-staging**
- [ ] `site_slug` column migration applied (if not already)
- [ ] Review generated SQL row count = **60**
- [ ] `legacy_id` list has no collision with existing rows (`SELECT legacy_id FROM schedules WHERE legacy_id LIKE 'schedule-2026-%'`)
- [ ] No `service_role` in Kit tooling path
- [ ] Backup: `SELECT count(*) FROM schedules WHERE site_slug = 'gosaki-piano'` (expect 0 before seed)

### 7.4 Post-execution verification

```sql
-- Staging verification (SELECT only)
select site_slug, month, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by site_slug, month
order by month desc;

select legacy_id, date, title, venue, open_time, start_time
from public.schedules
where site_slug = 'gosaki-piano'
order by date
limit 20;
```

### 7.5 Rollback template (if needed)

```sql
-- Staging rollback — operator only, after explicit approval
delete from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id like 'schedule-2026-%';
-- Review rows_affected = 60 before commit
```

---

## 8. Manual review checklist

Use after `npm run extract:gosaki-schedule-seed` (or `--write` JSON review).

### 8.1 Count parity

| Month | Fixture items | Extracted | Match |
| --- | ---: | ---: | --- |
| 2026-03 | 13 | 13 | ✓ |
| 2026-04 | 10 | 10 | ✓ |
| 2026-05 | 12 | 12 | ✓ |
| 2026-06 | 11 | 11 | ✓ |
| 2026-07 | 14 | 14 | ✓ |
| **Total** | **60** | **60** | ✓ |

### 8.2 Field quality (G-9b dry-run)

| Check | Count / status | Action |
| --- | --- | --- |
| Date parse failure | 0 | — |
| Title empty | 0 | — |
| Venue empty | 3 events | Manual review (likely TBD gigs) |
| open/start both empty | 10 events | Review: empty `時間：` or non-standard range |
| Non-standard time in description | 1 (`2026-07-004` `17:00〜19:00`) | Accept or split manually |
| Price empty | 6 events | Confirm intentional |
| Description missing | 6 events | Often correlate with sparse meta |
| `image_url` | 0 (all null) | Expected — Wix CDN flyers not in crawl; Storage migration deferred |

### 8.3 Spot-check events

- [ ] `schedule-2026-07-001` — venue, 開場/開演, 出演, 会場website
- [ ] `schedule-2026-07-003` — `Leader LIVE` title + subtitle in description
- [ ] `schedule-2026-07-004` — range time in description
- [ ] `schedule-2026-07-007` — empty 時間/料金 (if applicable)
- [ ] Routes are `/YYYY-MM/` not `/schedule-YYYY-MM/`

### 8.4 `image_url` policy

- **MVP seed:** allow `null` — static Wix staging still shows HTML cards
- **Wix CDN URLs:** if crawl later includes `img[src]`, store URL as-is in seed; human review before production
- **Storage migration:** G-4 pattern (`review-schedule-storage-assets.mjs`) — separate phase after seed stable

### 8.5 Staging row isolation

- [ ] Gosaki `legacy_id` does not overlap G-6 PoC row `schedule-2026-07-010`
- [ ] All Gosaki rows have `site_slug = 'gosaki-piano'`

---

## 9. Verification (G-9b)

```bash
cd tools/static-to-astro
npm run verify:gosaki-schedule-seed   # 36 passed
npm run extract:gosaki-schedule-seed  # dry-run stats
npm run verify:url-staging            # 152 passed
npm run verify:crawl                  # 30 passed
```

### 9.1 New files

| File | Purpose |
| --- | --- |
| `scripts/lib/gosaki-wix-schedule-extractor.mjs` | Wix repeater parser |
| `scripts/extract-gosaki-schedule-seed.mjs` | CLI (dry-run default) |
| `scripts/verify-gosaki-schedule-seed-extractor.mjs` | Fixture verifier |

### 9.2 Modified files

| File | Change |
| --- | --- |
| `scripts/lib/schedule-seed-extractor.mjs` | `parseScheduleTimeLine` — OPEN/START support |
| `package.json` | `verify:gosaki-schedule-seed`, `extract:gosaki-schedule-seed` |

---

## 10. Recommended next phase

```txt
G-9c-gosaki-schedule-seed-sql-planning
```

**Scope:**

1. Generate full INSERT SQL from extractor JSON (60 rows)
2. Operator manual seed on staging
3. Astro read integration + static fallback (G-9d)

**Parallel (deferred):** YouTube `site_embeds` — `G-9f-gosaki-youtube-embed-schema-planning`

---

## 11. Safety

| Action | G-9b |
| --- | --- |
| DB write / SQL execution | **No** |
| Supabase production | **No** |
| `service_role` | **No** |
| FTP / workflow_dispatch | **No** |
| `/admin` changes | **No** |
| Generated output commit | **No** |
| `schedule_months` CMS write | **No** |

---

## 12. Gates (G-9b)

```txt
gosakiScheduleDataSeedPlanningComplete: true
gosakiScheduleSeedExtractorDryRunComplete: true
readyForG9cGosakiScheduleSeedSqlPlanning: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```
