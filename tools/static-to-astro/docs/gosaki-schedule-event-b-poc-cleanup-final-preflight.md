# G-13c2 — Gosaki Event B PoC cleanup final preflight

**Phase:** `G-13c2-gosaki-schedule-event-b-poc-cleanup-final-preflight`  
**Status:** final preflight complete — **no Save / DB write / SQL execution in this phase**  
**Base commit:** `7d868f5`  
**Prior:** G-13c2d2-result local dry-run Preview PASS  
**Scope:** Event B only — Event A / March **out of scope**

## Summary

Final checks before the first **G-13c2** non-dry-run Save on Event B (`aa440e29…`). Documents beforeSnapshot (live-confirmed), cleanup targets, rollback policy (SQL templates only — **not executed**), Save env stack, pre-Save gates, afterVerification SELECT, failure stop conditions, and G-14c public reflection chain.

**No Save / DB write / rollback SQL execution / FTP / commit in this phase.**

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: 7d868f5
origin/main: 7d868f5
```

---

## 2. Staging project confirmation

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/admin/schedule/
UI section: G-13c2 Event B PoC cleanup panel
/admin (Sariswing production): not used
service_role: not used
schedule_months: read-only / derived (not touched)
```

Abort if project is not `static-to-astro-cms-staging` or production is open.

---

## 3. Target row (Event B)

| Item | Value |
|------|-------|
| **id** | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| **legacy_id** | `schedule-2026-07-010` |
| **date** | `2026-07-19` |
| **site_slug** | `gosaki-piano` |
| **month** | `2026-07` |
| **public route** | `/schedule/2026-07/` |

**Event A (`f687ebf3…`) — not in scope. Do not re-click G-13c1 Save. Do not re-upload March HTML.**

---

## 4. beforeSnapshot SQL (operator — read-only)

**Operator runs in Supabase SQL Editor (staging only). Cursor does not execute UPDATE.**

```sql
-- G-13c2 beforeSnapshot — SELECT only; staging project only
select
  id,
  legacy_id,
  site_slug,
  date,
  year,
  month,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  published,
  show_on_home,
  home_order,
  sort_order,
  source_file,
  source_route,
  created_at,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and legacy_id = 'schedule-2026-07-010'
  and site_slug = 'gosaki-piano';
```

**Row count must be exactly 1.**

Record **exact** `updated_at` from live query — used as `expectedBeforeUpdatedAt` at Save time.

### Reference beforeSnapshot (G-13c2 preflight + G-13c2d2-result + live anon read)

**Cursor read-only verification (final preflight phase):** staging anon SELECT returned **1 row** matching reference below.

**Reconfirm via live SELECT immediately before execution.** Abort if live row diverges without documented reason.

| Field | Reference value |
|-------|-----------------|
| `title` | `[CMS Kit staging] G-9g2 title PoC` |
| `venue` | `[CMS Kit staging] G-9g3b venue PoC` |
| `open_time` | `[CMS Kit staging] G-9g3c open PoC` |
| `start_time` | `[CMS Kit staging] G-9g3c start PoC` |
| `price` | `[CMS Kit staging] G-9g3d general edit price PoC` |
| `description` | `出演： [G-9g3b venue+description PoC]` |
| `updated_at` | `2026-06-18T01:04:51.312817+00:00` |

### Abort conditions (beforeSnapshot)

Abort execution if:

```txt
- row count ≠ 1
- id / legacy_id / site_slug / date mismatch
- title missing G-9g2 PoC marker (unless documented intentional change)
- site_slug ≠ gosaki-piano
- date ≠ 2026-07-19
- any concurrent edit detected between SELECT and Save (stale optimistic lock)
```

---

## 5. Cleanup expected values (after Save)

Source: G-13c2 preflight (3 sources) + `gosaki-schedule-event-b-poc-cleanup-config.ts`

| Field | Expected after cleanup |
|-------|------------------------|
| `title` | `<>` (string) |
| `venue` | **DB null** |
| `open_time` | **DB null** |
| `start_time` | **DB null** |
| `price` | **DB null** |
| `description` | `出演：` (string) |

**changedFields (expected):** `title`, `venue`, `open_time`, `start_time`, `price`, `description` (6 fields)

**Unchanged fields (must not appear in payload):** `id`, `legacy_id`, `site_slug`, `date`, `month`, `published`, `show_on_home`, `sort_order`, `schedule_months`, etc.

