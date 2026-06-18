# Staging shell schedule site_slug general edit non-dry-run PoC preflight (G-9g3d3)

**Phase:** `G-9g3d3-general-edit-non-dry-run-preflight`  
**Date:** 2026-06-17  
**Prior:** G-9g3d2 dry-run smoke — commit `a647f36`  
**Type:** preflight checklist only — **no Save click, no DB write, no Supabase SQL execution**

---

## 1. Phase summary

G-9g3d general edit path — first non-dry-run execution preflight. Consolidates G-9g2 / G-9g3b / G-9g3c slice PoCs into a single **changed-fields-only** Save via `executeG9G3dGeneralEditNonDryRunSave`.

**This phase performed:** preflight doc, approval text, safety checklist, rollback policy, dry-run checklist for G-9g3d4.  
**This phase did not:** implementation changes, Save click, UPDATE / INSERT / DELETE / UPSERT / RPC, Supabase SQL execution (including SELECT by Cursor/AI), FTP, workflow_dispatch, `service_role`, `/admin` changes.

| Check | Status |
| --- | --- |
| Save clicked | **no** |
| DB write executed | **no** |
| SQL mutation executed | **no** |
| Cursor / AI / Playwright clicks | **no** |

Prior docs:

- [staging-shell-schedule-site-slug-general-edit-consolidation-implementation.md](./staging-shell-schedule-site-slug-general-edit-consolidation-implementation.md)
- [staging-shell-schedule-site-slug-general-edit-dry-run-smoke-test-result.md](./staging-shell-schedule-site-slug-general-edit-dry-run-smoke-test-result.md)
- [staging-shell-schedule-site-slug-time-price-non-dry-run-poc-execution-result.md](./staging-shell-schedule-site-slug-time-price-non-dry-run-poc-execution-result.md) (G-9g3c baseline)

**Do not re-run G-9g2 / G-9g3b / G-9g3c Save.** **G-9g3d Save not yet executed.**

---

## 2. Target row

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
```

### Expected before values (post G-9g3c)

| Field | Expected before G-9g3d execution |
| --- | --- |
| `title` | `[CMS Kit staging] G-9g2 title PoC` |
| `venue` | `[CMS Kit staging] G-9g3b venue PoC` |
| `open_time` | `[CMS Kit staging] G-9g3c open PoC` |
| `start_time` | `[CMS Kit staging] G-9g3c start PoC` |
| `price` | `[CMS Kit staging] G-9g3c price PoC` |
| `description` | `出演： [G-9g3b venue+description PoC]` |
| `updated_at` | `2026-06-17T15:45:35.433566+00:00` |

**Operator must confirm via live SELECT (§3).** Row count must be **exactly 1**. Record exact live `updated_at` before execution — use as `expectedBeforeUpdatedAt` for optimistic lock.

---

## 3. Live SELECT only SQL

**Operator manual only** — Supabase SQL Editor on `static-to-astro-cms-staging`.  
**Cursor / AI does not execute this query.**

```sql
-- G-9g3d beforeSnapshot — SELECT only; staging project only
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

**Row count must be exactly 1.** Abort if 0 or >1.

---

## 4. Candidate payload (changed-fields only)

First G-9g3d non-dry-run PoC: **`price` only** (minimal blast radius).

| Field | From | To |
| --- | --- | --- |
| `price` | `[CMS Kit staging] G-9g3c price PoC` | `[CMS Kit staging] G-9g3d general edit price PoC` |

**Unchanged fields:** `title`, `venue`, `open_time`, `start_time`, `description`

**Expected `changedFields`:** `["price"]` only

```json
{
  "price": "[CMS Kit staging] G-9g3d general edit price PoC"
}
```

Not a full safe-fields payload — general edit Save builds from preview `changedFields` only.

---

## 5. Approval ID

```txt
G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc
```

---

## 6. Env arm

### G-9g3d arm (required for Save in execution phase)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED=true
```

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
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

| Env | Value | Notes |
| --- | --- | --- |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` | Required for Save path |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` | Required for non-dry-run Save |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc` | **Not G-9g2 / G-9g3b / G-9g3c / G-6** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED` | `true` | G-9g3d arm gate |
| `PUBLIC_SUPABASE_URL` | staging URL | host = `kmjqppxjdnwwrtaeqjta.supabase.co` |
| `PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE` | off (unset) | Unless explicitly needed for audit |

### Must be off (single-arm)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true
service_role key
production Supabase URL / keys (vsbvndwuajjhnzpohghh.supabase.co)
```

---

## 7. Dry-run checklist for G-9g3d4 (before Save)

Operator must manually confirm Preview dry-run in browser **before** one Save click.

