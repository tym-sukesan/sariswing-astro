# CMS Core v2 — Schedule TBD date Save non-dry-run staging final-preflight

- **Phase:** `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight`
- **Follow-up recorded:** `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution-preparation` (2026-08-04)
- **Date:** 2026-08-03 · prep update 2026-08-04
- **HEAD at final-preflight commit:** `dcc8de812b6b683e7417b5094be29cc8958c6aac` (= `origin/main` · clean at execution-preparation start)
- **Status:** **COMPLETE (docs / SELECT-only / runbook)** · SQL Editor full-table **PASS recorded** · **process-scoped 9-key env** · oneshot later **SUCCESS** (2026-08-08) · **ACTUAL_WRITE_EXECUTED: true** (human CREATE) · re-run **forbidden**
- **This preparation phase (historical):** record preflight · finalize human execution steps · no Cursor Save in preflight
- **Write-stack correction:** `cms-core-v2-schedule-tbd-create-oneshot-write-stack-gate-correction`
- **Process-scoped packet:** `cms-core-v2-schedule-tbd-create-oneshot-process-scoped-env-packet-correction` · **Auth packet:** `cms-core-v2-schedule-tbd-create-oneshot-process-scoped-auth-packet-correction` — **forbid** writing the 9 keys into shared root `.env.local`
- **Auth note:** write **7 keys alone** arm write config but leave Auth **mock** → real login **impossible** · execution needs **exactly 9 keys**
- **Preflight query-builder fix (2026-08-05):** `cms-core-v2-schedule-tbd-create-oneshot-preflight-query-builder-fix` — human oneshot click stopped at preflight (`NOT_INSERTED` · total 79 · target 0) · root cause intermediate `.eq()` await · **INSERT 未到達** · cleanup 不要 · later resolved on SUCCESS path
- **Auth-before-preflight fix (2026-08-05):** `cms-core-v2-schedule-tbd-create-oneshot-auth-before-preflight-fix` — second click `expected 79, got 74` (= published / public RLS) · auth before counts · later resolved on SUCCESS path
- **Site-scoped owner authz (2026-08-06):** `cms-core-v2-schedule-site-owner-authz-implementation-and-migration-template` — gate = `can_write_site` (not legacy `is_admin`) · mapping PASS
- **Site-writer RLS apply recorded (2026-08-06):** `cms-core-v2-schedules-site-writer-rls-apply-result-recording` — applied SUCCESS · policy count **4** · RLS fp `3f6c87dda8edf44159d939ec69fbcc2b`
- **Oneshot SUCCESS recorded (2026-08-08):** `cms-core-v2-schedule-tbd-create-oneshot-success-recording` — **INSERTED_EXACT** · counts **80/74/gosaki80/tbd1/target1** · Doc: `cms-core-v2-schedule-tbd-create-oneshot-success-result.md`
- **Post-success baseline recorded (2026-08-08):** `cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline-recording` — SELECT-only PASS · site_slug `1d780b234483e3c860a66cec93311718` · data `221256605d1501abc7cab3e044d54e2b` · Doc: `cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline.md`
- **Staging:** `kmjqppxjdnwwrtaeqjta`
- **Production STOP:** `vsbvndwuajjhnzpohghh`

