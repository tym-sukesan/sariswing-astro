Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3-staging-shell-schedule-site-slug-safe-fields-edit-planning` (planning complete — uncommitted)

**Doc:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-edit-planning.md` (**new**)

**Awaiting:** operator commit approval (`Plan site_slug safe-fields edit slices`)

### G-9g3 summary

- Safe fields: venue, open_time, start_time, price, description (title done G-9g2)
- **Mandatory:** Supabase host hard gate (`kmjqppxjdnwwrtaeqjta.supabase.co`)
- Slices: G-9g3a dry-run+host → G-9g3b venue+desc → G-9g3c time+price → G-9g3d general UI
- No DB write in planning phase

### Gates

```txt
stagingShellScheduleSiteSlugSafeFieldsEditPlanningComplete: true
readyForG9g3aHostGateAndDryRunImplementation: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. Commit G-9g3 planning
2. G-9g3a — host hard gate + multi-field dry-run preview (no Save)

## 3. Do not

- Re-click G-9g2 Save
- Modify `/admin` or production
- Skip host gate in G-9g3a+

## 4. Baseline

- Latest commit: `d57dd5f` (G-9g2 execution result)
- Target row title: `[CMS Kit staging] G-9g2 title PoC` (keep as PoC marker)
