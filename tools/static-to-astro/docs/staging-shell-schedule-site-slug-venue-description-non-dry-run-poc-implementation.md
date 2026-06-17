# Staging shell schedule site_slug venue + description non-dry-run PoC implementation (G-9g3b)

**Phase:** `G-9g3b-staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation`  
**Date:** 2026-06-17  
**Prior:** G-9g3a smoke test + commit `54380a0`  
**Type:** gated Save UI + adapter — **no Save execution in implementation phase**

---

## 1. Background

G-9g3a validated host hard gate and multi-field dry-run preview. G-9g3b adds gated non-dry-run Save for `venue` + `description` only on the Gosaki `site_slug=gosaki-piano` pilot row.

Planning: [staging-shell-schedule-site-slug-safe-fields-edit-planning.md](./staging-shell-schedule-site-slug-safe-fields-edit-planning.md)  
G-9g3a smoke: [staging-shell-schedule-site-slug-safe-fields-dry-run-preview-smoke-test-result.md](./staging-shell-schedule-site-slug-safe-fields-dry-run-preview-smoke-test-result.md)

---

## 2. Target row

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
title:      [CMS Kit staging] G-9g2 title PoC  (unchanged — no restore)
```

---

## 3. Payload (PoC)

```txt
venue:       [CMS Kit staging] G-9g3b venue PoC
description: 出演： [G-9g3b venue+description PoC]
```

`changedFields` must be `venue`, `description` only.

---

## 4. Approval ID

```txt
G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc
```

---

## 5. Env arm

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED=true
```

Plus standard staging write stack (see preflight doc). Default routine dev: Save disabled.

Single-arm: G-9g2 / G-6 arms must be off when G-9g3b armed.

---

## 6. Save gating conditions

Save `Save venue+description PoC` enabled only when:

- Host gate passed (`activeHost === kmjqppxjdnwwrtaeqjta.supabase.co`)
- G-9g3b env arm + write gates satisfied
- Dry-run preview succeeded in session
- `optimisticLock.stale === false`
- `changedFields === ["venue", "description"]` (order-independent)
- Venue + description inputs match previewed values
- title / open_time / start_time / price unchanged from loaded row
- Target id / legacy_id / site_slug match

---

## 7. UPDATE scope

```txt
.update({ venue, description })
.eq("id", targetId)
.eq("site_slug", "gosaki-piano")
.eq("legacy_id", "schedule-2026-07-010")
.eq("updated_at", expectedBeforeUpdatedAt)
```

---

## 8. Changed files

| File | Role |
| --- | --- |
| `staging-schedule-site-slug-config.ts` | G-9g3b constants |
| `staging-schedule-site-slug-venue-description-poc-config.ts` | Env arm + host gate |
| `staging-schedule-site-slug-venue-description-poc-save.ts` | `executeG9G3bVenueDescriptionNonDryRunSave` |
| `schedule-write-guards.ts` | `assertG9G3bVenueDescriptionPayloadOnly` |
| `schedule-write-types.ts` | G-9g3b approval ID |
| `staging-schedule-site-slug-edit-binding.ts` | G-9g3b binding |
| `staging-schedule-site-slug-edit-ui.ts` | Preview + gated Save |
| `AdminStagingScheduleSiteSlugEditSection.astro` | Save button (default disabled) |
| `verify-url-to-staging-pipeline.mjs` | G-9g3b assertions |

---

## 9. Safety

| Rule | Status |
| --- | --- |
| Cursor Save click | **no** |
| DB write / SQL | **no** (implementation phase) |
| `service_role` | not used |
| `/admin` | not modified |
| G-9g3a preview path | preserved (`actualWrite=false`) |

---

## 10. Gates

```txt
stagingShellScheduleVenueDescriptionPocImplementationComplete: true
stagingShellScheduleVenueDescriptionPocSaveUiGated: true
stagingShellScheduleVenueDescriptionPocHostGateRequired: true
stagingShellScheduleVenueDescriptionPocVenueDescriptionOnly: true
stagingShellScheduleVenueDescriptionPocNotExecuted: true
readyForG9g3bPreflight: true
readyForAnyDbWrite: false
```

---

## 11. Next

**G-9g3b-preflight** → operator manual Save once in execution phase only.
