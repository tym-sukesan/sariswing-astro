Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9h-gosaki-schedule-cms-practicalization-planning — complete; Gosaki staging admin schedule UI refined (check git HEAD).
branch: main
HEAD = origin/main — check git HEAD for latest commit hash
G-9g4a2 framework: complete, committed, pushed (C1–C4 through d66bae7)
```

## Gosaki staging admin (latest UI work)

- **Routes:** `/__admin-staging-shell/musician-basic/admin/`, `/admin/schedule/` (not production `/admin/`)
- **Operator schedule:** month / published / keyword filters; columns 日付・タイトル・会場・開場・開演・料金・確認する; detail card; save not exposed
- **Dev PoC:** bottom `<details>開発者向け詳細</details>` — row picker, read/edit, G-6 sections preserved
- **No** DB write / Save / Preview auto / FTP / production admin changes

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

## G-9h Gosaki schedule CMS practicalization planning — complete

- **Doc:** `gosaki-schedule-cms-practicalization-planning.md`
- **Verifier:** 34 passed
- **Phase 1:** client feedback + public read UX + re-upload planning — no DB write
- **Phase 2:** schedule CMS write slices — explicit gates; no per-field `start_time`/`price` round-trips
- **YouTube:** separate track — `G-9i-gosaki-youtube-embed-planning`

## Next

1. **G-9h1** client preview feedback closure (staging URL vs Wix; residual list; no DB write)
2. **G-9h2** public schedule read verification + re-upload planning
3. **G-9h3** schedule CMS practicalization phase boundary
4. **G-9i** YouTube embed planning (parallel track)
5. Optional operator dry-run Preview (`start_time`/`price`) — explicit approval only; no Save
6. **Not** `start_time`-only manual non-dry-run execution
