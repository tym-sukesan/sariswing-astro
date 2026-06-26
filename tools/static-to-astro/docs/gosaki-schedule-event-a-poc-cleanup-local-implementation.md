# G-13d1 — Gosaki Event A PoC cleanup local implementation

**Phase:** `G-13d1-gosaki-schedule-event-a-poc-cleanup-local-implementation`  
**Status:** local implementation complete — **no Save / DB write in this phase**  
**Base commit:** `91c98e7`  
**Prior:** G-13c implementation prep  
**Scope:** Event A only (`f687ebf3…` / `schedule-2026-03-007`)

## Summary

Registered **G-13c1** approval ID, guards, config, dry-run Preview, and gated Save path for Event A PoC visible text cleanup. Routine dev keeps **Save disabled** (`armed=false`, compile gate off). Event B (`aa440e29…`) is **out of scope**.

**No Save / DB write / SQL / FTP / commit in this phase.**

---

## 1. Target Event A

| Item | Value |
|------|-------|
| **id** | `f687ebf3-407c-49d0-9ab8-58040c499b8e` |
| **legacy_id** | `schedule-2026-03-007` |
| **date** | `2026-03-15` |
| **site_slug** | `gosaki-piano` |

### Cleanup expected values

```txt
title: <Duo>
venue: 川崎 ぴあにしも
open_time: 15:00
start_time: 15:30
price: 3,000円
description:
出演：長谷川薫vo 後藤沙紀pf
会場website: http://pubhpp.com/
```

---

## 2. Approval / operation / env

| Item | Value |
|------|-------|
| **approval_id** | `G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run` |
| **operation_id** | `gosaki-schedule-event-a-poc-cleanup` |
| **env arm** | `PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED` |
| **compile gate** | `PUBLIC_ADMIN_G13C1_EVENT_A_POC_CLEANUP_SAVE_ENABLED` (default off) |

Registered in `SCHEDULE_WRITE_APPROVAL_IDS` (`schedule-write-types.ts`).

---

## 3. Implementation modules

| Module | Role |
|--------|------|
| `gosaki-schedule-event-a-poc-cleanup-config.ts` | Env arm stack, target constants, `getG13c1EventAPocCleanupConfig()` |
| `gosaki-schedule-event-a-poc-cleanup-guards.ts` | Fixed row + payload target guards |
| `gosaki-schedule-event-a-poc-cleanup-dry-run.ts` | Pure Preview (`actualWrite: false`) |
| `gosaki-schedule-event-a-poc-cleanup-save.ts` | Non-dry-run Save — gated off routine dev |
| `gosaki-schedule-event-a-poc-cleanup-ui.ts` | Operator panel Preview/Save wiring |
| `AdminGosakiStagingScheduleOperatorPage.astro` | G-13c1 section markup |

**Mutual exclusion:** G-9k / G-9j configs call `collectG13c1EventAPocCleanupArmOffFailures` when G-13c1 arm is on.

---

## 4. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiScheduleEventAPocCleanupLocalImplementationComplete` | **true** |
| `readyForG13d1FinalPreflight` | **true** |
| `readyForAnyDbWrite` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorPreviewButtonClicked` | **false** |
| `eventBTouched` | **false** |

---

## 5. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13d1-gosaki-schedule-event-a-poc-cleanup-local-implementation.mjs
```

---

## 6. Next

`G-13d1-final-preflight` — beforeSnapshot SELECT + rollback SQL for Event A; operator Save once in separate execution phase.

---

## 7. References

- [gosaki-schedule-poc-visible-text-cleanup-implementation-prep.md](./gosaki-schedule-poc-visible-text-cleanup-implementation-prep.md) (G-13c)
