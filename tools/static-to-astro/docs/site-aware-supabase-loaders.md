# G-20u13 — Site-aware Supabase loaders

**Phase:** `G-20u13-site-aware-supabase-loaders`  
**Base commit:** `23806c5`  
**Gate:** `siteAwareSupabaseLoadersComplete: true`

## Goal

Route Supabase schedule / discography reads through site registry (`siteKey` → `supabaseSiteSlug` + feature flags). Gosaki wrappers remain for backward compatibility. Pilot and future sites skip or noop safely.

## siteKey → supabaseSiteSlug flow

```
convert-static-to-astro.mjs (--site SITE_KEY)
  └─ loadSiteSupabaseDataForBuild({ siteKey, inputDir })
       └─ resolveSiteSupabaseLoadPlan(siteKey)
            ├─ registry.slugSemantics.supabaseSiteSlug
            └─ registry.supabaseFeatures { schedule, discography }
       ├─ loadSiteScheduleDataForBuild
       │    └─ gosaki-piano → loadGosakiScheduleDataForBuild(siteSlug)
       │    └─ pilot → null (features.schedule=false)
       └─ loadSiteDiscographyDataForBuild
            └─ gosaki-piano → loadGosakiDiscographyDataForBuild()
            └─ pilot → null (features.discography=false)
```

## Registry fields

| Site | supabaseSiteSlug | schedule | discography |
| --- | --- | --- | --- |
| gosaki-piano | gosaki-piano | true | true |
| pilot-sample-static | pilot-sample-static | false | false |

## Gosaki wrapper delegation

| Legacy wrapper | Delegates to |
| --- | --- |
| `loadGosakiScheduleDataForBuild` | `loadScheduleDataForBuild({ siteSlug })` + Gosaki static fallback |
| `loadGosakiDiscographyDataForBuild` | `loadDiscographyRowsFromSupabase` (anon read) |
| **New** `loadSiteScheduleDataForBuild` | registry plan → Gosaki wrapper or generic schedule loader |
| **New** `loadSiteDiscographyDataForBuild` | registry plan → Gosaki wrapper or noop |

## Gosaki compatibility

- `supabaseSiteSlug`: `gosaki-piano` (unchanged)
- Schedule filter: `.eq("site_slug", siteSlug)` in `loadScheduleRowsFromSupabase`
- Expected at staging (when env configured): **74 events**, **4 discography releases**, **14 cards in 2026-08**
- Month discovery: auto from published rows (G-20t2) — no hardcoded month list

## Pilot / noop

- `supabaseFeatures.schedule=false` → schedule bundle **null** (no Supabase call)
- `supabaseFeatures.discography=false` → discography bundle **null**
- Gosaki hooks not applied (G-20u6 noop factory)

## Not executed

- DB write / SQL mutation  
- FTP / deploy  

## Verification

```bash
cd tools/static-to-astro
node scripts/verify-g20u13-site-aware-supabase-loaders.mjs
```

## Next

- Add `site_slug` filter to discography when multi-site rows exist
- Wire `url-to-staging-pipeline` to site-aware loaders
