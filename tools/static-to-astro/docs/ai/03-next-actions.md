Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-g1-schedule-title-non-dry-run-slice-execution`

G-6-g1 product-path title non-dry-run execution **succeeded**. User manual Save once. Optimistic lock passed. Rollback not needed.

**Doc:** `tools/static-to-astro/docs/schedule-title-non-dry-run-slice-execution-result.md`

**Recommended next phase:** `G-6-g2-schedule-general-edit-next-slice-planning` (or return dev to dry-run default)

## 2. Staging DB state

```txt
Trigger: schedules_set_updated_at on public.schedules (active)
Target row: aa440e29-5be8-402e-9190-0d81c48434c0
  title: [CMS Kit staging] G-6-g1 title PoC
  venue: [CMS Kit staging] G-6-f6 venue PoC
  description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
  updated_at: 2026-06-14 15:03:08.762993+00
nonDryRunSaveExecuted: true
scheduleTitleNonDryRunSliceExecutionSucceeded: true
rollbackNeeded: false
```

## 3. Dry-run default (routine work)

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true
```

Do not re-click G-6-g1 Save without new approval ID. Do not re-arm G-6-e5 / G-6-f6 PoCs.

## 4. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-g1 preflight | **DONE** |
| G-6-g1 implementation | **DONE** |
| G-6-g1 final-preflight | **DONE** |
| G-6-g1 execution | **DONE** |
| G-6-g2 next slice planning | **Next** |

## 5. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
