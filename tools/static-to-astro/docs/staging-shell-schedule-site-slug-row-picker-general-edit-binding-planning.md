# Staging shell schedule site_slug row picker → general edit binding planning (G-9g3f3)

**Phase:** `G-9g3f3-row-picker-general-edit-binding-planning`  
**Date:** 2026-06-18  
**Prior:** G-9g3f2 smoke — commit `94d4e61`  
**Type:** planning only — **no implementation, no Save, no Preview click, no DB write, no Supabase SQL execution**

| Check | Status |
| --- | --- |
| Save clicked | **no** |
| Preview clicked | **no** |
| DB write executed | **no** |
| SQL executed | **no** |
| Row picker → edit binding | **planning only** |
| Operational Save | **not implemented** |

Prior docs:

- [staging-shell-schedule-site-slug-row-picker-read-only-smoke-test-result.md](./staging-shell-schedule-site-slug-row-picker-read-only-smoke-test-result.md)
- [staging-shell-schedule-site-slug-row-picker-implementation.md](./staging-shell-schedule-site-slug-row-picker-implementation.md)
- [staging-shell-schedule-site-slug-row-picker-planning.md](./staging-shell-schedule-site-slug-row-picker-planning.md)
- [staging-shell-schedule-site-slug-general-edit-post-execution-hardening-smoke-test-result.md](./staging-shell-schedule-site-slug-general-edit-post-execution-hardening-smoke-test-result.md)
- [staging-shell-schedule-site-slug-general-edit-non-dry-run-execution-result.md](./staging-shell-schedule-site-slug-general-edit-non-dry-run-execution-result.md)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save.**

---

## 1. Purpose

Connect the **G-9g3f1/f2 read-only row picker** to the **G-9g1–G-9g3d general edit form** so the operator edits whichever **non-PoC `gosaki-piano` row** they select — without weakening multi-tenant safety, PoC freeze, or changed-fields-only write policy.

### Current state (post G-9g3f2)

```txt
Row picker:     read-only; client selection state; 59 selectable rows
Edit binding:   resolveGosakiScheduleSiteSlugEditBinding → fixed pilot row (G9G1_TARGET_ROW_ID)
Edit UI:        AdminStagingScheduleSiteSlugEditSection — frozen G-9g3d PoC Save; dry-run Preview on pilot row
Bridge:         data-general-edit-binding-deferred="true" on picker section
Route:          /__admin-staging-shell/musician-basic/#schedule
```

### Target state (post G-9g3f3a — implementation deferred)

```txt
Row picker:     selects row → dispatches selection event
Edit binding:   hydrates from selected row (not pilot row)
Edit UI:        disabled until valid selection; Preview dry-run on selected row only
Save:           still frozen until G-9g3g operational path
```

---

## 2. Binding strategy

### 2.1 Recommended approach: client-side bridge (CustomEvent)

| Option | Verdict | Rationale |
| --- | --- | --- |
| **Client selected row state + CustomEvent** | **Recommended** | Picker already owns `selectedRow` in `staging-schedule-site-slug-row-picker-ui.ts`; edit UI is client-hydrated; no SSR round-trip per selection |
| SSR initial selected row | **No** for operator selection | SSR cannot know operator pick; would re-introduce fixed row |
| URL hash / query param (`?rowId=`) | **Reject** | Leaks row ids in bookmarks; `#schedule` already used; SSR/client desync risk |
| Hidden input form POST | **Reject** | No form submit path; write path is JS executor |
| Shared module global | **Avoid** | Prefer explicit `document` events for testability |

### 2.2 Event contract (G-9g3f3a implementation)

```txt
Event: staging-schedule-site-slug-row-selected
Detail: { row: ScheduleRecord, loadedAt: string, source: "picker" }

Event: staging-schedule-site-slug-row-cleared
Detail: { reason: "clear" | "invalid" | "poc-audit-blocked" }

Event: staging-schedule-site-slug-row-reloaded
Detail: { row: ScheduleRecord, previousUpdatedAt: string | null, loadedAt: string }
```

**Flow:**

