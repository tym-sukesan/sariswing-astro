Last updated: 2026-06-21
Project: Static-to-Astro CMS / Musician CMS Kit

## 0c. G-9k1 save button guard / config — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k1-gosaki-schedule-existing-event-save-button-guard-config-verifier` |
| Doc | `gosaki-schedule-existing-event-save-button-guard-config.md` |
| Modules | `gosaki-schedule-existing-event-save-button-config.ts`, `gosaki-schedule-existing-event-save-button-guards.ts` |
| approvalId | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |
| env arm | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED` |
| Status | **complete** — Save **not** enabled; no UI wiring / DB write |
| Next | `G-9k2` operator UI wiring |
| `readyForAnyDbWrite` | **false** |

## 0b. G-9k save button enablement — planning complete

| Item | Value |
| --- | --- |
| Phase | `G-9k-gosaki-schedule-existing-event-save-button-enablement-planning` |
| Doc | `gosaki-schedule-existing-event-save-button-enablement-planning.md` |
| Scope | Operator 「更新する」 — existing row UPDATE; 6 safe fields |
| approvalId | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |
| env arm | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED` |
| Status | **planning complete** — Save **not** enabled |
| Next | `G-9k1` guard / config / verifier |
| `readyForAnyDbWrite` | **false** |

## 0a. G-9j5c — success finalization complete

| Item | Value |
| --- | --- |
| Phase | `G-9j5c-gosaki-schedule-existing-event-update-success-finalization` |
| Doc | `gosaki-schedule-existing-event-update-success-finalization.md` |
| Status | **G-9j5 one-row non-dry-run UPDATE succeeded** (operator manual — once) |
| Project | `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `description` only |
| `rowsAffected` | **1** |
| UI | post-save description confirmed on staging schedule admin |
| Prerequisites | G-9j5a password reset, G-9j5b auth gate, explicit admin email, project allowlist |
| **Do not** | re-run G-9j5 without new approval ID |
| Next | operator Save enablement planning or additional field slices (separate phases) |
| `readyForAnyDbWrite` | **false** (routine dev) |

## 0. Gosaki staging admin schedule UI — add/edit forms (UI only)

| Item | Value |
| --- | --- |
| Routes | `/__admin-staging-shell/musician-basic/admin/schedule/` |
| Schedule | Add + edit forms; save disabled; dev PoC in `<details>` |
| Next | G-9h1 client preview feedback closure |

## 0b. G-9j Gosaki schedule existing event save enablement — planning complete

| Item | Value |
| --- | --- |
| Phase | `G-9j-gosaki-schedule-existing-event-save-enablement-planning` |
| Doc | `gosaki-schedule-existing-event-save-enablement-planning.md` |
| Verifier | `verify-g9j-gosaki-schedule-existing-event-save-enablement-planning.mjs` — 33 passed |
| Scope | Existing row UPDATE only — 6 safe fields; no add/delete/date/published |
| Status | **planning complete** — no implementation / Save / DB write |
| Next | `G-9j1-guards-and-dry-run-implementation` |
| `readyForAnyDbWrite` | **false** |

## 0c. Gosaki YouTube and Discography (UI practicalization)

Static home YouTube embeds (multi-item JSON) + Discography CMS-ready admin UI. Doc: `gosaki-youtube-and-discography-practicalization.md`. No DB / Save / deploy.

## 1. Immediate priority

**Current phase:** `G-9h-gosaki-schedule-cms-practicalization-planning` — **complete**（G-9h planning complete. 最新commitは git HEAD を確認すること。）

**Git:** branch `main`; HEAD = origin/main — 最新commitは git HEAD を確認すること。

### G-9h Gosaki schedule CMS practicalization planning — complete

| Item | Value |
| --- | --- |
| Doc | `gosaki-schedule-cms-practicalization-planning.md` |
| Verifier | `verify-g9h-gosaki-schedule-cms-practicalization-planning.mjs` — 34 passed |
| Status | **complete** — planning only; no DB write / Preview / Save |
| Next recommended | `G-9h1-gosaki-client-preview-feedback-closure` |
| NOT next | `start_time-only manual non-dry-run execution` |

### G-9g4a2 framework implementation — complete

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-single-text-field-operational-commonization-implementation.md` |
| Status | **complete, committed, pushed** — C1 `1e643e7`, C2 `9c3714c`, C3 `1c1fb32`, C4 `d66bae7` |
| C1 | registry + types + parameterized guards + generic config |
| C2 | generic Save executor + open_time-only save delegate |
| C3 | generic edit UI + open_time edit-ui delegate + Astro/binding wiring |
| Target fields | `open_time`, `start_time`, `price` |
| Verifiers | C1 69 / C2 34 / C3 47 / G-9g4a2a 83 / planning 39 / implementation 43 passed |

### G-9g4a2a open_time-only round-trip — complete (historical)

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-open-time-only-operational-restore-and-closure.md` |
| Status | **complete** — commit `105c6b1` (committed and pushed) |
| markerRemainsInStagingDb | **false** |
| No further Save / restore | **yes** |

### Policy (manual round-trip reduction)

- Do **not** repeat per-field manual round-trips for `start_time` / `price`
- Manual non-dry-run round-trip reserved for **new common logic** only (max once with explicit approval)
- Config-only field additions: static verifiers, guards, dry-run Preview, type checks
- **Not** next: `start_time`-only manual execution slice

### Gates

```txt
stagingShellScheduleSingleTextFieldOperationalCommonizationImplementationComplete: true
readyForG9g4a2FrameworkLocalStaticVerification: true
readyForG9g4a2FrameworkOptionalDryRunPreviewByOperator: true (explicit approval only)
readyForG9g4a2FrameworkSmokeNonDryRunSave: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

## 2. Next steps

1. **G-9k2** operator UI wiring — dry-run gates Save button (disabled until G-9k4)
2. **G-9h1** client preview feedback closure
3. **Not** next: G-9j5 runner re-execution; G-9j5 approval/arm for operator Save

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

## 4. Do not

- Start `start_time`-only manual round-trip (framework implementation complete)
- Re-click G-9g4a2a open_time-only Save on proven row
- Run non-dry-run Save for `start_time` / `price` without new approval ID
- Cursor / AI click row picker / Preview / Save
- Use service_role
- Touch production or `/admin`