Prior: implementation + boundary hardening (`cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation.md`)

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_DATE_SAVE_NON_DRY_RUN_STAGING_FINAL_PREFLIGHT_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_DATE_SAVE_NON_DRY_RUN_STAGING_EXECUTION_PREPARATION_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_WRITE_STACK_GATE_CORRECTION_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_PROCESS_SCOPED_ENV_PACKET_CORRECTION_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_PROCESS_SCOPED_AUTH_PACKET_CORRECTION_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_PREFLIGHT_QUERY_BUILDER_FIX_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_AUTH_BEFORE_PREFLIGHT_FIX_COMPLETE: true
CMS_CORE_V2_SCHEDULE_SITE_OWNER_AUTHZ_IMPLEMENTATION_COMPLETE: true
CMS_CORE_V2_SCHEDULES_SITE_WRITER_RLS_APPLY_RESULT_RECORDED: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_SUCCESS_RECORDED: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_POST_SUCCESS_BASELINE_RECORDED: true
SCHEDULE_SITE_MAPPING_SAFE: true
SITE_WRITER_RLS_APPLIED: true
RLS_MIGRATION_EXECUTED: true
RLS_POSTCHECK_PASS: true
OWNER_VISIBILITY_PASS: true
ANON_VISIBILITY_PASS: true
CAN_WRITE_SITE_PASS: true
CURRENT_STAGING_SCHEDULES_RLS_FINGERPRINT: 3f6c87dda8edf44159d939ec69fbcc2b
PRE_SITE_WRITER_RLS_FINGERPRINT_HISTORICAL: e7344ff0de1d5e2862965ffc0e4e72cf
POST_SUCCESS_SITE_SLUG_FP: 1d780b234483e3c860a66cec93311718
POST_SUCCESS_DATA_FP: 221256605d1501abc7cab3e044d54e2b
POST_SUCCESS_INDEX_FP: cbaada6b44ae2cd07f4a0516f9d0f9b3
POST_SUCCESS_TRIGGER_FP: 2e9899f09421456307b3c96402574106
PRE_ONESHOT_SITE_SLUG_FP_HISTORICAL: a4ff22feb81e19789732525937f4be7e
PRE_ONESHOT_DATA_FP_HISTORICAL: 1910b4faa5b17344d63968dc25f89cd6
ONESHOT_GUARD_EXPECTED_TOTAL_REMAINS: 79
POLICY_COUNT: 4
SCHEDULE_ROW_WRITE_EXECUTED: true
TARGET_ROW_EXISTS: true
TARGET_ROW_EXACT: true
OUTCOME: INSERTED_EXACT
CURRENT_TOTAL: 80
CURRENT_PUBLISHED: 74
CURRENT_GOSAKI: 80
CURRENT_TBD: 1
CURRENT_TARGET: 1
ONESHOT_TERMINAL: succeeded
ONESHOT_RERUN_FORBIDDEN: true
READY_FOR_MIGRATION_EXECUTION: false
IMPLEMENTATION_READY: true
PREFLIGHT_PASS: true
PREFLIGHT_ANON_SUBSET_PASS: true
PREFLIGHT_SQL_EDITOR_FULL_TABLE: pass
EXECUTION_PACKET_READY: true
ACTUAL_WRITE_READY: false
ACTUAL_WRITE_EXECUTED: true
READY_FOR_RETRY: false
READY_FOR_CLEANUP: false
ARMS_OFF: true
ENV_FILE_UNCHANGED: true
ENV_CHANGED: false
DB_WRITE_EXECUTED: true
SAVE_EXECUTED: true
CLEANUP_EXECUTED: false
CLEANUP_NEEDED: false
EDGE_CHANGED: false
PACKAGE_REGENERATED: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
NEXT_PRIMARY_RECOMMENDED: cleanup requires separate explicit approval only (READY_FOR_CLEANUP false)
```

**SQL Editor PASS (operator, staging only · historical pre-oneshot):** `observed_at=2026-08-03 15:51:19.118619+00` · `preflight_pass=true` · `stop_reasons=''` · counts/schema/CHECK/trigger/RLS/fingerprints all match · see §5.3 · total **79** at that time.

**Human oneshot click failure (2026-08-05):** runtime preflight unknown → diagnosed as `countTargetLegacyId` intermediate await · exact SELECT `NOT_INSERTED` · total=79 · published=74 · gosaki=79 · mio=0 · tbd=0 · target=0 · contract violations=0 · **INSERT 未到達** · cleanup 不要 · fixed legacy_id / approval / payload **unchanged**. See `cms-core-v2-schedule-tbd-create-oneshot-preflight-query-builder-fix.md`.

**Second single-click (2026-08-05):** runtime preflight **failed** · `total schedules drift (expected 79, got 74)` · 74 = published / `schedules_public_select` · cause = auth before preflight missing · exact SELECT `NOT_INSERTED` · baseline 79/74/0/0 · cleanup 不要. See `cms-core-v2-schedule-tbd-create-oneshot-auth-before-preflight-fix.md`.

**Oneshot SUCCESS (2026-08-08):** sites → `can_write_site` → preflight → INSERT · **INSERTED_EXACT** · `schedule-2026-11-001` · counts **80/74/gosaki80/tbd1/target1** · published false · terminal succeeded · re-run forbidden · cleanup not done · Doc: `cms-core-v2-schedule-tbd-create-oneshot-success-result.md`.

**Post-success baseline (2026-08-08):** SELECT-only PASS · site_slug fp `1d780b234483e3c860a66cec93311718` · data fp `221256605d1501abc7cab3e044d54e2b` · index/trigger unchanged · RLS `3f6c87dda8edf44159d939ec69fbcc2b` · Doc: `cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline.md`.

**ACTUAL_WRITE_READY false** (do not re-arm). **ACTUAL_WRITE_EXECUTED true** (human CREATE once). Arms OFF · production untouched · Cursor did not click Save in this recording phase.

---

## 1. Fixed oneshot (unchanged)

| Field | Value |
| --- | --- |
| site_slug | `gosaki-piano` |
| legacy_id | `schedule-2026-11-001` |
| title | `【CMS Kit staging】TBD create oneshot PoC` |
| date_status | `tbd` |
| date | `null` |
| month | `2026-11` |
| source_route | `/schedule/2026-11/` |
| published | `false` |
| approval | `cms-core-v2-schedule-tbd-create-non-dry-run-oneshot` |

---

## 2. Latest code — execution order (function names)

Browser (arms OFF → wrap hidden; when armed):

1. `wireTbdDryRunButtons` → click `#gosaki-add-tbd-create-oneshot-btn`
2. `runTbdCreateOneshotSave`
3. `readTbdCreateOneshotPageConfigFromDom` (SSR booleans)
4. `evaluateTbdCreateOneshotUiGate` → `getTbdCreateOneshotConfig`
5. `executeTbdCreateOneshotSave`

