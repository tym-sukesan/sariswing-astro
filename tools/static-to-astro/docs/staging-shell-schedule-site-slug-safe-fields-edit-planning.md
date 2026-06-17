# Staging shell schedule site_slug safe-fields edit planning (G-9g3)

**Phase:** `G-9g3-staging-shell-schedule-site-slug-safe-fields-edit-planning`  
**Date:** 2026-06-17  
**Prior:** G-9g2 execution commit `d57dd5f`  
**Type:** planning only — no implementation, no DB write, no Supabase SQL, no Save click

---

## 1. Background

G-9g1 shipped dry-run Preview for Gosaki `site_slug=gosaki-piano`. G-9g2 proved the first **site_slug-scoped** non-dry-run write (`title` only) on staging. The target row now retains the G-9g2 PoC marker; **restore is not planned** — keep as audit trail.

This phase plans the **remaining safe fields** without over-slicing like early G-6, while keeping Sariswing-proven safety patterns and adding a **mandatory Supabase host hard gate** learned from G-9g2 operator debugging.

**This phase performed:** reuse audit, slice map, host-gate policy, speed-up plan, AI context.  
**This phase did not:** UPDATE / INSERT / DELETE, Save UI changes, SQL, `/admin`, `service_role`, FTP.

Prior docs:

- [staging-shell-schedule-site-slug-edit-planning.md](./staging-shell-schedule-site-slug-edit-planning.md)
- [staging-shell-schedule-site-slug-title-non-dry-run-poc-execution-result.md](./staging-shell-schedule-site-slug-title-non-dry-run-poc-execution-result.md)
- [schedule-cms-generalization-planning.md](./schedule-cms-generalization-planning.md)

---

## 2. Current baseline (post G-9g2)

```txt
Supabase project: static-to-astro-cms-staging
Host: kmjqppxjdnwwrtaeqjta.supabase.co
Table: public.schedules
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
site_slug: gosaki-piano
title: [CMS Kit staging] G-9g2 title PoC   ← PoC marker retained
venue: NULL
open_time / start_time / price: NULL
description: 出演：
updated_at: 2026-06-17T06:12:13.105898+00:00 (after G-9g2 Save)
```

