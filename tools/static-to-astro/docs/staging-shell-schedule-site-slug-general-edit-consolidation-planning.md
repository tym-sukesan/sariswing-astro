# Staging shell schedule site_slug general edit consolidation planning (G-9g3d)

**Phase:** `G-9g3d-staging-shell-schedule-site-slug-general-edit-consolidation-planning`  
**Date:** 2026-06-17  
**Prior:** G-9g3c execution — commit `d53d167`  
**Type:** planning only — **no implementation, no Save, no DB write, no Supabase SQL execution**

---

## 1. Background

Gosaki pilot row (`site_slug=gosaki-piano`) now has **all safe-field non-dry-run PoC slices executed**:

| Slice | Fields | Status |
| --- | --- | --- |
| G-9g2 | `title` | execution succeeded |
| G-9g3b | `venue`, `description` | execution succeeded |
| G-9g3c | `open_time`, `start_time`, `price` | execution succeeded |

G-9g3a already ships multi-field dry-run preview with host hard gate. G-9g3d consolidates the **three slice-specific Save paths** into one **general safe-fields edit UX** inside `AdminStagingScheduleSiteSlugEditSection`, mirroring G-6 general edit patterns but with `site_slug` scoping.

Parent planning: [staging-shell-schedule-site-slug-safe-fields-edit-planning.md](./staging-shell-schedule-site-slug-safe-fields-edit-planning.md) §5.5, §8 G-9g3d

Execution results:

- [staging-shell-schedule-site-slug-title-non-dry-run-poc-execution-result.md](./staging-shell-schedule-site-slug-title-non-dry-run-poc-execution-result.md)
- [staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md](./staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md)
- [staging-shell-schedule-site-slug-time-price-non-dry-run-poc-execution-result.md](./staging-shell-schedule-site-slug-time-price-non-dry-run-poc-execution-result.md)

**This phase performed:** consolidation strategy, PoC UI freeze policy, Save safety design, approval/env proposals, phase sequence, rollback policy, CMS Kit migration notes.  
**This phase did not:** implementation, Save click, UPDATE / INSERT / DELETE / UPSERT / RPC, `/admin` changes, `service_role`, FTP.

---

