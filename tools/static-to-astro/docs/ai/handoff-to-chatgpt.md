Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3-staging-shell-schedule-site-slug-safe-fields-edit-planning (planning complete — uncommitted)
Latest commit: d57dd5f (G-9g2 execution result)
```

## Summary

G-9g3 plans remaining Gosaki site_slug safe-field edits after successful G-9g2 title PoC.

- **Title:** `[CMS Kit staging] G-9g2 title PoC` — keep; no restore
- **New mandatory safety:** active Supabase host hard gate
- **Slices:** G-9g3a host+dry-run → G-9g3b venue+description → G-9g3c time+price → G-9g3d general UI
- **Planning only** — no Save / DB write

**Doc:** `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-edit-planning.md`

## Gates

```txt
stagingShellScheduleSiteSlugSafeFieldsEditPlanningComplete: true
readyForG9g3aHostGateAndDryRunImplementation: true
readyForAnyDbWrite: false
```

## Next

- Commit G-9g3 planning
- G-9g3a implementation (host gate + multi-field dry-run)
