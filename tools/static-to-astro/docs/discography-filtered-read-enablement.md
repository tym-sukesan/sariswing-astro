# G-20u25 — Discography filtered read enablement

**Phase:** `G-20u25-discography-filtered-read-enablement`  
**Base:** `4363e3d` (G-20u24d complete)  
**Scope:** Loader code enablement — **no DB write / SQL execution / FTP / deploy**

## Purpose

After G-20u24a/b/c/d staging migration (`site_slug` column + `gosaki-piano` backfill), enable **filtered** Supabase discography reads in the build loader. Unfiltered reads are no longer the default path.

## Prerequisites (staging — verified G-20u24d)

| Check | Value |
| --- | --- |
| `discography.site_slug` | exists · 4 rows · all `gosaki-piano` |
| `discography_tracks.site_slug` | exists · 34 rows · all `gosaki-piano` |
| Orphan / mismatch | 0 |
| Rollback | not needed |

## Code changes

| Item | Before (G-20u22–u24) | After (G-20u25) |
| --- | --- | --- |
| `DISCOGRAPHY_SITE_SLUG_COLUMN_READY` | `false` | **`true`** (`DISCOGRAPHY_SITE_SLUG_COLUMN_READY = true`) |
| Gosaki capability mode | `gosaki_legacy_unfiltered` | **`generic_filtered`** |
| `loadGosakiDiscographyDataForBuild` | `requireSiteSlugFilter: false` | **`requireSiteSlugFilter: true`** |
| Supabase query | unfiltered | **`.eq("site_slug", siteSlug)`** |

### Loader flow (post-G-20u25)

```
loadSiteDiscographyBundleForBuild({ siteKey })
  └─ resolveDiscographyLoaderCapability
       ├─ discography feature off → null (pilot)
       ├─ column not ready → legacy unfiltered (Gosaki only) or noop (others)
       └─ column ready → generic_filtered
            └─ loadDiscographyDataForBuild({ requireSiteSlugFilter: true })
```

## Expected read results (Gosaki staging)

| Metric | Value |
| --- | --- |
| Releases | **4** |
| Tracks | **34** |
| Album groups | **4** |
| `site_slug` filter | `gosaki-piano` |

## Pilot / noop

- `supabaseFeatures.discography: false` → **`null`** (no Supabase API call)

## Upload rules (unchanged)

- **Before any manual upload:** rebuild at current HEAD + `preflight` PASS
- **Production upload:** STOP until G-20j explicit approval
- On-disk packages are **stale** until regen

## Not executed

- No SQL execution · no DB write · no migration
- No FTP / deploy / package upload

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u25-discography-filtered-read-enablement
npm run verify:current-active-regression
```

## Gates

```txt
discographyFilteredReadEnablementComplete: true
DISCOGRAPHY_SITE_SLUG_COLUMN_READY: true
gosakiFilteredReadFourReleasesThirtyFourTracks: true (when Supabase env live)
pilotDiscographyNullNoop: true
```
