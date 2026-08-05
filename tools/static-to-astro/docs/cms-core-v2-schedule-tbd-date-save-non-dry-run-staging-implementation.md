# CMS Core v2 — Schedule TBD date Save non-dry-run staging implementation

- **Phase:** `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation`
- **Follow-up:** `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-boundary-hardening`
- **Follow-up (2026-08-05):** `cms-core-v2-schedule-tbd-create-oneshot-preflight-query-builder-fix` — `countTargetLegacyId` chain-before-await · preflight client errors → `failed` (not ambiguous) · INSERT未到達明示
- **Follow-up (2026-08-05):** `cms-core-v2-schedule-tbd-create-oneshot-auth-before-preflight-fix` — getAuth **before** preflight counts · same shared client for preflight+INSERT · second click `got 74` = public RLS · expected total **79** unchanged
- **Follow-up (2026-08-06):** `cms-core-v2-schedule-site-owner-authz-implementation-and-migration-template` — owner gate = `sites` resolve + `rpc('can_write_site', { p_site_id })` (**not** legacy `is_admin`) · staging RLS template SELECT+INSERT (unapplied) · expected total **79** · `READY_FOR_RETRY: false`
- **Date:** 2026-08-03 · authz/RLS template 2026-08-06
- **Status:** **COMPLETE (implementation + boundary hardening + preflight query-builder fix + auth-before-preflight + site-scoped owner authz + offline verifier)**
- **This phase:** Path B CREATE-only oneshot wire · **low-level INSERT non-exported** · INSERT直前再guard · schema probe · arms OFF · no Save · no DB write · no Edge deploy · no env change · no commit/push · **migration apply forbidden in this phase**

