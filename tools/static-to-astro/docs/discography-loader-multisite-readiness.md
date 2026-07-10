# G-20u22 — Discography loader multi-site readiness

**Phase:** `G-20u22-discography-loader-multisite-readiness`  
**Base:** `7ee4d1c` (G-20u21 complete)  
**Scope:** Read-only loader structure + docs — **no DB write / SQL migration / FTP / deploy**

## Purpose

After G-20u20 feature flags, schedule and discography ON/OFF are registry-driven. This phase organizes the **discography loader** for multi-site readiness without executing a DB migration.

## Current state (pre-migration)

| Table | `site_slug` column | Build-time filter |
| --- | --- | --- |
| `public.schedules` | **yes** | `.eq("site_slug", siteSlug)` (G-9e) |
| `public.discography` | **no** | Gosaki-only unfiltered read |
| `public.discography_tracks` | **no** | Gosaki-only unfiltered read |

Gosaki staging currently has **4 published releases** and **34 tracks** — all implicitly Gosaki-only.

## Loader architecture

```
loadSiteDiscographyDataForBuild({ siteKey })
  └─ loadSiteDiscographyBundleForBuild (site-discography-loader.mjs)
       └─ resolveDiscographyLoaderCapability(siteKey)
            ├─ supabaseFeatures.discography=false → null (pilot)
            ├─ gosaki-piano → gosaki_legacy_unfiltered (Supabase read OK)
            ├─ other + site_slug column pending → noop (no Supabase call)
            └─ other + site_slug column ready → generic_filtered read
       └─ loadGosakiDiscographyDataForBuild / loadDiscographyDataForBuild
```

## Module map

| Module | Role |
| --- | --- |
| `site-discography-loader.mjs` | Capability resolution + site-aware entry |
| `supabase-discography-read.mjs` | Generic `loadDiscographyDataForBuild` + Gosaki wrapper |
| `site-aware-supabase-loaders.mjs` | Delegates discography to `loadSiteDiscographyBundleForBuild` |

## Capability modes

| Mode | Supabase call | Result |
| --- | --- | --- |
| `noop_feature_off` | **no** | `null` (pilot) |
| `noop_site_slug_pending` | **no** | wix-html noop bundle |
| `gosaki_legacy_unfiltered` | **yes** | 4 releases when env configured |
| `generic_filtered` | **yes** (future) | filtered by `site_slug` |

## Gosaki compatibility

- `loadGosakiDiscographyDataForBuild` retained — delegates to `loadDiscographyDataForBuild({ legacyUnfilteredRead: true })`
- `GOSAKI_DISCOGRAPHY_SITE_CONFIG.siteSlug` = `gosaki-piano`
- Expected live read: **4 releases** (when Supabase env configured)
- Wix HTML patch helpers unchanged (`patchGosakiDiscographySupabaseFields`, etc.)

## Pilot / noop

- `supabaseFeatures.discography: false` → `null` — **no Supabase API call**
- Same as G-20u13 pilot behavior

## Non-Gosaki safety

Until `DISCOGRAPHY_SITE_SLUG_COLUMN_READY === true`:

- Non-Gosaki sites with `discography: true` would receive `fallbackReason: discography_site_slug_column_pending`
- **No unfiltered Supabase read** — prevents leaking Gosaki rows to another site
- `loadDiscographyRowsFromSupabase({ requireSiteSlugFilter: true })` throws if column migration pending

## Future migration considerations (separate high-risk phase)

**Do not execute in G-20u22.** Treat as high-risk DB migration requiring explicit operator approval.

### If adding `site_slug` to discography tables

1. **Schema:** `ALTER TABLE public.discography ADD COLUMN site_slug text;` (and same for `discography_tracks` or join via legacy_id)
2. **Backfill Gosaki:** `UPDATE ... SET site_slug = 'gosaki-piano' WHERE site_slug IS NULL;`
3. **RLS / indexes:** filter policies per site; index on `(site_slug, published)`
4. **Code gate:** set `DISCOGRAPHY_SITE_SLUG_COLUMN_READY = true` after migration verified on staging
5. **Loader:** enable `.eq("site_slug", siteSlug)` in `loadDiscographyRowsFromSupabase`

### Impact on existing Gosaki data

| Concern | Mitigation |
| --- | --- |
| 4 releases / 34 tracks | Backfill all to `gosaki-piano` before enabling filter |
| Admin Save paths | Must scope UPDATE by `site_slug` (separate admin phases) |
| Public reflection | Build must filter — unfiltered read only until backfill complete |

### Requirements for adding a non-Gosaki site

1. Registry: `supabaseFeatures.discography: true`
2. DB: rows with matching `site_slug` (after migration)
3. Code: `DISCOGRAPHY_SITE_SLUG_COLUMN_READY = true`
4. Convert: Wix HTML patch strategy per site (may need site-specific hooks)

## Upload / production rules (unchanged)

- Production upload: **STOP** until G-20j explicit approval
- Before upload: rebuild at HEAD + preflight PASS
- No FTP auto-apply

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u22-discography-loader-multisite-readiness
npm run verify:current-active-regression
```

## Not executed

- No DB write / SQL mutation / migration
- No FTP / deploy
- No package regen / upload

## Gates

```txt
discographyLoaderMultisiteReadinessComplete: true
gosakiDiscographyFourReleasesReadable: true (when Supabase env live)
pilotDiscographyNullNoop: true
nonGosakiUnfilteredReadBlocked: true
```
