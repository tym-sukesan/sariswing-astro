# Gosaki production package preflight at current HEAD

**Phase:** `gosaki-production-package-preflight-at-current-head`
**Status:** **COMPLETE (preflight only · read-only / local-only)**
**Date:** 2026-08-18
**HEAD baseline:** `dcb9e012cd825b7c748ec30f51a4e489f941ef5d`
**Prior:** `gosaki-production-cutover-operator-gates-refresh`

| Check | Status |
| --- | --- |
| Production package **generated** | **no** |
| Preview package **generated** | **no** |
| FTP / DNS / SSL / DB write | **no** |
| Live SELECT | **not executed** |
| Secrets printed | **no** |
| Commit / push | **no** |

---

## Gates

```txt
GOSAKI_PRODUCTION_PACKAGE_PREFLIGHT_AT_CURRENT_HEAD_COMPLETE: true
PACKAGE_GENERATION_EXECUTED: false
PREVIEW_PACKAGE_EXECUTED: false
FTP_EXECUTED: false
DB_WRITE_EXECUTED: false
LIVE_SELECT_EXECUTED: false
PACKAGE_GENERATION_READY: LIVE_READ_ONLY_CHECK_REQUIRED
PREVIEW_PACKAGE_READY: BLOCKED_BY_CONFIG
FINAL_PRODUCTION_PIPELINE_DRY_RUN: PASS
PUBLICATION_DATA_CLEANUP_REQUIRED: unknown
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-production-publication-data-live-readonly-check
```

**Do not** generate production or preview packages in this phase. **Do not** upload. **Do not** run the SELECT packet below until a dedicated live-read phase.

---

## Operator hosting facts (this preflight)

FTP login root: `/`
Visible: `/gosaki-piano/` (operator-created, **not uploaded yet**), `/welcome.html`

| Profile | Public URL | Remote folder | Domain-relative `deployBase` |
| --- | --- | --- | --- |
| **PREVIEW** | `https://gotosaki.ciao.jp/gosaki-piano/` | `/gosaki-piano/` | `/gosaki-piano/` |
| **FINAL PRODUCTION** | `https://www.gosaki-piano.com/` | `/gosaki-piano/` (document root assignment in progress) | `/` |

Same remote folder. Different **deployBase**. These two HTML trees **cannot** be the same package.

---

## A. PACKAGE_BASELINE

| Item | Value |
| --- | --- |
| HEAD | `dcb9e012` = `origin/main` (0/0) |
| Subject | `docs(cms): close discography site-owner authz slice b` |
| Working tree | AI docs uncommitted only (this phase included) |
| Current phase (this doc) | `gosaki-production-package-preflight-at-current-head` **COMPLETE** |
| Production entrypoint | `npm run build:gosaki:production` → `scripts/build-site-package.mjs --site gosaki-piano --profile production` |
| Dry-run | `npm run build:gosaki:production:dry-run` — **PASS** this phase (plan only) |
| Verifiers | `verify:gosaki:production`, `verify:manual-upload:gosaki-production` (admin exclusion), `preflight:gosaki:production` (existing package freshness — will fail until a fresh package exists) |
| Build-time SoT | Staging Kit Supabase `kmjqppxjdnwwrtaeqjta` (`site_slug=gosaki-piano`, `published=true`) |
| Admin exclusion | **yes** — `profileName === "production"` → `includeReadOnlyAdmin: false` |

Dry-run production plan (no convert / package / FTP):

```txt
baseUrl: https://www.gosaki-piano.com
deployBase: /
output: output/manual-upload/gosaki-piano-production
includeReadOnlyAdmin: false
supabaseProjectRef: kmjqppxjdnwwrtaeqjta
intendedRemotePath: TBD_G-20i
```

Staging dry-run (existing profile — **not** ciao.jp preview):

```txt
baseUrl: https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano
deployBase: /cms-kit-staging/gosaki-piano/
output: output/manual-upload/gosaki-piano
includeReadOnlyAdmin: true
```