## 2. Current pilot row baseline (post G-9g3c)

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
title:      [CMS Kit staging] G-9g2 title PoC
venue:      [CMS Kit staging] G-9g3b venue PoC
open_time:  [CMS Kit staging] G-9g3c open PoC
start_time: [CMS Kit staging] G-9g3c start PoC
price:      [CMS Kit staging] G-9g3c price PoC
description: 出演： [G-9g3b venue+description PoC]
updated_at: 2026-06-17T15:45:35.433566+00:00
```

**Do not re-run G-9g2 / G-9g3b / G-9g3c Save.**

---

## 3. Goals

1. Replace slice-specific Save UX with one **general safe-fields editor** (staging shell only)
2. Preserve all proven safety: host gate, optimistic lock, dry-run prerequisite, `writeScope`, approval discipline
3. **Freeze** legacy PoC Save buttons — code retained, re-execution blocked in UI
4. Improve operator clarity: loaded DB value vs candidate edit value
5. Path toward Musician CMS Kit multi-tenant `site_slug` editor without touching Sariswing `/admin`

---

## 4. Legacy PoC Save UI — handling policy

### 4.1 Recommendation: **freeze + hide by default, developer-only disclosure**

| Slice | Current UI | G-9g3d1 policy |
| --- | --- | --- |
| G-9g2 title Save | hidden via `g9g3aSaveUiHidden` when not armed | **Keep frozen** — never re-arm in routine dev |
| G-9g3b venue+description Save | visible when armed | **Hide by default** — only show in collapsed "Legacy PoC (executed — do not re-run)" panel when `PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE=true` (new optional dev flag, default off) |
| G-9g3c time+price Save | visible when armed | Same as G-9g3b |

### 4.2 Re-execution prevention (UI + config)

```txt
- Slice env arms (G9G2 / G9G3B / G9G3C): hard-disabled when G9G3D general edit armed
- Slice Save buttons: disabled={true} permanently unless legacy dev flag + explicit slice arm (both off by default)
- Binding banner: "G-9g2/G-9g3b/G-9g3c PoC executed — do not re-run"
- armFailureReason if slice arm attempted: "Slice PoC complete — use G-9g3d general edit"
```

### 4.3 Code retention

- **Do not delete** `executeG9G2TitleNonDryRunSave`, `executeG9G3bVenueDescriptionNonDryRunSave`, `executeG9G3cTimePriceNonDryRunSave`, or slice guards
- Treat as **frozen audit trail** — verifier keeps assertions
- General edit uses **new** executor + guard, not slice executors

---

## 5. General edit UI — consolidation strategy

### 5.1 Form model: **one unified safe-fields form**

All six fields in one section (already present for dry-run inputs from G-9g3a):

```txt
title, venue, open_time, start_time, price, description
```

Single row target for G-9g3d pilot (same `aa440e29-…` row). Row picker deferred to G-9g3e+.

### 5.2 Save model: **one Save button — changed fields only**

| Option | Verdict | Rationale |
| --- | --- | --- |
| Per-field-group Save (title / venue+desc / time+price) | **Reject** | Recreates slice UX; operator confusion |
| Full safe-fields payload every Save | **Reject** | Over-writes unchanged fields; harder guards |
| **Single Save with changed-fields-only payload** | **Adopt** | Matches dry-run `changedFields`; minimal blast radius |

### 5.3 Preview model: **one Preview dry-run — full diff**

- Reuse `buildSiteSlugScheduleEditDryRunResult` (G-9g3a)
- Show `before` / `after` / `changedFields` for **all** safe fields
- `actualWrite=false` always on preview
- Save enabled only when `changedFields.length > 0` and subset of `SITE_SLUG_EDIT_SAFE_FIELDS`

### 5.4 Reference implementation

Mirror G-6 `AdminStagingScheduleGeneralEditSection` + `staging-schedule-general-edit-ui.ts` patterns:

- Session dry-run validity flag
- Stale optimistic lock blocks Save
- Input values must match previewed values at Save time
- Non-target fields unchanged check against loaded row

Difference: G-9g3d adds `site_slug` + `legacy_id` scope and host hard gate (already in G-9g3a).

---

## 6. Save safety design

### 6.1 Payload whitelist

```txt
Allowed keys: subset of SITE_SLUG_EDIT_SAFE_FIELDS present in changedFields
Forbidden: date, published, show_on_home, home_order, sort_order, source_route, updated_at, site_slug, id
Guard: assertG9G3dGeneralEditPayloadOnly(payload, allowedKeys)
```

Save path builds payload from preview `changedFields` only — not from unconstrained form state.

### 6.2 changedFields whitelist

```txt
Save enabled when:
  changedFields.length >= 1
  every key in changedFields ∈ SITE_SLUG_EDIT_SAFE_FIELDS
  no key outside changedFields in payload
  changedFields matches preview session (order-independent)
```

No fixed field-bundle requirement (unlike G-9g3b/c slices).

### 6.3 Empty string / null normalization

| Field | DB type | Rule |
| --- | --- | --- |
| `title` | text, required for display | Empty string → **abort Save** (title cannot be cleared) |
| `venue`, `open_time`, `start_time`, `price` | nullable text | Trim; `""` → `null` in payload |
| `description` | nullable text | Trim; `""` → `null`; preserve intentional prefix `出演：` when operator sets it |

**Dry-run display:** null may render as `""` in `after` — `changedFields` remains source of truth (G-9g3b lesson).

**Null → value and value → null** both valid when preview confirms.

### 6.4 Optimistic lock + scope

```txt
expectedBeforeUpdatedAt: from loaded row at preview time
UPDATE scope:
  .eq("id", targetId)
  .eq("site_slug", siteSlug)
  .eq("legacy_id", legacyId)
  .eq("updated_at", expectedBeforeUpdatedAt)
writeScope: { siteSlug, legacyId }
```

Lock baseline for G-9g3d preflight: `updated_at` = `2026-06-17T15:45:35.433566+00:00` (verify live).

### 6.5 Host hard gate

```txt
expectedHost: kmjqppxjdnwwrtaeqjta.supabase.co
production STOP: vsbvndwuajjhnzpohghh.supabase.co
hostGatePassed required for Save enable
```

### 6.6 Approval ID (proposed)

```txt
G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc
```

Register in `SCHEDULE_WRITE_APPROVAL_IDS` during G-9g3d1 implementation. **Not** G-9g2 / G-9g3b / G-9g3c IDs.

### 6.7 Env arm (proposed)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED=true
```

