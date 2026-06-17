# Staging shell schedule site_slug safe-fields dry-run preview implementation (G-9g3a)

**Phase:** `G-9g3a-staging-shell-schedule-site-slug-safe-fields-dry-run-preview`  
**Date:** 2026-06-17  
**Prior:** G-9g3 planning commit `51051c2`  
**Type:** host hard gate + multi-field dry-run preview — **no Save, no DB write**

---

## 1. Background

G-9g3 planning defined safe-fields slices after successful G-9g2 title PoC. G-9g3a adds mandatory Supabase host hard gate and multi-field dry-run preview UI before any further non-dry-run slices (G-9g3b–d).

Planning: [staging-shell-schedule-site-slug-safe-fields-edit-planning.md](./staging-shell-schedule-site-slug-safe-fields-edit-planning.md)

---

## 2. Target row

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
title:      [CMS Kit staging] G-9g2 title PoC  (retained — no restore)
```

---

## 3. Host hard gate

| Constant | Value |
|----------|-------|
| expectedHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| production danger host | `vsbvndwuajjhnzpohghh.supabase.co` (Sariswing) |

Module: `src/lib/admin/staging-data/staging-schedule-site-slug-host-gate.ts`

- `evaluateSupabaseHostGate(supabaseUrl)` → `{ activeHost, expectedHost, hostGatePassed, isKnownProductionHost, warningMessage }`
- `hostGatePassed` when `activeHost === expectedHost`
- Production host → DANGER warning; non-dry-run armed treated as false
- Live stale check blocked when `!hostGatePassed`
- Reused by G-9g2 title PoC config (`getG9G2TitlePocConfig`) and G-9g3a binding/UI

---

## 4. Safe fields whitelist

Editable in dry-run preview only:

```txt
title, venue, open_time, start_time, price, description
```

Excluded (never in patch/UI): `date`, `month`, `year`, `source_route`, `source_file`, `sort_order`, `published`, `show_on_home`, `home_order`, `legacy_id`, `site_slug`, `id`, `created_at`, `updated_at`

`sanitizeSiteSlugEditSafeFieldPatch()` strips non-safe keys.

---

## 5. Multi-field dry-run preview UI

Section: `AdminStagingScheduleSiteSlugEditSection` at `/__admin-staging-shell/musician-basic/#schedule`

- Inputs: title + venue + open_time + start_time + price + description
- **Preview dry-run** button only — `actualWrite=false` always
- G-9g2 Save button **hidden** (`g9g3aSaveUiHidden: true`)
- Host gate banner (ok / warning / DANGER) in section header

Dry-run result displays:

```txt
actualWrite=false
wouldWrite
changedFields
before / after (safe fields + updated_at in before)
target.id, target.legacy_id, target.site_slug
optimisticLock.expectedBeforeUpdatedAt
optimisticLock.currentUpdatedAt
optimisticLock.stale
activeHost, expectedHost, hostGatePassed
```

---

## 6. Changed files

| File | Change |
|------|--------|
| `staging-schedule-site-slug-host-gate.ts` | **NEW** — host gate evaluator |
| `staging-schedule-site-slug-config.ts` | `G9G3A_PHASE` |
| `staging-schedule-site-slug-edit-dry-run.ts` | `hostGate` on result; `sanitizeSiteSlugEditSafeFieldPatch` |
| `staging-schedule-site-slug-edit-binding.ts` | G-9g3a phase; `g9g3aSaveUiHidden`; host gate fields |
| `staging-schedule-site-slug-title-poc-config.ts` | host gate blocks G-9g2 arm when mismatch |
| `staging-schedule-site-slug-edit-ui.ts` | multi-field preview; host gate in result |
| `AdminStagingScheduleSiteSlugEditSection.astro` | multi-field inputs; host banner; no Save |

---

## 7. Safety

- No Save button in G-9g3a section
- No `executeG9G2TitleNonDryRunSave` call from G-9g3a UI
- No Supabase write / SQL mutation
- No `service_role`
- `/admin` untouched

---

## 8. Gates

```txt
stagingShellScheduleSiteSlugSafeFieldsDryRunPreviewComplete: true
stagingShellScheduleHostHardGateImplemented: true
stagingShellScheduleMultiFieldDryRunPreviewImplemented: true
stagingShellScheduleG9g3aNoSaveUi: true
stagingShellScheduleG9g3aNotExecuted: true
readyForG9g3bVenueDescriptionPoc: true
readyForAnyDbWrite: false
```

---

## 9. Next

`G-9g3b-staging-shell-schedule-site-slug-venue-description-non-dry-run-poc` — venue + description non-dry-run slice (operator approval, one Save only).
