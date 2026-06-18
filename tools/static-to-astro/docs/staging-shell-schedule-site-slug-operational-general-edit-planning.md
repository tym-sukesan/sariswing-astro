# Staging shell schedule site_slug operational general edit planning (G-9g3g)

**Phase:** `G-9g3g-operational-general-edit-planning`  
**Status:** **G-9g3g planning completed**  
**Date:** 2026-06-18  
**Prior:** G-9g3f3d hardening smoke — commit `a1cfcba`  
**Type:** planning only — **no implementation, no Save, no DB write, no Supabase SQL execution**

| Check | Status |
| --- | --- |
| Save clicked | **no** |
| Preview clicked (Cursor) | **no** |
| DB write executed | **no** |
| SQL executed | **no** |
| Operational Save implemented | **no** |

Prior docs:

- [staging-shell-schedule-site-slug-general-edit-consolidation-planning.md](./staging-shell-schedule-site-slug-general-edit-consolidation-planning.md) (G-9g3d PoC)
- [staging-shell-schedule-site-slug-row-picker-general-edit-binding-planning.md](./staging-shell-schedule-site-slug-row-picker-general-edit-binding-planning.md)
- [staging-shell-schedule-site-slug-row-picker-general-edit-binding-hardening-smoke-test-result.md](./staging-shell-schedule-site-slug-row-picker-general-edit-binding-hardening-smoke-test-result.md)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.**

---

## Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditPlanningComplete: true
readyForG9g3g1OperationalSavePathImplementation: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

---

## 1. Purpose — operational general edit

Elevate the **frozen G-9g3d pilot-row PoC** into an **operational** general edit path for **operator-selected non-PoC rows** on staging shell only.

| Goal | Policy |
| --- | --- |
| Edit target | Row picker → selected non-PoC `gosaki-piano` schedule row |
| Write scope | Safe fields only; **changed-fields-only** payload |
| Tenant safety | `site_slug` scope enforced on read + write |
| Concurrency | `id` + `legacy_id` + `site_slug` + `updated_at` optimistic lock |
| Save path | **New** operational executor — not G-9g3d PoC Save |
| PoC rows | Audit-only; not selectable (`isPocAuditScheduleRow`) |
| Production `/admin` | **Out of scope** — staging shell `__admin-staging-shell/musician-basic/` only |
| Auth | Staging admin session + anon key (no `service_role`) |

### What exists today (post G-9g3f3d)

```txt
Row picker → general edit hydrate     ✓ (G-9g3f3a)
G-9 changed-fields-only Preview       ✓ (G-9g3f3b–f3d)
Dirty switch / stale / identity UX  ✓ (G-9g3f3c–f3d)
Operational Save                    ✗ (frozen G-9g3d PoC on pilot row only)
```

---

## 2. Safe fields — operational scope

### 2.1 In scope (G-9g3g operational MVP)

```txt
title, venue, open_time, start_time, price, description
```

Same set as `SITE_SLUG_EDIT_SAFE_FIELDS` and G-9g3d PoC.

### 2.2 Deferred (separate future phases)

| Field group | Rationale for deferral |
| --- | --- |
| `date` | Routing / month pages; higher blast radius |
| `published` | Site visibility; needs publish workflow |
| `show_on_home`, `home_order` | Homepage CMS coupling |
| `sort_order` | List ordering policy TBD |
| Image / media fields | Storage + FTP; not in schedules safe-field path yet |

---

## 3. Approval ID proposal

**Adopt:**

```txt
G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run
```

| ID | Role |
| --- | --- |
| `G-9g1-schedule-site-slug-edit-dry-run-preview` | G-9 Preview dry-run (unchanged) |
| `G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc` | **Frozen** pilot PoC Save — do not reuse |
| `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` | **New** operational non-dry-run Save |

Register in `SCHEDULE_WRITE_APPROVAL_IDS` at implementation (`G-9g3g1`).

`PUBLIC_ADMIN_WRITE_APPROVAL_ID` must match exactly when armed.

---

## 4. Env arm proposal

**Adopt:**

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED
```

### 4.1 Single-arm mutual exclusion

When `G9G3G_OPERATIONAL…_ARMED=true`, **all** of the following must be **off**:

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED
```

`G9G3D_GENERAL_EDIT_POC_EXECUTED=true` remains a hard block on G-9g3d re-arm regardless.

