Last updated: 2026-06-28
Project: Static-to-Astro CMS / Musician CMS Kit

## 0zzzzzzzzzzzzzzzzzzzzz. G-15c Discography public reflection local regen + upload preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-15c-gosaki-discography-public-reflection-local-regen-and-upload-preflight` |
| Doc | `gosaki-discography-public-reflection-local-regen-and-upload-preflight.md` |
| Verifier | `verify-g15c-gosaki-discography-public-reflection-local-regen-and-upload-preflight.mjs` |
| Target | `discography-002` / SKYLARK / `purchase_url` only |
| Hook | `supabase-discography-read.mjs` (convert-time Supabase patch) |
| Local HTML | new URL present; old URL absent |
| CSS/JS hash | **unchanged** — upload `discography/index.html` ×1 |
| Live staging | **stale** (pre-upload) |
| **Next (recommended)** | **G-15c-upload** — operator manual upload + HTTP verify |
| **Do not** | FTP auto-apply; re-Save; full `public-dist/` upload |

## 0zzzzzzzzzzzzzzzzzzzz. G-15b-f8-execution Discography updated_at trigger apply — complete

| Item | Value |
| --- | --- |
| Phase | `G-15b-f8-execution-gosaki-discography-updated-at-trigger-apply-result` |
| Doc | `gosaki-discography-updated-at-trigger-apply-result.md` |
| Verifier | `verify-g15b-f8-gosaki-discography-updated-at-trigger-apply-result.mjs` |
| Trigger | `discography_set_updated_at` — **enabled** |
| Row `updated_at` | **unchanged** (DDL only — expected) |
| **Next (recommended)** | **G-15c** — public reflection planning |
| **Do not** | Re-Save for trigger proof without new approval |

## 0zzzzzzzzzzzzzzzzzzz. G-15b-f8 Discography updated_at trigger final preflight — complete

| Item | Value |
| --- | --- |
| Commit | `1931aaf` |
| Doc | `gosaki-discography-updated-at-trigger-final-preflight.md` |
| **Next** | G-15b-f8-execution — done |

## 0zzzzzzzzzzzzzzzzzz. G-15b-retry Discography Save retry — complete

| Item | Value |
| --- | --- |
| Commit | `c06162b` |
| Doc | `gosaki-discography-save-retry-result-and-updated-at-investigation.md` |
| `purchase_url` | **updated** (`gosakirikako`) |
| `updated_at` | **unchanged** — trigger gap |
| **Next** | G-15b-f8 — done (preflight) |

## 0zzzzzzzzzzzzzzzzz. G-15b-grant-apply Discography UPDATE grant — complete

| Item | Value |
| --- | --- |
| Commit | `cfc0297` |
| Doc | `gosaki-discography-update-grant-apply-result.md` |
| **Next** | G-15b-retry — done |

## 0zzzzzzzzzzzzzzz. G-15b Discography Save slice — complete (Save failed safely)

| Item | Value |
| --- | --- |
| Phase | `G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run` |
| Commit | `eda9047` |
| Doc | `gosaki-discography-save-slice-final-preflight.md` |
| Target | `discography-002` / `purchase_url` |
| Operator Save | **attempted once** — failed at DB permission |
| **Next** | G-15b-fail — done |
| **Do not** | Re-Save without grant fix |

## 0zzzzzzzzzzzzzz. G-15a2 Discography dry-run Preview implementation and preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-15a2-gosaki-discography-dry-run-preview-implementation-and-preflight` |
| Doc | `gosaki-discography-dry-run-preview-implementation-and-preflight.md` |
| Target | `discography-002` (SKYLARK) / `purchase_url` only |
| Preview | `actualWrite: false`; `wouldWrite: true` |
| Save | dry-run only in G-15a2 |
| **Next (recommended)** | **G-15b** — done |
| **Do not** | Reuse G-15a2 approval for Save |

## 0zzzzzzzzzzzzz. G-15a Discography admin Supabase read binding — complete

| Item | Value |
| --- | --- |
| Phase | `G-15a-gosaki-discography-admin-supabase-read-binding` |
| Doc | `gosaki-discography-admin-supabase-read-binding.md` |
| Route | `/__admin-staging-shell/musician-basic/admin/discography/` |
| Source | Supabase `discography` + `discography_tracks` (read-only) |
| Albums | **4** — legacy_id `discography-001` … `004` |
| Save | **disabled** |
| **Next (recommended)** | **G-15a2** — dry-run Preview preflight |
| **Do not** | Save / DB write / migration in G-15a |

## 0zzzzzzzzzzzz. G-15 Discography CMS MVP inventory and plan — complete

| Item | Value |
| --- | --- |
| Phase | `G-15-gosaki-discography-cms-mvp-inventory-and-plan` |
| Doc | `gosaki-discography-cms-mvp-inventory-and-plan.md` |
| Verifier | `verify-g15-gosaki-discography-cms-mvp-inventory-and-plan.mjs` |
| Releases | **4** (Wix public / JSON admin / Supabase DB) |
| MVP path | Supabase `discography` existing-row UPDATE (Schedule pattern) |
| **Next (recommended)** | **G-15a** — admin Supabase read binding + list UI |
| **Do not** | DB write / migration / Save / FTP in G-15 |

## 0zzzzzzzzzzz. G-14b1f Schedule CMS routine edit reflection closure — complete

| Item | Value |
| --- | --- |
| Phase | `G-14b1f-gosaki-schedule-routine-edit-reflection-closure` |
| Doc | `gosaki-schedule-routine-edit-reflection-closure.md` |
| Verifier | `verify-g14b1f-gosaki-schedule-routine-edit-reflection-closure.mjs` — **53 PASS** |
| Chain | G-14b1 planning → G-14b1a → G-14b1b → G-14b1b-result → G-14b1c → G-14b1d → G-14b1e → G-14b1e-upload — **closed** |
| Product path | G-9k operator UI Save — **success** |
| Target | `schedule-2026-04-005` / price only |
| `readyForG14b1RoutineEditReExecution` | **false** |
| **Next (recommended)** | **G-14b2** — second routine edit planning (new target + new approval) **or** G-9l YouTube embed CMS planning |
| **Do not** | Re-Save `schedule-2026-04-005`; re-upload `schedule/2026-04/index.html` |