| # | Check | Expected |
| --- | --- | --- |
| 1 | `actualWrite` | `false` |
| 2 | `wouldWrite` | `true` |
| 3 | `changedFields` | `price` only |
| 4 | `before.price` | `[CMS Kit staging] G-9g3c price PoC` |
| 5 | `after.price` | `[CMS Kit staging] G-9g3d general edit price PoC` |
| 6 | `title` | unchanged — `[CMS Kit staging] G-9g2 title PoC` |
| 7 | `venue` | unchanged — `[CMS Kit staging] G-9g3b venue PoC` |
| 8 | `open_time` | unchanged — `[CMS Kit staging] G-9g3c open PoC` |
| 9 | `start_time` | unchanged — `[CMS Kit staging] G-9g3c start PoC` |
| 10 | `description` | unchanged — `出演： [G-9g3b venue+description PoC]` |
| 11 | `optimisticLock.expectedBeforeUpdatedAt` | `2026-06-17T15:45:35.433566+00:00` (or exact live SELECT value) |
| 12 | `optimisticLock.currentUpdatedAt` | matches live row `updated_at` |
| 13 | `optimisticLock.stale` | `false` |
| 14 | `activeHost` / `expectedHost` | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| 15 | `hostGatePassed` | `true` |
| 16 | approval ID in UI | `G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc` |
| 17 | staging admin | signed in |
| 18 | Save button | enabled **only after** dry-run passes all gates |

### Dry-run abort conditions

```txt
optimisticLock.stale === true              → STOP — do not Save
changedFields includes any field ≠ price → STOP
changedFields missing price                → STOP
hostGatePassed === false                   → STOP
activeHost = vsbvndwuajjhnzpohghh.supabase.co → STOP (production)
title / venue / open_time / start_time / description changed → STOP
```

**Note:** Dry-run `after` may show `""` for null fields — display normalization only. `changedFields` is the source of truth.

---

## 8. Operator approval text (execution phase)

Required **before** one manual Save in G-9g3d4. **Not required for this preflight phase.**

```txt
承認します。G-9g3d general edit non-dry-run PoC として、static-to-astro-cms-staging の public.schedules で、id=aa440e29-5be8-402e-9190-0d81c48434c0 / legacy_id=schedule-2026-07-010 / site_slug=gosaki-piano の1行について、general edit path から price のみを PoC 値に更新します。dry-run preview と optimistic lock と host gate と staging admin auth が成功している場合のみ1回だけ実行し、title / venue / open_time / start_time / description その他フィールド・他site・本番には触りません。
```

Cursor / AI / CI / Playwright must **not** click Save or run SQL.

---

## 9. Rollback policy

**Initial policy:** `rollbackNeeded: false`

If rollback is ever approved separately, restore **`price` only** to G-9g3c baseline:

```txt
price → [CMS Kit staging] G-9g3c price PoC
```

**Reference rollback SQL (staging only — not executed in preflight or execution unless operator explicitly approves rollback):**

```sql
-- G-9g3d rollback reference — operator only if rollback approved
-- Reverts price only; title / venue / open_time / start_time / description untouched
update public.schedules
set
  price = '[CMS Kit staging] G-9g3c price PoC'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-07-010';
```

**Not executed in this preflight phase.**

---

## 10. Safety gates

| Gate | Requirement |
| --- | --- |
| Payload strategy | **changed-fields-only** — not full safe-fields payload |
| Payload whitelist | `title`, `venue`, `open_time`, `start_time`, `price`, `description` |
| This execution | **`price` only** expected in `changedFields` |
| Scope | `id` + `legacy_id` + `site_slug` |
| Optimistic lock | `expectedBeforeUpdatedAt` from live row at preview time |
| Host hard gate | `kmjqppxjdnwwrtaeqjta.supabase.co` only |
| Production block | `vsbvndwuajjhnzpohghh.supabase.co` → **STOP** |
| Auth | Staging admin signed in before Save |
| `service_role` | **prohibited** |
| Save | Operator manual one-click only |
| Cursor / AI / Playwright | **must not** click Save |
| G-9g2 / G-9g3b / G-9g3c Save | **re-run prohibited** |
| G-9g3d Save | **not yet executed** |

---

## 11. Save execution procedure (G-9g3d4 only)

**Operator manual only.** Click **Save general edit** **once** when all conditions hold:

```txt
- Operator approval text (§8)
- Live beforeSnapshot SELECT confirmed (§3)
- Execution-phase dev env (§6)
- Dry-run preview gates (§7)
- hostGatePassed = true
- optimisticLock.stale = false
- changedFields = price only
- price input unchanged since preview
- G-9g2 / G-9g3b / G-9g3c / G-6 arms off
- staging admin signed in
```

### Expected UPDATE scope (adapter — reference)

```txt
.update({ price: "[CMS Kit staging] G-9g3d general edit price PoC" })
.eq("id", "aa440e29-5be8-402e-9190-0d81c48434c0")
.eq("site_slug", "gosaki-piano")
.eq("legacy_id", "schedule-2026-07-010")
.eq("updated_at", expectedBeforeUpdatedAt)
```

---

## 12. Gates

```txt
stagingShellScheduleGeneralEditPreflightComplete: true
stagingShellScheduleGeneralEditPocNotExecuted: true
readyForG9g3d4GeneralEditNonDryRunExecution: true
readyForG9g3dExecution: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

`readyForG9g3d4GeneralEditNonDryRunExecution: true` means the operator may proceed after live SELECT, dev arm, dry-run preview, and approval — **not** that Cursor/AI should write to the database.

---

## 13. Next phase

**G-9g3d4-general-edit-non-dry-run-execution** — operator manual Save once after §3 live SELECT, §6 dev arm, §7 dry-run preview, and §8 approval text.
