# Staging shell schedule site_slug time + price non-dry-run PoC preflight (G-9g3c)

**Phase:** `G-9g3c-staging-shell-schedule-site-slug-time-price-non-dry-run-poc-preflight`  
**Date:** 2026-06-17  
**Prior:** G-9g3c implementation — commit `37ba023`  
**Type:** preflight checklist only — **no Save click, no DB write, no Supabase SQL execution**

---

## 1. Background

G-9g3b execution succeeded on the Gosaki `site_slug=gosaki-piano` pilot row (`venue` + `description` only). G-9g3c implementation ships gated `Save time+price PoC` UI and `executeG9G3cTimePriceNonDryRunSave()` for `open_time` + `start_time` + `price` only on the same row.

This phase documents operator checks immediately **before** the first manual Save in the execution phase.

**This phase performed:** preflight checklist, beforeSnapshot expectations, dry-run / Save procedures, rollback plan, AI context.  
**This phase did not:** Save click, UPDATE / INSERT / DELETE / UPSERT / RPC, Supabase SQL execution, FTP, workflow_dispatch, `service_role`, `/admin` changes.

Prior docs:

- [staging-shell-schedule-site-slug-time-price-non-dry-run-poc-implementation.md](./staging-shell-schedule-site-slug-time-price-non-dry-run-poc-implementation.md)
- [staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning.md](./staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning.md)
- [staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md](./staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md) (G-9g3b baseline)

---

## 2. Target row

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
date:       2026-07-19
```

---

## 3. Payload (PoC)

```txt
open_time:  [CMS Kit staging] G-9g3c open PoC
start_time: [CMS Kit staging] G-9g3c start PoC
price:      [CMS Kit staging] G-9g3c price PoC
```

`changedFields` must be `open_time`, `start_time`, `price` only (order-independent). **title**, **venue**, and **description** must remain unchanged.

---

## 4. Approval ID

```txt
G-9g3c-schedule-site-slug-time-price-non-dry-run-poc
```

---

## 5. Operator approval text (execution phase)

Required **before** one manual Save in execution phase. **Not required for this preflight phase.**

```txt
承認します。G-9g3c time+price non-dry-run PoC として、static-to-astro-cms-staging の public.schedules で、id=aa440e29-5be8-402e-9190-0d81c48434c0 / legacy_id=schedule-2026-07-010 / site_slug=gosaki-piano の1行について、open_time と start_time と price のみを PoC 値に更新します。dry-run preview と optimistic lock と host gate が成功している場合のみ1回だけ実行し、title / venue / description その他フィールド・他site・本番には触りません。
```

Cursor / AI / CI / Playwright must **not** click Save or run SQL.

---

## 6. Env arm

### G-9g3c arm (required for Save)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED=true
```

Without this env: Save UI remains disabled; dry-run preview only.

### Full execution-phase dev stack (inline env — do not commit `.env` / `.env.local`)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g3c-schedule-site-slug-time-price-non-dry-run-poc \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

| Env | Value | Notes |
| --- | --- | --- |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-9g3c-schedule-site-slug-time-price-non-dry-run-poc` | **Not G-9g2 / G-9g3b / G-6** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED` | `true` | G-9g3c arm gate |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` | Required for non-dry-run Save |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` | Required for Save path |
| `PUBLIC_SUPABASE_URL` | staging URL | host must be `kmjqppxjdnwwrtaeqjta.supabase.co` |

