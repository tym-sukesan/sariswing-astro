# G-13d1 — Gosaki Event A PoC cleanup final preflight

**Phase:** `G-13d1-final-preflight-gosaki-schedule-event-a-poc-cleanup`  
**Status:** final preflight complete — **no Save / DB write / SQL execution in this phase**  
**Base commit:** `6a026a0`  
**Prior:** G-13d1 implementation, G-13d2 admin reflection local dev verify  
**Scope:** Event A only — Event B **out of scope**

## Summary

Final checks before the first **G-13c1** non-dry-run Save on Event A (`f687ebf3…`). Documents beforeSnapshot reference, cleanup targets, rollback policy (SQL templates only — **not executed**), Save env stack, and operator procedure.

**No Save / DB write / rollback SQL execution / FTP / commit in this phase.**

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: 6a026a0
origin/main: 6a026a0
```

---

## 2. Staging project confirmation

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/admin/schedule/
UI section: G-13c1 Event A PoC cleanup panel
/admin (Sariswing production): not used
service_role: not used
schedule_months: read-only / derived (not touched)
```

Abort if project is not `static-to-astro-cms-staging` or production is open.

---

## 3. Target row (Event A)

| Item | Value |
|------|-------|
| **id** | `f687ebf3-407c-49d0-9ab8-58040c499b8e` |
| **legacy_id** | `schedule-2026-03-007` |
| **date** | `2026-03-15` |
| **site_slug** | `gosaki-piano` |
| **month** | `2026-03` |

**Event B (`aa440e29…`) — not in scope.**

---

## 4. beforeSnapshot SQL (operator — read-only)

**Operator runs in Supabase SQL Editor (staging only). Cursor does not execute.**

```sql
-- G-13d1 beforeSnapshot — SELECT only; staging project only
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
where id = 'f687ebf3-407c-49d0-9ab8-58040c499b8e'
  and legacy_id = 'schedule-2026-03-007'
  and site_slug = 'gosaki-piano';
```

**Row count must be exactly 1.**

Record **exact** `updated_at` from live query — used as `expectedBeforeUpdatedAt` at Save time.

### Reference beforeSnapshot (historical — G-9k6g closure + G-9k4b)

**Reconfirm via live SELECT before execution.** Abort if live row diverges without documented reason.

| Field | Reference value (post-G-9k6f) |
|-------|-------------------------------|
| `title` | `<Duo> [G-9k6 title UI保存テスト]` |
| `venue` | `川崎 ぴあにしも [G-9k6 venue UI保存テスト]` |
| `open_time` | `18:00` |
| `start_time` | `19:00` |
| `price` | `3,000円（G-9k6 price UI保存テスト）` |
| `description` | See below |
| `published` | `true` |
| `show_on_home` | `false` |
| `sort_order` | `70` |
| `updated_at` (historical) | `2026-06-22T15:01:47.671778+00:00` — **replace with live value** |

**description (reference):**

```txt
出演：長谷川薫vo 後藤沙紀pf
会場website: http://pubhpp.com/
（管理画面保存テスト / G-9k4 UI保存テスト）
```

### Abort conditions (beforeSnapshot)

Abort execution if:

```txt
- row count ≠ 1
- id / legacy_id / site_slug mismatch
- title missing G-9k6 marker (unless documented intentional change)
- site_slug ≠ gosaki-piano
- published ≠ true
- any concurrent edit detected between SELECT and Save (stale optimistic lock)
```

---

## 5. Cleanup expected values (after Save)

Source: `gosaki-schedule-event-a-poc-cleanup-config.ts` + Wix seed `schedule-2026-03-007`

| Field | Expected after cleanup |
|-------|------------------------|
| `title` | `<Duo>` |
| `venue` | `川崎 ぴあにしも` |
| `open_time` | `15:00` |
| `start_time` | `15:30` |
| `price` | `3,000円` |
| `description` | See below |

**description (exact):**

```txt
出演：長谷川薫vo 後藤沙紀pf
会場website: http://pubhpp.com/
```

**changedFields (expected):** `title`, `venue`, `open_time`, `start_time`, `price`, `description` (6 fields)

**Unchanged fields (must not appear in payload):** `id`, `legacy_id`, `site_slug`, `date`, `published`, `show_on_home`, `sort_order`, `schedule_months`, etc.

### afterVerification SQL (operator — post-Save, read-only)

```sql
-- G-13d1 afterVerification — SELECT only; run after Save
select
  id,
  legacy_id,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  updated_at
from public.schedules
where id = 'f687ebf3-407c-49d0-9ab8-58040c499b8e';
```

Expect section 5 values; `updated_at` **newer** than beforeSnapshot baseline.

---

## 6. Rollback policy

| Principle | Detail |
|-----------|--------|
| **When** | Save wrong outcome, partial failure, or operator abort after unintended write |
| **Who** | Operator manual SQL only — staging project |
| **What** | Restore **exact** beforeSnapshot field values (6 text fields) |
| **Cursor** | Does not execute rollback SQL |
| **Approval** | Separate operator decision — not bundled with Save approval |
| **Event B** | Not touched |

### Rollback SQL template (documented only — not executed)

Replace placeholders with **operator-captured** beforeSnapshot values.

```sql
-- G-13d1 rollback template — DOCUMENTATION ONLY — operator manual; staging only
-- DO NOT EXECUTE from Cursor / CI
-- Project: static-to-astro-cms-staging

begin;

update public.schedules
set
  title = '<BEFORE_TITLE>',
  venue = '<BEFORE_VENUE>',
  open_time = '<BEFORE_OPEN_TIME>',
  start_time = '<BEFORE_START_TIME>',
  price = '<BEFORE_PRICE>',
  description = '<BEFORE_DESCRIPTION>'
where id = 'f687ebf3-407c-49d0-9ab8-58040c499b8e'
  and legacy_id = 'schedule-2026-03-007'
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
| **approval_id** | `G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run` |
| **operation_id** | `gosaki-schedule-event-a-poc-cleanup` |
| **env arm** | `PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED=true` |
| **compile gate** | `PUBLIC_ADMIN_G13C1_EVENT_A_POC_CLEANUP_SAVE_ENABLED=true` |

**Do not reuse:** `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run`, G-9k6 slice IDs, G-9g3*, G-6-g1/g2.

### Dev server command (execution phase only)

Inline env only — **do not commit** to `.env` / `.env.local`.

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED=true \
PUBLIC_ADMIN_G13C1_EVENT_A_POC_CLEANUP_SAVE_ENABLED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

### Required env summary

| Env | Execution value |
|-----|-----------------|
| `ENABLE_ADMIN_STAGING_SHELL` | `true` |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `schedule` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run` |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED` | `true` |
| `PUBLIC_ADMIN_G13C1_EVENT_A_POC_CLEANUP_SAVE_ENABLED` | `true` |
| `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK` | `true` (recommended) |
| All other schedule `*_NON_DRY_RUN_ARMED` | **off** (G-9k, G-9g*, G-6-g*, single-text-field registry) |

---

## 8. Operator Save procedure (execution phase — not this phase)

1. Receive explicit approval phrase (section 7).
2. Run beforeSnapshot SELECT; save exact `updated_at` + field values.
3. Start dev server with execution env stack (section 7).
4. Open `http://localhost:4321/__admin-staging-shell/musician-basic/admin/schedule/`.
5. Sign in as staging admin.
6. Scroll to **G-13c1 — Event A PoC 文言クリーンアップ**.
7. Click **G-13c1 変更を確認（dry-run）** — verify:
   - `dryRun: true`, `actualWrite: false`
   - `changedFields`: 6 fields
   - `saveReadiness`: `ready_to_save`
   - `approvalId`: `G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run`
8. Confirm Save button enabled (**once**).
9. Click **Event A cleanup を保存（1回）** — **operator manual once only**.
10. Run afterVerification SELECT; compare to section 5.
11. Disarm: stop dev; restore routine `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; all arms off.
12. **Do not** re-click G-13c1 Save without new approval + fresh beforeSnapshot.

**Public site:** separate G-13e phase after DB cleanup (convert + manual-upload).

---

## 9. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiScheduleEventAPocCleanupFinalPreflightComplete` | **true** |
| `readyForG13d1EventAPocCleanupExecution` | **true** |
| `readyForAnyDbWrite` | **false** (until execution approval) |
| `cursorSaveExecuted` | **false** |
| `cursorSqlExecuted` | **false** |
| `rollbackSqlExecuted` | **false** |
| `eventBTouched` | **false** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13d1-final-preflight-gosaki-schedule-event-a-poc-cleanup.mjs
```

---

## 11. Next

`G-13d1-event-a-poc-cleanup-execution` — operator beforeSnapshot → Preview → Save once → afterVerification (separate phase; explicit approval required).

---

## 12. References

- [gosaki-schedule-event-a-poc-cleanup-local-implementation.md](./gosaki-schedule-event-a-poc-cleanup-local-implementation.md)
- [gosaki-schedule-event-a-poc-cleanup-admin-reflection-local-dev-verify-result.md](./gosaki-schedule-event-a-poc-cleanup-admin-reflection-local-dev-verify-result.md)
- [gosaki-schedule-existing-event-field-slice-closure.md](./gosaki-schedule-existing-event-field-slice-closure.md) (G-9k6 before baseline)
- `src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts`