Inside `executeTbdCreateOneshotSave`:

1. Terminal gate (`oneshotTerminalState === "idle"`)
2. `getTbdCreateOneshotConfig` (+ `serverArmOkFromSsr`)
3. `assertTbdCreateOneshotApprovalId`
4. Fingerprint match (`previewFingerprint` vs `currentFingerprint` / fixed payload)
5. Staging / production URL gates · `buildTbdCreateOneshotFixedInsertPayload` · `assertTbdCreateOneshotPayloadOnly`
6. **Mandatory preflight** (`defaultPreflightClient` / DI):
   - `probeDateStatusColumn`
   - `countTotal` · `countMio` · `countTbd` · `countTargetLegacyId`
   - `evaluateTbdCreateOneshotPreflightCounts` (79 / 0 / 0 / 0)
7. `getStagingAuthSessionDetails` · `isSignedInStagingAuth`
8. **Exactly one** `insertTbdCreateOneshotScheduleWriteInternal` (module-private):
   - production reject · staging ref exact · client arm · `serverArmOkFromSsr` · `tbdWriteEnabled` · dry-run false · fixed payload
   - `.insert(payload).select("*").single()`
9. `assertReturnedTbdCreateOneshotRow` → terminal `succeeded` | `failed` | `ambiguous`

SSR bake (page load):

1. `resolveTbdCreateOneshotPageServerConfig` → `isTbdCreateServerArmExactTrue` + `getTbdCreateOneshotConfig`
2. Astro `#gosaki-schedule-tbd-create-oneshot-config` data-* booleans only
3. Wrap `#gosaki-add-tbd-create-oneshot-wrap` visible iff `saveEnabled === true`

---

## 3. Arm read / restart model

| Env | Where read | When | Parse |
| --- | --- | --- | --- |
| `PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED` | `isTbdCreateClientArmExactTrue` → `isSaveArmExactTrue` (`=== "true"`, no trim) | SSR config · client `import.meta.env` · INSERT boundary | exact string `"true"` |
| `ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED` | `isTbdCreateServerArmExactTrue` on **SSR only** | `resolveTbdCreateOneshotPageServerConfig` | exact `"true"` |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `getTbdCreateOneshotConfig` | SSR + client | write path needs exact `"false"` |

### Env files (baseline only · **do not edit for oneshot arming**)

- Root `.env.local` is **shared with Sariswing本体** — **forbidden** to write the oneshot **9 keys** into it.
- Baseline (routine) stays: Auth mock (`ENABLE_ADMIN_STAGING_AUTH` unset · `PUBLIC_ADMIN_AUTH_PROVIDER` unset) · write-stack OFF / empty provider·module·approval · dry-run `true` · oneshot arms unset.
- `.env.local` still supplies staging `PUBLIC_SUPABASE_URL` + anon key / shell flags (read-only during execution) — **no** `service_role` · **never** inject production URL/ref.
- Do **not** commit `.env` / `.env.local`.
- Server arm `ADMIN_*` and `ENABLE_ADMIN_STAGING_AUTH` are **non-PUBLIC** — inject via **process-scoped** `env … npm run dev` so SSR sees them; never bake raw strings into HTML; never persist in `.env.local`.

### Browser exposure

- Exposed as attributes only: `data-client-arm-ok` · `data-server-arm-ok` · `data-tbd-write-enabled` · `data-write-dry-run-false` · `data-save-enabled` · `data-approval-id`
- **Not** exposed: raw `ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED=…`
- Client arm name may appear in client bundle as env key (PUBLIC_); value must stay unset/false until the armed process starts

### Process-scoped arming / package

| Action | Required? |
| --- | --- |
| Start **one** armed process via `env … npm run dev` (**exactly 9 keys**) | **YES** for execution |
| Edit root `.env.local` for the 9 keys | **FORBIDDEN** |
| `export` the 9 keys into the parent shell | **FORBIDDEN** |
| Armed `build` / package / FTP | **FORBIDDEN** |
| After Ctrl+C · plain `npm run dev` | returns **file baseline** (Auth mock · write OFF · no file restore) |

### Temporary ON = process-scoped **exactly these 9** (Auth 2 + write 7 · not file edit)

Vite/Astro `loadEnv` — **process env overrides** `.env` / `.env.local`. Client: PUBLIC_* via `import.meta.env`; SSR: private `ADMIN_*` + `ENABLE_*`; client `ENABLE_*` via SSR gates → `mergeStagingShellEnv`.

