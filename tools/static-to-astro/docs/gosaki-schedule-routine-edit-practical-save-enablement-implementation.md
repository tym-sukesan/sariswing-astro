# G-14b1a — Gosaki Schedule CMS routine edit practical Save enablement implementation

**Phase:** `G-14b1a-gosaki-schedule-routine-edit-practical-save-enablement-implementation`  
**Status:** **complete** — practical routine edit arm wired to existing G-9k Save path (no Save execution)  
**Date:** 2026-06-28  
**Base commit:** `e5d4fa3`  
**Prior:** G-14b1 planning (`gosaki-schedule-routine-edit-flow-next-poc-planning.md`)

| Check | Status |
| --- | --- |
| G-9k Save path surveyed | **yes** |
| Practical arm env implemented | **yes** |
| Save enablement conditions documented | **yes** |
| G-13c1 / G-13c2 mutual exclusion | **yes** |
| No hardcoded PoC row/values | **yes** |
| Cursor Save / Preview / DB write | **no** |

---

## Gates

```txt
gosakiScheduleRoutineEditPracticalSaveEnablementImplementationComplete: true
phase: G-14b1a-gosaki-schedule-routine-edit-practical-save-enablement-implementation
readyForG14b1bLocalDryRunPreflight: true
readyForG14b1dRoutineEditPocExecution: false
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
cursorSaveExecuted: false
cursorPreviewExecuted: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
cursorFtpExecuted: false
```

**Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; all non-dry-run arms off; `G9K_SAVE_BUTTON_SAVE_ENABLED=false`.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

Wire **routine Schedule CMS edit** (G-14b) to the existing **G-9k multi-field Save path** via a dedicated practical arm env.  
No new Save executor — only arm resolution, mutual exclusion, and SSR→DOM bridge extension.

**Out of scope:** Preview / Save execution, DB write, package regen, FTP, hardcoded PoC values.

---

## 2. G-9k Save path (unchanged executor)

| Step | Module |
| --- | --- |
| Row picker + form | `gosaki-staging-schedule-operator-ui.ts` |
| Dry-run Preview | `gosaki-schedule-existing-event-save-button-dry-run.ts` |
| Save | `gosaki-schedule-existing-event-save-button-save.ts` |
| Guards | `gosaki-schedule-existing-event-save-button-guards.ts` → `G9J_EXISTING_EVENT_UPDATE_SAFE_FIELDS` |
| Config / arm | `gosaki-schedule-existing-event-save-button-config.ts` + **G-14b1a** module |
| SSR bridge | `gosaki-schedule-save-button-page-config.ts` |
| approval_id | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |

---

## 3. G-14b1a implementation

### 3.1 New module

`src/lib/admin/staging-write/gosaki-schedule-routine-edit-practical-save-enablement-config.ts`

| Export | Role |
| --- | --- |
| `GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED_ENV` | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED` |
| `isGosakiSchedulePracticalEditEnvArmTrue` | Practical arm detector |
| `isGosakiScheduleLegacyG9kSaveButtonEnvArmTrue` | Legacy G-9k arm detector |
| `isGosakiScheduleRoutineEditArmSatisfied` | Either arm satisfies routine edit |
| `collectG14b1aRoutineEditArmFailures` | Single-arm policy + optimistic lock requirement |
| `collectG14b1aPracticalEditArmOffFailures` | Mutual exclusion for cleanup slices |

### 3.2 G-9k config changes

`getG9kExistingEventSaveButtonConfig()` now:

- Accepts **either** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED=true` **or** legacy `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=true`
- **Rejects both arms on** (single-arm policy)
- Requires `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true` (not `false` / `off`)
- Exposes `practicalEditArmed`, `legacyG9kEnvArmed`, `routineEditArmSatisfied` on config object
- **Compile gate unchanged:** `G9K_SAVE_BUTTON_SAVE_ENABLED=false` by default; runtime via `G9K_SAVE_BUTTON_SAVE_ENABLED=true` env + SSR bridge

### 3.3 Page config bridge

`gosaki-schedule-save-button-page-config.ts` + `AdminGosakiStagingScheduleOperatorPage.astro`:

- `data-g9k-legacy-env-arm-armed`
- `data-g9k-practical-edit-env-arm-armed`
- `data-g9k-optimistic-lock-enabled`
- `envArmArmed` = either routine arm active