Prior: `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-planning.md`

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_DATE_SAVE_NON_DRY_RUN_STAGING_IMPLEMENTATION_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_DATE_SAVE_NON_DRY_RUN_STAGING_BOUNDARY_HARDENING_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_PREFLIGHT_QUERY_BUILDER_FIX_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_AUTH_BEFORE_PREFLIGHT_FIX_COMPLETE: true
CMS_CORE_V2_SCHEDULE_SITE_OWNER_AUTHZ_IMPLEMENTATION_COMPLETE: true
SCHEDULE_SITE_MAPPING_SAFE: true
SITE_WRITER_RLS_TEMPLATE_CREATED: true
SITE_WRITER_RLS_APPLIED: false
READY_FOR_MIGRATION_EXECUTION: false
IMPLEMENTATION_READY: true
COMMIT_READY: true
ACTUAL_WRITE_READY: false
ACTUAL_WRITE_EXECUTED: false
READY_FOR_RETRY: false
READY_FOR_TBD_NON_DRY_RUN_EXECUTION: false
TBD_SAVE_WIRED: true
TBD_WRITE_ENABLED: false
ARMS_OFF: true
ENV_CHANGED: false
RUNTIME_CHANGED: true
EDGE_CHANGED: false
DB_WRITE_EXECUTED: false
SAVE_EXECUTED: false
CLEANUP_IMPLEMENTED: false
MIO_SEED_UNCHANGED: true
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-schedules-site-writer-rls-migration-execution (separate approval · after commit)
FINAL_PREFLIGHT: cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight (COMPLETE · SQL Editor PASS · process-scoped exactly 9 keys · ACTUAL_WRITE_READY false · ACTUAL_WRITE_EXECUTED false)
EXECUTION_PREPARATION: cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution-preparation (COMPLETE · human runbook §7)
WRITE_STACK_GATE_CORRECTION: cms-core-v2-schedule-tbd-create-oneshot-write-stack-gate-correction (COMPLETE · oneshot-only proven)
PROCESS_SCOPED_ENV_PACKET: cms-core-v2-schedule-tbd-create-oneshot-process-scoped-env-packet-correction (COMPLETE · `env … npm run dev` · no `.env.local` edit)
PREFLIGHT_QUERY_BUILDER_FIX: cms-core-v2-schedule-tbd-create-oneshot-preflight-query-builder-fix (COMPLETE · offline · READY_FOR_RETRY false)
AUTH_BEFORE_PREFLIGHT_FIX: cms-core-v2-schedule-tbd-create-oneshot-auth-before-preflight-fix (COMPLETE · offline · READY_FOR_RETRY false)
SITE_OWNER_AUTHZ: cms-core-v2-schedule-site-owner-authz-implementation-and-migration-template (COMPLETE · offline · migration unapplied · READY_FOR_RETRY false)
```

**Staging only:** `kmjqppxjdnwwrtaeqjta`

**Production STOP:** `vsbvndwuajjhnzpohghh`

---

## 1. What was implemented

### 1.1 Create-only write API

| Module | Role |
| --- | --- |
| `gosaki-schedule-tbd-create-oneshot-guards.ts` | Fixed row + allowlist + fingerprint + preflight baselines |
| `gosaki-schedule-tbd-create-oneshot-config.ts` | Dual arm + staging/host + mutex + UI gate |
| `gosaki-schedule-tbd-create-oneshot-save.ts` | **public** `executeTbdCreateOneshotSave` only · **private** INSERT |
| `schedule-insert-write-adapter.ts` | confirmed `insertNewEventScheduleWrite` only (TBD INSERT **not exported**) |

**Boundary hardening:** low-level INSERT is `insertTbdCreateOneshotScheduleWriteInternal` (module-private). INSERT直前に staging ref / production 拒否 / dual arm / fixed payload を再確認。独立 `probeDateStatusColumn` schema probe。`deps.offline` preflight skip **削除**（runtime skip 不可）。

**Preflight query-builder fix (2026-08-05):** `countTargetLegacyId` は `.eq().eq()` chain 後に **1回だけ** await。INSERT 前の preflight client 例外は `terminal=failed` / `preflight_client_failed`（「INSERTは実行されていません」）· INSERT 発行後のみ `ambiguous`。人間ワンショット失敗記録: exact SELECT `NOT_INSERTED` · total 79 · target 0 · cleanup 不要 · `READY_FOR_RETRY=false`。Doc: `cms-core-v2-schedule-tbd-create-oneshot-preflight-query-builder-fix.md`。

**Auth-before-preflight fix (2026-08-05):** second single-click failed with `expected 79, got 74` (= published / `schedules_public_select`). Fix: `getAuth` **before** preflight counts · same `getStagingSupabaseClient` singleton for probe/preflight/INSERT · expected total stays **79**. Doc: `cms-core-v2-schedule-tbd-create-oneshot-auth-before-preflight-fix.md`.

**Site-scoped owner authz (2026-08-06):** oneshot gate is **not** legacy `is_admin` / `admin_users`. Call order: signed-in → resolve `sites.id` for `site_slug=gosaki-piano` (0/multi fail-closed) → `rpc('can_write_site', { p_site_id })` must be `true` → preflight (expected total **79**) → INSERT max 1. Owner (`site_members.role=owner`) · editor · platform_admin are all via `can_write_site`. Staging RLS template adds `schedules_site_writer_select` + `schedules_site_writer_insert` (**created · not applied**). Keeps `schedules_public_select` + `schedules_admin_all`. Doc: `cms-core-v2-schedule-site-owner-authz-rls-implementation.md`.

- Uses `buildScheduleTbdSavePayload` · `mode=tbd-v1` · `operation=create` · `dryRun` write path via `tbdWriteEnabled`
- No `buildScheduleLockedWriteRequest` / UPDATE
- No fake `expectedBeforeUpdatedAt`
- Returned row exact-field check; zero / mismatch → fail or ambiguous (no retry)

### 1.2 Dual arm / capability

| Arm | Env | Parse |
| --- | --- | --- |
| Client | `PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED` | `isSaveArmExactTrue` (`=== "true"`) |
| Server | `ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED` | same · **not** baked as raw string |

SSR (`resolveTbdCreateOneshotPageServerConfig`) passes **booleans only** (`data-server-arm-ok`, `data-tbd-write-enabled`, …).

`tbdWriteEnabled` SSR true only when dual arms + staging ref + `PUBLIC_ADMIN_WRITE_DRY_RUN==="false"` + write stack.

### 1.3 Fixed oneshot allowlist

- `site_slug=gosaki-piano` · `legacy_id=schedule-2026-11-001`
- `date_status=tbd` · `date=null` · `month=2026-11` · `source_route=/schedule/2026-11/`
- `title=【CMS Kit staging】TBD create oneshot PoC` · venue/description markers
- `published=false` · `show_on_home=false` · `home_order=null` · `sort_order=0`
- Approval: `cms-core-v2-schedule-tbd-create-non-dry-run-oneshot`

### 1.4 Preflight (designed; not executed this phase)

Baselines: total **79** · mio **0** · tbd **0** · target legacy_id **0**. Drift → STOP.

### 1.5 Preview fingerprint

Dry-run (add/create) must match fixed oneshot fields → fingerprint lock → Save requires fingerprint match + unchanged form.

### 1.6 Mutex / double-click / ambiguity

- Peer Schedule / Edge arms must be OFF
- Module terminal: `idle` → `in_flight` → `succeeded` | `failed` | `ambiguous`
- Ambiguous / success → no re-click; UI prompts exact SELECT

### 1.7 Confirmed compatibility

- Confirmed TBD Save banner still blocks normal Save when TBD selected
- G-22e INSERT path unchanged; mutex adds TBD client arm OFF
- Edge handler unchanged

---

## 2. UI

- Button: **Staging one-shot CREATE** (`#gosaki-add-tbd-create-oneshot-btn`)
- Hidden when SSR `saveEnabled` false (default arms OFF)
- Notices: staging限定 · unpublished 1行 · 既存変更なし · 自動cleanupなし · 曖昧時再クリック禁止
- No ritual approval text input (approval is internal contract)

---

## 3. Verification (this phase)

| Check | Result |
| --- | --- |
| Offline implementation verifier | **PASS** (boundary hardening behavioral suite) |
| Safety Suite | **ALL PASS** |
| `git diff --check` | clean |
| Browser arms-OFF PC1280 / SP375 | **PASS** — TBD Save disabled · Dry-run OK · oneshot wrap hidden · `tbdWriteEnabled:false` · writeRequests: [] |
| Actual INSERT / Save click | **not executed** |
| Env / arms | **unchanged / OFF** (`PUBLIC_ADMIN_WRITE_DRY_RUN=true`) |

---

## 4. Explicit non-goals

- Cleanup DELETE UI
- TBD UPDATE
- Edge TBD CREATE
- Mio seed
- Package / FTP
- Production

---

## 5. Next

Final-preflight **COMPLETE** · SQL Editor PASS · execution-preparation **COMPLETE** · write-stack gate correction **COMPLETE** · **process-scoped env packet COMPLETE** · **Auth packet COMPLETE (exactly 9 keys)**.

Doc: `cms-core-v2-schedule-tbd-create-oneshot-write-stack-gate-correction.md` · `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight.md` · `PREFLIGHT_PASS: true` · `EXECUTION_PACKET_READY: true` · `ACTUAL_WRITE_READY: false` · `ACTUAL_WRITE_EXECUTED: false`.

**Next Primary:** `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution-arm-gate` → execution via process-scoped `env … npm run dev` with **exactly 9 keys** (Auth 2 + write 7 · never edit shared `.env.local`) · Cursor does not arm/click/SQL.