`ALLOWED_PROFILE_NAMES = ["staging", "production"]` only. **No ciao.jp / `/gosaki-piano/` preview profile exists.**

### SEO / URL generation sources

| Surface | Source |
| --- | --- |
| `deployBase` / origin | `config/sites/gosaki-piano.deploy-profiles.json` + `resolveSitePackageBuildProfile` |
| canonical / og:url | convert `--base-url` / `buildDeployOrigin` / `applyBaseUrlToSeo` |
| sitemap / robots | `scripts/lib/seo-publish.mjs` `generateRobotsTxt` |
| noindex | `isStagingSubdirBuild(deployBase)` → any `deployBase !== "/"` forces noindex + `Disallow: /` |
| nav / assets / schedule hub | Astro `BASE_URL` + `withBase()` |
| Wix absolute production URLs | `productionAbsoluteUrlToRoute` (www.gosaki-piano.com → internal routes) |

Root deploy (`deployBase=/`) **requires** `productionIndexable=true`. Subdir deploy **requires** `stagingNoindex=true`.

---

## B. PREVIEW_PROFILE — `deployBase=/gosaki-piano/`

**Not safe to generate with current profiles.**

| Existing profile | What would happen on `https://gotosaki.ciao.jp/gosaki-piano/` |
| --- | --- |
| **production** (`deployBase=/`) | `/_astro/`, `/about/`, `/schedule/` resolve to **host root** `gotosaki.ciao.jp/_astro` — **broken**. Canonical/og would claim `www.gosaki-piano.com`. Indexable while still on ciao.jp. |
| **staging** (`deployBase=/cms-kit-staging/gosaki-piano/`) | Assets/nav under **wrong prefix**. Admin **included**. Canonical/og = weblike.jp staging. |

Required (future implementation — **not this phase**):

```txt
origin: https://gotosaki.ciao.jp
publicUrl: https://gotosaki.ciao.jp/gosaki-piano/
deployBase: /gosaki-piano/
remotePath: /gosaki-piano/
includeReadOnlyAdmin: false
seo.stagingNoindex: true
seo.robotsDisallowAll: true
seo.productionIndexable: false
separate output tree (must not overwrite staging or production packages)
```

Subdir `deployBase` already forces noindex — correct for DNS-前 preview.

`withBase('/about/')` with `BASE_URL=/gosaki-piano/` → `/gosaki-piano/about/`. That is the mechanism that prevents host-root leak — **only if that BASE_URL is used at convert/build**.

---

## C. FINAL_PRODUCTION_PROFILE — `deployBase=/`

**Mechanically safe** (dry-run PASS). **Do not bake yet.**

| Check | Result |
| --- | --- |
| `/gosaki-piano/` prefix in final HTML | **no** — `deployBase=/` |
| canonical / og:url | `https://www.gosaki-piano.com/...` |
| staging weblike / cms-kit-staging in SEO | **must not** appear (production origin) |
| ciao.jp in SEO | **must not** appear (no preview origin in this profile) |
| Admin | excluded |
| noindex | **off** (`productionIndexable=true`, `Allow: /`, Sitemap line) |
| `intendedRemotePath` | still `TBD_G-20i` in config; operator now states `/gosaki-piano/` — **config stale**, not a generate-code blocker |

Cannot reuse one HTML tree for preview then DNS cutover. At cutover, **swap files** to the `deployBase=/` package (same remote folder, different URLs).

---

## D. URL_REWRITE_RISKS

| Surface | Preview (`/gosaki-piano/`) | Final (`/`) |
| --- | --- | --- |
| CSS/JS `_astro` | must be `/gosaki-piano/_astro/...` | `/_astro/...` |
| Nav About / Discography / Contact | `/gosaki-piano/about/` etc. | `/about/` etc. |
| Schedule hub / months | `/gosaki-piano/schedule/`, `/gosaki-piano/schedule/YYYY-MM/` | `/schedule/`, `/schedule/YYYY-MM/` |
| canonical / og:url | `https://gotosaki.ciao.jp/gosaki-piano/...` | `https://www.gosaki-piano.com/...` |
| sitemap | built but robots Disallow (subdir) | `Allow: /` + Sitemap |
| robots / noindex | **must** noindex | **must** index |
| staging weblike leak | forbidden on both public packages | forbidden |
| ciao.jp leak | **required** on preview SEO; **forbidden** on final |

