# G-13c2d1 — Gosaki Event B PoC cleanup slice implementation

**Phase:** `G-13c2d1-gosaki-schedule-event-b-poc-cleanup-slice-implementation`  
**Status:** local implementation complete — **no Save / DB write in this phase**  
**Base commit:** `4419565`  
**Prior:** G-13c2 preflight  
**Scope:** Event B only (`aa440e29…` / `schedule-2026-07-010`)

## Summary

Registered **G-13c2** approval ID, guards, config, dry-run Preview, page-config bridge, fixed target row resolve, and gated Save path for Event B PoC visible text cleanup. Routine dev keeps **Save disabled** (`armed=false`, compile gate off). Event A (`f687ebf3…`) and March staging HTML are **untouched**.

**No Save / DB write / SQL / FTP / commit in this phase.**

---

## 1. Target Event B

| Item | Value |
|------|-------|
| **id** | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| **legacy_id** | `schedule-2026-07-010` |
| **date** | `2026-07-19` |
| **site_slug** | `gosaki-piano` |
| **public route** | `/schedule/2026-07/` |
| **lock baseline** | `updated_at` `2026-06-18T01:04:51.312817+00:00` |

### Current DB values (preflight)

```txt
title: [CMS Kit staging] G-9g2 title PoC
venue: [CMS Kit staging] G-9g3b venue PoC
open_time: [CMS Kit staging] G-9g3c open PoC
start_time: [CMS Kit staging] G-9g3c start PoC
price: [CMS Kit staging] G-9g3d general edit price PoC
description: 出演： [G-9g3b venue+description PoC]
```

### Cleanup expected values (3 sources — confirmed)

```txt
title: <>
venue: null
open_time: null
start_time: null
price: null
description: 出演：
```

`venue` / `open_time` / `start_time` / `price` must be **DB null**, not empty string. `date` / `month` / `legacy_id` / `site_slug` must not change.

---

## 2. Approval / operation / env

| Item | Value |
|------|-------|
| **approval_id** | `G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run` |
| **operation_id** | `gosaki-schedule-event-b-poc-cleanup` |
| **env arm** | `PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED` |
| **compile gate** | `PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED` (default off) |

Registered in `SCHEDULE_WRITE_APPROVAL_IDS` (`schedule-write-types.ts`).

**Single-arm:** G-13c1 and G-13c2 env arms are mutually exclusive.

---

## 3. Implementation modules

| Module | Role |
|--------|------|
| `gosaki-schedule-event-b-poc-cleanup-config.ts` | Env arm stack, target constants, `getG13c2EventBPocCleanupConfig()` |
| `gosaki-schedule-event-b-poc-cleanup-guards.ts` | Fixed row (id/legacy_id/site_slug/date) + null payload guards |
| `gosaki-schedule-event-b-poc-cleanup-dry-run.ts` | Pure Preview (`actualWrite: false`) |
| `gosaki-schedule-event-b-poc-cleanup-save.ts` | Non-dry-run Save — gated off routine dev |
| `gosaki-schedule-event-b-poc-cleanup-page-config.ts` | SSR→DOM bridge for compile gate |
| `gosaki-schedule-event-b-poc-cleanup-target-row-resolve.ts` | Direct `loadScheduleRowForSiteSlugRead` (no selectableRows) |
| `gosaki-schedule-event-b-poc-cleanup-ui.ts` | Operator panel Preview/Save wiring |
| `AdminGosakiStagingScheduleOperatorPage.astro` | G-13c2 section markup |

**Mutual exclusion:** G-13c1 / G-9k / G-9j configs call `collectG13c2EventBPocCleanupArmOffFailures` when G-13c2 arm is on. G-13c2 blocks when G-13c1 arm is on.

**Patterns (from G-13d1 fixes):**

- Fixed target row via direct read — no `selectableRows` dependency
- Server gate bridge via `getReadOnlyDataConfig()` — not raw `ENABLE_ADMIN_STAGING_DATA_READ` in client
- Page config bridge for compile gate / Save enabled browser reflection
- Project allowlist uses `allowlistPassed` / `errorMessage`

---

## 4. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiScheduleEventBPocCleanupSliceImplementationComplete` | **true** |
| `readyForG13c2FinalPreflight` | **true** |
| `readyForAnyDbWrite` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorPreviewButtonClicked` | **false** |
| `eventATouched` | **false** |
| `marchReuploadTriggered` | **false** |

---

## 5. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13c2d1-gosaki-schedule-event-b-poc-cleanup-slice-implementation.mjs
```

---

## 6. Next phase

1. **G-13c2 final preflight** — beforeSnapshot / rollback SQL doc / Save env stack
2. **G-13c2 execution** — operator Preview → Save once
3. **G-13c2e reflection** — regen → upload `schedule/2026-07/index.html` → HTTP verify → closure