## 0zzzzzzzzzz. G-14b1e-upload Schedule CMS routine edit public reflection upload + HTTP verify — complete

| Item | Value |
| --- | --- |
| Phase | `G-14b1e-upload-gosaki-schedule-routine-edit-public-reflection-result` |
| Doc | `gosaki-schedule-routine-edit-public-reflection-result.md` |
| Upload | `schedule/2026-04/index.html` ×1 |
| HTTP | **200** — price `3,300円（税込）` live |
| **Next (recommended)** | **G-14b1f** — reflection closure (historical; **done**) |
| **Do not** | Re-upload April HTML |

## 0zzzzzzzzz. G-14b1e Schedule CMS routine edit public reflection local regen + upload preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-14b1e-gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight` |
| Doc | `gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight.md` |
| Regen | `build-gosaki-staging-admin-package.mjs` PASS |
| Minimal upload | `schedule/2026-04/index.html` ×1 |
| CSS/JS hash | **unchanged** |
| Live April | **stale** until upload |
| **Next (recommended)** | **G-14b1e-upload** — upload + HTTP verify (historical; **done**) |
| **Do not** | Re-upload April HTML |

## 0zzzzzzzz. G-14b1d Schedule CMS routine edit Save execution result — complete

| Item | Value |
| --- | --- |
| Phase | `G-14b1d-gosaki-schedule-routine-edit-save-execution-result` |
| Doc | `gosaki-schedule-routine-edit-save-execution-result.md` |
| Target | `14230329…` / `schedule-2026-04-005` |
| Save path | G-9k operator UI |
| `updated_at` after | `2026-06-27T17:18:54.986868+00:00` |
| rollbackNeeded | **false** |
| **Next (recommended)** | **G-14b1f** — reflection closure (G-14b1e-upload **done**) |
| **Do not** | Re-click G-14b1 Save |

## 0zzzzzzz. G-14b1c Schedule CMS routine edit final preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-14b1c-gosaki-schedule-routine-edit-final-preflight` |
| Doc | `gosaki-schedule-routine-edit-final-preflight.md` |
| Target | `14230329…` / `schedule-2026-04-005` |
| `updated_at` baseline | `2026-06-16T16:03:41.551792+00:00` |
| Save path | **G-9k** operator UI + practical arm |
| **Not** for Save | G-9g3g dev-tools |
| **Next (recommended)** | **G-14b1f** — reflection closure (G-14b1e-upload **done**) |
| **Do not** | Re-click G-14b1 Save |

## 0zzzzzz. G-14b1b-result Schedule CMS routine edit local dry-run Preview result — complete

| Item | Value |
| --- | --- |
| Phase | `G-14b1b-result-gosaki-schedule-routine-edit-local-dry-run-preview-result` |
| Doc | `gosaki-schedule-routine-edit-local-dry-run-preview-result.md` |
| Preview path used | G-9g1 dev-tools (`Preview G-9 site_slug general edit dry-run`) — **PASS** |
| Save path required | **G-9k** + `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED` |
| **Not** for routine Save | G-9g3g `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| DB after Preview | unchanged (`price` / `updated_at` baseline held) |
| **Next (recommended)** | **G-14b1c** — final preflight (historical; **done**) |
| **Do not** | Re-click G-14b1 Save |

## 0zzzzz. G-14b1b Schedule CMS routine edit local dry-run Preview preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-14b1b-gosaki-schedule-routine-edit-local-dry-run-preview-preflight` |
| Doc | `gosaki-schedule-routine-edit-local-dry-run-preview-preflight.md` |
| Target | `14230329…` / `schedule-2026-04-005` / 2026-04-12 |
| Field | `price` only |
| `updated_at` baseline | `2026-06-16T16:03:41.551792+00:00` |
| **Next (recommended)** | **G-14b1b-result** — operator Preview once (Save off) |
| **Do not** | Cursor Preview / Save in G-14b1b |

## 0zzzz. G-14b1a Schedule CMS routine edit practical Save enablement — complete

| Item | Value |
| --- | --- |
| Phase | `G-14b1a-gosaki-schedule-routine-edit-practical-save-enablement-implementation` |
| Doc | `gosaki-schedule-routine-edit-practical-save-enablement-implementation.md` |
| Practical arm | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED` |
| approval_id | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |
| Save default | `G9K_SAVE_BUTTON_SAVE_ENABLED=false` (compile + routine dev) |
| G-13c1 / G-13c2 | panels **unchanged**; practical-arm-off mutual exclusion |
| **Next (recommended)** | **G-14b1b** — local dry-run Preview preflight |
| **Do not** | Save / Preview / DB / FTP in G-14b1a |

## 0zzz. G-14b1 Schedule CMS routine edit flow next PoC planning — complete

| Item | Value |
| --- | --- |
| Phase | `G-14b1-gosaki-schedule-routine-edit-flow-next-poc-planning` |
| Doc | `gosaki-schedule-routine-edit-flow-next-poc-planning.md` |
| Recommended PoC | `schedule-2026-04-005` / 2026-04-12 / `price` only |
| approval_id | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |
| Excluded rows | Event A (`f687ebf3…`), Event B (`aa440e29…`) — cleanup closed |
| **Next (recommended)** | **G-14b1a** — practical Save enablement implementation |
| **Do not** | Save / Preview / DB / FTP / regen in planning phase |

## 0zz. G-13c2e Event B PoC cleanup public reflection closure — complete

| Item | Value |
| --- | --- |
| Phase | `G-13c2e-gosaki-schedule-event-b-public-reflection-closure` |
| Chain | G-13c2 DB → G-13c2e regen → upload → HTTP verify — **closed** |
| Row | `aa440e29…` / `schedule-2026-07-010` / `2026-07-19` |
| Live July | **clean** — `<>` / `出演：`; G-9g PoC absent |
| rollbackNeeded | **false** |
| Event A / March | **untouched** |
| G-13b (2 events) | **both closed** (A: G-13e, B: G-13c2e) |
| **Next (recommended)** | **G-14b1f** — reflection closure (G-14b1e-upload **done**) |
| **Do not** | re-click G-13c2 Save; re-upload July / March HTML |

## 0zz0. G-13c2e Event B public reflection upload result + HTTP verify — complete

| Item | Value |
| --- | --- |
| Phase | `G-13c2e-gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight` |
| Local regen | `build-gosaki-staging-admin-package.mjs` **PASS** (27 files) |
| Minimal upload | **1 file** — `schedule/2026-07/index.html` |
| Upload execution | **done** (operator) |
| Post-upload HTTP | **done** — see section above |

## 0zz0. G-13c2 Event B PoC cleanup execution result — complete

| Item | Value |
| --- | --- |
| Phase | `G-13c2-gosaki-schedule-event-b-poc-cleanup-execution-result` |
| Row | `aa440e29…` / `schedule-2026-07-010` / `2026-07-19` |
| Save | operator **1回** — `errorCode: (none)` |
| after `updated_at` | `2026-06-27T10:17:42.60691+00:00` |
| rollbackNeeded | **false** |
| **Next** | G-13c2e — **done** → upload execution |
| Event A / March | **untouched** |

## 0zz0. G-13c2 Event B PoC cleanup final preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-13c2-gosaki-schedule-event-b-poc-cleanup-final-preflight` |
| Row | `aa440e29…` / `schedule-2026-07-010` / `2026-07-19` |
| `updated_at` baseline | `2026-06-18T01:04:51.312817+00:00` (live-confirmed) |
| **Next** | `G-13c2-gosaki-schedule-event-b-poc-cleanup-execution` — **done** |

