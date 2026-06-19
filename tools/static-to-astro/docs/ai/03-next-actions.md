Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 0. Gosaki staging admin schedule UI — add/edit forms (UI only)

| Item | Value |
| --- | --- |
| Routes | `/__admin-staging-shell/musician-basic/admin/schedule/` |
| Schedule | Add + edit forms; save disabled; dev PoC in `<details>` |
| Next | G-9h1 client preview feedback closure |

## 0b. Gosaki YouTube and Discography (G-9j)

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

1. **G-9h1 client preview feedback closure** — staging URL review vs Wix; residual list; no DB write / Preview / Save
2. **G-9h2 public schedule read verification + re-upload planning** — `scheduleDataSource` check; manual re-upload checklist
3. **G-9h3 schedule CMS practicalization phase boundary** — Phase 1 vs Phase 2 write slice roadmap
4. **G-9i YouTube embed planning** — separate track per G-9a
5. **Optional:** operator dry-run Preview for `start_time` / `price` (explicit approval only; no Save)
6. **Not** next: `start_time`-only manual non-dry-run execution slice

## 3. Routine dev safety

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

## 4. Do not

- Start `start_time`-only manual round-trip (framework implementation complete)
- Re-click G-9g4a2a open_time-only Save on proven row
- Run non-dry-run Save for `start_time` / `price` without new approval ID
- Cursor / AI click row picker / Preview / Save
- Use service_role
- Touch production or `/admin`