**Auth 2 (required for owner login):**

| Env | Parse |
| --- | --- |
| `ENABLE_ADMIN_STAGING_AUTH` | exact `=== "true"` |
| `PUBLIC_ADMIN_AUTH_PROVIDER` | trim · must `"supabase"` (default `"mock"`) |

**Write 7 (required for oneshot Save UI):** write-stack 4 + dual oneshot arms + `PUBLIC_ADMIN_WRITE_DRY_RUN=false`.

**Write 7 alone:** write config can arm, but Auth stays **mock** → real login **impossible** → execution **cannot** proceed.

Also verify present in baseline files (not injected):

- `ENABLE_ADMIN_STAGING_SHELL=true`
- staging `PUBLIC_SUPABASE_URL` + anon (no production ref) — do **not** inject production URL/ref
- **no** `service_role`

### Auth / write matrix (execution readiness)

| Case | Setup | Login | Oneshot write |
| --- | --- | --- | --- |
| **A** | write **7 keys** only | **不可** (Auth mock) | config may arm · **実行不能** |
| **B** | Auth **2 keys** only | staging login **可** | write **不可** |
| **C** | **exactly 9 keys** · peers OFF · staging URL | owner login **可** | oneshot **のみ** |
| **D** | C + production URL/ref | **STOP** | **STOP** |
| **E** | C · unauthenticated / non-owner | — | **INSERT 0** (signed-in + RLS) |
| **F** | C · login only · no Save click | ok | **write 0** · `writeRequests=[]` |

Peer / other Save paths: dedicated arm / approval mismatch → **disabled** under exact 9-key packet.

### Arm OFF = stop the armed process (no `.env.local` restore)

1. **Ctrl+C** the armed `env … npm run dev` terminal — Auth **2** + write **7** all vanish with the process
2. Confirm port **4321** has no LISTEN
3. Optional: plain `cd ~/sariswing-astro && npm run dev` (baseline from files → Auth **mock** · write **OFF**)
4. Confirm wrap hidden · `data-save-enabled="false"`

Unset / `"false"` is OFF. Only raw `"true"` is ON (`isSaveArmExactTrue`).

---

## 4. Peer arms (must be OFF for oneshot)

Parse for mutex ON detection in `collectPeerArmOffFailures`: `isSaveArmExactTrue` **or** trim-`"true"` (Family A peers). Safe OFF = **unset** or any value other than exact/trim true. Prefer **unset**.

### 4.1 Code-enforced peers (`getTbdCreateOneshotConfig` → `collectPeerArmOffFailures`)

| Env | Expected OFF | unset OK | `"false"` OK |
| --- | --- | --- | --- |
| `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED` | OFF (registry) | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED` | OFF (registry) | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED` | OFF (registry) | yes | yes |
| `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED` | OFF (G-14b1a) | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED` | OFF | yes | yes |
| `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED` | OFF | yes | yes |
| `GOSAKI_SCHEDULE_SAVE_ARMED` | OFF (Edge server) | yes | yes |

### 4.2 Inventory-recommended OFF (operational Save UI · not all code-mutexed here)

Keep OFF for oneshot window (inventory SoT `gosaki-operational-save-ui-arm-inventory.mjs`):

- `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` / `GOSAKI_DISCOGRAPHY_SAVE_ARMED`
- `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` / `GOSAKI_YOUTUBE_URL_SAVE_ARMED`
- `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` / `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED`
- `PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED` / `GOSAKI_ABOUT_CONTENT_SAVE_ARMED`
- `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` / `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED`
- Other legacy Schedule/Discography `NON_DRY_RUN_ARMED` literals in inventory allowlist

Oneshot **own** client/server arms stay OFF in `.env.local` · armed only inside the process-scoped Step 3 command.

---

## 5. Live SELECT-only (this phase)

### 5.1 Cursor anon (2026-08-03) — staging only · no service_role

| Check | Result |
| --- | ---: |
| project ref | `kmjqppxjdnwwrtaeqjta` |
| production used | **false** |
| total (anon RLS) | **74** |
| published | **74** |
| gosaki (anon) | **74** |
| mio | **0** |
| TBD (`date_status=tbd`) | **0** |
| target `legacy_id` | **0** |
| title collision (oneshot title) | **0** |
| `date_status` SELECT | **OK** (200) |
| RLS error | **none** |

**Anon subset PASS.** Full-table **79** is invisible to anon (known: `schedules_public_select`).

### 5.2 Operator SQL Editor Block B (historical short form)

Superseded for hard-gate by the reinforced one-row preflight (schema · CHECK · 5 fingerprints). Short form retained for continuity:

```sql
-- TBD CREATE oneshot final-preflight · SELECT-only · staging kmjqppxjdnwwrtaeqjta ONLY
-- STOP if production project is open

