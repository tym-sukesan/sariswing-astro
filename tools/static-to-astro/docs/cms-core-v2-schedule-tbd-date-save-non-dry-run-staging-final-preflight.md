# CMS Core v2 — Schedule TBD date Save non-dry-run staging final-preflight

- **Phase:** `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight`
- **Date:** 2026-08-03
- **HEAD at phase start:** `35d8d431ebb60b8c4012c8e06ab2f59963554b94` (= `origin/main` · clean)
- **Status:** **COMPLETE (docs / SELECT-only / runbook)** — **no** arm ON · **no** Save · **no** DB write · **no** cleanup · **no** env change · **no** commit/push
- **Staging:** `kmjqppxjdnwwrtaeqjta`
- **Production STOP:** `vsbvndwuajjhnzpohghh`

Prior: implementation + boundary hardening (`cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation.md`)

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_DATE_SAVE_NON_DRY_RUN_STAGING_FINAL_PREFLIGHT_COMPLETE: true
IMPLEMENTATION_READY: true
PREFLIGHT_PASS: false
PREFLIGHT_ANON_SUBSET_PASS: true
PREFLIGHT_SQL_EDITOR_FULL_TABLE: pending_operator
EXECUTION_PACKET_READY: true
ACTUAL_WRITE_READY: false
ARMS_OFF: true
ENV_CHANGED: false
DB_WRITE_EXECUTED: false
SAVE_EXECUTED: false
CLEANUP_EXECUTED: false
EDGE_CHANGED: false
PACKAGE_REGENERATED: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution
```

**Why PREFLIGHT_PASS false / ACTUAL_WRITE_READY false:** Cursor anon SELECT sees RLS `schedules_public_select` → **published 74 only**. Full-table baselines (**total 79 · gosaki 79**) require **operator SQL Editor** (Block B below). Until that paste matches, do not arm / Save.

**Why EXECUTION_PACKET_READY true:** code order · arm procedure · peer list · payload · post-check · cleanup · A–J runbook are fixed below.

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

### Env files (do not edit this phase)

- Primary for local Astro staging shell: **repo root** `.env.local` (overrides `.env`)
- Optional mirror: `tools/static-to-astro/.env.local` (tooling; shell uses repo root)
- Do **not** commit `.env` / `.env.local`
- Server arm `ADMIN_*` is **non-PUBLIC** — put in root `.env.local` so SSR sees it; never bake raw string into HTML

### Browser exposure

- Exposed as attributes only: `data-client-arm-ok` · `data-server-arm-ok` · `data-tbd-write-enabled` · `data-write-dry-run-false` · `data-save-enabled` · `data-approval-id`
- **Not** exposed: raw `ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED=…`
- Client arm name may appear in client bundle as env key (PUBLIC_); value must stay unset/false until execution

### Restart / package

| Action | Required? |
| --- | --- |
| Astro **dev server restart** after any arm / dry-run / approval-id change | **YES** (`import.meta.env` baked at process start) |
| `build` / package / FTP | **NO** for local shell oneshot |
| After arm **OFF** / delete keys | **YES** restart again |

### Write stack also required when arming (execution phase only)

Exact values (same as mutex-armed Save slices):

- `ENABLE_ADMIN_STAGING_SHELL=true`
- `ENABLE_ADMIN_STAGING_WRITE=true`
- `PUBLIC_ADMIN_WRITE_PROVIDER=supabase`
- `PUBLIC_ADMIN_WRITE_MODULE=schedule`
- `PUBLIC_ADMIN_WRITE_APPROVAL_ID=cms-core-v2-schedule-tbd-create-non-dry-run-oneshot`
- `PUBLIC_SUPABASE_URL` → staging host containing `kmjqppxjdnwwrtaeqjta` only

### Arm OFF restore (exact)

1. Remove or set **not** `"true"`:
   - `PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED`
   - `ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED`
2. `PUBLIC_ADMIN_WRITE_DRY_RUN=true` (routine default)
3. Restore prior `PUBLIC_ADMIN_WRITE_APPROVAL_ID` / provider / module if changed
4. **Restart** Astro dev
5. Confirm wrap hidden · `data-save-enabled="false"`

Unset is OFF. `"false"` is OFF. Only raw `"true"` is ON (`isSaveArmExactTrue`).

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

Oneshot **own** client/server arms stay OFF until runbook D.

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

### 5.2 Operator SQL Editor Block B (required before ACTUAL_WRITE_READY)

Run **only** on staging SQL Editor. Cursor does **not** execute this block in final-preflight.

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

**Expected one row:**

| total | published | gosaki | mio | tbd | target_legacy | title_collision | violations |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **79** | **74** | **79** | **0** | **0** | **0** | **0** | **0** |

Any mismatch → **STOP** · keep `ACTUAL_WRITE_READY=false`.

Signed-in admin runtime preflight uses the same browser client JWT (`schedules_admin_all`) and must also see **79** before INSERT.

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

## 7. Execution runbook A–J (operator · **not executed this phase**)

### A. git / process / staging

- `git rev-parse HEAD` matches intended commit · tree clean or knowingly reviewed
- Confirm Supabase dashboard project = staging `kmjqppxjdnwwrtaeqjta` only
- Production `vsbvndwuajjhnzpohghh` **closed**
- No FTP / package / Edge deploy in flight

### B. SQL Editor SELECT-only preflight

- Paste §5.2 SQL · expect 79/74/79/0/0/0/0/0
- STOP on drift

### C. All peer arms OFF

- Confirm §4 lists unset / not `"true"`
- Confirm oneshot client+server arms still OFF
- `PUBLIC_ADMIN_WRITE_DRY_RUN` not `"false"` yet (still routine true)

### D. Arm ON (execution window only)

In root `.env.local` (example — do not apply in final-preflight):

```txt
PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED=true
ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED=true
PUBLIC_ADMIN_WRITE_DRY_RUN=false
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=cms-core-v2-schedule-tbd-create-non-dry-run-oneshot
```

Keep peer arms unset. Explicit approval text before Save:

```txt
承認します。この操作を1回だけ実行してください。
```

### E. Restart + owner login

- Restart Astro `npm run dev` (host/port as used for shell)
- Open `/__admin-staging-shell/musician-basic/admin/schedule/`
- Sign in as staging owner (`is_admin`)
- Confirm `#gosaki-schedule-tbd-create-oneshot-config`:
  - `data-server-arm-ok="true"` · `data-client-arm-ok="true"` · `data-tbd-write-enabled="true"` · `data-save-enabled="true"`
  - raw server arm string **absent** from HTML
