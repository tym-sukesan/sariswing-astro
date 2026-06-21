Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9k1-gosaki-schedule-existing-event-save-button-guard-config-verifier — complete (guard/config/verifier only).
Prior: G-9k planning complete; G-9j5c one-row UPDATE succeeded on staging (do not re-run G-9j5 runner).
branch: main
HEAD = origin/main — check git HEAD for latest commit hash
```

## G-9k1 save button guard / config — complete

- **Doc:** `gosaki-schedule-existing-event-save-button-guard-config.md`
- **Modules:** `gosaki-schedule-existing-event-save-button-config.ts`, `gosaki-schedule-existing-event-save-button-guards.ts`
- **approvalId:** `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` (not G-9j5)
- **env arm:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED`
- **Separated from:** `gosaki-schedule-existing-event-update-g9j5-config.ts` (fixed runner)
- **Save:** still disabled until G-9k2+ wiring and G-9k4 manual phase
- **Next:** G-9k2 UI wiring
- **`readyForAnyDbWrite: false`**

## G-9k save button enablement — planning complete

- **Doc:** `gosaki-schedule-existing-event-save-button-enablement-planning.md`
- **Scope:** operator 「更新する」 — existing row UPDATE; 6 safe fields; dry-run before Save
- **approvalId:** `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` (not G-9j5)
- **env arm:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED`
- **Save:** still disabled until G-9k2+ implementation and G-9k4 manual phase
- **Next:** G-9k1 guard / config / verifier
- **`readyForAnyDbWrite: false`**

## G-9j5c — success (prior)

- **Doc:** `gosaki-schedule-existing-event-update-success-finalization.md`
- **Project:** `static-to-astro-cms-staging` / ref `kmjqppxjdnwwrtaeqjta` only — `sari-site` not touched
- **Row:** `f687ebf3-407c-49d0-9ab8-58040c499b8e` (`gosaki-piano`, `<Duo>`, 2026-03-15)
- **Field:** `description` only — `changedFields: ["description"]`, `rowsAffected: 1`
- **Auth:** anon + `signInWithPassword` — no `service_role`
- **Safety:** project ref allowlist, explicit admin email guard, G-9j5a password reset, G-9j5b auth gate
- **UI:** post-save description confirmed on `/__admin-staging-shell/musician-basic/admin/schedule/`
- **Do not:** re-run G-9j5; operator Save still disabled
- **`readyForAnyDbWrite: false`** (routine dev)

## Gosaki staging admin (latest UI work)

- **Routes:** `/__admin-staging-shell/musician-basic/admin/`, `/admin/schedule/` (not production `/admin/`)
- **Operator schedule:** month / published / keyword filters; columns 日付・タイトル・会場・開場・開演・料金・確認する; detail card; save not exposed
- **Dev PoC:** bottom `<details>開発者向け詳細</details>` — row picker, read/edit, G-6 sections preserved
- **Schedule:** add/edit forms (save disabled); dev PoC in `<details>`

## Summary

**G-9g4a2 single-text-field operational commonization implementation — complete, committed, pushed:**

- **Doc:** `staging-shell-schedule-single-text-field-operational-commonization-implementation.md`
- **Planning commit:** `e267da3`
- **C1:** `1e643e7` — registry + types + parameterized guards + generic config
- **C2:** `9c3714c` — generic Save executor + open_time-only save delegate
- **C3:** `1c1fb32` — generic edit UI + open_time edit-ui delegate + Astro/binding wiring
- **C4:** `d66bae7` — implementation doc + final verifier + AI context
- **Target fields:** `open_time`, `start_time`, `price` (config-driven registry)
- **Excluded:** `description` (G-9g3g operational), `title` (SEO sensitivity), `venue` (G-9g4a1 separate), date/route/publication/image
- **open_time:** round-trip complete (`105c6b1`); delegates preserve existing exports and DOM ids
- **start_time / price:** registry/config/guard/save/UI wired; **no** manual non-dry-run round-trip
- **Verifiers:** C1 69 / C2 34 / C3 47 / G-9g4a2a 83 / planning 39 / implementation 43 passed

## Policy (manual round-trip reduction)

- Do **not** repeat per-field manual round-trips for `start_time` / `price`
- Manual non-dry-run round-trip only when **new common logic** is introduced (max once, explicit approval)
- Config-only fields: static verifiers, guards, dry-run Preview, type checks
- Do **not** over-abstract — minimal commonization for gosaki schedule CMS practical use
- **Not** next: `start_time`-only manual execution slice

## Gates

```txt
stagingShellScheduleSingleTextFieldOperationalCommonizationImplementationComplete: true
readyForG9g4a2FrameworkLocalStaticVerification: true
readyForG9g4a2FrameworkOptionalDryRunPreviewByOperator: true (explicit approval only)
readyForG9g4a2FrameworkSmokeNonDryRunSave: false
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
noFurtherSaveOrRestoreNeeded: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

## Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

## G-9j Gosaki schedule existing event save enablement — planning complete

- **Doc:** `gosaki-schedule-existing-event-save-enablement-planning.md`
- **Verifier:** 33 passed
- **Scope:** existing row UPDATE only (`title`, `venue`, `open_time`, `start_time`, `price`, `description`)
- **approvalId:** `G-9j-gosaki-schedule-existing-event-update-non-dry-run`
- **env:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED`
- **Reuse:** `buildScheduleLockedWriteRequest`, `updateScheduleWrite`, optimistic lock; **new** operator UI path (not G-9g3g PoC)
- **Next:** G-9j1 guards + dry-run implementation — **no DB write / Save yet**
- **`readyForAnyDbWrite: false`**

## G-9h Gosaki schedule CMS practicalization planning — complete

- **Doc:** `gosaki-schedule-cms-practicalization-planning.md`
- **Verifier:** 34 passed
- **Phase 1:** client feedback + public read UX + re-upload planning — no DB write
- **Phase 2:** schedule CMS write slices — explicit gates; no per-field `start_time`/`price` round-trips
- **YouTube:** separate track — `G-9i-gosaki-youtube-embed-planning`

## Next

1. **G-9k2** UI wiring — dry-run gates Save
2. **G-9h1** client preview feedback closure
3. **Not** G-9j5 runner re-execution
4. **Not** G-9j5 approval/arm for operator Save