select
  (select count(*) from public.schedules) as total,
  (select count(*) from public.schedules where published = true) as published,
  (select count(*) from public.schedules where site_slug = 'gosaki-piano') as gosaki,
  (select count(*) from public.schedules where site_slug = 'mio-kisaragi-jazz') as mio,
  (select count(*) from public.schedules where date_status = 'tbd') as tbd,
  (select count(*) from public.schedules
     where site_slug = 'gosaki-piano' and legacy_id = 'schedule-2026-11-001') as target_legacy,
  (select count(*) from public.schedules
     where site_slug = 'gosaki-piano'
       and title = '【CMS Kit staging】TBD create oneshot PoC') as title_collision,
  (select count(*) from public.schedules
     where date_status = 'tbd' and date is not null) as tbd_date_not_null_violations,
  (select count(*) from public.schedules
     where date_status = 'confirmed' and date is null) as confirmed_date_null_violations;
```

### 5.3 SQL Editor reinforced preflight — **PASS recorded** (execution-preparation)

- **Phase recording:** `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution-preparation`
- **Project (visual):** `kmjqppxjdnwwrtaeqjta` · production `vsbvndwuajjhnzpohghh` **not used**
- **observed_at:** `2026-08-03 15:51:19.118619+00`
- **Operator:** human SQL Editor · Cursor did **not** execute

| Field | Value |
| --- | --- |
| preflight_pass | **true** |
| stop_reasons | *(empty)* |
| schedules_total | **79** |
| schedules_published | **74** |
| gosaki_total | **79** |
| gosaki_published | **74** |
| mio_rows | **0** |
| tbd_rows | **0** |
| confirmed_rows | **79** |
| target_legacy_id_rows | **0** |
| exact_title_collision_rows | **0** |
| month_title_collision_rows | **0** |
| contract_violation_rows | **0** |
| date_status_null_or_unknown_rows | **0** |
| updated_at_nonnull_rows | **79** |
| updated_at_null_rows | **0** |
| schema / CHECK / trigger / RLS | **PASS** |
| site / data / index / trigger / RLS fingerprints | **all baseline match** |

Secrets / tokens / emails / actor IDs: **not recorded**.

**Gate effect (historical pre-SUCCESS):** `PREFLIGHT_PASS: true` · SQL Editor PASS recorded · process-scoped packet · `ACTUAL_WRITE_READY: false` until arm-gate. **Post-SUCCESS (2026-08-08):** `ACTUAL_WRITE_EXECUTED: true` · re-run forbidden · see `cms-core-v2-schedule-tbd-create-oneshot-success-result.md`.

Signed-in admin runtime preflight (JWT · `schedules_admin_all`) must still see **79** before INSERT during execution.

---

## 6. Dry-run payload + fingerprint (offline fixed builder)

Source: `buildTbdCreateOneshotFixedInsertPayload()` / `fingerprintTbdCreateOneshotPayload()`.

### INSERT allowlist payload

```json
{
  "legacy_id": "schedule-2026-11-001",
  "site_slug": "gosaki-piano",
  "date_status": "tbd",
  "date": null,
  "month": "2026-11",
  "year": 2026,
  "source_route": "/schedule/2026-11/",
  "source_file": "schedule-2026-11.html",
  "title": "【CMS Kit staging】TBD create oneshot PoC",
  "venue": "[CMS Kit staging] TBD create PoC venue",
  "open_time": null,
  "start_time": null,
  "price": null,
  "description": "[CMS Kit staging] TBD create oneshot — unpublished",
  "published": false,
  "show_on_home": false,
  "home_order": null,
  "sort_order": 0
}
```

### Fingerprint

Canonical JSON of allowlist keys **sorted**:

```txt
{"date":null,"date_status":"tbd","description":"[CMS Kit staging] TBD create oneshot — unpublished","home_order":null,"legacy_id":"schedule-2026-11-001","month":"2026-11","open_time":null,"price":null,"published":false,"show_on_home":false,"site_slug":"gosaki-piano","sort_order":0,"source_file":"schedule-2026-11.html","source_route":"/schedule/2026-11/","start_time":null,"title":"【CMS Kit staging】TBD create oneshot PoC","venue":"[CMS Kit staging] TBD create PoC venue","year":2026}
```

**Mismatch proof:** changing `title` by appending ` X` changes fingerprint → UI gate blocks Save (`preview fingerprint mismatch`).

UI path: Dry-run on add form with fixed TBD month-known fields → `lockTbdCreateOneshotPreviewFromDryRun` stores fingerprint → any form drift clears match.

---

## 7. Human execution steps (preparation · **Cursor does not run**)

Phase: `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution-preparation`
**Do not start until** operator says the explicit approval form for the **execution** phase.

Fixed target:

| Field | Value |
| --- | --- |
| site_slug | `gosaki-piano` |
| legacy_id | `schedule-2026-11-001` |
| title | `【CMS Kit staging】TBD create oneshot PoC` |
| date_status | `tbd` |
| date | `null` |
| month | `2026-11` |
| source_route | `/schedule/2026-11/` |
| published | `false` |
| approval | `cms-core-v2-schedule-tbd-create-non-dry-run-oneshot` |

### Step 1 — confirm `.env.local` baseline (**read-only · do not edit**)

- Root `.env.local` is shared with Sariswing本体 — **never** write the oneshot **9 keys** into it.
- Confirm baseline remains:
  - `ENABLE_ADMIN_STAGING_AUTH` **unset** · `PUBLIC_ADMIN_AUTH_PROVIDER` **unset** (Auth mock)
  - oneshot client/server arms **unset**
  - `PUBLIC_ADMIN_WRITE_DRY_RUN=true`
  - `ENABLE_ADMIN_STAGING_WRITE=false` · provider/module/approval **empty**
  - `ENABLE_ADMIN_STAGING_SHELL=true`
  - effective `PUBLIC_SUPABASE_URL` contains `kmjqppxjdnwwrtaeqjta` only · **no** `vsbvndwuajjhnzpohghh`
  - staging anon present · **no** `service_role`
- If staging URL / shell flag wrong → **STOP**.

### Step 2 — peer arms all OFF

Confirm every env in §4 is unset or not armed in `.env.local` (`isSaveArmExactTrue` / trim-true both count as ON).
Any peer ON → **STOP**. Do not start an armed process.

### Step 3 — start **one** process-scoped armed dev server (**exactly these 9**)

Stop any existing plain `npm run dev` on 4321 first (PID-only kill if needed). Then:

```zsh
cd ~/sariswing-astro