**Critical:** `venue` / `open_time` / `start_time` / `price` must be **SQL NULL**, not empty string `''`.

### afterVerification SQL (operator — post-Save, read-only)

```sql
-- G-13c2 afterVerification — SELECT only; run after Save
select
  id,
  site_slug,
  legacy_id,
  date,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-07-010';
```

**Post-Save checks:**

```txt
- row count = 1
- title = '<>'
- venue IS NULL
- open_time IS NULL
- start_time IS NULL
- price IS NULL
- description = '出演：'
- date = '2026-07-19' (unchanged)
- legacy_id / site_slug unchanged
- updated_at newer than beforeSnapshot baseline
- venue/open_time/start_time/price are NOT ''
```

---

## 6. Rollback policy

| Principle | Detail |
|-----------|--------|
| **When** | Save wrong outcome, partial failure, or operator abort after unintended write |
| **Who** | Operator manual SQL only — staging project |
| **What** | Restore **exact** beforeSnapshot field values (6 text fields) |
| **Cursor** | Does not execute rollback SQL |
| **Approval** | **Separate** operator decision — not bundled with Save approval |
| **Event A / March** | Not touched |

### Rollback SQL template (documented only — **DO NOT EXECUTE** in this phase)

**Execution requires separate explicit approval.** Cursor / CI must not run this SQL.

Filled from reference beforeSnapshot (replace with operator-captured live values if different):

```sql
-- G-13c2 rollback template — DOCUMENTATION ONLY — operator manual; staging only
-- DO NOT EXECUTE from Cursor / CI
-- Project: static-to-astro-cms-staging
-- Separate approval required if rollback is ever needed

begin;

update public.schedules
set
  title = '[CMS Kit staging] G-9g2 title PoC',
  venue = '[CMS Kit staging] G-9g3b venue PoC',
  open_time = '[CMS Kit staging] G-9g3c open PoC',
  start_time = '[CMS Kit staging] G-9g3c start PoC',
  price = '[CMS Kit staging] G-9g3d general edit price PoC',
  description = '出演： [G-9g3b venue+description PoC]'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and legacy_id = 'schedule-2026-07-010'
  and site_slug = 'gosaki-piano';

commit;

-- Post-check: SELECT same row; compare to beforeSnapshot
```

`updated_at` will advance via `schedules_set_updated_at` trigger on rollback UPDATE.

---

## 7. Approval / operation / env (Save execution)

### Operator approval phrase (required once per Save session)

```txt
承認します。このSchedule CMS非dry-run操作を1回だけ実行してください。
```

| Item | Value |
|------|-------|
| **approval_id** | `G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run` |
| **operation_id** | `gosaki-schedule-event-b-poc-cleanup` |
| **env arm** | `PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED=true` |
| **compile gate** | `PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED=true` |

**Do not reuse:** G-13c1, G-9k, G-9g3*, G-6-g1/g2, or other schedule approval IDs.

**Single-arm:** G-13c1 arm **must be off** when G-13c2 arm is on.

### Dev server command (execution phase only — **not started in this phase**)