`productionAbsoluteUrlToRoute` only rewrites `www.gosaki-piano.com`. It does **not** rewrite ciao.jp. Preview package must not be built with production origin.

---

## E. PUBLICATION_DATA_AUDIT

### Schedule bake SoT

Convert/build calls `loadScheduleRowsFromSupabase`:

```txt
.from("schedules")
.eq("site_slug", "gosaki-piano")
.eq("published", true)
```

Anon key is **build-time only** (`PUBLIC_SUPABASE_*` via Gosaki package env preflight). Production public package excludes Admin; verifier rejects stray JWTs except admin `data-gosaki-supabase-anon-key` (which production omits).

Published rows bake into:

- `/schedule/` hub (month links)
- `/schedule/YYYY-MM/` event cards — title, 会場, 時間, description
- home only if `show_on_home=true` (G-9c2c set all 60 seed rows `show_on_home=false`; later inserts also false in docs)

### `schedule-2026-07-010` chronology (docs — not live)

| When | State |
| --- | --- |
| G-6-e5 / f6 / g1 / g2 | PoC title/venue/times/description, `published: true` |
| G-9c2c (2026-06-16) | restored to seed: `title=<>`, venue/times/price null, `description=出演：`, `published: true` |
| G-9g2 / g3b / g3c / g3d | PoC text re-applied |
| **G-13c2 (2026-06-27)** | **cleanup Save succeeded** — PoC markers removed; same seed values as G-9c2c |
| G-13c2e | staging public July page reflected |
| G-14b1 / later | Event B **not touched** (documented) |

Last **documented field write** on this row is G-13c2 cleanup, **not** G-6-g2. Prior cutover-gates “G-6 PoC still published” is **STALE as docs SoT**. Live confirmation is still required.

Visible if still published: `/schedule/2026-07/` (date `2026-07-19`). `title=<>` is Wix leftover, not a PoC marker.

### Other documented rows

| Row | Last docs SoT | Bake risk |
| --- | --- | --- |
| `schedule-2026-03-001` | G-9g3h1c restore **removed** smoke marker | low if restore still live |
| `schedule-2026-03-007` Event A | G-13c1 cleanup closed | low |
| `schedule-2026-03-014` | G-22d duplicate `（コピー）`, **`published: false`** | bake **iff** later published |
| `schedule-2026-09-001` | G-22e `【G-22eテスト】…` / `テスト会場`, **`published: false`** | bake **iff** later published |
| `schedule-2026-11-001` TBD CREATE | **DELETED** | none |
| `schedule-2026-04-005` | G-14b1 price `3,300円（税込）` (real copy) | none as PoC |

### Discography / About / YouTube

| Surface | SoT | Last docs |
| --- | --- | --- |
| Discography | Supabase (`supabaseFeatures.discography=true`) | G-20b `（テスト）` cleanup; Slice B `discography-003` **restored** |
| About public | JSON (`sitePageFields=false`) unless `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ=true` | lede roundtrip restored |
| YouTube | JSON `gosaki-piano-youtube-embed.json` (`I-eY9YMq9GI`); registry `siteEmbeds=true` may overlay DB if table+env wired | Contents restore closed |

---

## F. PUBLICATION_DATA_CLEANUP_REQUIRED

```txt
PUBLICATION_DATA_CLEANUP_REQUIRED: unknown
```

Not `true`: last documented **published** PoC on `schedule-2026-07-010` was cleaned (G-13c2).
Not `false`: live state unverified; unpublished G-22 test/copy rows exist; 79-row table drifted after 60-row seed.

**Do not cleanup/restore/unpublish in this phase.**

If live SELECT finds published PoC/test markers, safest first move is usually **unpublish** (stops bake without reconstructing original copy). Real concerts with painted PoC text: **field restore** to last known seed/Wix values. Do not DELETE without a dedicated gate.