Routine dev: `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; G-9g2 arm off.

---

## 3. Goals

1. Edit **safe fields** on Gosaki staging rows with `site_slug` scoping
2. Reuse Sariswing / G-6 patterns — do **not** reinvent write adapter semantics
3. **Fewer phases than G-6 one-field-at-a-time** where risk is equivalent
4. **Never weaken** host gate, optimistic lock, dry-run prerequisite, or approval discipline
5. Keep G-9f read section and frozen G-6 PoC paths untouched

---

## 4. Safe fields scope

| Field | G-9g2 | G-9g3 plan | Notes |
| --- | --- | --- | --- |
| `title` | **Done** (PoC marker kept) | No re-slice unless restore phase | G-9g2 path frozen |
| `venue` | — | G-9g3b non-dry-run | Text; G-6-f6 proved pair with description |
| `description` | — | G-9g3b non-dry-run | With venue in one slice |
| `open_time` | — | G-9g3c non-dry-run | Pair with `start_time` (G-6-g2 lesson) |
| `start_time` | — | G-9g3c non-dry-run | Nullable text |
| `price` | — | G-9g3c non-dry-run | Can share slice with time fields if preview clean |

**Out of scope (G-9g3):** `date`, `published`, `show_on_home`, `home_order`, `sort_order`, `source_route`, INSERT/DELETE, `schedule_months` writes.

Helper already lists safe fields: `SITE_SLUG_EDIT_SAFE_FIELDS` in `staging-schedule-site-slug-config.ts`.

---

## 5. Sariswing CMS — reusable assets

### 5.1 Dry-run (reuse / extend)

| Asset | Location | G-9g3 use |
| --- | --- | --- |
| Site_slug dry-run builder | `staging-schedule-site-slug-edit-dry-run.ts` | **Extend G-9g3a** — multi-field inputs for all safe fields |
| G-6-f4 safe-fields dry-run UI | `staging-schedule-safe-fields-dry-run-ui.ts` | UX reference (row picker, field inputs) |
| Stale check | `schedule-optimistic-lock-dry-run.ts` | Reuse unchanged |
| `actualWrite: false` | dry-run builders | Mandatory |

G-9g1 already calls `buildSiteSlugScheduleEditDryRunResult` with full safe-field patch support; G-9g3a adds **UI inputs** for venue/time/price/description (title input exists).

### 5.2 Write path (reuse / generalize)

| Asset | Location | G-9g3 use |
| --- | --- | --- |
| `updateScheduleWrite` + `writeScope` | `schedule-write-adapter.ts` | **Reuse** — id + site_slug + legacy_id + updated_at |
| `buildScheduleLockedWriteRequest` | `schedule-general-update-trigger.ts` | **Reuse** |
| `assertBeforeSnapshotSiteSlugScope` | `schedule-write-guards.ts` | **Reuse** |
| `executeG9G2TitleNonDryRunSave` | `staging-schedule-site-slug-title-poc-save.ts` | **Generalize** → `executeG9GxSiteSlugNonDryRunSave` with slice config |
| Payload guards | `assertG6F6*`, `assertG6G2*`, `assertG9G2*` | **Add** `assertG9G3bVenueDescriptionPayloadOnly`, `assertG9G3cTimePricePayloadOnly` |
| Auth warnings | `schedule-non-dry-run-poc-auth.ts` | Reuse |

### 5.3 Config / arm pattern (reuse)

| Asset | G-6 / G-9g2 | G-9g3 pattern |
| --- | --- | --- |
| Env arm + approval ID | G-9g2 title poc config | One config module per non-dry-run slice **or** shared `getG9G3SliceConfig({ slice })` |
| `SCHEDULE_WRITE_APPROVAL_IDS` | register approval | New IDs per slice |
| Operator approval text | preflight docs | One text block per slice |
| Preflight → impl → execution docs | G-6-g1 / G-9g2 | Same doc chain, **shorter** per slice |

### 5.4 Do not reuse / do not extend

| Path | Reason |
| --- | --- |
| `executeScheduleGeneralUpdateWrite` (G-6-g) | No `site_slug` UPDATE filter — **frozen** |
| G-6-e5 / G-6-f6 hidden PoC triggers | Frozen — do not re-arm |
| `/admin` schedule CRUD | Out of Kit scope |
| `service_role` | Never |

### 5.5 General edit UI reference (future G-9g3d)

| Asset | Location |
| --- | --- |
| `AdminStagingScheduleGeneralEditSection` | G-6-g product path (no site_slug) |
| `staging-schedule-general-edit-ui.ts` | Preview + gated Save, stale, approval confirm |
| `schedule-general-edit-config.ts` | Multi-slice arm (G-6-g1 / G-6-g2 single-arm) |

G-9g3d should **mirror** general edit UX inside `AdminStagingScheduleSiteSlugEditSection`, not fork G-6 section.

---

## 6. G-9g2 lessons — speed-up without safety loss

### 6.1 What slowed G-9g2

| Issue | Impact | G-9g3 mitigation |
| --- | --- | --- |
| **No Supabase host hard gate** | Operator debug time; production `.env` risk | **G-9g3a mandatory** — `armed=false` if host ≠ expected |
| **Long env stack** | Many vars for one Save | Shared `G9G3_*` base config + slice-specific arm only |
| **SSR `g9g2Armed` vs client config** | Confusing ARMED=false display | Single `getG9G3ArmStatus()` used SSR + client; show `armFailureReason` + **active host** |
| **Per-field micro-docs** | 4 docs per slice (planning/impl/preflight/execution) | **Bundle docs** where slices are paired (venue+description one chain) |
| **Title-only UI first** | Re-work for multi-field | G-9g3a adds all safe-field inputs in dry-run in one pass |
| **tools/static-to-astro/.env.local** | Not loaded by Astro dev | Document: **repo root `.env.local` only** |
| **Dev server restart** | PUBLIC_* not picked up | Preflight checklist: restart after env change |

### 6.2 What to keep from G-9g2

- `writeScope` on adapter (site_slug + legacy_id)
- Dry-run before Save in same session
- `changedFields` whitelist on Save enable
- Separate approval ID per non-dry-run slice
- Operator manual Save once; Cursor never clicks
- PoC markers in payload values for audit (`[CMS Kit staging] G-9g3b …`)

### 6.3 Speed-up policy

```txt
Dry-run:     one multi-field preview UI (G-9g3a) — batch verify UX
Non-dry-run: 2–3 slices total (not 5 one-field slices)
Docs:        planning + preflight per slice; combine impl+execution when diff is small
Code:        generic site_slug save executor + slice guards (not copy-paste per field)
```

---

## 7. Mandatory safety (G-9g3+)

All G-9g3 implementation phases **must** include:

### 7.1 Active Supabase host hard gate

```txt
expectedHost: kmjqppxjdnwwrtaeqjta.supabase.co
expectedProject: static-to-astro-cms-staging
activeHost: extractSupabaseHost(PUBLIC_SUPABASE_URL)
```

| Condition | Behavior |
| --- | --- |
| `activeHost === expectedHost` | Host gate pass |
| `activeHost !== expectedHost` | `armed=false`, Save disabled, visible error |
| Missing URL | `armed=false` |

Apply in: slice config (`getG9G3*Config`), SSR binding, client Save gate, optional save preflight.

**UI:** show `Active host` + `Expected host` + match status in edit section (like G-9f read section).

### 7.2 UPDATE scope (unchanged from G-9g2)

```txt
.eq("id", targetId)
.eq("site_slug", "gosaki-piano")
.eq("legacy_id", "schedule-2026-07-010")
.eq("updated_at", expectedBeforeUpdatedAt)
```

### 7.3 changedFields whitelist

Each non-dry-run slice registers allowed keys. Save enabled only when preview `changedFields` **exactly matches** slice whitelist (order-normalized).

### 7.4 Dry-run prerequisite

Preview success + `actualWrite=false` + `stale=false` before Save.

### 7.5 Operator approval

One approval text per non-dry-run slice; one manual Save per execution phase.

### 7.6 Single-arm

Only one G-9g3 non-dry-run slice armed at a time (extend G-9g2 single-arm pattern).

---

## 8. Implementation slices

### G-9g3 (this phase)

Planning + docs only.

### G-9g3a — host hard gate + safe-fields dry-run preview

```txt
Phase: G-9g3a-staging-shell-schedule-site-slug-safe-fields-dry-run-preview
Scope:
  - Supabase host hard gate in config + UI (armed=false on mismatch)
  - Extend AdminStagingScheduleSiteSlugEditSection inputs:
      venue, open_time, start_time, price, description
  - Preview dry-run for any safe-field combination (actualWrite=false)
  - Display activeHost / expectedHost / hostGateOk
