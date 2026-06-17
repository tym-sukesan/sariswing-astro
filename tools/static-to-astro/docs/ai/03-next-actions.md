Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3a-staging-shell-schedule-site-slug-safe-fields-dry-run-preview` (implementation complete — uncommitted)

**Doc:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-dry-run-preview-implementation.md` (**new**)

**Awaiting:** operator commit approval

### G-9g3a summary

- Host hard gate: `kmjqppxjdnwwrtaeqjta.supabase.co` expected; Sariswing production host → DANGER
- Multi-field dry-run: venue, open_time, start_time, price, description + title
- Preview only — no Save UI, no DB write

### Gates

```txt
stagingShellScheduleSiteSlugSafeFieldsDryRunPreviewComplete: true
stagingShellScheduleHostHardGateImplemented: true
stagingShellScheduleMultiFieldDryRunPreviewImplemented: true
stagingShellScheduleG9g3aNoSaveUi: true
readyForG9g3bVenueDescriptionPoc: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. Commit G-9g3a implementation
2. G-9g3b — venue + description non-dry-run PoC (operator approval, one Save)

## 3. Do not

- Re-click G-9g2 Save
- Click Save in G-9g3a (no Save UI)
- Modify `/admin` or production
- Skip host gate in G-9g3b+

## 4. Baseline

- Latest commit: `51051c2` (G-9g3 planning)
- Target row title: `[CMS Kit staging] G-9g2 title PoC` (keep as PoC marker)