## 0zz0. G-13c2d2-result Event B local dry-run Preview result — complete

| Item | Value |
| --- | --- |
| Phase | `G-13c2d2-result-gosaki-schedule-event-b-poc-cleanup-local-dry-run-result` |
| Row | `aa440e29…` / `schedule-2026-07-010` / `2026-07-19` |
| Preview | **PASS** (operator 1回) |
| `saveReadiness` | `ready_but_save_disabled` |
| Null payload | venue / open / start / price = **null** |
| **Next** | `G-13c2-gosaki-schedule-event-b-poc-cleanup-final-preflight` — **done** → execution |
| Save / DB | **not executed** |

## 0zz0. G-13c2d2b Event B Preview UI visibility fix — complete

| Item | Value |
| --- | --- |
| Phase | `G-13c2d2b-gosaki-schedule-event-b-poc-cleanup-preview-ui-visibility-fix` |
| Fix | PoC panels outside sticky workspace grid |
| **Next** | operator retry G-13c2 dry-run Preview — **done** (G-13c2d2-result) |
| Save / Preview (Cursor) | **not executed** |

## 0zz0. G-13c2d2 Event B local dry-run Preview preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-13c2d2-gosaki-schedule-event-b-poc-cleanup-local-dry-run-preflight` |
| Row | `aa440e29…` / `schedule-2026-07-010` / `2026-07-19` |
| Save gate | **OFF** (Preview-only) |
| Expected Preview | `dryRun:true` / `actualWrite:false` / 6 changedFields / null payload fields |
| **Next** | `G-13c2d2-result` complete → `G-13c2-gosaki-schedule-event-b-poc-cleanup-final-preflight` |
| Save / DB | **not executed** |

## 0zz0. G-13c2d1 Event B PoC cleanup slice implementation — complete

| Item | Value |
| --- | --- |
| Phase | `G-13c2d1-gosaki-schedule-event-b-poc-cleanup-slice-implementation` |
| Row | `aa440e29…` / `schedule-2026-07-010` / `2026-07-19` |
| Expected | `<>` / null times / `出演：` |
| Verifier | `verify-g13c2d1-gosaki-schedule-event-b-poc-cleanup-slice-implementation.mjs` |
| **Next** | `G-13c2d2` preflight complete → operator Preview |
| Event A / March | **untouched** |
| Save / DB | **not executed** |

## 0zz0. G-13c2 Event B PoC cleanup preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-13c2-gosaki-schedule-event-b-poc-cleanup-preflight` |
| Row | `aa440e29…` / `schedule-2026-07-010` / `2026-07-19` |
| Expected | `<>` / null times / `出演：` (Wix seed — **confirmed**) |
| **Next** | `G-13c2d1-gosaki-schedule-event-b-poc-cleanup-local-implementation` |

## 0zz0. G-14c Public reflection standardization — complete

## 0zz0. G-14b Schedule CMS practical editing flow — complete

## 0zz0. G-14a Gosaki CMS completion roadmap — complete

| Item | Value |
| --- | --- |
| Phase | `G-14a-gosaki-cms-completion-roadmap-gap-inventory` |
| Scope | CMS/system completion gaps; client preview **out of dev scope** |

## 0zz0. G-13e Event A PoC cleanup public reflection closure — complete

| Item | Value |
| --- | --- |
| Phase | `G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-closure` |
| Chain | G-13d1 DB cleanup + G-13e public reflection — **closed** |
| March re-upload | **not required** |
| Rollback | **not required** |
| Event B | **closed** (G-13c2e) |

## 0zz0. G-13e Event A public reflection upload execution — complete

| Item | Value |
| --- | --- |
| Phase | `G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-execution-result` |
| Upload | 1 file — `schedule/2026-03/index.html` |

## 0zz0. G-13e Event A public reflection upload preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight` |

## 0zz0. G-13e Event A public reflection local regen — complete

| Item | Value |
| --- | --- |
| Phase | `G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen` |
| Package | 27 files; March Event A clean; `scheduleDataSource=supabase` |

## 0zz0. G-13e Event A public reflection preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-preflight` |

## 0zz0. G-13d1 Event A PoC cleanup execution — complete

| Item | Value |
| --- | --- |
| Phase | `G-13d1-event-a-poc-cleanup-execution-result` |
| Row | `f687ebf3…` / `schedule-2026-03-007` — 6 fields cleaned |
| approval_id | `G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run` |
| post-save `updated_at` | `2026-06-27T05:10:58.008982+00:00` |
| **Do not** | Re-click G-13c1 Save |