### 3.4 Mutual exclusion (cleanup slices unchanged)

| When armed | Blocks |
| --- | --- |
| G-13c1 cleanup | G-9k + practical arm (existing) |
| G-13c2 cleanup | G-9k + practical arm (existing + G-14b1a) |
| G-14b1a practical arm | G-13c1 + G-13c2 + G-9j5 runner arm (existing patterns) |

**G-13c1 / G-13c2 panels and hardcoded target rows:** **not modified.**

---

## 4. Save enablement conditions (all required)

| # | Condition |
| --- | --- |
| 1 | `DEV=true` |
| 2 | `ENABLE_ADMIN_STAGING_SHELL=true` |
| 3 | `ENABLE_ADMIN_STAGING_WRITE=true` |
| 4 | `PUBLIC_ADMIN_WRITE_DRY_RUN=false` |
| 5 | `PUBLIC_ADMIN_WRITE_PROVIDER=supabase` |
| 6 | `PUBLIC_ADMIN_WRITE_MODULE=schedule` |
| 7 | `PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |
| 8 | **One** routine arm: `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED=true` **(recommended)** OR `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=true` |
| 9 | `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true` |
| 10 | `G9K_SAVE_BUTTON_SAVE_ENABLED=true` (runtime / SSR bridge) |
| 11 | Supabase host = `kmjqppxjdnwwrtaeqjta` (project allowlist PASS) |
| 12 | Staging auth session signed in (UI gate) |
| 13 | Dry-run Preview PASS → `saveReadiness=ready_to_save` |
| 14 | All other schedule non-dry-run arms **off** (G-13c1, G-13c2, G-9g*, G-6, G-9j5) |

---

## 5. Recommended dev env stack (G-14b1b — not started here)

```bash
cd /path/to/sariswing-astro
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9k-gosaki-schedule-existing-event-save-button-non-dry-run \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED=false \
G9K_SAVE_BUTTON_SAVE_ENABLED=false \
npm run dev
```

**Non-dry-run Save stack (G-14b1c/d only — operator):** set `PUBLIC_ADMIN_WRITE_DRY_RUN=false`, `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED=true`, `G9K_SAVE_BUTTON_SAVE_ENABLED=true`; all G-13c1/G-13c2/G-9g arms **off**.

---

## 6. Safe fields / excluded fields

**In scope (unchanged G-9k guards):** `title`, `venue`, `open_time`, `start_time`, `price`, `description`

**Out of scope:** `date`, `month`, `published`, `show_on_home`, INSERT, DELETE, `schedule_months`, venue master

**No hardcoded edit values in G-14b1a** — operator form input at execution time.

---

## 7. Event A / Event B impact

| Item | Impact |
| --- | --- |
| G-13c1 Event A cleanup config / UI | **unchanged** |
| G-13c2 Event B cleanup config / UI | **unchanged** — added practical-arm-off check only |
| Event A row `f687ebf3…` | **not targeted** |
| Event B row `aa440e29…` | **not targeted** |
| March / July HTML | **not touched** |

---

## 8. Next phases

| Phase | Action |
| --- | --- |
| **G-14b1b** | Local dry-run Preview preflight doc |
| **G-14b1b-result** | Operator Preview once (Save off) |
| **G-14b1c** | Final preflight — read-only beforeSnapshot |
| **G-14b1d** | Operator Save once + afterVerification |
| **G-14b1e** | G-14c reflection chain |

---

## 9. Prohibited operations — not performed

| Operation | Executed |
| --- | --- |
| Save / Preview click | **no** |
| DB write / SQL | **no** |
| package regen / FTP | **no** |
| `.env` change | **no** |
| commit / push | **no** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g14b1a-gosaki-schedule-routine-edit-practical-save-enablement-implementation.mjs
```

---

## 11. Reference index

| Topic | Path |
| --- | --- |
| G-14b1 planning | `gosaki-schedule-routine-edit-flow-next-poc-planning.md` |
| G-14b flow | `gosaki-schedule-cms-practical-editing-flow-definition.md` |
| G-14b1a module | `gosaki-schedule-routine-edit-practical-save-enablement-config.ts` |
| G-9k config | `gosaki-schedule-existing-event-save-button-config.ts` |