- Confirm PUBLIC URL host is staging only

### F. Dry-run

- Add form: date_status TBD · month-known · month `2026-11` · fixed title/venue/description · published unchecked
- Run TBD Dry-run · confirm payload matches §6
- Oneshot wrap visible · button enables after fingerprint lock
- Do **not** change fields after preview

### G. One-shot CREATE once

- Click **Staging one-shot CREATE** **once**
- Do not double-click · do not refresh-and-retry

### H. Success / fail / ambiguous

| Terminal | Action |
| --- | --- |
| `succeeded` | Record `insertedId` from UI · **no second click** · go to I then J |
| `failed` (guard / preflight / auth · `actualWrite` false) | arms OFF (J) · investigate · **no retry** without new phase |
| `ambiguous` / timeout / network | **no re-click** · arms OFF (J) · exact SELECT §8 · ask human |

### I. SQL Editor post-check

- Paste §8 SQL · fill `inserted_id` from UI (do **not** invent UUID)

### J. Arms OFF + restart

- Immediately apply §3 Arm OFF restore
- Restart
- Confirm wrap hidden · arms-OFF browser smoke
- Cleanup (§9) only after arms OFF + separate explicit approval

**Arm anomaly → OFF first (before cleanup / retry).**

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

1. Arms OFF + restart (§3 / runbook J) **before** cleanup
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
| Browser arms-OFF PC1280 / SP375 | `writeRequests=[]` |
| env / arms | unchanged / OFF |
| DB write | **0** |

---

## 12. Judgment summary

| Gate | Value |
| --- | --- |
| IMPLEMENTATION_READY | **true** |
| PREFLIGHT_PASS | **false** (SQL Editor full-table pending) |
| PREFLIGHT_ANON_SUBSET_PASS | **true** |
| EXECUTION_PACKET_READY | **true** |
| ACTUAL_WRITE_READY | **false** |

**Next:** operator completes Block B SQL → if PASS, separate phase `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution` with explicit approval (arm ON + Save once).

---

## 13. Explicit non-goals (this phase)

- env / Secret change · arm ON · write-enabled dev start
- INSERT / UPDATE / DELETE · Save click · cleanup
- Edge · schema · Mio seed · package / FTP · production · commit/push
