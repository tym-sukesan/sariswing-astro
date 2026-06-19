# Staging shell schedule text fields operational expansion planning (G-9g4a)

**Phase:** `G-9g4a-schedule-text-fields-operational-expansion-planning`  
**Status:** **complete**  
**Date:** 2026-06-19  
**Prior:** G-9g4 field expansion planning — commit `aebbf98`  
**Type:** planning only — **no implementation, no Save, no Preview by Cursor, no DB write, no SQL mutation**

| Check | Status |
| --- | --- |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Restore / rollback SQL executed | **no** |
| service_role used | **no** |

Prior docs:

- [staging-shell-schedule-editor-usability-and-field-expansion-planning.md](./staging-shell-schedule-editor-usability-and-field-expansion-planning.md)
- [cms-kit-schedule-editor-generalization-notes.md](./cms-kit-schedule-editor-generalization-notes.md)
- [staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md](./staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.** **Do not re-click G-9g3g4 / G-9g3h1a / G-9g3h1c operational Save.**

---

## Gates

```txt
stagingShellScheduleTextFieldsOperationalExpansionPlanningComplete: true
readyForG9g4a1VenueOnlyOperationalExpansionImplementation: true
firstSlice: G-9g4a1-venue-only
operationalProvenFields: description
activeRestoreExceptionsCount: 0
markerRemainsInStagingDb: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

**Recommended next:** `G-9g4a1-venue-only-operational-expansion-implementation`

---

## 1. Current text field support audit

### UI / hydrate / dry-run Preview

| Layer | Text fields | Notes |
| --- | --- | --- |
| `SITE_SLUG_EDIT_SAFE_FIELDS` | title, venue, open_time, start_time, price, description | All six in config |
| `staging-schedule-site-slug-edit-ui.ts` | All six inputs (`site-slug-edit-dry-run-*`) | Hydrate + changed-fields detection for all safe fields |
| `staging-schedule-site-slug-edit-dry-run.ts` | All six in preview diff | `changedFields` from candidate vs loaded row |
| Row picker SELECT | All safe fields + metadata | Read-only list |

### Write paths

| Path | Fields actually saved (guards) | Operational on content rows? |
| --- | --- | --- |
| G-9g3g operational general edit | Any subset of safe fields via `assertG9G3gOperationalGeneralEditPayloadOnly` | **description only proven** (G-9g3g4) |
| G-9g3g5 restore | `description` only | proven (G-9g3g5c) |
| G-9g2 title PoC | `title` only | pilot row only — frozen |
| G-9g3b venue+description PoC | `venue` + `description` together | pilot row only — frozen |
| G-9g3c time+price PoC | `open_time`, `start_time`, `price` | pilot row only — frozen |
| G-9g3d general edit PoC | multi-field dry-run; Save frozen | pilot row only |

### Guards / executor gaps for G-9g4a1

| Item | Today | G-9g4a1 needs |
| --- | --- | --- |
| `assertG9G3gOperationalGeneralEditPayloadOnly` | Allows any safe-field combination | **Not sufficient alone** — too broad for venue-only slice |
| Field-specific operational guard | None for venue-only | `assertG9G4a1VenueOnlyPayloadOnly` (implementation) |
| Approval ID | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` | **New** `G-9g4a1-schedule-site-slug-venue-only-non-dry-run` |
| Env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` | **New** `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED` |
| Save executor entry | `executeScheduleGeneralUpdateWrite` via G-9g3g path | Dedicated `executeG9G4a1VenueOnlyNonDryRunSave` or gated wrapper |
| UI Save button routing | G-9g3g operational when armed | G-9g4a1 arm + approval when venue-only slice active |
| Verifier | G-9g3g4 / G-9g3h1 docs | New G-9g4a1* verifiers |

**Conclusion:** UI and dry-run **already support** `venue` in preview diff. Operational **non-dry-run Save** for `venue` only on **content rows** is **not yet implemented or proven** — requires G-9g4a1 slice.

---

## 2. Venue-only first slice rationale

| Criterion | `venue` | vs title | vs time/price | vs description (done) |
| --- | --- | --- | --- | --- |
| Route / date / month impact | **none** | low | none | none |
| Visibility / homepage / image | **none** | medium | none | none |
| User-facing value | **high** | high | medium | high |
| Restore complexity | **low** (single string) | medium (non-empty rule) | low | proven |
| changed-fields-only fit | **excellent** | good | pair slice | proven |
| Validation weight | trim; empty→null | non-empty required | format strings | multiline |
| PoC precedent | G-9g3b (with description, pilot) | G-9g2 | G-9g3c | G-9g3g4 operational |
| Side effects vs title | **fewer** (no SEO/title display) | — | — | — |

**Decision:** `venue` is the safest **first operational text-field expansion** after `description`.

---

## 3. G-9g4a1 venue-only implementation plan

**Next implementation phase:** `G-9g4a1-venue-only-operational-expansion-implementation`

### Scope

| Item | Value |
| --- | --- |
| Target field | `venue` only |
| Allowed payload | `{ "venue": "<candidate>" }` only |
| changedFields | `["venue"]` only |
| Forbidden in same Save | title, open_time, start_time, price, description, date, published, images, routes |

### Required behavior

| Step | Requirement |
| --- | --- |
| Preview | `actualWrite=false`, `wouldWrite=true`, `changedFields=["venue"]` |
| Save gates | Disabled unless valid Preview on selected row |
| Optimistic lock | `expectedBeforeUpdatedAt` required; stale blocks Save |
| Host gate | Staging host only (`kmjqppxjdnwwrtaeqjta.supabase.co`) |
| Approval ID | `G-9g4a1-schedule-site-slug-venue-only-non-dry-run` |
| Env arm | `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true` |
| Re-click prevention | G-9g3h1 pattern — one Save per preview identity |
| Row scope | `site_slug=gosaki-piano`; non-PoC audit row |
| service_role | forbidden |

### Implementation sub-phases (planned)

```txt
G-9g4a1-venue-only-operational-expansion-implementation
  → G-9g4a1-preflight (target row lock baseline, beforeSnapshot)
  → G-9g4a1-execution (operator Preview once + Save once — optional smoke marker)
  → G-9g4a1b-venue-restore-preflight (if smoke marker used)
  → G-9g4a1c-venue-restore-execution
  → G-9g4a1d-post-restore-hardening
```

### Out of scope for G-9g4a1

- `date`, `year`, `month`, `source_route`, `source_file`
- `published`, `show_on_home`, `home_order`, `sort_order`
- `image_url`, `home_image_url`
- Multi-field operational Save (venue + description together)
- Reuse of G-9g3g operational arm for venue Save

---

## 4. Target row recommendation

### Option A — **Preferred:** different content row (not G-9g3g4/G-9g3h1 row)

Select via row picker at G-9g4a1 preflight:

| Criterion | Requirement |
| --- | --- |
| `site_slug` | `gosaki-piano` |
| Audit | **not** PoC audit (`aa440e29-…`); no `[CMS Kit staging]` marker |
| `published` | `true` (preferred) |
| `venue` | short, human-readable (easy before/after diff) |
| `description` | clean — no operational test markers |
| History | **no** prior G-9g3g4 / G-9g3h1 description operational writes |

**Rationale:** Row `888c58f2-f152-4563-a3cf-a20d7c2456c1` was used heavily for description operational + smoke/restore round-trip. A fresh row isolates venue slice evidence and reduces confusion in docs/verifiers.

**Action at preflight:** Operator lists selectable rows in `2026-03` or `2026-04` month filter; pick first row meeting criteria; record `id`, `legacy_id`, `updated_at`, `venue` in preflight doc.

### Option B — **Acceptable fallback:** reuse known content row

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |
| venue (expected before) | `銀座 N` |
| description | original (no G-9g3h1a marker) |
| Lock baseline (reference) | `updated_at` from G-9g3h1c: `2026-06-19T02:05:42.615781+00:00` — **reconfirm live at preflight** |

**Caveat:** Venue-only change does not modify `description`; acceptable if operator confirms clean description and accepts shared row history.

**Planning recommendation:** **Option A** at G-9g4a1 preflight; document Option B as documented fallback.

---

## 5. Venue smoke candidate

If G-9g4a1 execution uses a **smoke marker** pattern (like G-9g3h1a for description):

### before.venue (expected)

```txt
銀座 N
```

(or operator-recorded value from chosen target row at preflight)

### after.venue (smoke candidate — append suffix)

```txt
銀座 N [G-9g4a1 venue smoke]
```

**Alternative (more natural for non-銀座 rows):** `{original venue} [CMS Kit staging] G-9g4a1 venue smoke` — use only if suffix pattern is clearer on long venue names.

### restore target.venue

```txt
銀座 N
```

(same as before.venue — exact original string)

**Note:** Venue smoke marker is **visible on public schedule cards** if row is published — use staging row with `published=true` only after operator accepts brief visible test, or use `published=false` row if available. Preflight must record choice.

**Marker vocabulary:** Prefer suffix `[G-9g4a1 venue smoke]` without generic `[CMS Kit staging]` alone — avoids PoC audit classification (`rowContainsPocAuditMarker`).

---

## 6. Approval ID / env arm proposal

### Comparison

| Approach | Pros | Cons |
| --- | --- | --- |
| Reuse G-9g3g operational ID/arm | Less code | Mixes description + venue slices; verifier/audit confusion; cannot prove venue-only isolation |
| **New G-9g4a1 ID/arm** | Field-slice isolation; future slices (G-9g4a2 time, etc.) follow same pattern | New constants, guards, UI gate, verifier |

### Recommended (G-9g4a1)

```txt
approvalId: G-9g4a1-schedule-site-slug-venue-only-non-dry-run
env arm:    PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true
```

### Mutual exclusion (routine dev + armed stacks)

| Arm | G-9g4a1 execution |
| --- | --- |
| `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED` | **on** (execution only) |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` | **off** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED` | **off** |
| G-9g2 / G-9g3b / G-9g3c PoC arms | **off** |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | **false** only during operator execution window; **true** in routine dev |

Register approval ID in `SCHEDULE_WRITE_APPROVAL_IDS` during implementation.

---

## 7. Safety gates (G-9g4a1 mandatory)

| Gate | Check |
| --- | --- |
| Target row selected | Row picker → hydrate |
| `site_slug` match | `gosaki-piano` |
| Non-PoC audit row | `assertOperationalNotPocAuditRow` passes |
| `changedFields` | exactly `["venue"]` |
| Payload | exactly `{ venue: <string> }` |
| `before.venue` | matches preflight expected value |
| `after.venue` | matches smoke candidate (execution) or restore target (restore) |
| Optimistic lock | `optimisticLock.stale=false` at Preview; `expectedBeforeUpdatedAt` matches at Save |
| Host gate | `hostGatePassed=true`; staging host only |
| Approval ID | `G-9g4a1-schedule-site-slug-venue-only-non-dry-run` |
| Env arm | `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true` |
| Dry-run first | Preview executed before Save enabled |
| Operator Save | manual once; Cursor/AI never clicks |
| Re-click prevention | Save disabled after success; fresh Preview required |
| Restore preflight | Required before non-dry-run if smoke marker used |
| Result doc | preflight + execution (+ restore chain if needed) |
| Verifier | `verify-g9g4a1*.mjs` |

---

## 8. Restore strategy

Follow **G-9g3h1 round-trip template** (smoke append → UI restore → post-hardening), adapted for `venue`:

| Phase | Scope |
| --- | --- |
| **G-9g4a1** | Implementation: guards, UI gate, Save path (no operator Save in planning) |
| **G-9g4a1-preflight** | Target row, before.venue, smoke candidate, env stack, rollback SQL documented (not executed) |
| **G-9g4a1-execution** | Operator Preview once + Save once (optional venue smoke suffix) |
| **G-9g4a1b-venue-restore-preflight** | Restore path: Option A — G-9g4a1 operational Save with `venue` only back to original |
| **G-9g4a1c-venue-restore-execution** | Operator Preview once + restore Save once |
| **G-9g4a1d-post-restore-hardening** | Verify `venue` restored; routine dev safety; registry if needed |

**Restore path:** Same G-9g4a1 approval/arm (venue-only payload to original string) — not G-9g3g5 description restore mode.

**SQL rollback:** Discouraged — UI restore only (project policy).

---

## 9. Future text field slices (after G-9g4a1)

| Slice | Phase | Fields |
| --- | --- | --- |
| G-9g4a2 | time fields operational | `open_time`, `start_time` |
| G-9g4a3 | price operational | `price` |
| G-9g4a4 | title operational | `title` (last — non-empty validation) |

Each slice: new approval ID + env arm + field-specific guard — same pattern as G-9g4a1.

`description` remains proven under G-9g3g operational ID — do not re-prove unless regression slice explicitly planned.

---

## 10. CMS Kit generalization impact

| Pattern | G-9g4a1 establishes |
| --- | --- |
| Field-specific operational slice | One field (or declared pair) per approval ID |
| Smoke + restore round-trip | Optional per slice; suffix marker without `[CMS Kit staging]` audit trap |
| Guard function naming | `assertG9G4a1VenueOnlyPayloadOnly` template for G-9g4a2+ |
| Env mutual exclusion | Single slice armed at a time |
| Target row selection | Preflight row picker audit — avoid overused rows |
| Verifier chain | planning → implementation → preflight → execution → restore |

---

## 11. Recommended next phase

**Recommended:** `G-9g4a1-venue-only-operational-expansion-implementation`

**Reason:** Planning complete; UI dry-run already diffs `venue`; gap is guards, approval ID, env arm, Save routing, and verifier — implementation with **no operator Save** in implementation phase.

| Sub-phase | First deliverable |
| --- | --- |
| G-9g4a1 implementation | constants, guard, config, UI gate, executor hook, disarm G-9g3g when G-9g4a1 armed |
| G-9g4a1-preflight | Option A target row selection + beforeSnapshot |

---

## 12. Safety flags (this phase)

```json
{
  "stagingOnly": true,
  "productionBlocked": true,
  "serviceRoleUsed": false,
  "markerRemainsInStagingDb": false,
  "activeRestoreExceptionsCount": 0
}
```

| Item | G-9g4a |
| --- | --- |
| Save clicked | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed | **no** |
| SQL mutation executed | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |
