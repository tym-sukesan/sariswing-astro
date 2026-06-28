# G-15 — Gosaki Discography CMS MVP inventory and plan

**Phase:** `G-15-gosaki-discography-cms-mvp-inventory-and-plan`  
**Status:** **complete** — read-only survey + MVP design + low-risk prep artifacts  
**Date:** 2026-06-28  
**Base commit:** `8313349`  
**Prior:** G-14b1f Schedule routine edit chain closed; G-14b2 skipped per operator

| Check | Status |
| --- | --- |
| Public / admin / DB data sources mapped | **yes** |
| 4 releases inventoried | **yes** |
| Staging Supabase `discography` table confirmed | **yes** (4 rows) |
| MVP scope + defer list documented | **yes** |
| Schema / seed SQL templates (no execution) | **yes** |
| Inventory seed JSON | **yes** |
| Implementation phases proposed | **yes** |
| Cursor Save / DB write / FTP / migration | **no** |

---

## Gates

```txt
gosakiDiscographyCmsMvpInventoryAndPlanComplete: true
phase: G-15-gosaki-discography-cms-mvp-inventory-and-plan
readyForG15aDiscographyAdminSupabaseReadBinding: true
readyForG15bDiscographyExistingRowSaveSlicePlanning: false
readyForG15cDiscographyPublicReflectionPlanning: false
readyForAnyDbWrite: false
readyForAnyDbMigration: false
readyForAnyFutureFtpApply: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorMigrationExecuted: false
cursorFtpExecuted: false
```

**Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; all non-dry-run arms off.

---

## 1. Executive summary

Gosaki Discography has **three parallel data layers** today:

| Layer | Source | Used by public staging? | Used by admin UI? |
| --- | --- | --- | --- |
| **A. Wix HTML** | `fixtures/gosaki-piano/discography.html` → convert → `discography/index.html` | **yes** (SoT) | no |
| **B. Static JSON** | `config/sites/gosaki-piano-discography.json` | **no** | **yes** (read-only) |
| **C. Supabase** | `public.discography` + `public.discography_tracks` | **no** | **no** (adapter exists but not wired to Gosaki operator page) |

**Fastest MVP path:** align with **Schedule CMS** — use **staging Supabase `discography` table** for admin read + existing-row UPDATE Save. Public reflection remains a **later G-14c-style phase** (Wix HTML regen or convert hook).

Do **not** fork a third architecture (e.g. static JSON write like YouTube) for Discography — DB rows already exist and Sariswing Kit templates already define update field allowlists.

---

## 2. Public page generation

```txt
fixtures/gosaki-piano/discography.html (Wix crawl)
  → convert-static-to-astro.mjs (generic page transform)
  → output/gosaki-piano-astro/src/pages/discography/index.astro
  → astro build → dist/discography/index.html
  → static-public → manual-upload/.../public-dist/discography/index.html
```

- **Route:** `/discography/` (single hub; no per-album routes)
- **Layout:** Wix repeater HTML passthrough inside `<BaseLayout>`
- **Images:** Wix CDN `wixstatic.com` in crawled HTML; staging package has **no local** discography images
- **CSS:** `gosaki-piano-overrides.mjs` (G-8g5/G-8g8 spacing + subheading only)

`gosaki-piano-discography.json` and Supabase are **not** consumed by the public build today.

---

## 3. Current data inventory

### 3.1 Release count

| Source | Count |
| --- | ---: |
| Public Wix HTML repeater items | **4** |
| Admin JSON `releases[]` | **4** |
| Staging Supabase `discography` | **4** |
| Staging Supabase `discography_tracks` | **16** (partial vs JSON track lists) |

### 3.2 ID mapping (critical for Save targeting)

| Admin JSON `id` | Supabase `legacy_id` | DB `uuid` | Title |
| --- | --- | --- | --- |
| `continuous` | `discography-001` | `00f4cd00-…` | Continuous |
| `skylark` | `discography-002` | `ed59d236-…` | SKYLARK |
| `about-us` | `discography-003` | `d17653b4-…` | About Us!! |
| `ja-jaaaaan` | `discography-004` | `32b83506-…` | Ja-Jaaaaan! |

Admin UI uses **slug ids** (`continuous`); DB uses **`discography-NNN`**. Save implementation must resolve via `legacy_id`, not JSON slug alone.

### 3.3 Field structure comparison

