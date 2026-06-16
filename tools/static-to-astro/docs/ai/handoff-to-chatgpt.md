Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9d-gosaki-astro-supabase-schedule-read-with-static-fallback (implementation complete — uncommitted)
Latest commit: 2bd5b90 (G-9c2c result)
```

## Summary

G-9d: Gosaki Astro convert now reads `public.schedules` from staging Supabase (anon key) when env is set; otherwise static-fallback from fixture extractor. Data-driven `/schedule/` hub and `/schedule/YYYY-MM/` month pages. Legacy `/YYYY-MM/` stubs unchanged.

**Modules:**
- `scripts/lib/supabase-schedule-read.mjs`
- `scripts/lib/gosaki-schedule-data-pages.mjs`

**No DB writes, no service_role, no FTP.**

**Doc:** `tools/static-to-astro/docs/gosaki-astro-supabase-schedule-read-with-static-fallback.md`

## Gates

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

## Safety

- Staging only — not production
- No Cursor/CI SQL execution
- Anon key only for schedule read

## Next

- Operator commit/push G-9d
- Optional: convert with Supabase env + manual re-upload