Inline env only — **do not commit** to `.env` / `.env.local`.  
Use existing `.env.local` for `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` (do not print or change).

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED=true \
PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED=true \
npm run dev
```

### Required env summary

| Env | Execution value |
|-----|-----------------|
| `ENABLE_ADMIN_STAGING_SHELL` | `true` |
| `ENABLE_ADMIN_STAGING_AUTH` | `true` |
| `ENABLE_ADMIN_STAGING_DATA_READ` | `true` |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `schedule` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run` |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED` | `true` |
| `PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED` | `true` |
| `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK` | `true` (recommended) |
| `PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED` | **off** |
| All other schedule `*_NON_DRY_RUN_ARMED` | **off** (G-9k, G-9g*, G-6-g*, single-text-field registry) |

---

## 8. Pre-Save confirmation checklist (execution phase)

After starting execution env stack, run **G-13c2 Preview once** then verify:

```txt
dryRun: true
actualWrite: false
saveReadiness: ready_to_save
changedFields: title, venue, open_time, start_time, price, description
payload venue: null (not "")
payload open_time: null (not "")
payload start_time: null (not "")
payload price: null (not "")
payload title: <>
payload description: 出演：
approvalId: G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run
target id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
site_slug: gosaki-piano
date: 2026-07-19
Save button: enabled (Event B cleanup を保存（1回）)
expectedBeforeUpdatedAt matches live beforeSnapshot updated_at
```

**Do not click Save** if any item fails.

---

## 9. Operator Save procedure (execution phase — not this phase)

1. Receive explicit approval phrase (section 7).
2. Run beforeSnapshot SELECT; save exact `updated_at` + field values.
3. Start dev server with execution env stack (section 7).
4. Open `http://localhost:4321/__admin-staging-shell/musician-basic/admin/schedule/`.
5. Sign in as staging admin.
6. Scroll to **G-13c2 — Event B PoC 文言クリーンアップ** (below workspace).
7. Click **G-13c2 変更を確認（dry-run）** — verify section 8.
8. Confirm Save button enabled (**once**).
9. Click **Event B cleanup を保存（1回）** — **operator manual once only**.
10. Run afterVerification SELECT (section 5); compare to expected after values.
11. Disarm: stop dev; restore routine `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; all arms off.
12. **Do not** re-click G-13c2 Save without new approval + fresh beforeSnapshot.

**Public site:** separate G-13c2e reflection phase after DB cleanup (G-14c §12.3).

---

## 10. Failure stop conditions

**Stop immediately** — do not retry Save, do not cleanup, ask human:

```txt
target mismatch
legacy_id mismatch
site_slug mismatch
date mismatch
updated_at conflict / stale
unexpected changedFields
payload null が空文字になる
Save result ambiguous
network error
actualWrite false のまま
DB afterVerification mismatch
row count ≠ 1 (before or after)
approvalId mismatch
G-13c1 arm still on (single-arm violation)
Save button enabled without ready_to_save Preview
```

On stop: record incident; use rollback SQL only with **separate** rollback approval.

---

## 11. Public reflection chain (G-14c — after successful Save)

Mirror G-13e Event A pattern (`gosaki-public-reflection-operation-standardization.md` §12.3):

| Step | Phase | Action |
|------|-------|--------|
| 1 | G-13c2 execution | DB Save complete + afterVerification PASS |
| 2 | G-13c2e preflight | reflection scope doc; regen preflight |
| 3 | G-13c2e local regen | `build-gosaki-staging-admin-package.mjs` |
| 4 | G-13c2e upload preflight | minimal upload plan |
| 5 | G-13c2e upload execution | operator manual upload |
| 6 | G-13c2e HTTP verify | staging URL check |
| 7 | G-13c2e closure | chain closed doc |

**Minimal upload target:** `schedule/2026-07/index.html` only (if CSS hash unchanged — G-13e pattern).

**Staging URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/`

**Out of scope:** March `schedule/2026-03/index.html` re-upload; Event A regression.

**Upload approval (separate):**

```txt
承認します。この手動アップロードを1回だけ実行してください。
```

---

## 12. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiScheduleEventBPocCleanupFinalPreflightComplete` | **true** |
| `readyForG13c2EventBPocCleanupExecution` | **true** |
| `readyForAnyDbWrite` | **false** (until execution approval) |
| `cursorSaveExecuted` | **false** |
| `cursorSqlExecuted` | **false** |
| `rollbackSqlExecuted` | **false** |
| `eventATouched` | **false** |
| `marchReuploadTriggered` | **false** |

---

## 13. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13c2-gosaki-schedule-event-b-poc-cleanup-final-preflight.mjs
```

---

## 14. Next

`G-13c2-gosaki-schedule-event-b-poc-cleanup-execution` — operator beforeSnapshot → Preview (`ready_to_save`) → Save once → afterVerification (separate phase; explicit approval required).

---

## 15. References

- [gosaki-schedule-event-b-poc-cleanup-local-dry-run-result.md](./gosaki-schedule-event-b-poc-cleanup-local-dry-run-result.md) (G-13c2d2-result)
- [gosaki-schedule-event-b-poc-cleanup-slice-implementation.md](./gosaki-schedule-event-b-poc-cleanup-slice-implementation.md) (G-13c2d1)
- [gosaki-schedule-event-b-poc-cleanup-preflight.md](./gosaki-schedule-event-b-poc-cleanup-preflight.md) (G-13c2)
- [gosaki-public-reflection-operation-standardization.md](./gosaki-public-reflection-operation-standardization.md) (G-14c §12.3)
- [gosaki-schedule-event-a-poc-cleanup-final-preflight.md](./gosaki-schedule-event-a-poc-cleanup-final-preflight.md) (G-13d1 template)