| Concept | Admin JSON | Supabase `discography` | Public Wix HTML |
| --- | --- | --- | --- |
| title | `title` | `title` | h3 heading |
| artist | `artist` | `artist` | h3 heading |
| release date | `releaseText` (display) | `release_date`, `year` | Release line |
| catalog | `catalogNumber` | `catalog_number` | Release line |
| price | `price` | **no column** | inline in Release line |
| personnel | `personnel[]` | merged in `description` | Personnel block |
| track list | `trackList[]` | `discography_tracks` table (partial) | Track List `<ul>` |
| purchase link | `purchaseUrl` + `purchaseText` | `purchase_url` | link or text |
| streaming link | — | `streaming_url` | link (e.g. TuneCore) |
| cover image | `coverImage` (empty) | `cover_image_url` (Storage URL) | Wix CDN `<img>` |
| display order | `order` | `sort_order` | DOM order |
| published | `published` | `published` | always visible |
| label | `label` (1 album) | `label` | Release line |

### 3.4 Images

- **Public:** real jacket images via **external Wix CDN** (not self-hosted)
- **DB:** `cover_image_url` populated with **Supabase Storage** paths (`site-assets/gosaki/discography/…`)
- **Admin JSON:** `coverImage: ""` on all 4 — placeholder UI only
- **MVP:** **no image upload / cover edit** (defer G-10f / Storage slice)

### 3.5 Links

- `purchase_url` and `streaming_url` columns exist on DB
- JSON splits purchase text vs URL; DB stores URL only (notes in `description`)
- Example gap: JSON `skylark.purchaseUrl` empty but DB has `https://gosaakiii.base.shop/`

### 3.6 Display order

- JSON: `order` 10, 20, 30, 40
- DB: `sort_order` 1, 2, 3, 4
- Both ascending; mapping is consistent (newest first)

### 3.7 Track data gap

| `legacy_id` | JSON tracks | DB tracks |
| --- | ---: | ---: |
| discography-001 | 9 | 5 |
| discography-002 | 8 | 4 |
| discography-003 | 9 | 4 |
| discography-004 | 8 | 3 |

Track CMS is **out of MVP scope**; optional G-15x backfill before public DB-driven regen.

---

## 4. Staging Supabase survey (read-only)

**Project:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only

| Table | Exists | Row count | `site_slug` column |
| --- | --- | ---: | --- |
| `public.discography` | **yes** | **4** | **no** |
| `public.discography_tracks` | **yes** | **16** | n/a |

**Confirmed columns on `discography`:**  
`id`, `legacy_id`, `title`, `artist`, `release_date`, `year`, `label`, `catalog_number`, `description`, `cover_image_url`, `purchase_url`, `streaming_url`, `sort_order`, `published`, `source_file`, `source_route`, `created_at`, `updated_at`

**Multi-tenant note:** Unlike `schedules` (has `site_slug = gosaki-piano`), discography rows are implicitly gosaki-only on staging (4 rows, `source_route = /discography/`). Future Kit generalization may add `site_slug` — template in `scripts/supabase/gosaki-discography-schema.template.sql`.

---

## 5. Existing CMS patterns to reuse

| Pattern | Reference | Apply to Discography |
| --- | --- | --- |
| Operator admin shell | `/__admin-staging-shell/musician-basic/admin/discography/` | **keep** |
| Supabase read adapter | `src/lib/admin/staging-data/supabase-read-only-data-adapter.ts` → `listDiscography()` | **wire to admin page** (G-15a) |
| Schedule Save stack | `gosaki-schedule-existing-event-save-button-*` | **mirror** for discography UPDATE |
| Field allowlist | `templates/admin-cms/src/lib/admin-discography-update.ts` | **reuse field list** |
| Dry-run + approval gates | G-9k / G-14b1 chain | **same shape** |
| Public reflection | G-14c playbook | **later** (discography/index.html) |
| YouTube static JSON write | G-10c | **do not use** for Discography |

### Gosaki-specific vs Kit generalization

| Gosaki-specific (now) | Kit-general (later) |
| --- | --- |
| `templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro` | Extract to `musician-basic` module |
| Single-tenant 4-row staging data | `site_slug` filter + per-site seed |
| Wix HTML public page | `discography-seed-extractor.mjs` rebuild path |
| `data/gosaki/discography.seed.json` inventory | Generic seed exporter |

---

## 6. G-15 MVP recommended scope

### In scope — **existing row edit only** (first Save slice)

Target table: `public.discography` (one row per Save)

| MVP field (operator terms) | DB column | Notes |
| --- | --- | --- |
| title | `title` | required |
| artist / credit | `artist` | MVP: artist only; personnel stays in `description` |
| year / release_date | `year`, `release_date` | ISO date on Save |
| description | `description` | free text; includes personnel notes today |
| link_url | `purchase_url`, `streaming_url` | two URL fields (not generic links table) |
| display_order | `sort_order` | integer; no drag UI in MVP |
| published | `published` | boolean toggle |