### Do not arm (single-arm conflict)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true
service_role key
production Supabase URL / keys
```

**Do not re-run G-9g2 or G-9g3b Save.**

---

## 7. Host hard gate (mandatory)

| Check | Pass criteria |
| --- | --- |
| expectedHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| activeHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| hostGatePassed | `true` |
| Supabase project | `static-to-astro-cms-staging` only |
| Sariswing production host | **must not** be active (`vsbvndwuajjhnzpohghh.supabase.co` → **STOP immediately**) |

Save remains disabled when `hostGatePassed === false`.

---

## 8. Preflight confirmation items

| # | Check | Pass criteria |
| --- | --- | --- |
| 1 | Supabase project | `static-to-astro-cms-staging` only |
| 2 | Route | `/__admin-staging-shell/musician-basic/#schedule` — **not** `/admin` |
| 3 | Section | `AdminStagingScheduleSiteSlugEditSection` visible |
| 4 | Host gate | `hostGatePassed=true` in UI |
| 5 | Target row | id + legacy_id + site_slug match §2 |
| 6 | beforeSnapshot | Matches §9 (live SELECT confirmed) |
| 7 | Approval ID displayed | `G-9g3c-schedule-site-slug-time-price-non-dry-run-poc` |
| 8 | Env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED=true` when arming Save |
| 9 | G-9g2 / G-9g3b / G-6 arms off | No conflicting slice arms |
| 10 | Auth | Staging admin signed in before Save (execution) |
| 11 | `service_role` | Not used |
| 12 | FTP / workflow_dispatch | Not executed |

---

## 9. beforeSnapshot confirmation (post G-9g3b)

### Operator SQL (read-only — staging project only)

**Cursor does not execute.**

```sql
-- G-9g3c beforeSnapshot — SELECT only; staging project only
select
  id,
  legacy_id,
  site_slug,
  date,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  source_route,
  published,
  show_on_home,
  home_order,
  sort_order,
  created_at,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-07-010';
```

**Row count must be exactly 1.**

### Expected beforeSnapshot (after G-9g3b execution)

| Field | Expected |
| --- | --- |
| `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| `legacy_id` | `schedule-2026-07-010` |
| `site_slug` | `gosaki-piano` |
| `title` | `[CMS Kit staging] G-9g2 title PoC` |
| `venue` | `[CMS Kit staging] G-9g3b venue PoC` |
| `description` | `出演： [G-9g3b venue+description PoC]` |
| `open_time` | `NULL` |
| `start_time` | `NULL` |
| `price` | `NULL` |
| `source_route` | `/schedule/2026-07/` |
| `published` | `true` |
| `show_on_home` | `false` |
| `sort_order` | `10` |
| `updated_at` | `2026-06-17T14:36:04.711395+00:00` (G-9g3b baseline — **record exact live value**) |

### Abort conditions (beforeSnapshot)

Abort execution if:

```txt
- Supabase project is not static-to-astro-cms-staging
- activeHost ≠ kmjqppxjdnwwrtaeqjta.supabase.co
- activeHost = vsbvndwuajjhnzpohghh.supabase.co (production — STOP)
- hostGatePassed = false
- row count ≠ 1
- id ≠ aa440e29-5be8-402e-9190-0d81c48434c0
- legacy_id ≠ schedule-2026-07-010
- site_slug ≠ gosaki-piano
- title ≠ [CMS Kit staging] G-9g2 title PoC
- venue ≠ [CMS Kit staging] G-9g3b venue PoC
- description ≠ 出演： [G-9g3b venue+description PoC]
- open_time is not NULL (already has a value)
- start_time is not NULL (already has a value)
- price is not NULL (already has a value)
- updated_at differs from live SELECT without recording new baseline
- live beforeSnapshot not confirmed via operator SELECT
```

---

## 10. Dry-run preview confirmation (required before Save)

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Load section with staging Supabase env | Target row loaded; host gate passed |
| 2 | Confirm title unchanged | `[CMS Kit staging] G-9g2 title PoC` |
| 3 | Confirm venue unchanged | `[CMS Kit staging] G-9g3b venue PoC` |
| 4 | Confirm description unchanged | `出演： [G-9g3b venue+description PoC]` |
| 5 | Enter open_time | `[CMS Kit staging] G-9g3c open PoC` |
| 6 | Enter start_time | `[CMS Kit staging] G-9g3c start PoC` |
| 7 | Enter price | `[CMS Kit staging] G-9g3c price PoC` |
| 8 | Click **Preview dry-run** | Preview succeeds |
| 9 | Confirm `actualWrite` | `false` |
| 10 | Confirm `changedFields` | `open_time`, `start_time`, `price` only |
| 11 | Confirm `optimisticLock.stale` | `false` |
| 12 | Confirm `hostGatePassed` | `true` |
| 13 | Record `expectedBeforeUpdatedAt` | Matches beforeSnapshot `updated_at` from live SELECT |