## 0zz0. G-13d1g Event A project allowlist property fix — complete

| Item | Value |
| --- | --- |
| Phase | `G-13d1g-gosaki-schedule-event-a-poc-cleanup-project-allowlist-property-fix` |
| Fix | `allowlistPassed` / `errorMessage` in G-13c1 config (G-9k aligned) |

## 0zz0. G-13d1f Event A project allowlist investigation — complete

| Item | Value |
| --- | --- |
| Phase | `G-13d1f-gosaki-schedule-event-a-poc-cleanup-project-allowlist-investigation` |
| Root cause | Wrong `.passed` / `.failureReason` on allowlist result |

## 0zz0. G-13d1e Event A Save gate page config bridge — complete

| Item | Value |
| --- | --- |
| Phase | `G-13d1e-gosaki-schedule-event-a-poc-cleanup-save-gate-page-config-bridge` |
| Fix | G-9k-style SSR→DOM page config for G-13c1 |

## 0zz0. G-13d1c staging shell server gate injection — complete

| Item | Value |
| --- | --- |
| Phase | `G-13d1c-gosaki-staging-shell-server-gate-injection` |

## 0zz0. G-13d1b Event A target row resolve fix — complete

| Item | Value |
| --- | --- |
| Phase | `G-13d1b-gosaki-schedule-event-a-poc-cleanup-target-row-resolve-fix` |

## 0zz0. G-13d1 selectable row investigation — complete

| Item | Value |
| --- | --- |
| Phase | `G-13d1-event-a-poc-cleanup-execution-blocked-selectable-row-investigation` |

## 0zz0. G-13d1 Event A cleanup final preflight — complete (execution blocked)

| Item | Value |
| --- | --- |
| Phase | `G-13d1-final-preflight-gosaki-schedule-event-a-poc-cleanup` |
| Target | `f687ebf3…` / `schedule-2026-03-007` |
| **Blocked by** | G-13d1b target row resolve fix |

## 0zz0. G-13d2 admin reflection local dev verify — complete

| Item | Value |
| --- | --- |
| Phase | `G-13d2-admin-reflection-local-dev-verify-result` |

## 0zz0. G-13d2 Event A admin reflection preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-13d2-gosaki-schedule-event-a-poc-cleanup-admin-reflection-preflight` |

## 0zz0. G-13d1 Event A cleanup local implementation — complete

| Item | Value |
| --- | --- |
| Phase | `G-13d1-gosaki-schedule-event-a-poc-cleanup-local-implementation` |
| approval_id | `G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run` |

## 0zz0. G-13c PoC cleanup implementation prep — complete

| Item | Value |
| --- | --- |
| Phase | `G-13c-gosaki-schedule-poc-visible-text-cleanup-implementation-prep` |

## 0zz0. G-13b PoC visible text cleanup preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-13b-gosaki-schedule-poc-visible-text-cleanup-preflight` |
| Affected | 2 events (2026-03-15, 2026-07-19) |

## 0zz1. G-13a dry-run preview — complete

| Item | Value |
| --- | --- |
| Commit | `099ee5d` |

## 0zz1. G-12d phase boundary — complete

| Item | Value |
| --- | --- |
| Commit | `993356b` |

## 0zz1. G-12c client preview planning — complete

| Item | Value |
| --- | --- |
| Commit | `892f86f` |

## 0zz1. G-12b public schedule read — complete

| Item | Value |
| --- | --- |
| Commit | `372b558` |

## 0zz1. G-11c15 YouTube staging verification — complete

| Item | Value |
| --- | --- |
| G-11c8→c15 | **complete** |

## 0zz1. G-11c14 staging manual upload — complete

| Item | Value |
| --- | --- |
| Commit | `213c834` |

## 0zz1. G-11c13 staging upload preflight — complete

| Item | Value |
| --- | --- |
| Commit | `1d29158` |

## 0zz1. G-11c12 package regeneration — complete

| Item | Value |
| --- | --- |
| Commit | `de2850e` |

## 0zz1. G-11c11 public reflection — complete

| Item | Value |
| --- | --- |
| Commit | `f285786` |

## 0zz1. G-11c10c dispatch retry — success

| Item | Value |
| --- | --- |
| JSON commit | `9f58889` |
| `embedCode` | `https://youtu.be/I-eY9YMq9GI` |

## 0zz1. G-11c10a allowlist registration — complete

| Item | Value |
| --- | --- |
| Commit | `282e762` |
| Doc | `gosaki-youtube-url-save-workflow-dispatch-allowlist-registration.md` |

## 0zz1. G-11c9 workflow dispatch preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-11c9-gosaki-youtube-url-save-workflow-dispatch-preflight` |
| Commit | `1182419` |
| Doc | `gosaki-youtube-url-save-workflow-dispatch-preflight.md` |

## 0zz1. G-11c8 workflow JSON patch implementation — complete

| Item | Value |
| --- | --- |
| Phase | `G-11c8-gosaki-youtube-url-save-workflow-json-patch-implementation` |
| Commit | `3cbcb9e` |
| Doc | `gosaki-youtube-url-save-workflow-json-patch-implementation.md` |

## 0zz1. G-11c7 workflow JSON patch planning — complete

| Item | Value |
| --- | --- |
| Phase | `G-11c7-gosaki-youtube-url-save-workflow-json-patch-planning` |
| Doc | `gosaki-youtube-url-save-workflow-json-patch-planning.md` |
| Patch | `gosaki-piano-youtube-embed.json` — `embedCode` only (Option C) |

## 0zz1. G-11c6d save endpoint smoke — complete

| Item | Value |
| --- | --- |
| Commit | `747b638` |
| Doc | `gosaki-youtube-url-save-endpoint-smoke-and-admin-wiring-check.md` |

## 0zzy. G-11c4b-fix auth login button enable — complete

| Item | Value |
| --- | --- |
| Phase | `G-11c4b-fix-gosaki-staging-admin-auth-configured-login-button-enable` |
| Commit | `ecca35e` |