### 4.2 Routine dev default

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=unset (off)
```

Operational non-dry-run requires explicit operator stack in execution phase only.

---

## 5. Save gate design

Operational Save **enabled** only when **all** gates pass:

| # | Gate | Source / note |
| --- | --- | --- |
| 1 | Staging host only | `evaluateSupabaseHostGate` — `kmjqppxjdnwwrtaeqjta.supabase.co` |
| 2 | Production host block | `isKnownProductionHost` → STOP |
| 3 | No `service_role` | Executor uses anon + session only |
| 4 | Signed-in staging admin | `isSignedInStagingAuth` |
| 5 | `ENABLE_ADMIN_STAGING_WRITE=true` | Staging write flag |
| 6 | `PUBLIC_ADMIN_WRITE_DRY_RUN=false` | Non-dry-run arm |
| 7 | Operational env arm `true` | G-9g3g arm only |
| 8 | Approval ID match | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| 9 | Picker-driven binding | `data-picker-driven-binding=true` |
| 10 | Non-PoC row selected | `!isPocAuditScheduleRow(row)` |
| 11 | `changedFields.length > 0` | No no-op Save |
| 12 | `changedFields ⊆ SITE_SLUG_EDIT_SAFE_FIELDS` | Whitelist |
| 13 | Payload changed-fields-only | No unchanged keys in write payload |
| 14 | Latest G-9 Preview valid | `g9OperationalPreviewValid === true` |
| 15 | Preview not stale | No `site-slug-edit-dry-run-result--stale` |
| 16 | `optimisticLock.stale === false` | Live SELECT at Preview time |
| 17 | `expectedBeforeUpdatedAt === currentUpdatedAt` | Lock baseline match |
| 18 | Row identity match | `id`, `legacy_id`, `site_slug` vs picker + preview |
| 19 | Candidate ↔ Preview match | Each changed field value equals preview snapshot |
| 20 | Unchanged safe fields match loaded baseline | Non-changed fields not dirty vs DB |
| 21 | Save button default disabled | Enabled only when gate panel OK |
| 22 | Operator manual Save once | Cursor/AI never auto-clicks |

### UI surface (implementation phase)

```txt
Button id (proposed):  #site-slug-edit-g9g3g-operational-save-btn
Label (proposed):      Save operational general edit
Result panel:          #site-slug-edit-g9g3g-operational-save-result
```

Distinct from frozen `#site-slug-edit-g9g3d-save-btn`.

---

## 6. Preview / Save relationship

| Rule | Behavior |
| --- | --- |
| Preview path | Existing `#site-slug-edit-dry-run-preview-btn` → `buildSiteSlugScheduleEditDryRunResult` with phase `G9G3G_OPERATIONAL_PREVIEW` (or extend G-9g3f3c preview phase) |
| Preview `actualWrite` | Always `false` |
| Save payload | Must equal Preview `changedFields` + field values |
| Candidate edit after Preview | `markG9PreviewStale` → Save blocked |
| Row switch after Preview | Hydrate clears preview session → Save blocked |
| Preview result must show | `approvalId`, `changedFields`, `optimisticLock`, `hostGatePassed`, `target.id/legacy_id/site_slug` |
| Save result must show | `beforeSnapshot`, `payload`, `afterSnapshot`, `changedFields`, `rowsAffected`, `actualWrite`, safety flags |

Legacy G-6-e2 preview (`G-6-e2-schedule-dry-run-ui`) is **not** valid for operational gates.

---

## 7. Rollback strategy

| Policy | Detail |
| --- | --- |
| `beforeSnapshot` | **Required** in Save result JSON / UI |
| Rollback SQL | Documented in preflight/execution result docs — **operator manual only** |
| Cursor/AI | **Never** executes rollback SQL |
| Staging only | Rollback targets `static-to-astro-cms-staging` project only |
| Restore test | Separate phase **G-9g3g5** after first execution |
| Rollback template | **Yes** — include in `G-9g3g3` preflight doc (SELECT to verify + UPDATE revert) |
| Production | No rollback path in G-9g3g series |

If first execution changes a field, prefer **reversible** candidate (e.g. append `[CMS Kit staging] G-9g3g operational edit marker` to `description` or restore exact `before` value via rollback SQL).

---

## 8. Phase sequence (G-9g3g+)