Plus standard staging write stack (inline env in execution — do not commit `.env`).

Optional legacy PoC UI disclosure (default off):

```txt
PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE=true
```

### 6.8 Single-arm

When G-9g3d armed, these **must be off**:

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED
PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED
PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED
service_role
production Supabase URL / keys
```

### 6.9 Auth

- Staging admin signed in before Save (execution phase)
- Reuse `collectScheduleNonDryRunPocAuthWarnings` / `isSignedInStagingAuth`
- **UI:** persistent banner when signed out: "Sign in as staging admin before Save"

### 6.10 service_role

**Never.** Anon key + authenticated session only.

---

## 7. UI/UX improvements (G-9g3d1)

### 7.1 Loaded vs candidate values

| Column | Source | Label |
| --- | --- | --- |
| Loaded (read-only) | DB row at load / post-Save refresh | "Loaded from DB" |
| Candidate (editable) | Form inputs | "Edit value" |

**Remove** PoC default auto-fill on arm (G-9g3b/c lesson — confused operator during preflight). Inputs initialize from loaded row only.

### 7.2 Preview panel

```txt
before / after / changedFields (highlighted)
optimisticLock: expectedBeforeUpdatedAt, currentUpdatedAt, stale
hostGatePassed, actualWrite=false
```

### 7.3 Save disabled reasons

Expose `canEnableG9G3dSave().reason` in hint element (existing pattern). Examples:

```txt
"Sign in as staging admin before Save"
"Dry-run preview required"
"Stale — re-run preview"
"No fields changed"
"Host gate failed"
"G-9g3d not armed"
```

### 7.4 Auth pre-warning

Show signed-out state in section header before operator edits. Disable Save with explicit auth reason (not silent).

### 7.5 General Save button label

```txt
Save safe fields
```

Distinct from legacy "Save time+price PoC" etc.

---

## 8. Implementation outline (G-9g3d1 — not this phase)

| File | Role |
| --- | --- |
| `staging-schedule-site-slug-config.ts` | G-9g3d constants, env arm, phase id |
| `staging-schedule-site-slug-general-edit-poc-config.ts` | Env arm + host gate + single-arm |
| `staging-schedule-site-slug-general-edit-poc-save.ts` | `executeG9G3dGeneralEditNonDryRunSave` |
| `schedule-write-guards.ts` | `assertG9G3dGeneralEditPayloadOnly` |
| `schedule-write-types.ts` | G-9g3d approval ID |
| `staging-schedule-site-slug-edit-binding.ts` | G-9g3d binding; legacy PoC freeze flags |
| `staging-schedule-site-slug-edit-ui.ts` | General Save gating; legacy slice UI freeze |
| `AdminStagingScheduleSiteSlugEditSection.astro` | Unified form UX; legacy PoC collapsed panel |
| `verify-url-to-staging-pipeline.mjs` | G-9g3d assertions |

Write path:

```txt
executeG9G3dGeneralEditNonDryRunSave
  → buildScheduleLockedWriteRequest
  → updateScheduleWrite + writeScope