## 0zzy. G-11c3b YouTube dry-run Edge Function deploy execution — complete

| Item | Value |
| --- | --- |
| Phase | `G-11c3b-gosaki-youtube-url-dry-run-edge-function-deploy-execution-result` |
| Commit | `5844d6f` |
| Doc | `gosaki-youtube-url-dry-run-edge-function-deploy-execution-result.md` |

## 0zzy. G-11c3a YouTube dry-run deploy readiness config prep — complete

| Item | Value |
| --- | --- |
| Phase | `G-11c3a-gosaki-youtube-url-dry-run-edge-function-deploy-readiness-config-prep` |
| Commit | `537e5e6` |
| Doc | `gosaki-youtube-url-dry-run-edge-function-deploy-readiness-config-prep.md` |
| config.toml | `[functions.gosaki-youtube-url-dry-run] verify_jwt = true` |

## 0zy. G-11c2 YouTube dry-run Edge Function deploy preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-11c2-gosaki-youtube-url-dry-run-edge-function-deploy-preflight` |
| Commit | `df6e18e` |
| Doc | `gosaki-youtube-url-dry-run-edge-function-deploy-preflight.md` |

## 0zx. G-11c1 YouTube URL web-save dry-run local prep — complete

| Item | Value |
| --- | --- |
| Phase | `G-11c1-gosaki-youtube-url-web-save-dry-run-poc-local-prep` |
| Commit | `8152d7c` |
| Doc | `gosaki-youtube-url-web-save-dry-run-poc-local-prep.md` |

## 0zw. G-11b staging online admin post-upload finalization — complete

| Item | Value |
| --- | --- |
| Phase | `G-11b-gosaki-staging-online-admin-read-only-page-post-upload-finalization` |
| Commit | `d7b4674` |
| Doc | `gosaki-staging-online-admin-read-only-page-post-upload-finalization.md` |

## 0zv. G-11b staging online admin read-only page package prep — complete

| Item | Value |
| --- | --- |
| Phase | `G-11b-gosaki-staging-online-admin-read-only-page-package-prep` |
| Commit | `d941003` |
| Doc | `gosaki-staging-online-admin-read-only-page-package-prep.md` |
| **Note** | Upload + QA closed in G-11b post-upload finalization |

## 0zu. G-11a staging online CMS architecture planning — complete

| Item | Value |
| --- | --- |
| Phase | `G-11a-gosaki-staging-online-cms-architecture-planning` |
| Commit | `755ecbe` |
| Doc | `gosaki-staging-online-cms-architecture-planning.md` |

## 0zt. G-10h5-2a staging manual upload post-QA finalization — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h5-2a-gosaki-staging-manual-upload-post-qa-finalization` |
| Commit | `ffd1496` |
| Doc | `gosaki-staging-manual-upload-post-qa-finalization.md` |

## 0zs. G-10i1 About bands/projects images package prep — complete

| Item | Value |
| --- | --- |
| Phase | `G-10i1-gosaki-about-bands-projects-images-package-prep` |
| Commit | `e5beedc` |
| **Note** | Uploaded + QA closed in G-10h5-2a |

## 0zr. G-10g4 Contact photo aspect-ratio fix package prep — complete

| Item | Value |
| --- | --- |
| Phase | `G-10g4-gosaki-contact-photo-aspect-ratio-fix-package-prep` |
| Doc | `gosaki-contact-photo-aspect-ratio-fix-package-prep.md` |
| Fix | PC `#comp-jsh29kfc` portrait `3/4`, `object-fit: cover`, `object-position: center top` |
| Package | `output/manual-upload/gosaki-piano/public-dist/` (regenerated) |
| **Next** | `G-10h5-2a-gosaki-staging-manual-upload-by-operator` (Contact photo QA) |
| **Do not** | Cursor FTP / image file ops / About JSON re-Save |

## 0zq. G-10g3 Contact HubSpot visual layout refinement package prep — complete

| Item | Value |
| --- | --- |
| Phase | `G-10g3-gosaki-contact-hubspot-visual-layout-refinement-package-prep` |
| **Note** | Use **G-10g4-regenerated** package for upload |

## 0zp. G-10g2 Contact HubSpot layout fix package prep — complete

| Item | Value |
| --- | --- |
| Phase | `G-10g2-gosaki-contact-hubspot-layout-fix-package-prep` |
| Doc | `gosaki-contact-hubspot-layout-fix-package-prep.md` |
| Commit | `04eadd9` |
| **Note** | Use **G-10g3-regenerated** package for upload |

## 0zo. G-10g1 Contact HubSpot embed package prep — complete

| Item | Value |
| --- | --- |
| Phase | `G-10g1-gosaki-contact-hubspot-embed-implementation-and-package-prep` |
| Doc | `gosaki-contact-hubspot-embed-package-prep.md` |
| Commit | `aa352ac` |
| Config | `gosaki-piano-contact-hubspot.json` |
| **Note** | Use **G-10g2-regenerated** package for upload (includes layout fix) |
| **Do not** | Cursor FTP / About JSON re-Save / G-10h4b / G-10h4d re-run |

## 0zn. G-10h5-2 About HTML staging manual upload preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h5-2-gosaki-about-html-staging-manual-upload-preflight` |
| Doc | `gosaki-about-html-staging-manual-upload-preflight.md` |
| Commit | `c1b2bc3` |
| **Next** | G-10h5-2a operator upload (G-10g1 package regen — see 0zo) |
| **Do not** | use pre-G-10g1 package for upload |

## 0zm. G-10h5-1 About HTML public reflection package prep — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h5-1-gosaki-about-html-content-public-reflection-package-prep` |
| Doc | `gosaki-about-html-content-public-reflection-package-prep.md` |
| Commit | `f427f9c` |
| **Next** | G-10h5-2a operator upload (G-10h5-2 preflight complete — see 0zn) |
| **Do not** | FTP / mirror-delete / package regen without cause |