env \
  ENABLE_ADMIN_STAGING_AUTH=true \
  PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
  ENABLE_ADMIN_STAGING_WRITE=true \
  PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
  PUBLIC_ADMIN_WRITE_MODULE=schedule \
  PUBLIC_ADMIN_WRITE_APPROVAL_ID=cms-core-v2-schedule-tbd-create-non-dry-run-oneshot \
  PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED=true \
  ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED=true \
  PUBLIC_ADMIN_WRITE_DRY_RUN=false \
  npm run dev
```

Rules:

- **Do not** `export` these keys in the parent shell
- **Do not** edit `.env.local`
- **exactly 9** values apply **only** to this npm/Astro process (Vite process env overrides file baseline)
- Auth **2** + write **7** — write 7 alone leaves Auth mock → login **不可**
- **Do not** inject production URL/ref (use baseline staging URL / anon)
- **Do not** use `service_role`
- **Do not** run `build` / package / FTP with these envs
- Other Save paths stay disarmed (dedicated arm/approval mismatch)
- Login alone → **write 0** · `writeRequests=[]` until Save click
- Unauthenticated / non-owner → **INSERT 0**

### Step 4 — confirm armed process up

- Staging shell reachable · no production ref in UI/config
- Auth mode `supabase-staging` (not mock) · login form enabled
- Env baked at process start — this single process is the only armed instance

### Step 5 — staging admin · owner login

- **Requires** process-scoped Auth 2 keys above (`ENABLE_ADMIN_STAGING_AUTH=true` · `PUBLIC_ADMIN_AUTH_PROVIDER=supabase`) plus baseline shell + staging URL/anon
- URL: `/__admin-staging-shell/musician-basic/admin/schedule/`
- Sign in as **gosaki-piano site owner** (`site_members.role='owner'`) — owner ≠ legacy `admin_users` / `is_admin()`
- Runtime gate: `sites` resolve + `rpc('can_write_site', { p_site_id })` must be true
- Site-writer RLS **applied** on staging (fp `3f6c87dda8edf44159d939ec69fbcc2b`) — owner visibility **79** / anon **74** confirmed via live probe
- Confirm host / `PUBLIC_SUPABASE_URL` is staging only
- Login alone does **not** INSERT — Save click still required
- **Do not** re-CREATE (oneshot terminal succeeded · `ONESHOT_RERUN_FORBIDDEN: true` · `READY_FOR_RETRY: false`)
### Step 6 — Dry-run + fingerprint

- Add form: TBD · month-known · month `2026-11` · fixed title / venue / description · published unchecked
- Run TBD Dry-run · payload must match §6
- Fingerprint must lock · any edit after Dry-run → **STOP** · re-Dry-run

### Step 7 — fixed approval + UI gates

On page, confirm:

- `#gosaki-schedule-tbd-create-oneshot-config`:
  - `data-client-arm-ok="true"` · `data-server-arm-ok="true"`
  - `data-tbd-write-enabled="true"` · `data-save-enabled="true"`
  - `data-approval-id=cms-core-v2-schedule-tbd-create-non-dry-run-oneshot`
  - raw `ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED` **absent** from HTML
- Exactly **one** `#gosaki-add-tbd-create-oneshot-btn` · wrap visible
- Confirmed / routine Save paths stay disabled as designed (no unexpected armed Save buttons)
- Operator approval text ready:

```txt
承認します。この操作を1回だけ実行してください。
```

If button missing / multiple / `data-save-enabled` false / peer Save visible armed → **STOP** · Ctrl+C armed process.

### Step 8 — click **Staging one-shot CREATE** once

- Single click only · no double-click · no refresh-retry

### Step 9 — branch on outcome

| Outcome | Action |
| --- | --- |
| Success | Record UI `insertedId` (runtime only · do not invent) · **no 2nd click** → Step 10 → 12 |
| Fail (`actualWrite` false) | **no retry** → Step 10 → investigate · new phase if needed |
| Ambiguous / timeout / unknown | **no re-click** · **no re-arm restart** → Step 10 → exact SELECT (§8) · ask human |

### Step 10 — emergency / normal stop armed process (**no `.env.local` restore**)

1. **Ctrl+C** the armed `env … npm run dev` terminal (highest priority before cleanup / retry) — Auth **2** + write **7** all vanish
2. Confirm `lsof -nP -iTCP:4321 -sTCP:LISTEN` is empty
3. `.env.local` was never changed — no file restore

### Step 11 — optional plain baseline restart

```zsh
cd ~/sariswing-astro
npm run dev
```

- Confirm oneshot wrap **hidden** · `data-save-enabled="false"` · Auth **mock** · routine dry-run OK
- File baseline supplies Auth mock / dry-run true / write-stack OFF

### Step 12 — SQL Editor post-check

- Staging project only · paste §8 · substitute UI `inserted_id`
- Expect `postcheck_pass=true` (total 80 · published 74 · TBD 1 · target 1 · …)

### Step 13 — cleanup vs keep

- Cleanup (§9) **only after** armed process ended (Step 10) + separate destructive approval
- Or keep unpublished row for later QA · document choice
- Broad DELETE forbidden

**Cursor never:** edits `.env.local` · starts armed process · clicks Save · runs SQL.

---

## 8. Post-check SQL (SELECT-only · after successful INSERT)

Replace `:inserted_id` with UI-returned UUID at execution time. **Do not store UUID in this doc.**

```sql
-- TBD CREATE oneshot post-check · SELECT-only · staging only
-- :inserted_id = UUID returned by Save UI (runtime only)

with
  counts as (
    select
      (select count(*) from public.schedules) as total,
      (select count(*) from public.schedules where published = true) as published,
      (select count(*) from public.schedules where site_slug = 'gosaki-piano') as gosaki,
      (select count(*) from public.schedules where site_slug = 'mio-kisaragi-jazz') as mio,
      (select count(*) from public.schedules where date_status = 'tbd') as tbd,
      (select count(*) from public.schedules
         where site_slug = 'gosaki-piano' and legacy_id = 'schedule-2026-11-001') as target_legacy,
      (select count(*) from public.schedules
         where date_status = 'tbd'
           and id is distinct from ':inserted_id'::uuid) as other_tbd,
      (select count(*) from public.schedules
         where (date_status = 'tbd' and date is not null)
            or (date_status = 'confirmed' and date is null)) as contract_violations
  ),
  target as (
    select
      id,
      site_slug,
      legacy_id,
      title,
      published,
      date_status,
      date,
      month,
      source_route
    from public.schedules
    where id = ':inserted_id'::uuid
  )
select
  c.total,
  c.published,
  c.gosaki,
  c.mio,
  c.tbd,
  c.target_legacy,
  c.other_tbd,
  c.contract_violations,
  t.id as target_id,
  t.published as target_published,
  t.date_status as target_date_status,
  t.date as target_date,
  t.month as target_month,
  t.source_route as target_route,
  t.title as target_title,
  (t.id is not null and t.id = ':inserted_id'::uuid) as inserted_id_matches_row,
  (
    c.total = 80
    and c.published = 74
    and c.gosaki = 80
    and c.mio = 0
    and c.tbd = 1
    and c.target_legacy = 1
    and c.other_tbd = 0
    and c.contract_violations = 0
    and t.published = false
    and t.date_status = 'tbd'
    and t.date is null
    and t.month = '2026-11'
    and t.source_route = '/schedule/2026-11/'
    and t.title = '【CMS Kit staging】TBD create oneshot PoC'
    and t.site_slug = 'gosaki-piano'
    and t.legacy_id = 'schedule-2026-11-001'
  ) as postcheck_pass
from counts c
left join target t on true;
```

**Success:** `postcheck_pass = true` · `inserted_id_matches_row = true`.

---

## 9. Exact cleanup SQL (**do not execute this phase**)

**Preconditions:**

1. Armed process **ended** (Steps 10–11 · Ctrl+C · port 4321 empty) **before** cleanup
2. `:inserted_id` known from successful Save / post-check (else **STOP**)
3. Explicit operator approval for DELETE (same bar as destructive ops)
4. Staging project only

