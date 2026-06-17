# Staging shell schedule site_slug venue + description non-dry-run PoC preflight (G-9g3b)

**Phase:** `G-9g3b-staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-preflight`  
**Date:** 2026-06-17  
**Prior:** G-9g3b implementation (uncommitted)  
**Type:** preflight checklist only — **no Save click, no DB write, no Supabase SQL execution**

---

## 1. Background

G-9g3b implementation ships gated `Save venue+description PoC` UI and `executeG9G3bVenueDescriptionNonDryRunSave()` for Gosaki `site_slug=gosaki-piano`. This phase documents operator checks immediately **before** the first manual Save in the execution phase.

**This phase performed:** preflight checklist, beforeSnapshot expectations, dry-run / Save procedures, rollback plan, AI context.  
**This phase did not:** Save click, UPDATE / INSERT / DELETE, Supabase SQL execution, FTP, workflow_dispatch, `service_role`, `/admin` changes.

Prior docs:

- [staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation.md](./staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation.md)
- [staging-shell-schedule-site-slug-safe-fields-dry-run-preview-smoke-test-result.md](./staging-shell-schedule-site-slug-safe-fields-dry-run-preview-smoke-test-result.md)
- [staging-shell-schedule-site-slug-title-non-dry-run-poc-execution-result.md](./staging-shell-schedule-site-slug-title-non-dry-run-poc-execution-result.md) (G-9g2 baseline)

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
venue:       [CMS Kit staging] G-9g3b venue PoC
description: 出演： [G-9g3b venue+description PoC]
```

`changedFields` must be `venue`, `description` only. **title** and other safe fields must remain unchanged.

---

## 4. Approval ID

```txt
G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc
```

---

## 5. Operator approval text (execution phase)

Required **before** one manual Save in execution phase. **Not required for this preflight phase.**

```txt
承認します。G-9g3b venue+description non-dry-run PoC として、static-to-astro-cms-staging の public.schedules で、id=aa440e29-5be8-402e-9190-0d81c48434c0 / legacy_id=schedule-2026-07-010 / site_slug=gosaki-piano の1行について、venue と description のみを PoC 値に更新します。dry-run preview と optimistic lock と host gate が成功している場合のみ1回だけ実行し、title その他フィールド・他site・本番には触りません。
```

Cursor / AI / CI / Playwright must **not** click Save or run SQL.

---

## 6. Env arm

### G-9g3b arm (required for Save)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED=true
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
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

| Env | Value | Notes |
| --- | --- | --- |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc` | **Not G-9g2 / G-6** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED` | `true` | G-9g3b arm gate |
| `PUBLIC_SUPABASE_URL` | staging URL | host must be `kmjqppxjdnwwrtaeqjta.supabase.co` |

### Do not arm (single-arm conflict)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true
service_role key
production Supabase URL / keys
```

---

## 7. Host hard gate (mandatory)

| Check | Pass criteria |
| --- | --- |
| activeHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| hostGatePassed | `true` |
| Sariswing production host | **must not** be active (`vsbvndwuajjhnzpohghh.supabase.co` → STOP) |

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
| 6 | beforeSnapshot | Matches §9 |
| 7 | Approval ID displayed | `G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc` |
| 8 | Env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED=true` when arming Save |
| 9 | G-9g2 / G-6 arms off | No conflicting slice arms |
| 10 | Auth | Staging admin signed in before Save (execution) |
| 11 | `service_role` | Not used |
| 12 | FTP / workflow_dispatch | Not executed |

---

## 9. beforeSnapshot confirmation (post G-9g2)

### Operator SQL (read-only — staging project only)

**Cursor does not execute.**

```sql
-- G-9g3b beforeSnapshot — SELECT only; staging project only
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

### Expected beforeSnapshot (after G-9g2 title PoC)

| Field | Expected |
| --- | --- |
| `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| `legacy_id` | `schedule-2026-07-010` |
| `site_slug` | `gosaki-piano` |
| `title` | `[CMS Kit staging] G-9g2 title PoC` |
| `venue` | `NULL` |
| `description` | `出演：` |
| `source_route` | `/schedule/2026-07/` |
| `published` | `true` |
| `show_on_home` | `false` |
| `home_order` | `NULL` |
| `sort_order` | `10` |
| `updated_at` | `2026-06-17T06:12:13.105898+00:00` (G-9g2 baseline — **record exact live value**) |

### Abort conditions (beforeSnapshot)

Abort execution if:

```txt
- Supabase project is not static-to-astro-cms-staging
- hostGatePassed = false
- row count ≠ 1
- site_slug ≠ gosaki-piano
- legacy_id ≠ schedule-2026-07-010
- title ≠ [CMS Kit staging] G-9g2 title PoC
- venue ≠ NULL (unless documented)
- description ≠ 出演：
```

---

## 10. Dry-run preview confirmation (required before Save)

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Load section with staging Supabase env | Target row loaded; host gate passed |
| 2 | Confirm title unchanged | `[CMS Kit staging] G-9g2 title PoC` |
| 3 | Enter venue | `[CMS Kit staging] G-9g3b venue PoC` |
| 4 | Enter description | `出演： [G-9g3b venue+description PoC]` |
| 5 | Click **Preview dry-run** | Preview succeeds |
| 6 | Confirm `actualWrite` | `false` |
| 7 | Confirm `changedFields` | `venue`, `description` only |
| 8 | Confirm `optimisticLock.stale` | `false` |
| 9 | Confirm `hostGatePassed` | `true` |
| 10 | Record `expectedBeforeUpdatedAt` | Matches beforeSnapshot `updated_at` |

### Stale stop condition

```txt
optimisticLock.stale === true  → STOP — do not Save
```

---

## 11. Save execution procedure (execution phase only)

**Operator manual only.** Cursor / AI / CI / Playwright **must not** click Save.

Click **Save venue+description PoC** **once** only when **all** conditions hold:

```txt
- Operator approval text provided (§5)
- hostGatePassed = true
- env arm active (PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED=true)
- approval ID: G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc
- dry-run preview succeeded in same session
- changedFields = venue + description only
- optimisticLock.stale = false
- title / open_time / start_time / price unchanged
- venue + description inputs unchanged since preview
- Save button enabled (not disabled)
- staging admin signed in
```

### UPDATE scope (adapter)

```txt
.update({
  venue: "[CMS Kit staging] G-9g3b venue PoC",
  description: "出演： [G-9g3b venue+description PoC]"
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
approvalId: G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc
changedFields: ["venue", "description"]
title unchanged: [CMS Kit staging] G-9g2 title PoC
```

### Rollback SQL (staging only — not executed in preflight)

```sql
-- G-9g3b rollback — operator only if rollback approved
update public.schedules
set
  venue = null,
  description = '出演：'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-07-010';
```

---

## 13. Gates

```txt
stagingShellScheduleVenueDescriptionPocPreflightComplete: true
stagingShellScheduleVenueDescriptionPocNotExecuted: true
readyForG9g3bExecution: true
readyForAnyDbWrite: false
```

---

## 14. Next

**G-9g3b-execution** — operator manual Save once after approval + env arm + preview gates.