```txt
1. Operator clicks Select on a selectable row (picker UI)
2. Picker validates site_slug === STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG
3. Picker validates !isPocAuditScheduleRow(row) — block + audit warning if PoC row
4. Picker updates selected summary (existing)
5. Picker dispatches row-selected event
6. Edit UI listener:
   a. Single-row SELECT confirm optional (picker list row is SSR snapshot; reload on bind recommended)
   b. Hydrate Loaded-from-DB columns from row
   c. Reset candidate inputs to loaded values
   d. Clear dry-run preview session
   e. Disable Save (operational path still off)
   f. Show "Editing selected row" badge + id/legacy_id/site_slug/updated_at strip
```

### 2.3 SSR role after binding

| Layer | SSR (G-9g3f3a) | Client |
| --- | --- | --- |
| Edit binding `targetRow` | **null** (no fixed pilot preload) | Hydrated on selection |
| Edit `targetId` / `legacyId` | Empty string or placeholder | From selected row |
| Picker `data-selectable-rows` | Unchanged — list bootstrap | Filters/selection |
| `data-general-edit-binding-deferred` | Remove or `false` after G-9g3f3a | — |
| Pilot row audit panel | Unchanged — read-only | Not selectable |

**Rationale:** Removing SSR pilot preload prevents the edit form from showing pilot data before the operator picks a row.

### 2.4 Clear selection → edit form

| Action | Edit form behavior |
| --- | --- |
| Clear selection (picker) | Dispatch `row-cleared`; show placeholder "Select a row in the picker above"; disable all candidate inputs; hide Preview result; Save disabled |
| Filter hides selected row | Keep selection in memory but show warning "Selected row not visible in current filter"; do not auto-clear |
| Page reload | Selection lost (acceptable); operator re-selects |

### 2.5 Reload selected row → `updated_at` sync

| Step | Behavior |
| --- | --- |
| Picker Reload selected row | Existing SELECT `.eq("id").eq("site_slug")` — unchanged |
| After reload | Dispatch `row-reloaded` with new `updated_at` |
| Edit UI | Compare `loadedBaseline.updated_at` vs `row.updated_at` |
| If preview was run on old `updated_at` | Mark stale — block Save; show stale lock banner |
| If no preview yet | Update loaded baseline + candidate reset from fresh row |

### 2.6 Stale detection timing

| When | Check |
| --- | --- |
| Before Preview (dry-run) | Live SELECT `updated_at` (existing G-9g3a pattern) — optional in G-9g3f3b smoke |
| After Preview | Store `expectedBeforeUpdatedAt` from preview result |
| Before Save (G-9g3g+) | Re-SELECT; optimistic lock |
| Row switch with dirty candidate | Confirm discard (see §4) |
| Picker reload changes `updated_at` | Invalidate preview session |

### 2.7 Migration from fixed pilot binding

```txt
Phase G-9g3f3   ← this doc (planning)
Phase G-9g3f3a  ← implementation
  1. Add G9G3F3A_PHASE + binding mode flag (picker-driven)
  2. resolveGosakiScheduleSiteSlugEditBinding: skip loadScheduleRowForSiteSlugRead(pilot) when picker mode
  3. Edit UI: subscribe to picker events; remove hard-coded G9G1_TARGET_ROW_ID guards for hydrate path
  4. Keep G9G1_TARGET_ROW_ID in PoC audit utils + legacy frozen Save paths only
  5. Picker: dispatch events on select/clear/reload
  6. data-general-edit-binding-deferred → false when wired
Phase G-9g3f3b  ← binding smoke (Preview dry-run only; no Save)
Phase G-9g3g      ← operational Save on operator-chosen non-PoC row
```

**Pilot row form:** Do **not** keep a parallel "fixed pilot edit form". Single general edit form; pilot visible only in PoC audit `<details>`.

---

## 3. Selected row safety

### 3.1 Required display (edit form header)

Always visible when a row is bound:

```txt
id, legacy_id, site_slug, updated_at, date, title
```

Reuse picker summary styling; add **"Editing selected row"** badge on edit section.

### 3.2 site_slug enforcement