Save: none
DB write: none
```

Deliverables:

- `getG9G3HostGateConfig()` or extend title poc config → shared `getG9G3SiteSlugEditConfig()`
- Multi-field dry-run UI (reuse G-9g1 builder)
- Verifier: host gate assertions

### G-9g3b — venue + description non-dry-run PoC

```txt
Phase: G-9g3b-staging-shell-schedule-site-slug-venue-description-non-dry-run-poc
Fields: venue + description only
Target: aa440e29-5be8-402e-9190-0d81c48434c0 (same row; title unchanged)
Approval ID: G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc
Env arm: PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED=true
Payload example:
  venue: [CMS Kit staging] G-9g3b venue PoC
  description: 出演： [CMS Kit staging] G-9g3b description PoC
Rationale: G-6-f6 proved venue+description pair; one Save vs two
```

### G-9g3c — open_time + start_time + price non-dry-run PoC

```txt
Phase: G-9g3c-staging-shell-schedule-site-slug-time-price-non-dry-run-poc
Fields: open_time + start_time + price only
Approval ID: G-9g3c-schedule-site-slug-time-price-non-dry-run-poc
Env arm: PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED=true
Payload example:
  open_time: [CMS Kit staging] G-9g3c open PoC
  start_time: [CMS Kit staging] G-9g3c start PoC
  price: [CMS Kit staging] G-9g3c price PoC
Rationale: G-6-g2 did time pair; price is nullable text — bundle for speed
Alternative: split price to G-9g3c2 only if preview/save guards get messy
```

### G-9g3d — general safe-fields edit UI

```txt
Phase: G-9g3d-staging-shell-schedule-site-slug-safe-fields-general-edit-ui
Scope:
  - Row picker filtered by site_slug (optional: start with fixed row)
  - All safe fields editable in one form
  - Dry-run preview always available
  - Non-dry-run: gated per-field-group OR single "Save safe fields" with
    explicit changedFields detection — ONLY after G-9g3b/c PoCs prove path
  - Host gate + optimistic lock always on
