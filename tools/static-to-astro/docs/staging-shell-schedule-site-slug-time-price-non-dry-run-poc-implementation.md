# Staging shell schedule site_slug time + price non-dry-run PoC implementation (G-9g3c)

**Phase:** `G-9g3c-staging-shell-schedule-site-slug-time-price-non-dry-run-poc-implementation`  
**Date:** 2026-06-17  
**Prior:** G-9g3c planning — commit `26238e4`  
**Type:** gated Save UI + adapter — **no Save execution in implementation phase**

---

## 1. Background

G-9g3b proved venue + description non-dry-run Save on the Gosaki `site_slug=gosaki-piano` pilot row. G-9g3c adds gated non-dry-run Save for `open_time` + `start_time` + `price` only on the same row.

Planning: [staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning.md](./staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning.md)  
G-9g3b execution: [staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md](./staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md)

---

## 2. Target row

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
title:      [CMS Kit staging] G-9g2 title PoC  (unchanged)
venue:      [CMS Kit staging] G-9g3b venue PoC  (unchanged)
description: 出演： [G-9g3b venue+description PoC]  (unchanged)
```

---

## 3. Payload (PoC)

```txt
open_time:  [CMS Kit staging] G-9g3c open PoC
start_time: [CMS Kit staging] G-9g3c start PoC
price:      [CMS Kit staging] G-9g3c price PoC
```

`changedFields` must be `open_time`, `start_time`, `price` only (order-independent).

---

## 4. Approval ID

```txt
G-9g3c-schedule-site-slug-time-price-non-dry-run-poc
```

---

## 5. Env arm

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED=true
```

Plus standard staging write stack (see preflight doc). Default routine dev: Save disabled.

Single-arm: G-9g2 / G-9g3b / G-6 arms must be off when G-9g3c armed.

---

## 6. Lock baseline

Post G-9g3b execution (planning baseline — **re-verify live before preflight / Save**):

```txt
updated_at: 2026-06-17T14:36:04.711395+00:00
```

---

## 7. Save gating conditions

Save `Save time+price PoC` enabled only when:

- Host gate passed (`activeHost === kmjqppxjdnwwrtaeqjta.supabase.co`)
- G-9g3c env arm + write gates satisfied
- Dry-run preview succeeded in session
- `optimisticLock.stale === false`
- `changedFields === ["open_time", "start_time", "price"]` (order-independent)
- open_time / start_time / price inputs match previewed values
- title / venue / description unchanged from loaded row
- Target id / legacy_id / site_slug match

---

## 8. UPDATE scope

```txt
.update({ open_time, start_time, price })
.eq("id", targetId)
.eq("site_slug", "gosaki-piano")
.eq("legacy_id", "schedule-2026-07-010")
.eq("updated_at", expectedBeforeUpdatedAt)
```

---

## 9. Changed files

| File | Role |
| --- | --- |
| `staging-schedule-site-slug-config.ts` | G-9g3c constants |
| `staging-schedule-site-slug-time-price-poc-config.ts` | Env arm + host gate + single-arm |
| `staging-schedule-site-slug-time-price-poc-save.ts` | `executeG9G3cTimePriceNonDryRunSave` |
| `schedule-write-guards.ts` | `assertG9G3cTimePricePayloadOnly` |
| `schedule-write-types.ts` | G-9g3c approval ID |
| `staging-schedule-site-slug-title-poc-config.ts` | G-9g3c single-arm block |
| `staging-schedule-site-slug-venue-description-poc-config.ts` | G-9g3c single-arm block |
| `staging-schedule-site-slug-edit-binding.ts` | G-9g3c binding |
| `staging-schedule-site-slug-edit-ui.ts` | Preview + gated Save |
| `AdminStagingScheduleSiteSlugEditSection.astro` | Save button (default disabled) |
| `verify-url-to-staging-pipeline.mjs` | G-9g3c assertions |

---

## 10. Safety

| Rule | Status |
| --- | --- |
| Cursor Save click | **no** |
| DB write / SQL | **no** (implementation phase) |
| `service_role` | not used |
| `/admin` | not modified |
| G-9g3b / G-9g2 Save | not re-executed |
| G-9g3a / G-9g3b preview path | preserved |

---

## 11. Gates

```txt
stagingShellScheduleTimePricePocImplementationComplete: true
stagingShellScheduleTimePricePocSaveUiGated: true
stagingShellScheduleTimePricePocHostGateRequired: true
stagingShellScheduleTimePricePocOpenTimeStartTimePriceOnly: true
stagingShellScheduleTimePricePocNotExecuted: true
readyForG9g3cPreflight: true
readyForG9g3cExecution: false
readyForAnyDbWrite: false
```

---

## 12. Next

**G-9g3c-preflight** — beforeSnapshot / rollback SQL / dev arm procedure (no Save click).  
**G-9g3c-execution** — operator manual Save once only after preflight approval.