## 0zl. G-10h4d About bands HTML static JSON write execution — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h4d-gosaki-about-bands-html-static-json-write-execution` |
| Doc | `gosaki-about-bands-html-static-json-write-execution.md` |
| Commit | `c3b0d56` |
| **Next** | G-10h5-2 upload (G-10h5-1 prep complete — see 0zm) |
| **Do not** | re-run G-10h4d run script / re-click bands Save / G-10h4b profile re-Save / Cursor FTP |

## 0zk. G-10h4d-1 About bands HTML static JSON write execution prep — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h4d-1-gosaki-about-bands-html-static-json-write-execution-prep` |
| Doc | `gosaki-about-bands-html-static-json-write-execution.md` |
| Commit | `6951d63` |
| **Next** | G-10h4d execution (complete — see 0zl) |
| **Do not** | re-run prep as if unexecuted |

## 0zj. G-10h4c About bands HTML dry-run write slice — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h4c-gosaki-about-bands-html-static-json-write-dry-run` |
| Doc | `gosaki-about-bands-html-static-json-write-dry-run.md` |
| Commit | `8cabd19` |
| Block | `about-bands-html` / field `html` only |
| approvalId | `G-10h4c-about-bands-html-static-json-write-dry-run` |
| Save env | `G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED=false` (default) |
| **Next** | G-10h4d execution (G-10h4d-1 prep complete — see 0zk) |
| **Do not** | bands non-dry-run Save in G-10h4c / G-10h4b profile re-Save / Cursor FTP |

## 0zi. G-10h4b About profile HTML static JSON write execution — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h4b-gosaki-about-profile-html-static-json-write-execution` |
| Doc | `gosaki-about-profile-html-static-json-write-execution.md` |
| Commit | `e2d378a` |
| **Next** | G-10h4d (G-10h4c dry-run complete — see 0zj) |
| **Do not** | re-click G-10h4b Save |

## 0zh. G-10h4a About profile HTML dry-run write slice — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h4a-gosaki-about-profile-html-static-json-write-dry-run` |
| Doc | `gosaki-about-profile-html-static-json-write-dry-run.md` |
| Commit | `c126efe` |
| Block | `about-profile-html` / field `html` only |
| **Next** | G-10h4c (G-10h4b execution complete — see 0zi) |
| **Do not** | duplicate G-10h4b Save without rollback |

## 0zg. G-10h3 About HTML CMS admin read-only preview — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h3-gosaki-about-html-content-admin-readonly-preview` |
| Doc | `gosaki-about-html-content-admin-readonly-preview.md` |
| Route | `/__admin-staging-shell/musician-basic/admin/about/` |
| Status | **complete** — read-only textarea + preview; Save disabled |
| **Next** | G-10h4b profile Save execution (G-10h4a dry-run complete — see 0zh) |
| **Do not** | enable Save / write API / Cursor FTP |

## 0zf. G-10h2 About HTML CMS seed JSON + convert hook — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h2-gosaki-about-html-content-seed-json-and-convert-hook` |
| Doc | `gosaki-about-html-content-seed-json-and-convert-hook.md` |
| Status | **complete** — read-only public reflection |
| Config | `gosaki-piano-about-content.json` |
| Hook | `gosaki-about-content.mjs` after G-8a |
| Verify | `safeForStaticFtp: true`; about in manual-upload package |
| **Next** | `G-10h3-gosaki-about-html-content-admin-ui` |
| **Do not** | Save / write API / Cursor FTP |

## 0ze. G-10h1 About HTML CMS implementation preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h1-gosaki-about-html-content-cms-implementation-preflight` |
| Doc | `gosaki-about-html-content-cms-implementation-preflight.md` |
| Status | **complete** — design fixed; no implementation |
| Config path | `gosaki-piano-about-content.json` (**not created yet**) |
| Profile anchor | `[data-mesh-id="comp-lol1i5l0inlineContent-gridContainer"]` inner |
| Bands policy | non-empty HTML replaces `<BandProfilesSection />`; else G-8a fallback |
| Hook | `gosaki-about-content.mjs` after G-8a in convert |
| Approval ID | `G-10h-about-html-content-static-json-write-slice` |
| **Next** | G-10h4 static JSON write (G-10h3 complete — see 0zg) |
| **Do not** | create JSON / hook / Save / Cursor FTP |

## 0zd. G-10h About HTML content CMS planning — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h-gosaki-about-html-content-cms-planning` |
| Doc | `gosaki-about-html-content-cms-planning.md` |
| Status | **complete** — planning only |
| Target | `/about/` — profile Wix block + Bands / Projects HTML |
| Sariswing ref | `site_pages` + textarea + preview (Gosaki → static JSON) |
| PHOTO placeholder | `BandProfilesSection` — missing `public/images/bands/*.jpg` |
| Recommended | **2 HTML blocks** in `gosaki-piano-about-content.json` + G-10c write pattern |
| **Next** | G-10h2 implementation (preflight complete — see 0ze) |
| Deferred | G-10f Discography images |
| **Do not** | implement / JSON write / Cursor FTP |

## 0zc. G-10f Discography album images planning — complete (deferred)

| Item | Value |
| --- | --- |
| Phase | `G-10f-gosaki-discography-album-images-planning` |
| Doc | `gosaki-discography-album-images-planning.md` |
| Status | **complete** — read-only investigation |
| **Priority** | **deferred** — operator shifted to About CMS (G-10h) |
| **Resume when** | About CMS v1 live or operator requests discography |
| Releases | 4 (`continuous`, `skylark`, `about-us`, `ja-jaaaaan`) |
| Public images | Wix CDN in HTML — **0 local** in package |
| Admin `coverImage` | **empty** on all 4 → 「準備中」placeholder |
| Recommended | **E+B** — JSON paths + `public/images/discography/` + convert img rewrite |
| **Next** | resume at `G-10f1` when operator re-prioritizes |
| **Do not** | image mutation / JSON write / Cursor FTP |

## 0zb. G-10e1 YouTube embed layout reupload QA — complete