Defer until: G-9g3a–c complete
```

---

## 9. Bundle vs split — recommendation

| Concern | Bundle OK? | Recommendation |
| --- | --- | --- |
| Dry-run preview (all safe fields) | **Yes** | G-9g3a — one Preview button, `changedFields` from diff |
| Host hard gate | **Yes** | G-9g3a — applies to all later slices |
| title non-dry-run | **No** | Already done G-9g2; leave marker |
| venue + description Save | **Yes** | G-9g3b one slice (G-6-f6 precedent) |
| open_time + start_time + price Save | **Yes** | G-9g3c one slice (nullable text; low routing impact) |
| venue + time in one Save | **No** | Different risk classes; harder rollback |
| All safe fields one Save | **Not yet** | G-9g3d after PoCs; needs strong changedFields guard |
| published / date / sort_order | **No** | Later G-9g5+ with routing review |
| Per-field approval IDs (G-6 style) | **Avoid** | Unless operator requests audit granularity |

---

## 10. Operator approval text (templates)

### G-9g3b (venue + description)

```txt
承認します。G-9g3b venue+description non-dry-run PoC として、static-to-astro-cms-staging の public.schedules で、id=aa440e29-5be8-402e-9190-0d81c48434c0 / legacy_id=schedule-2026-07-010 / site_slug=gosaki-piano の1行について、venue と description のみを更新します。active host が kmjqppxjdnwwrtaeqjta.supabase.co であること、dry-run preview と optimistic lock が成功している場合のみ1回だけ実行し、他フィールド・他site・本番には触りません。
```

### G-9g3c (time + price)

```txt
承認します。G-9g3c time+price non-dry-run PoC として、static-to-astro-cms-staging の public.schedules で、id=aa440e29-5be8-402e-9190-0d81c48434c0 / legacy_id=schedule-2026-07-010 / site_slug=gosaki-piano の1行について、open_time・start_time・price のみを更新します。active host が kmjqppxjdnwwrtaeqjta.supabase.co であること、dry-run preview と optimistic lock が成功している場合のみ1回だけ実行し、他フィールド・他site・本番には触りません。
```

---

## 11. Expected beforeSnapshot (G-9g3b/c preflight baseline)

Post G-9g2 — operator re-confirms before each slice:

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
site_slug: gosaki-piano
title: [CMS Kit staging] G-9g2 title PoC    ← unchanged in G-9g3b/c
venue: NULL
open_time / start_time / price: NULL
description: 出演：
updated_at: (record at preflight — optimistic lock baseline)
```

---

## 12. Code path map (planned)

```txt
G-9g3a  host gate + multi-field dry-run
          → buildSiteSlugScheduleEditDryRunResult (existing)
          → getG9G3SiteSlugEditConfig (new shared)

G-9g3b  executeG9G3bVenueDescriptionNonDryRunSave
          → executeG9GxSiteSlugNonDryRunSave (new generic)
          → updateScheduleWrite + writeScope

G-9g3c  executeG9G3cTimePriceNonDryRunSave
          → same generic executor

G-9g3d  general UI → slice configs + row picker
```

Frozen: G-9g2 title path (do not modify Save behavior), G-6 paths.

---

## 13. Risks

| Risk | Mitigation |
| --- | --- |
| Production Supabase via root `.env` | **Host hard gate** (G-9g3a) |
| Cross-site UPDATE | `writeScope.site_slug` + guards |
| Over-bundled Save | Whitelist `changedFields`; slice-specific guards |
| G-9g2 title marker overwritten | G-9g3b/c guards reject `title` in payload |
| Stale row | Optimistic lock + preview stale banner |
| Env misconfiguration | armFailureReason + host display + dev restart note |

---

## 14. Verification (G-9g3 planning)

```bash
cd tools/static-to-astro
node scripts/verify-gosaki-schedule-seed-extractor.mjs
node scripts/verify-url-to-staging-pipeline.mjs
node scripts/verify-crawl-static-site.mjs
node scripts/verify-gosaki-font-safety.mjs
npm run verify:manual-upload
```

G-9g3a implementation will add host-gate code assertions.

---

## 15. Gates

```txt
stagingShellScheduleSiteSlugSafeFieldsEditPlanningComplete: true
stagingShellScheduleSafeFieldsSliceMapDefined: true
stagingShellScheduleHostHardGateRequired: true
stagingShellScheduleSafeFieldsReuseAuditComplete: true
stagingShellScheduleG9g3SpeedUpPolicyDefined: true
stagingShellNoWriteUiAdded: true
stagingShellNoAdminRouteTouched: true
readyForG9g3aHostGateAndDryRunImplementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 16. Next phase

**G-9g3a-staging-shell-schedule-site-slug-safe-fields-dry-run-preview** — host hard gate + multi-field dry-run inputs. No Save, no DB write.
