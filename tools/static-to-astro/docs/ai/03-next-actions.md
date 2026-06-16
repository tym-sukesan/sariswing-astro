Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9d-gosaki-astro-supabase-schedule-read-with-static-fallback` (implementation complete — uncommitted)

**Docs:**
- `tools/static-to-astro/docs/gosaki-astro-supabase-schedule-read-with-static-fallback.md` (**new**)
- `tools/static-to-astro/docs/gosaki-existing-schedule-rows-manual-sql-execution-result.md` (G-9c2c)

**Awaiting:** operator commit/push approval (`Add Gosaki Supabase schedule read fallback`)

### G-9d implementation summary

- `scripts/lib/supabase-schedule-read.mjs` — anon read, normalize, `loadGosakiScheduleDataForBuild()`
- `scripts/lib/gosaki-schedule-data-pages.mjs` — data-driven hub + month pages
- `astro-generator.mjs` / convert / pipeline — prefetch bundle, skip Wix HTML months when data path active
- `scheduleDataSource`: `supabase` | `static-fallback` | `wix-html` (logged + HTML comment)

### Staging DB state (G-9c2c — unchanged)

```txt
site_slug=gosaki-piano: 60 rows
month counts: 13/10/12/11/14
source_route: canonical /schedule/YYYY-MM/ only
```

### Gates

```txt
gosakiAstroSupabaseScheduleReadPlanningOrImplementationComplete: true
gosakiScheduleReadUsesSiteSlug: true
gosakiScheduleReadUsesCanonicalSourceRoute: true
gosakiScheduleStaticFallbackReady: true
gosakiScheduleLegacyStubsStillGenerated: true
gosakiScheduleSitemapCanonicalOnly: true
readyForG9dVerificationAndCommit: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **Commit G-9d** (operator approval)
2. **Optional:** convert with staging Supabase env → verify `scheduleDataSource=supabase` → manual re-upload
3. **Future:** staging shell schedule read binding; Top YouTube embed CMS (G-9a item 2)

## 3. Do not

- Execute SQL from Cursor/CI
- Touch production / FTP / `/admin`
- Use `service_role`

## 4. Baseline

- Latest commit: `2bd5b90` (G-9c2c result)
- G-9d: implementation complete, pending commit