### LIVE_READ_ONLY_CHECK_REQUIRED (do not run here)

Project: `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if `vsbvndwuajjhnzpohghh`. SELECT only. No `service_role`.

```sql
-- 1) Event B last-known cleanup row
select id, legacy_id, published, show_on_home, date,
       title, venue, open_time, start_time, price, description, updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and site_slug = 'gosaki-piano';

-- 2) Published rows with PoC / staging / test markers
select id, legacy_id, published, date, title, venue, open_time, start_time, price, description
from public.schedules
where site_slug = 'gosaki-piano'
  and published = true
  and (
    title ilike '%CMS Kit staging%'
    or venue ilike '%CMS Kit staging%'
    or description ilike '%CMS Kit staging%'
    or open_time ilike '%CMS Kit staging%'
    or start_time ilike '%CMS Kit staging%'
    or price ilike '%CMS Kit staging%'
    or title ilike '%PoC%'
    or venue ilike '%PoC%'
    or description ilike '%PoC%'
    or title ilike '%テスト%'
    or venue ilike '%テスト%'
    or description ilike '%テスト%'
  );

-- 3) Unpublished G-22 rows must stay unpublished
select id, legacy_id, published, title, venue, description
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id in ('schedule-2026-09-001', 'schedule-2026-03-014');

-- 4) Optional: discography published test markers
select legacy_id, title, description
from public.discography_releases
where site_slug = 'gosaki-piano'
  and (
    title ilike '%CMS Kit staging%'
    or description ilike '%CMS Kit staging%'
    or title ilike '%PoC%'
    or description ilike '%テスト%'
  );
```

---

## G. SUPABASE_BUILD_SOURCE

Option **B** (new Gosaki production Supabase) is **out of scope**. Current production profile is **A**: staging Kit as build-time SoT. **C** (split at CLIENT CMS HANDOFF) remains the later path.

| Question | Answer |
| --- | --- |
| Which ref does production package read? | `kmjqppxjdnwwrtaeqjta` (enforced; Sariswing prod ref rejected) |
| Anon key in public artifact? | **Build-time env only.** Production package **excludes Admin**, so public HTML should not embed anon key. Staging package **does** embed for Admin. |
| Runtime vs build-time? | **Build-time SELECT** during convert. Public static HTML does not need a live Supabase client. |
| Risk of staging as SoT | Any `published=true` staging row (PoC, test, unpublished-then-published) **bakes into public HTML** until the next regen. Staging Admin writes become public at next production bake. No runtime fetch to “fix” live pages. |

---

## H. PACKAGE_GENERATION_READY

```txt
PACKAGE_GENERATION_READY: LIVE_READ_ONLY_CHECK_REQUIRED
PREVIEW_PACKAGE_READY: BLOCKED_BY_CONFIG
FINAL_PRODUCTION_PIPELINE: dry-run PASS · do not generate until live data PASS
```

| Gate | Why |
| --- | --- |
| Preview generate | no ciao.jp `/gosaki-piano/` profile; would leak to host root if production profile reused |
| Production generate | pipeline OK, but bake without live SELECT re-introduces PoC/test risk |
| Data cleanup write | not authorized; live state unknown |

---

## I. NEXT_PRIMARY

```txt
gosaki-production-publication-data-live-readonly-check
```

Operator-run SELECT packet above (staging only). No UPDATE. No package generate.

**Not** `gosaki-preview-package-generation` — blocked by missing preview profile.
**Not** `gosaki-production-poc-data-cleanup-preflight` until live SELECT proves published PoC/test rows.

After live PASS: `gosaki-ciao-jp-preview-profile-implementation` (third profile, separate output tree, Admin off, noindex on), then preview package generation.

---

## Correction to prior phase

`gosaki-production-cutover-operator-gates-refresh` listed G-6 PoC on `schedule-2026-07-010` as a **CONFIRMED_BLOCKER**. Docs chronology: G-13c2 restored that row. Treat G-6 bake risk as **unverified live**, not as current documented field values.