**Recommended first PoC row:** `discography-002` (SKYLARK) — `purchase_url` text fix or `description` typo fix (low blast radius).

**Recommended first PoC field slice:** single field `purchase_url` or `description` (mirror G-14b1 price-only discipline).

### Out of scope (defer)

| Item | Defer to |
| --- | --- |
| Image upload / `cover_image_url` edit | G-10f / G-15h |
| New album INSERT | G-15+ |
| DELETE / logical delete | G-15+ |
| Drag reorder UI | G-15+ |
| `discography_tracks` edit | G-15b tracks slice |
| `price` column (not in DB) | schema migration or Wix-only display |
| `personnel[]` / `trackList[]` structured arrays | tracks slice + UI |
| Public `/discography/` DB-driven regen | G-15c reflection |
| FTP / upload / deploy | G-14c operator phase |
| `site_slug` migration | G-15a optional preflight |
| `/admin` production | never in Gosaki phases |

---

## 7. Admin UI implementation direction (G-15a+)

### Current state

- Page: `AdminGosakiStagingDiscographyOperatorPage.astro`
- Binding: `loadGosakiDiscographyAdminBinding()` → **static JSON file**
- Save: **disabled** (`data-gosaki-disc-action-disabled`)
- Local reorder buttons: DOM-only (no persistence)

### Target state (incremental)

1. **G-15a** — Supabase read binding for list + edit form (replace JSON read)
2. **G-15a2** — Dry-run Preview panel (read-only SELECT + diff preview)
3. **G-15b** — Save enablement for **one field / one row** with approval ID
4. **G-15c** — Public reflection planning (minimal `discography/index.html` upload)

### Save path sketch (not implemented in G-15)

```txt
Operator form → 変更を確認 (dry-run) → 更新する (non-dry-run, armed)
  → gosaki-discography-existing-release-update-save.ts (new)
  → Supabase anon + RLS UPDATE on discography by legacy_id
  → optimistic lock via updated_at (after trigger migration)
```

Mirror: `gosaki-schedule-existing-event-save-button-save.ts` + guards + approval registry.

---

## 8. Minimum DB schema

**No new tables required for MVP** — existing `discography` suffices for text/URL edits.

Optional future deltas (templates only — **not executed**):

- `site_slug text` — multi-tenant parity with schedules
- `price text` — if operator wants price CMS separate from Wix HTML
- `updated_at` trigger — optimistic lock (schedules pattern)

Files:

- `scripts/supabase/gosaki-discography-schema.template.sql`
- `scripts/supabase/gosaki-discography-seed.template.sql`

---

## 9. Artifacts created in G-15

| File | Purpose |
| --- | --- |
| `data/gosaki/discography.seed.json` | Merged inventory (JSON id ↔ DB legacy_id) |
| `scripts/supabase/gosaki-discography-schema.template.sql` | Live schema doc + optional DDL (do not run) |
| `scripts/supabase/gosaki-discography-seed.template.sql` | Seed verification + draft shape (do not run) |
| `scripts/verify-g15-gosaki-discography-cms-mvp-inventory-and-plan.mjs` | Doc / artifact verifier |

---

## 10. Proposed phase chain

| Phase | Goal | Risk |
| --- | --- | --- |
| **G-15** (this) | Inventory + MVP plan | Low |
| **G-15a** | Admin Supabase read binding + list UI wired | Low |
| **G-15a2** | Dry-run Preview preflight for one row | Low |
| **G-15b** | First existing-row Save slice (1 field) | Med (DB write) |
| **G-15c** | Public reflection planning (Wix HTML patch vs regen) | Low |
| **G-15d** | Public reflection execution (operator upload) | Med |
| **G-15e** | Tracks table backfill + edit (optional) | High |
| **G-15f** | `site_slug` migration (if second customer) | Med |

---

## 11. Prohibited in G-15

| Operation | Executed |
| --- | --- |
| DB write / migration | **no** |
| Save / Preview click | **no** |
| FTP / upload | **no** |
| Package regen | **no** |
| commit / push | **no** |

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g15-gosaki-discography-cms-mvp-inventory-and-plan.mjs
```

---

## 13. Reference index

| Topic | Doc / path |
| --- | --- |
| G-9j static admin scaffold | `gosaki-youtube-and-discography-practicalization.md` |
| G-10f images (deferred) | `gosaki-discography-album-images-planning.md` |
| Gap inventory | `gosaki-cms-completion-roadmap-gap-inventory.md` |
| Schema adapter | `config/schema-adapters/cms-schema-adapters.json` |
| Sariswing update allowlist | `templates/admin-cms/src/lib/admin-discography-update.ts` |
| Schedule routine edit template | `gosaki-schedule-routine-edit-flow-next-poc-planning.md` |