```

---

## 9. Phase sequence after planning

```txt
G-9g3d-planning                    ← this phase (complete)
G-9g3d1-general-edit-consolidation-implementation   ← UI + executor + guards; no Save
G-9g3d2-general-edit-dry-run-smoke-test             ← operator Preview only; no Save
G-9g3d3-general-edit-non-dry-run-preflight          ← beforeSnapshot / rollback / env stack
G-9g3d4-general-edit-execution                    ← operator manual Save once
```

G-9g3d2 may merge with G-9g3d3 if smoke is trivial (same pattern as G-9g3a).

---

## 10. Rollback / restore policy

| Question | Recommendation |
| --- | --- |
| Restore PoC markers to pre-G-9g2 state? | **No** — keep as audit trail |
| `rollbackNeeded` now? | **false** — unchanged |
| General edit pilot row | **Same row** (`aa440e29-…`) — proven scope; live `updated_at` verify before Save |
| New row for general edit? | **Defer** — use after G-9g3d4 success or when row picker ships (G-9g3e) |
| Rollback SQL template | Include in G-9g3d3 preflight — operator-only, not executed in planning |

PoC marker restore is **not** required for Kit progress. If operator ever requests restore, separate approval per field group.

---

## 11. Musician CMS Kit generalization

### 11.1 From Gosaki PoC to Kit editor

```txt
Now:     site_slug fixed binding (gosaki-piano) + single pilot row
G-9g3d:  general edit on same binding — proves changed-fields-only Save
G-9g3e:  site_slug row picker (filter schedules by site_slug)
G-9g4+:  second customer site_slug pilot (non-gosaki)
G-10+:   extract staging-shell schedule editor as Kit module template
```

### 11.2 Multi-tenant safety

- `writeScope.site_slug` on every UPDATE (non-negotiable)
- Host gate per deployment (staging vs production project ref)
- Approval ID per write class (general edit vs future INSERT)
- Never share Sariswing production Supabase project with Kit staging

### 11.3 Sariswing `/admin` separation

- All G-9g3d work stays in `/__admin-staging-shell/musician-basic/#schedule`
- Do **not** modify `src/pages/admin` until explicit future product phase
- G-6 general edit section remains frozen reference — do not wire Kit to `/admin`

### 11.4 Repo separation timing

| Milestone | Repo action |
| --- | --- |
| G-9g3d4 execution success | Document Kit editor contract in `tools/static-to-astro/docs/` |
| Second `site_slug` customer write PoC | Evaluate extracting `src/lib/admin/staging-*` to Kit package |
| Gosaki production CMS cutover | Separate repo / deploy boundary — **not before G-9g3d proven** |

Recommendation: **repo separation planning** after G-9g3d4 + one non-write Kit onboarding doc — not in G-9g3d implementation.

---

## 12. Operator approval text (execution phase template)

**Not required for this planning phase.**

```txt
承認します。G-9g3d general edit non-dry-run PoC として、static-to-astro-cms-staging の public.schedules で、id=aa440e29-5be8-402e-9190-0d81c48434c0 / legacy_id=schedule-2026-07-010 / site_slug=gosaki-piano の1行について、dry-run preview で確認された safe fields（title / venue / open_time / start_time / price / description の変更分のみ）を更新します。active host が kmjqppxjdnwwrtaeqjta.supabase.co であること、optimistic lock と host gate が成功している場合のみ1回だけ実行し、変更対象外フィールド・他site・本番には触りません。
```

---

## 13. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Accidental slice PoC re-Save | Freeze slice UI; single-arm; legacy arm blocked |
| Full-form overwrite | changed-fields-only payload + guard |
| Empty title Save | Explicit abort if title cleared |
| description `出演：` lost | Normalization preserves operator input; preview shows diff |
| Stale row | Optimistic lock + stale banner |
| Production host | Host hard gate STOP |
| PoC auto-fill confusion | Remove arm-time default injection; loaded vs candidate columns |
| Cross-site UPDATE | writeScope + beforeSnapshot scope guard |

---

## 14. Verification (planning phase)

Docs-only. Optional verifier markers added for G-9g3d planning doc existence and gates.

Post-implementation:

```bash
cd tools/static-to-astro
node scripts/verify-url-to-staging-pipeline.mjs
```

---

## 15. Gates

```txt
stagingShellScheduleGeneralEditConsolidationPlanningComplete: true
stagingShellScheduleLegacyPocSlicesComplete: true
stagingShellScheduleGeneralEditStrategyDefined: true
stagingShellScheduleGeneralEditPayloadChangedFieldsOnly: true
stagingShellScheduleLegacyPocSaveFreezePolicyDefined: true
stagingShellScheduleGeneralEditNotImplemented: true
readyForG9g3d1GeneralEditConsolidationImplementation: true
readyForG9g3dExecution: false
readyForG9g2Execution: false
readyForG9g3bExecution: false
readyForG9g3cExecution: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

---

## 16. Next

**G-9g3d1-staging-shell-schedule-site-slug-general-edit-consolidation-implementation** — unified form UX, `executeG9G3dGeneralEditNonDryRunSave`, legacy PoC Save freeze. No Save / DB write in implementation phase.
