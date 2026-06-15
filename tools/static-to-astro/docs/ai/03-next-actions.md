Last updated: 2026-06-15
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-g2-schedule-time-fields-non-dry-run-slice-execution`

G-6-g2 execution succeeded. User manual Preview + Save once. `open_time` + `start_time` only changed. Optimistic lock OK. `rollbackNeeded: false`.

**Doc:** `tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-execution-result.md`

**Recommended next phase:** `G-6-g3-schedule-price-non-dry-run-slice-preflight` (planning) — or return to routine `PUBLIC_ADMIN_WRITE_DRY_RUN=true`

## 2. Staging DB state

```txt
Target row: aa440e29-5be8-402e-9190-0d81c48434c0
  title: [CMS Kit staging] G-6-g1 title PoC
  open_time: [CMS Kit staging] G-6-g2 open PoC
  start_time: [CMS Kit staging] G-6-g2 start PoC
  price: null (G-6-g3 candidate)
  updated_at: 2026-06-15 01:02:22.949565+00
scheduleTimeFieldsNonDryRunSliceExecutionSucceeded: true
G-6-g2 nonDryRunSaveExecuted: true
rollbackNeeded: false
```

## 3. Dry-run default (routine work)

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
```

Do not re-arm G-6-g1 / G-6-g2 / G-6-e5 / G-6-f6 without new approval ID / phase.

## 4. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-g2 implementation | **DONE** (`e461155`) |
| G-6-g2 final-preflight | **DONE** (`499aa37`) |
| G-6-g2 execution | **DONE** |
| G-6-g3 price slice preflight | **Next** (planning) |

## 5. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