| Item | Value |
| --- | --- |
| Phase | `G-10e1-gosaki-youtube-embed-section-layout-reupload-qa-finalization` |
| Doc | `gosaki-youtube-embed-section-layout-reupload-qa-finalization.md` |
| Status | **complete** — operator re-upload + staging QA **PASS** |
| Staging URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| videoId | `Ke4F8JAQz-I` |
| Layout | G-10e `720px` / 16:9 / Wix mesh breakout **reflected on staging** |
| Prior commit | `9dabcb4` (G-10e) |
| Cursor FTP / upload | **not executed** |
| **Next** | `G-10f-gosaki-discography-album-images-planning` **or** `G-10g-gosaki-contact-hubspot-form-planning` |
| **Do not** | re-click G-10c Save; mirror/delete re-upload |

## 0za. G-10e YouTube embed section layout improvement — complete

| Item | Value |
| --- | --- |
| Phase | `G-10e-gosaki-youtube-embed-section-layout-improvement` |
| Doc | `gosaki-youtube-embed-section-layout-improvement.md` |
| Status | **complete** — local CSS + convert/build/package; staging QA PASS (G-10e1) |
| Layout | `.gosaki-youtube-embed` `max-width: 720px`; `aspect-ratio: 16 / 9`; Wix mesh breakout |
| Package | `output/manual-upload/gosaki-piano/public-dist/` (20 files) |
| Staging | **live** — layout improvement confirmed (G-10e1) |
| Cursor FTP / upload | **not executed** |
| **Next** | G-10f or G-10g (see 0zb) |
| **Do not** | re-click G-10c Save; Cursor FTP |

## 0z. G-10d2a YouTube embed staging upload QA — complete

| Item | Value |
| --- | --- |
| Phase | `G-10d2a-gosaki-youtube-embed-staging-upload-qa-finalization` |
| Doc | `gosaki-youtube-embed-staging-upload-qa-finalization.md` |
| Status | **complete** — operator upload + staging QA **PASS** |
| Staging URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| videoId | `Ke4F8JAQz-I` |
| Known UI | YouTube section too small → **G-10e** (non-blocking) |
| Cursor FTP | **not executed** |
| **Next** | `G-10e-gosaki-youtube-embed-section-layout-improvement` |
| **Do not** | re-click G-10c Save; mirror/delete re-upload |

## 0y. G-10d2 YouTube embed staging manual upload — complete

| Item | Value |
| --- | --- |
| Phase | `G-10d2-gosaki-youtube-embed-staging-manual-upload-by-operator` |
| Doc | `gosaki-youtube-embed-staging-manual-upload-by-operator.md` |
| Status | **complete** — operator upload + QA PASS (G-10d2a) |
| Operator decision | Upload **done** |
| Cursor FTP/upload | **not executed** |
| **Next** | `G-10e-gosaki-youtube-embed-section-layout-improvement` |
| **Do not** | mirror / sync / delete; FTP auto-deploy; re-click G-10c Save |

## 0x. G-10d1 YouTube embed manual upload package prep — complete

| Item | Value |
| --- | --- |
| Phase | `G-10d1-gosaki-youtube-embed-manual-upload-package-prep` |
| Doc | `gosaki-youtube-embed-manual-upload-package-prep.md` |
| Status | **complete** — package generated + verified locally |
| Package | `output/manual-upload/gosaki-piano/public-dist/` (20 files) |
| YouTube in package home | `youtube-nocookie.com/embed/Ke4F8JAQz-I` |
| `verify:manual-upload` | **PASS** |
| Staging upload | **not done** |
| **Next** | `G-10d2-gosaki-youtube-embed-staging-manual-upload-by-operator` |
| **Do not** | FTP auto-deploy; re-click G-10c Save |

## 0w. G-10d YouTube embed public reflection verification — complete

| Item | Value |
| --- | --- |
| Phase | `G-10d-gosaki-youtube-embed-public-reflection-verification` |
| Doc | `gosaki-youtube-embed-public-reflection-verification.md` |
| Status | **complete** — local convert/build + home HTML verified |
| Source JSON | `yt-placeholder-01` `published:true`, watch URL `Ke4F8JAQz-I` |
| Home HTML | `youtube-nocookie.com/embed/Ke4F8JAQz-I` + `.gosaki-youtube-embed` |
| Staging upload | **package ready** — operator upload pending (G-10d2) |
| **Next** | `G-10d2-gosaki-youtube-embed-staging-manual-upload-by-operator` |
| **Do not** | re-click G-10c Save; FTP auto-deploy |

## 0v. G-10c2 YouTube embed static JSON Save success — complete

| Item | Value |
| --- | --- |
| Phase | `G-10c2-gosaki-youtube-embed-static-json-write-save-success-finalization` |
| Doc | `gosaki-youtube-embed-static-json-write-save-success-finalization.md` |
| Status | **complete** — operator manual Save **succeeded** |
| Target | `gosaki-piano-youtube-embed.json` / `yt-placeholder-01` |
| changedFields | `embedCode`, `published` |
| videoId | `Ke4F8JAQz-I` |
| itemsAffected | **1** |
| Public反映 | **local verified** — staging upload pending (G-10d1) |
| **Next** | `G-10d1-gosaki-youtube-embed-staging-manual-upload-by-operator` |
| **Do not** | re-click G-10c Save |

## 0u. G-10c1 Save API response fix — complete

| Item | Value |
| --- | --- |
| Phase | `G-10c1-gosaki-youtube-embed-static-json-save-api-response-fix` |
| Doc | `gosaki-youtube-embed-static-json-save-api-response-fix.md` |
| Incident | Manual Save 1: HTML 404; API check: `FailedToLoadModuleSSR` (wrong import path) |
| Fix | `injectRoute` (dev) + `../../../../lib/...` imports + client safe parse |
| **Verify** | `curl GET` → **405 JSON** `method_not_allowed` |
| **Next** | Operator: restart dev → dry-run → Save retry once |
| JSON config | **unchanged** |

## 0t. G-10c YouTube embed static JSON write slice — complete