| Phase | Scope | Save / DB |
| --- | --- | --- |
| **G-9g3g** | **This doc** — operational planning | none |
| **G-9g3g1** | Operational Save path implementation (executor, guards, config, single-arm) | none |
| **G-9g3g2** | Operational Save UI + gate smoke (dry-run only; Save disabled) | none |
| **G-9g3g3** | Operational non-dry-run preflight (beforeSnapshot, rollback SQL template, env stack doc) | none |
| **G-9g3g4** | Operational non-dry-run execution — **one** selected non-PoC row, operator manual Save once | operator only |
| **G-9g3g5** | Post-execution hardening + restore/rollback decision | operator only if rollback needed |

Optional later:

- `G-9g3h` — multi-row operational edit UX polish
- `G-9g3i` — `date` / `published` field expansion planning

---

## 9. First operational execution candidate

### 9.1 Recommended row (reuse smoke-tested non-PoC)

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |
| price baseline | `3,500円` |

**Rationale:** Used in G-9g3f3b/3d smoke; operator familiarity; non-PoC; real seed data.

### 9.2 Recommended first changed field

**Option A (preferred):** `description` append-only staging marker  
`出演： …` + `[CMS Kit staging] G-9g3g operational edit PoC`  
— Reversible via rollback SQL restoring exact `before.description`.

**Option B:** `price` temporary candidate (as smoke) — revert to `3,500円` via rollback SQL.

**Avoid for first execution:** `title` change (SEO/display sensitivity).

### 9.3 Not recommended in G-9g3g planning

| Option | Verdict |
| --- | --- |
| New dedicated test row via INSERT | **Reject in planning** — no SQL mutation this phase |
| Pilot row `aa440e29-…` | **Reject** — PoC audit-only |
| Row `09c149b1-…` | **Acceptable alternate** — used in G-9g3f3d Continue smoke |

### 9.4 Lock baseline

Capture `updated_at` at G-9g3g3 preflight via SELECT (operator or read-only tooling). Expect lock from live row state at Preview time.

---

## 10. CMS Kit generalization notes

| Theme | G-9g3g stance |
| --- | --- |
| Multi-tenant `site_slug` | All reads/writes scoped `.eq("site_slug", siteSlug)`; host gate per project |
| Row picker UX | Reuse G-9g3f1 picker + G-9g3f3 hardening (dirty/stale/identity) |
| Loaded vs candidate | Keep dual-column pattern; operational Save uses candidate after Preview |
| Preview / stale / dirty switch | **Reuse** G-9g3f3c implementation — do not regress |
| Operational Save | New path parallel to frozen PoC slices — template for future customers |
| Future row add/delete/publish | Out of scope; plan separate approval IDs per mutation type |
| Image fields | Deferred to media CMS / storage phases |
| Repo separation | Continue in `tools/static-to-astro` + staging shell templates until second customer needs extract |
| Sariswing production | Staging shell route + staging Supabase only; no `/admin` coupling |

Target end state: **Musician CMS Kit Schedule editor** = row picker + safe-field edit + G-9 Preview + gated operational Save, parameterized by `site_slug` config.

---

## 11. Implementation touchpoints (G-9g3g1 preview — not this phase)

| Area | Files (candidate) |
| --- | --- |
| Config | `staging-schedule-site-slug-config.ts` |
| Operational config | `staging-schedule-site-slug-operational-general-edit-config.ts` (new) |
| Guards | `schedule-write-guards.ts` — `assertG9G3gOperationalPayloadOnly` |
| Executor | `staging-schedule-site-slug-operational-general-edit-save.ts` (new) |
| UI | `staging-schedule-site-slug-edit-ui.ts`, `AdminStagingScheduleSiteSlugEditSection.astro` |
| Picker binding | `staging-schedule-site-slug-edit-picker-binding.ts` (Save gate hooks) |

---

## 12. Forbidden operations (planning phase)

- Save / DB write / SQL mutation: **not executed**
- FTP / deploy / workflow_dispatch: **not executed**
- `service_role`: **not used**
- `/admin` / production: **not touched**
- G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save re-run: **prohibited**

---

## 13. Verifiers (after doc commit)

```bash
node tools/static-to-astro/scripts/verify-url-to-staging-pipeline.mjs
```

---

## 14. Next phase

**`G-9g3g1-operational-save-path-implementation`**

---

## 15. Git

```txt
G-9g3f3d committed at: a1cfcba
G-9g3g planning: completed (uncommitted)
```