| Layer | Rule |
| --- | --- |
| Config | `STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG` = `gosaki-piano` |
| Picker select | `row.site_slug !== siteSlug` → reject |
| Edit hydrate | Same check + STOP banner |
| Reload | `.eq("site_slug", siteSlug)` + post-check |
| Write (G-9g3g+) | `assertBeforeSnapshotSiteSlugScope` unchanged |

### 3.3 PoC audit row block

| Row type | Picker | Edit form |
| --- | --- | --- |
| Pilot `aa440e29-…` | Audit panel only — not in selectable list | **Blocked** — never hydrate |
| `[CMS Kit staging]` marker rows | Excluded from selectable | **Blocked** |
| Audit panel "view" | Read-only reference | No bind button |

Implementation: reuse `isPocAuditScheduleRow()` from `staging-schedule-site-slug-row-picker-utils.ts` in edit UI hydrate guard.

### 3.4 Null selection

```txt
selectedRow === null → edit form disabled
Save disabled (always until G-9g3g arm)
Preview disabled or shows "Select a row first"
```

### 3.5 Reload / stale policy

```txt
reload后 updated_at 変更 + preview baseline 不一致 → stale → Save blocked
reload后 updated_at 変更 + preview 未実行 → refresh loaded + reset candidates (no stale banner)
```

---

## 4. General edit form migration

### 4.1 G-9g3f3 scope

**Planning only.** No code changes this phase.

### 4.2 Implementation phase split

| Phase | Scope |
| --- | --- |
| **G-9g3f3a** | Binding implementation — event bridge, edit hydrate, pilot preload removed |
| **G-9g3f3b** | Binding smoke — SSR + operator/dry-run Preview on selected non-PoC row; no Save |

Recommend **G-9g3f3a** (not folding into G-9g3f3) to keep planning commit separate from implementation review.

### 4.3 Fixed pilot → selected row

| Topic | Decision |
| --- | --- |
| Pilot form duplicate | **No** — one edit form |
| Pilot in edit SSR | **Remove** after G-9g3f3a |
| Pilot audit reference | Keep in picker `<details>` |
| Unselected state | Edit form **disabled** with placeholder |
| Row selected | Re-init Loaded DB / Candidate from row snapshot |
| Row switch with dirty candidate | **`window.confirm`** — "Discard unsaved candidate changes?" Default Cancel |
| Candidate reset button | **Keep** — resets to current loaded baseline for selected row |
| Reload from DB button | **Keep** on edit section — SELECT selected id+site_slug (same as picker reload; may dedupe to one control later) |

### 4.4 Guards to refactor (G-9g3f3a)

Current `staging-schedule-site-slug-edit-ui.ts` checks `row.id === G9G1_TARGET_ROW_ID` in multiple Save/Preview paths.

| Path | G-9g3f3a change |
| --- | --- |
| Hydrate / Preview dry-run | Use `selectedRow.id` + `isPocAuditScheduleRow` block |
| G-9g2/g9g3b/g9g3c/g9g3d PoC Save | **Frozen** — keep pilot-only guards |
| Operational Save (G-9g3g) | New executor — selected row + operational approval ID |

---

## 5. Preview / Save safety (future operational path)

All G-9g3e policies **carry forward** unchanged:

| Policy | Status |
| --- | --- |
| changed-fields-only payload | **Keep** |
| full-form overwrite prohibited | **Keep** |
| `title` empty → abort Save | **Keep** |
| nullable `""` → `null` | **Keep** |
| description empty → `null` | **Keep** |
| Scope lock `id + legacy_id + site_slug + updated_at` | **Keep** |
| Host gate | **Keep** |
| Staging admin auth | **Keep** |
| Preview required before Save | **Keep** |
| Save manual one-click only | **Keep** |
| Production host block | **Keep** |
| `service_role` | **Prohibited** |
| G-9g3d PoC executor | **Frozen** — do not reuse for operational writes |

### G-9g3g operational executor (planning note)

Wrap `executeScheduleGeneralUpdateWrite` with:

- New approval ID (§6)
- `assertOperationalGeneralEditPayloadOnly` (rename/evolve from G-9g3d guard)
- `selectedRow` from picker binding state — not `G9G1_TARGET_ROW_ID`
- `G9G3D_GENERAL_EDIT_POC_EXECUTED` does **not** block operational path (separate gate)

---

## 6. Operational approval ID / env

**Do not reuse** `G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc`.

| Item | Proposed value |
| --- | --- |
| Approval ID | `G-9g3-schedule-site-slug-general-edit` |
| Env enable flag | `PUBLIC_ADMIN_SCHEDULE_SITE_SLUG_GENERAL_EDIT_ENABLED=true` |
| Write module | `schedule` (existing) |
| Dry-run default | `PUBLIC_ADMIN_WRITE_DRY_RUN=true` (routine dev) |
| Arm semantics | **Enable** (not "armed" PoC) — operational path is env-gated + approval ID, not slice PoC |

### Naming rationale

| PoC pattern | Operational pattern |
| --- | --- |
| `…_NON_DRY_RUN_ARMED` | `…_GENERAL_EDIT_ENABLED` |
| One-off approval per slice | Single operational approval ID |
| `G9G3D_GENERAL_EDIT_POC_EXECUTED` freeze | Separate operational gate — PoC freeze irrelevant |

### Registration (G-9g3g preflight)

Add to `SCHEDULE_WRITE_APPROVAL_IDS` in implementation phase — **not G-9g3f3**.

### Coexistence with routine dev

```txt
PUBLIC_ADMIN_SCHEDULE_SITE_SLUG_GENERAL_EDIT_ENABLED: unset/false (default)
PUBLIC_ADMIN_WRITE_DRY_RUN: true
ENABLE_ADMIN_STAGING_WRITE: false
All G-9g2/g9g3b/g9g3c/g9g3d PoC arms: off
```

---

## 7. First operational candidate row policy (G-9g3g+)

Row picker binding (G-9g3f3a/b) uses **any selectable non-PoC row** for dry-run Preview.

For **first operational UPDATE** (G-9g3g execution):

| Criterion | Required |
| --- | --- |
| Not pilot row | **yes** — `id !== aa440e29-…` |
| No `[CMS Kit staging]` marker | **yes** |
| `site_slug` | `gosaki-piano` |
| `published` | `true` (preflight documents exception if needed) |
| `source_route` | Canonical `/schedule/YYYY-MM/` |
| Date risk | Prefer **future** or **recent** over legacy |
| First write fields | **1 low-risk field** (e.g. `venue` or `open_time` only) |
| Preflight confirmation | Operator **SELECT only** in Supabase dashboard — Cursor does not execute SQL |

### Recommended sequence

```txt
G-9g3f3b:  operator selects non-PoC row → dry-run Preview (price or venue candidate) — no Save
G-9g3g preflight: operator documents candidate id, legacy_id, updated_at, rollback SQL
G-9g3g execution: operator Preview → Save once (minimal changedFields)
```

---

## 8. UI/UX design

### 8.1 Layout (unchanged order)

```txt
[Staging shell banner]
[Row picker — read-only list]
[Selected row summary — picker]
[General edit form — bound to selection]   ← G-9g3f3a
```

### 8.2 Edit form additions (G-9g3f3a)

| Element | Purpose |
| --- | --- |
| **"Editing selected row"** badge | Visible when bound |
| Selected row strip | `id`, `legacy_id`, `site_slug`, `updated_at`, `date`, `title` |
| Flow note | "Read-only picker → edit form binding" |
| Unselected placeholder | "Select a row in the picker above to edit" |
| PoC audit warning | If somehow audit row — red banner + hydrate blocked |
| site_slug mismatch STOP | Reuse production STOP styling |
| Stale lock STOP | Existing banner — triggered on `updated_at` drift |
| Unsaved candidate confirm | On row switch |
| Candidate reset | Reset inputs to loaded baseline |
| Reload from DB | SELECT refresh for bound row |
| Preview JSON | Existing dry-run result panel |

### 8.3 Picker UX tweaks (G-9g3f3a)

| Change | Detail |
| --- | --- |
| Binding note text | Update from "deferred G-9g3f3" → "feeds general edit below" |
| Selected row highlight | Keep row highlight in table |
| Audit rows | No Select button — unchanged |

### 8.4 Operator manual checks (optional)