| Item | Value |
| --- | --- |
| Phase | `G-10c-gosaki-youtube-embed-static-json-write-slice-implementation` |
| Doc | `gosaki-youtube-embed-static-json-write-slice-implementation.md` |
| Status | **complete** — dry-run + gated Save UI; executor wired |
| Write target | `gosaki-piano-youtube-embed.json` / `yt-placeholder-01` |
| Fields | `embedCode`, `published` only |
| Default Save | **disabled** (`G10C_YOUTUBE_EMBED_SAVE_ENABLED=false`) |
| **Next** | G-10c final preflight → operator Save once |
| `readyForAnyDbWrite` | **false** |

## 0s. G-10b YouTube embed read/write planning — complete

| Item | Value |
| --- | --- |
| Phase | `G-10b-gosaki-youtube-embed-read-and-write-planning` |
| Doc | `gosaki-youtube-embed-read-and-write-planning.md` |
| Status | **complete** — survey + write option comparison |
| Public read | JSON → convert hook → `YouTubeEmbedSection.astro` → build → manual upload |
| Admin read | `gosaki-youtube-embed-admin-binding.ts` (fs JSON) |
| Current data | Placeholder `published:false` — home section hidden |
| **G-10c recommended** | static JSON write slice (1 item; dry-run + approval) |
| **G-10e deferred** | `site_embeds` Supabase migration |
| `readyForAnyDbWrite` | **false** |

**Next:** `G-10c-gosaki-youtube-embed-static-json-write-slice-final-preflight` — operator dry-run + Save once (env arm).

## 0r. G-10a Gosaki completion inventory — complete

| Item | Value |
| --- | --- |
| Phase | `G-10a-gosaki-completion-inventory-and-next-module-selection` |
| Doc | `gosaki-completion-inventory-and-next-module-selection.md` |
| Status | **complete** — inventory + next module selection |
| Schedule arc | G-9k6–G-9k7b **closed** for verification / UI |
| **Next module** | **YouTube embed CMS** → `G-10b` **complete** → `G-10c` static JSON write slice |
| Parallel | `G-9h1` client preview feedback (operator) |
| `readyForAnyDbWrite` | **false** |

## 0q. G-9k7b Save UI copy dedup + list edit button — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k7b-gosaki-schedule-save-ui-copy-and-list-usability-fix` |
| Doc | `gosaki-schedule-save-ui-copy-and-editor-scroll-fix.md` §3 |
| Status | **complete** — copy dedup + sticky「編集する」列 |
| Copy | Save 無効 dry-run 後: パネル `保存は無効です。確認のみ完了しました。` のみ |
| List | `admin-gosaki-schedule-table__actions-col` sticky @ ≥960px |
| **Do not** | DB write / Save click |
| `readyForAnyDbWrite` | **false** |

## 0p. G-9k7 Save UI copy and editor scroll fix — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k7-gosaki-schedule-save-ui-copy-and-editor-scroll-fix` |
| Doc | `gosaki-schedule-save-ui-copy-and-editor-scroll-fix.md` |
| Status | **complete** — operator copy + PC scroll layout |
| Copy | Save 無効/有効で矛盾しない文言 |
| Scroll | 一覧・編集パネル独立スクロール（≥960px） |
| **Do not** | DB write / Save click in this phase |
| Next | generalization, next feature, Gosaki CMS Kit, rollback |
| `readyForAnyDbWrite` | **false** |

## 0o. G-9k6g field slice closure — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k6g-gosaki-schedule-existing-event-field-slice-closure` |
| Doc | `gosaki-schedule-existing-event-field-slice-closure.md` |
| Status | **complete** — G-9k6 arc **closed** |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` |
| All slices | `description` (G-9k4b), `price` (G-9k6b), `open_time` (G-9k6c), `start_time` (G-9k6d), `venue` (G-9k6e), `title` (G-9k6f) — **succeeded** |
| Policy | **1 Save = 1 field**; `rowsAffected: 1`; single-field `changedFields` + `payload keys` every slice |
| Final baseline | title / venue / open_time / start_time / price + `updated_at` `2026-06-22T15:01:47.671778+00:00` |
| **Do not** | re-click any G-9k4b / G-9k6 slice Save |
| Next (operator choice) | UI copy fix; staging shell Save generalization; existing event next feature; Gosaki CMS Kit (`G-9h1`); rollback |
| `readyForAnyDbWrite` | **false** |

## 0n. G-9k6f title field slice Save success — complete (G-9k6 all slices done)

| Item | Value |
| --- | --- |
| Phase | `G-9k6f-gosaki-schedule-existing-event-title-field-slice-save-success-finalization` |
| Doc | `gosaki-schedule-existing-event-title-field-slice-save-success-finalization.md` |
| Status | **complete** — operator manual `title` slice UI Save **succeeded** |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `title` only |
| Before → after | `<Duo>` → `<Duo> [G-9k6 title UI保存テスト]` |
| `rowsAffected` | **1** |
| post-save `updated_at` | `2026-06-22T15:01:47.671778+00:00` |
| UI | **保存成功** panel; diff タイトル only; post-save description shown (display only) |
| **G-9k6 all slices** | `description`, `price`, `open_time`, `start_time`, `venue`, `title` — **all succeeded** |
| **Do not** | re-click G-9k6f Save (or any G-9k6 slice Save) |
| Next | `G-9k6g` field-slice closure |
| `readyForAnyDbWrite` | **false** |

## 0m. G-9k6e venue field slice Save success — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k6e-gosaki-schedule-existing-event-venue-field-slice-save-success-finalization` |
| Doc | `gosaki-schedule-existing-event-venue-field-slice-save-success-finalization.md` |
| Status | **complete** — operator manual `venue` slice UI Save **succeeded** |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `venue` only |
| Before → after | `川崎 ぴあにしも` → `川崎 ぴあにしも [G-9k6 venue UI保存テスト]` |
| `rowsAffected` | **1** |
| post-save `updated_at` | `2026-06-22T13:02:19.63835+00:00` |
| UI | **保存成功** panel; diff 会場 only; post-save description shown (display only) |
| **Do not** | re-click G-9k6e Save |
| Next | `G-9k6f` `title` field slice manual Save (last) |
| `readyForAnyDbWrite` | **false** |

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