```sql
-- TBD CREATE oneshot exact cleanup · staging ONLY · execute once when approved
-- Replace :inserted_id with the runtime UUID. Empty / wrong UUID → STOP.

begin;

set local lock_timeout = '3s';
set local statement_timeout = '10s';

do $$
declare
  v_id uuid := nullif(trim(':inserted_id'), '')::uuid;
  v_cnt int;
begin
  if v_id is null then
    raise exception 'STOP: inserted_id required';
  end if;

  select count(*) into v_cnt
  from public.schedules
  where id = v_id
    and site_slug = 'gosaki-piano'
    and legacy_id = 'schedule-2026-11-001'
    and title = '【CMS Kit staging】TBD create oneshot PoC'
    and published = false
    and date_status = 'tbd'
    and date is null
    and month = '2026-11'
    and source_route = '/schedule/2026-11/';

  if v_cnt <> 1 then
    raise exception 'STOP: exact cleanup target count=% (expected 1)', v_cnt;
  end if;
end $$;

with deleted as (
  delete from public.schedules
  where id = nullif(trim(':inserted_id'), '')::uuid
    and site_slug = 'gosaki-piano'
    and legacy_id = 'schedule-2026-11-001'
    and title = '【CMS Kit staging】TBD create oneshot PoC'
    and published = false
    and date_status = 'tbd'
    and date is null
    and month = '2026-11'
    and source_route = '/schedule/2026-11/'
  returning id
)
select count(*) as deleted_count from deleted;
-- Expect deleted_count = 1; if not, ROLLBACK.

-- Other-row non-change assert (expect 79 / 74 / 0 / 0)
select
  (select count(*) from public.schedules) as total,
  (select count(*) from public.schedules where published = true) as published,
  (select count(*) from public.schedules where date_status = 'tbd') as tbd,
  (select count(*) from public.schedules
     where site_slug = 'gosaki-piano' and legacy_id = 'schedule-2026-11-001') as target_legacy,
  (select count(*) from public.schedules where site_slug = 'mio-kisaragi-jazz') as mio;

-- If asserts match, COMMIT; else ROLLBACK.
commit;
```

**Cleanup success SELECT:** total **79** · published **74** · TBD **0** · target **0** · Mio **0**.

**Forbidden:** broad `DELETE` · delete without id · cleanup while arms ON · production.

---

## 10. Outcome branching (execution phase)

| Outcome | Retry? | Cleanup? | Arms |
| --- | --- | --- | --- |
| Success (`actualWrite` true · row matches) | **never** | optional later · exact §9 after arms OFF | OFF immediately |
| Guard/preflight fail (`actualWrite` false) | new phase only | no | OFF |
| Ambiguous / timeout / return mismatch | **never** | only after exact SELECT proves orphan row | OFF first |
| UNIQUE on `legacy_id` | **never** | SELECT then decide | OFF |

---

## 11. Verification (this phase)

| Check | Result |
| --- | --- |
| implementation verifier | run in phase close |
| planning verifier | run in phase close |
| save-arm parse | run in phase close |
| Safety Suite | ALL PASS required |
| `git diff --check` | clean |
| Browser arms-OFF PC1280 / SP375 | `writeRequests=[]` (historical pre-SUCCESS) |
| env / arms | unchanged / OFF (post-SUCCESS) |
| DB write | **human CREATE once** · `ACTUAL_WRITE_EXECUTED: true` · cleanup **0** |

---

## 12. Judgment summary

| Gate | Value |
| --- | --- |
| IMPLEMENTATION_READY | **true** |
| PREFLIGHT_PASS | **true** (§5.3 SQL Editor PASS) |
| PREFLIGHT_ANON_SUBSET_PASS | **true** |
| EXECUTION_PACKET_READY | **true** (process-scoped **exactly 9 keys** · Auth + oneshot-only proven) |
| ACTUAL_WRITE_READY | **false** (do not re-arm) |
| ACTUAL_WRITE_EXECUTED | **true** (2026-08-08 oneshot SUCCESS · INSERTED_EXACT) |
| ARMS_OFF / CLEANUP_EXECUTED / READY_FOR_RETRY | **true / false / false** |
| CURRENT_TOTAL / CURRENT_TBD / CURRENT_TARGET | **80 / 1 / 1** |
| PRODUCTION_UNCHANGED | **true** |

**Next Primary:** cleanup requires **separate explicit approval** only (`READY_FOR_CLEANUP: false`) · oneshot re-run **forbidden** · after cleanup re-SELECT fingerprints.

---

## 13. Explicit non-goals (final-preflight + execution-preparation)

- Cursor env / Secret change · arm ON · write-enabled Save
- INSERT / UPDATE / DELETE · Save click · cleanup execution
- Edge · schema · Mio seed · package / FTP · production · commit/push (unless operator separately requests docs commit)
