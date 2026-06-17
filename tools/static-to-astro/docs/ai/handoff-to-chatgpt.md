Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9e-site-slug-schedule-read-generalization (implementation complete — uncommitted)
Latest commit: e5aa2ab (G-9d3)
```

## Summary

G-9e generalized Gosaki schedule Supabase read to CMS Kit `site_slug` loaders:

- `loadScheduleRowsFromSupabase({ siteSlug, months, canonicalRoutePrefix })`
- `loadScheduleDataForBuild({ siteSlug, staticFallback, ... })`
- `loadGosakiScheduleDataForBuild()` — thin Gosaki wrapper

Fallback unchanged: supabase → static-fallback → wix-html. No DB writes, no service_role.

**Doc:** `tools/static-to-astro/docs/site-slug-schedule-read-generalization.md`

## Gates

```txt
siteSlugScheduleReadGeneralizationComplete: true
genericScheduleReadHelperReady: true
gosakiScheduleReadUsesGenericSiteSlugLoader: true
readyForG9eCommit: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Next

- Commit G-9e
- Staging shell schedule binding or client review