| Check | Suggested phase |
| --- | --- |
| Row select → edit hydrates | G-9g3f3b smoke (operator or SSR+script) |
| Clear → edit disabled | G-9g3f3b |
| Reload → `updated_at` refresh | G-9g3f3b or operator before G-9g3g |
| Row switch discard confirm | G-9g3f3b |

G-9g3f2 operator manual selection was **optional** — not a blocker. Recommend **G-9g3f3b** for operator UX confirmation before operational preflight.

---

## 9. Phase recommendations

```txt
G-9g3f3-row-picker-general-edit-binding-planning     ← this phase (complete)
G-9g3f3a-row-picker-general-edit-binding-implementation
G-9g3f3b-row-picker-general-edit-binding-smoke-test    ← Preview dry-run on selected row; no Save
G-9g3g-operational-general-edit-preflight            ← new approval ID; candidate row; rollback SQL
G-9g3g-operational-general-edit-execution            ← operator manual Save once
```

| Phase | Save | Preview | DB write | SQL |
| --- | --- | --- | --- | --- |
| G-9g3f3 (this) | no | no | no | no |
| G-9g3f3a | no | no | no | no |
| G-9g3f3b | no | operator dry-run OK | no | no |
| G-9g3g preflight | no | no | no | operator SELECT only |
| G-9g3g execution | operator once | operator once | yes (one UPDATE) | operator only |

**Recommended immediate next:** `G-9g3f3a-row-picker-general-edit-binding-implementation`

---

## 10. Old verifier cleanup

### 10.1 `verify-g9g3d-general-edit-dry-run-smoke.mjs`

| Issue | Current | Post-G-9g3d4 actual |
| --- | --- | --- |
| `PILOT_ROW.price` | `[CMS Kit staging] G-9g3c price PoC` | `[CMS Kit staging] G-9g3d general edit price PoC` |
| `UPDATED_AT_BASELINE` | `2026-06-17T15:45:35.433566+00:00` | `2026-06-18T01:04:51.312817+00:00` |

**Decision:** Align baseline in **G-9g3f3b** (binding smoke phase) — same window as binding smoke verifier work.

| Option | Verdict |
| --- | --- |
| Update baseline in G-9g3f3b | **Recommended** — keeps dry-run smoke meaningful |
| Archive script as legacy PoC-only | Defer to **G-10** if superseded by binding smoke |
| Block G-9g3f3 planning | **No** — documented here; script still passes (tests dry-run math, not live DB) |

Add header comment: `Legacy pilot-row baseline — PoC audit row; not used for operational binding.`

### 10.2 New verifier (G-9g3f3b)

`verify-g9g3f3-row-picker-general-edit-binding-smoke.mjs` — markers:

- `data-general-edit-binding-deferred` absent or `false`
- edit section shows selected-row placeholder when unselected
- event bridge source markers
- PoC audit block in edit hydrate
- no operational Save enabled
- site_slug scope in binding

---

## 11. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Accidental pilot re-edit | Picker exclusion + edit hydrate block |
| Cross-site row | site_slug on every SELECT + UI STOP |
| Stale Save after picker reload | Invalidate preview; stale banner |
| Dirty candidate lost on row switch | confirm dialog |
| PoC Save confusion | Keep G-9g3d frozen; separate operational ID |
| Full-form overwrite | changed-fields-only guard |
| Operator edits without selection | Disabled form + null guards |

---

## 12. Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingPlanningComplete: true
rowPickerToGeneralEditBindingStrategyRecorded: true
selectedRowBindingSafetyRecorded: true
pocAuditRowEditBlockRecorded: true
operationalApprovalIdProposalRecorded: true
generalEditOperationalSaveNotImplemented: true
readyForG9g3f3aRowPickerGeneralEditBindingImplementation: true
readyForG9g3f3RowPickerGeneralEditBindingPlanning: false
readyForG9g3gOperationalGeneralEditPreflight: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

**Save was not clicked.** **Preview was not clicked.** **DB write was not executed.** **Manual SQL was not executed.**

---

## 13. Next

**G-9g3f3a-row-picker-general-edit-binding-implementation** — wire picker selection to general edit form; remove pilot SSR preload; no Save / no operational arm / no DB write.