### Dry-run abort conditions

```txt
optimisticLock.stale === true           → STOP — do not Save
changedFields includes title            → STOP
changedFields includes venue            → STOP
changedFields includes description      → STOP
changedFields missing open_time         → STOP
changedFields missing start_time        → STOP
changedFields missing price             → STOP
hostGatePassed === false                → STOP
```

**Note:** Dry-run `after` may show `""` for null fields — display normalization only (G-9g3b lesson). `changedFields` is the source of truth.

---

## 11. Save execution procedure (execution phase only)

**Operator manual only.** Cursor / AI / CI / Playwright **must not** click Save.

Click **Save time+price PoC** **once** only when **all** conditions hold:

```txt
- Operator approval text provided (§5)
- hostGatePassed = true
- activeHost = kmjqppxjdnwwrtaeqjta.supabase.co
- env arm active (PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED=true)
- approval ID: G-9g3c-schedule-site-slug-time-price-non-dry-run-poc
- dry-run preview succeeded in same session
- changedFields = open_time + start_time + price only
- optimisticLock.stale = false
- title / venue / description unchanged
- open_time / start_time / price inputs unchanged since preview
- Save button enabled (not disabled)
- staging admin signed in
- G-9g2 / G-9g3b / G-6 arms off
```

### UPDATE scope (adapter)

```txt
.update({
  open_time: "[CMS Kit staging] G-9g3c open PoC",
  start_time: "[CMS Kit staging] G-9g3c start PoC",
  price: "[CMS Kit staging] G-9g3c price PoC"
})
.eq("id", "aa440e29-5be8-402e-9190-0d81c48434c0")
.eq("site_slug", "gosaki-piano")
.eq("legacy_id", "schedule-2026-07-010")
.eq("updated_at", expectedBeforeUpdatedAt)
```

---

## 12. Post-Save verification (execution phase only)

### Expected result

```txt
actualWrite: true
approvalId: G-9g3c-schedule-site-slug-time-price-non-dry-run-poc
changedFields: ["open_time", "start_time", "price"] only
updated_at: advances to new timestamp (trigger)
title unchanged: [CMS Kit staging] G-9g2 title PoC
venue unchanged: [CMS Kit staging] G-9g3b venue PoC
description unchanged: 出演： [G-9g3b venue+description PoC]
serviceRoleUsed: false
scheduleMonthsTouched: false
publishTriggered: false
```

### Optional read-only verification SQL (staging project only — not executed by Cursor)

```sql
-- G-9g3c post-Save verification — SELECT only; staging project only
select
  id,
  legacy_id,
  site_slug,
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

---

## 13. Rollback SQL (staging only — not executed in preflight)

Separate approval required if rollback is ever needed. Operator manual only.

```sql
-- G-9g3c rollback — operator only if rollback approved
-- Reverts open_time / start_time / price only; title / venue / description untouched
update public.schedules
set
  open_time = null,
  start_time = null,
  price = null
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-07-010';
```

**Not executed in this preflight phase.**

---

## 14. Gates

```txt
stagingShellScheduleTimePricePocPreflightComplete: true
stagingShellScheduleTimePricePocNotExecuted: true
readyForG9g3cExecution: true
readyForAnyDbWrite: false
```

`readyForG9g3cExecution: true` means the operator may proceed to the execution phase after live beforeSnapshot confirmation, dev arm, dry-run preview, and approval text — **not** that Cursor/AI should write to the database.

---

## 15. Next

**G-9g3c-execution** — operator manual Save once after:

1. Live beforeSnapshot SELECT (§9)
2. Execution-phase dev env stack (§6)
3. Dry-run preview gates (§10)
4. Operator approval text (§5)
