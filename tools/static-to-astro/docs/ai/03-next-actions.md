Last updated: 2026-06-22
Project: Static-to-Astro CMS / Musician CMS Kit

## 0l. G-9k6d start_time field slice Save success — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k6d-gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization` |
| Doc | `gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization.md` |
| Status | **complete** — operator manual `start_time` slice UI Save **succeeded** |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `start_time` only |
| Before → after | `15:30` → `19:00` |
| `rowsAffected` | **1** |
| post-save `updated_at` | `2026-06-22T12:42:32.483922+00:00` |
| UI | **保存成功** panel; diff 開演 only |
| **Do not** | re-click G-9k6d Save |
| Next | `G-9k6e` `venue` field slice manual Save |
| `readyForAnyDbWrite` | **false** |

## 0k. G-9k6c open_time field slice Save success — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k6c-gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization` |
| Doc | `gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization.md` |
| Status | **complete** — operator manual `open_time` slice UI Save **succeeded** |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `open_time` only |
| Before → after | `15:00` → `18:00` |
| `rowsAffected` | **1** |
| post-save `updated_at` | `2026-06-22T07:30:35.391238+00:00` |
| UI | **保存成功** panel; diff 開場 only |
| **Do not** | re-click G-9k6c Save |
| Next (at completion) | `G-9k6d` `start_time` — **done** |
| `readyForAnyDbWrite` | **false** |

## 0j. G-9k6b price field slice Save success — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k6b-gosaki-schedule-existing-event-price-field-slice-save-success-finalization` |
| Doc | `gosaki-schedule-existing-event-price-field-slice-save-success-finalization.md` |
| Status | **complete** — operator manual `price` slice UI Save **succeeded** |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `price` only |
| Before → after | `3,000円` → `3,000円（G-9k6 price UI保存テスト）` |
| `rowsAffected` | **1** |
| post-save `updated_at` | `2026-06-22T06:53:39.857434+00:00` |
| UI | post-save **保存成功** panel confirmed |
| **Do not** | re-click G-9k6b Save |
| Next (at completion) | `G-9k6c` `open_time` — **done** |
| `readyForAnyDbWrite` | **false** |

## 0i. G-9k6a field slice verification planning — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k6a-gosaki-schedule-existing-event-field-slice-verification-planning` |
| Doc | `gosaki-schedule-existing-event-field-slice-verification-planning.md` |
| Status | **planning complete** — matrix + checklist only |
| Done | `description` (G-9k4b), `price` (G-9k6b), `open_time` (G-9k6c), `start_time` (G-9k6d) |
| Pending slices | `venue` → `title` (last) |
| Next slice | `G-9k6e` `venue` |
| `readyForAnyDbWrite` | **false** |

## 0h. G-9k5 save button arc finalization — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k5-gosaki-schedule-existing-event-save-button-success-finalization` |
| Doc | `gosaki-schedule-existing-event-save-button-success-finalization.md` |
| Status | **G-9k arc closed** — operator UI Save初回成功まで到達 |
| First UI Save | row `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `description` only; `rowsAffected: 1` |
| Project | `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only |
| Production | sari-site / Sariswing **not touched** |
| `service_role` | **not used** |
| **Do not** | re-click G-9k4b Save; re-arm G-9k non-dry-run without new approval |
| Routine dev | `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; `G9K_SAVE_BUTTON_SAVE_ENABLED=false` |
| Next (separate) | field slices, CMS Kit generalization, rollback policy, publish/deploy design |
| `readyForAnyDbWrite` | **false** |

## 0g. G-9k4b UI manual Save success + post-save result fix — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k4b-gosaki-schedule-existing-event-ui-manual-save-success-and-post-save-result-fix` |
| Doc | `gosaki-schedule-existing-event-ui-manual-save-success-and-result-fix.md` |
| Status | **complete** — operator manual G-9k4b UI Save **succeeded**; post-save result UI fix |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `description` only |
| `rowsAffected` | **1** |
| post-save `updated_at` | `2026-06-22T02:20:07.217037+00:00` |
| **Do not** | re-click G-9k4b Save without new approval |
| Routine dev | `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; `G9K_SAVE_BUTTON_SAVE_ENABLED=false` |
| `readyForAnyDbWrite` | **false** |

## 0f. G-9k4a UI Save enable preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k4a-gosaki-schedule-existing-event-ui-save-enable-implementation-preflight` |
| Doc | `gosaki-schedule-existing-event-ui-save-enable-implementation-preflight.md` |
| Module | `gosaki-schedule-existing-event-save-button-save.ts` |
| Status | **complete** — Save path wired; **default disabled** |
| Next | `G-9k4` operator manual Save once |
| `readyForAnyDbWrite` | **false** |

## 0e. G-9k3 manual dry-run verification — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k3-gosaki-schedule-existing-event-save-button-manual-dry-run-verification` |
| Doc | `gosaki-schedule-existing-event-save-button-manual-dry-run-verification.md` |
| Status | **complete** — operator manual checklist 1–8 PASS; **no DB write** |
| Save | **disabled** (`G9K_SAVE_BUTTON_SAVE_ENABLED = false`) |
| Next | `G-9k4` operator manual Save once |
| `readyForAnyDbWrite` | **false** |

## 0d. G-9k2 save button UI wiring — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k2-gosaki-schedule-existing-event-save-button-ui-wiring-dry-run-gate` |
| Doc | `gosaki-schedule-existing-event-save-button-ui-wiring.md` |
| Module | `gosaki-schedule-existing-event-save-button-dry-run.ts` |
| Status | **complete** — dry-run gate; Save **not** enabled |
| Next | `G-9k3` dry-run verification |
| `readyForAnyDbWrite` | **false** |

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

1. **G-9k4** operator manual Save once (explicit approval; flip `G9K_SAVE_BUTTON_SAVE_ENABLED` in G-9k4 only)
2. **G-9h1** client preview feedback closure
3. **Not** next: Cursor Save click; G-9j5 runner re-execution

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
