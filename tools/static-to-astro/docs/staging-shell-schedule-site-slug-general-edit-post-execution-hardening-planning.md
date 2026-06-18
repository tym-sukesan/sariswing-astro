# Staging shell schedule site_slug general edit post-execution hardening planning (G-9g3e)

**Phase:** `G-9g3e-general-edit-post-execution-hardening-planning`  
**Date:** 2026-06-18  
**Prior:** G-9g3d4 execution — commit `e80b707`  
**Type:** planning only — **no implementation, no Save, no DB write, no Supabase SQL execution**

---

## 1. Phase summary

G-9g3d general edit path completed its first non-dry-run write (`price` only, `actualWrite=true`, operator manual Save once). Before row picker or real-data edits, harden the consolidated path: freeze executed PoCs, clarify operator UX, finalize data-safety policy, and define the path from staging shell PoC to Musician CMS Kit.

**This phase performed:** hardening policy, legacy PoC freeze strategy, production-readiness criteria, UI/UX improvements, data safety rules, next-data strategy, phase sequence, repo separation notes.  
**This phase did not:** implementation, Save click, Preview click, UPDATE / INSERT / DELETE / UPSERT / RPC, `/admin` changes, `service_role`, FTP.

| Check | Status |
| --- | --- |
| Save clicked | **no** |
| DB write executed | **no** |
| SQL executed | **no** |

Prior docs:

- [staging-shell-schedule-site-slug-general-edit-non-dry-run-execution-result.md](./staging-shell-schedule-site-slug-general-edit-non-dry-run-execution-result.md)
- [staging-shell-schedule-site-slug-general-edit-consolidation-implementation.md](./staging-shell-schedule-site-slug-general-edit-consolidation-implementation.md)
- [staging-shell-schedule-site-slug-general-edit-consolidation-planning.md](./staging-shell-schedule-site-slug-general-edit-consolidation-planning.md)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save.**

### Post-G-9g3d4 pilot row baseline

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
price:      [CMS Kit staging] G-9g3d general edit price PoC
updated_at: 2026-06-18T01:04:51.312817+00:00
```

---

## 2. Post-execution hardening policy

### 2.1 PoC Save re-run prohibition — permanent freeze

| PoC | Execution status | Current code freeze | G-9g3e1 hardening |
| --- | --- | --- | --- |
| G-9g2 title slice | executed | arm fails: "Slice PoC executed — do not re-run" | **Keep** — verifier + docs |
| G-9g3b venue+description | executed | same | **Keep** |
| G-9g3c time+price | executed | same | **Keep** |
| G-9g3d general edit | executed (price only) | **Not yet frozen** — arm still works if env stacked | **Add** — mirror slice freeze |

**Recommendation:** In G-9g3e1, add `G9G3D_POC_EXECUTED = true` constant (or equivalent) so `getG9G3dGeneralEditPocConfig` fails arm with:

```txt
General edit PoC executed — do not re-run; use G-9g3e+ operational path
```

Until operational approval ID ships, routine dev must keep `PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED` off.

### 2.2 Code · UI · docs triad

| Layer | Policy |
| --- | --- |
| **Code** | Slice executors + G-9g3d executor retained; arm gates block re-run; operational path added in G-9g3e+ |
| **UI** | Legacy PoC panel hidden by default; executed-PoC banner on general edit section; staging-shell notice |
| **Docs** | Execution result docs are audit trail; AI context marks all G-9 PoC Saves prohibited; verifier asserts freeze |

### 2.3 Legacy PoC UI — keep developer-only, do not delete

**Recommendation: retain, hidden by default** (`PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE` unset).

| Option | Verdict | Rationale |
| --- | --- | --- |
| Delete slice UI + executors | **Reject (now)** | Loses audit trail; breaks verifier references |
| Developer-only `<details>` panel | **Adopt** | Already implemented in G-9g3d1 |
| Show in routine dev | **Reject** | Operator confusion; re-arm temptation |

G-9g3e1: add collapsed panel label **"Legacy PoC (executed — audit only)"** and disable all legacy Save buttons even when panel visible (arm always fails).

### 2.4 Approval ID / env arm cleanup

| Class | ID / env | After G-9g3d4 |
| --- | --- | --- |
| Slice PoCs | G-9g2 / G-9g3b / G-9g3c approval IDs + arms | **Frozen** — never re-arm |
| G-9g3d PoC | `G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc` + `PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED` | **Freeze after G-9g3e1** — one-time PoC complete |
| Operational general edit (new) | `G-9g3-schedule-site-slug-general-edit` (proposed) + `PUBLIC_ADMIN_SCHEDULE_SITE_SLUG_GENERAL_EDIT_ENABLED` (proposed) | **G-9g3e3+** — after hardening smoke; still staging shell only |

PoC approval IDs remain in `SCHEDULE_WRITE_APPROVAL_IDS` for audit. Operational ID is a **new** registration — do not reuse G-9g3d PoC ID for future writes.

### 2.5 Executed PoC code — deletion vs isolation timeline

```txt
G-9g3e–G-9g3f:  retain all PoC code; freeze arms; hide UI
G-9g3g+:        operational general edit uses shared executor with new approval ID
G-10+:          move PoC slice files to tools/static-to-astro/archive/poc/ or equivalent
Kit extract:    PoC code does NOT ship to customer Kit — only operational path
```

**Do not delete** PoC executors until operational path has its own non-dry-run success on a non-PoC row.

---

## 3. General edit toward normal operation

### 3.1 PoC approval ID → operational approval ID

**Yes — migrate after G-9g3e hardening smoke.**

| Stage | Approval ID | When |
| --- | --- | --- |
| PoC (done) | `G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc` | G-9g3d4 — **do not reuse** |
| Operational (proposed) | `G-9g3-schedule-site-slug-general-edit` | First real-data write preflight (G-9g3g) |

Same write path (`executeG9G3dGeneralEditNonDryRunSave` or renamed `executeSiteSlugScheduleGeneralEditSave`) with new approval registration and without PoC-specific env arm.

### 3.2 Six safe fields — arbitrary changed-fields-only

**Adopt** — already proven in dry-run (G-9g3a) and non-dry-run (G-9g3d price-only).

- Any subset of `title`, `venue`, `open_time`, `start_time`, `price`, `description`
- Payload = preview `changedFields` only
- `title` empty abort continues
- First operational write should still be **minimal blast radius** (1–2 fields) on a chosen row

### 3.3 Preview before Save

**Mandatory — keep permanently.**

```txt
actualWrite=false on Preview
Save enabled only after successful Preview session
Stale optimistic lock → re-Preview required
Input values must match previewed values at Save time
```

### 3.4 Operator approval text

| Write class | Approval text |
| --- | --- |
| One-time PoC (G-9g2–G-9g3d) | Required per phase — **complete, do not repeat** |
| Operational staging writes (G-9g3g+) | **Per-write preflight** for first write on a new row; thereafter **UI gates only** (Preview + host + auth + lock) unless scope expands (new site_slug, INSERT, DELETE) |

Rationale: PoC phases needed explicit Japanese approval for safety discipline. Operational staging can rely on preflight doc + UI gates once row picker and host gate are proven — re-typing approval every edit is operator friction without added safety.

### 3.5 Staging shell → CMS Kit promotion criteria

Promote to Kit module template when **all** hold:

```txt
1. G-9g3e hardening implementation + smoke complete
2. Row picker operational on staging (G-9g3f)
3. At least one operational non-PoC write succeeded (G-9g3g)
4. Second site_slug read binding proven (G-9g4+)
5. No dependency on PoC env arms or legacy UI
6. Sariswing /admin still untouched
```

Until then: all work in `/__admin-staging-shell/musician-basic/#schedule`.

---

## 4. UI/UX hardening (G-9g3e1 scope)

### 4.1 Save disabled reason — improve visibility

Current `canEnableG9G3dSave().reason` pattern — **extend**:

- Show reason in a persistent `<p class="save-gate-hint">` below Save button
- Priority order: production host STOP → signed out → host gate → not armed → no preview → stale → no changes → PoC executed freeze
- When multiple failures, show primary + "(and N more)" expander

### 4.2 Signed-out state

- Section header badge: **"Not signed in"** (red) vs **"Staging admin"** (green)
- Disable Preview and Save when signed out (Preview currently may work — evaluate; signed-out Preview is lower risk but misleading)
- Link hint: "Sign in via staging shell auth panel"

### 4.3 Stale optimistic lock

- Banner when `optimisticLock.stale === true` after Preview or on load refresh
- Show `expectedBeforeUpdatedAt` vs `currentUpdatedAt` side-by-side
- CTA: **"Reload row"** + **"Re-run Preview"** — no auto-refresh write

### 4.4 changedFields / payload preview

- Highlight changed keys in before/after table (CSS class on changed rows)
- Separate **"Payload to write"** JSON block showing only `changedFields` keys
- Show `changedFields` as comma-separated chips

### 4.5 Loaded DB vs candidate value

- Keep two-column layout; add subtle background: loaded = gray read-only, candidate = white editable
- Label: **"Loaded from DB (read-only)"** / **"Your edit (candidate)"**
- After Save (future operational), refresh loaded column from DB — not in G-9g3e planning

### 4.6 Staging shell notice

Persistent banner at top of `#schedule` section:

```txt
⚠ Staging shell — not production. Host: kmjqppxjdnwwrtaeqjta.supabase.co
```

### 4.7 Production host STOP

When `activeHost === vsbvndwuajjhnzpohghh.supabase.co` or host gate fails:

```txt
🛑 STOP — production Supabase host detected. All writes blocked.
```

Red full-width banner; hide Save and Preview buttons.

---

## 5. Data safety

### 5.1 changed-fields-only payload

**Non-negotiable — maintain permanently.**

- Save builds from preview `changedFields` only
- `assertG9G3dGeneralEditPayloadOnly` (or operational equivalent) on every write
- Verifier keeps assertions

### 5.2 Empty string / null — final policy

| Field | Rule | Status |
| --- | --- | --- |
| `title` | trim; empty → **abort Save** | **Keep** |
| `venue`, `open_time`, `start_time`, `price` | trim; `""` → `null` | **Keep** |
| `description` | trim; `""` → `null` | **Keep** — intentional empty description is valid |

**description `出演：` prefix:** not auto-injected; operator controls full string; preview shows diff.

### 5.3 Scope lock

```txt
id + legacy_id + site_slug + updated_at (optimistic lock)
writeScope: { siteSlug, legacyId }
```

**Keep** for all writes including row picker era.

### 5.4 Row picker safety (forward-looking)

When G-9g3f ships:

- `site_slug` fixed to binding (`gosaki-piano` until multi-site phase)
- Row picker lists only `WHERE site_slug = :binding`
- Selected row `id` + `legacy_id` displayed read-only; cannot edit scope fields
- Cross-site UPDATE impossible by UI + adapter scope

### 5.5 service_role

**Prohibited permanently.** Document in hardening doc + UI notice. Anon key + authenticated session + RLS only.

---

## 6. Next data / row strategy

### 6.1 Same PoC row vs new row

| Option | Verdict | Rationale |
| --- | --- | --- |
| Keep using PoC row `aa440e29-…` | **Audit only** — do not write again unless rollback approved | PoC markers pollute real edit UX |
| New pilot row (INSERT) | **Defer** — needs INSERT approval class | Out of scope for G-9g3e |
| Pick existing non-PoC row via row picker | **Adopt for G-9g3g** | Real-ish data without PoC marker strings |

### 6.2 Restore PoC markers?

**No.** Keep PoC history as audit trail on `schedule-2026-07-010`. `rollbackNeeded: false`.

### 6.3 Row picker before real-data edit?

**Yes — recommended sequence.**

```txt
G-9g3e hardening → G-9g3f row picker → G-9g3g real-ish data edit
```

Row picker lets operator choose a row with normal titles/venues before first operational write. Safer than hard-coded second row ID.

### 6.4 Candidate row for G-9g3g (planning placeholder)

Pick at G-9g3f planning time from staging `gosaki-piano` rows:

- Prefer `published=true`, non-PoC title prefix, `source_route` under `/schedule/`
- Exclude `schedule-2026-07-010` (PoC row)
- Operator confirms via live SELECT before preflight

---

## 7. Phase recommendations

```txt
G-9g3e-planning                              ← this phase (complete)
G-9g3e1-post-execution-hardening-implementation   ← freeze G-9g3d PoC re-run; UI banners; disabled reasons
G-9g3e2-post-execution-hardening-smoke-test       ← dry-run / SSR smoke; no Save
G-9g3f-row-picker-planning                        ← row selection UX + binding safety
G-9g3f1-row-picker-implementation                 ← UI only; no Save
G-9g3f2-row-picker-smoke-test                     ← operator row select + dry-run Preview
G-9g3g-real-ish-data-edit-preflight               ← operational approval ID; new target row
G-9g3g-execution                                  ← operator manual Save once (minimal fields)
```

**Recommended immediate next:** `G-9g3e1-post-execution-hardening-implementation`

**Deferred:** row picker (G-9g3f) until G-9g3e2 smoke passes.

---

## 8. Repo separation / CMS Kit strategy

### 8.1 Sariswing `/admin` separation

- **Continue** staging shell only — no `src/pages/admin` changes
- G-6 general edit remains frozen reference
- Gosaki production cutover uses Kit staging path first

### 8.2 Staging shell → Musician CMS Kit promotion

| Milestone | Action |
| --- | --- |
| G-9g3e2 smoke pass | Document operational editor contract |
| G-9g3g operational write | Prove non-PoC row edit |
| G-9g4 second `site_slug` | Multi-tenant binding template |
| G-10+ | Extract `src/lib/admin/staging-*` schedule editor to `tools/static-to-astro/templates/admin-cms/` as Kit module |

### 8.3 Repo separation planning timing

**After G-9g3g execution success** — not before row picker.

Evaluate separate deployable Kit repo when:

- Two `site_slug` customers have staging write paths
- PoC code isolated from operational path
- FTP manual upload workflow documented per customer

### 8.4 Gosaki PoC → generic `site_slug` CMS

Conditions:

```txt
site_slug binding parameterized (not hard-coded gosaki-piano only)
Row picker + writeScope proven
Operational approval ID (not PoC IDs)
Host gate per deployment config
No Gosaki-specific strings in executor/guards
```

Gosaki-specific overrides stay in `config/sites/gosaki-piano*` and site-specific CSS — not in write path.

---

## 9. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Accidental G-9g3d PoC re-Save | G-9g3e1 freeze arm like slice PoCs |
| Operator thinks staging is production | Staging shell banner + host display |
| Full-form overwrite | changed-fields-only + guard |
| Row picker cross-site | site_slug filter + writeScope |
| PoC code ships to Kit | Archive/isolate before Kit extract |
| Approval fatigue | UI gates for operational writes; preflight per new row |

---

## 10. Gates

```txt
stagingShellScheduleGeneralEditPostExecutionHardeningPlanningComplete: true
stagingShellScheduleGeneralEditPocExecutionSucceeded: true
stagingShellScheduleLegacyPocSaveFreezePolicyDefined: true
stagingShellScheduleGeneralEditOperationalPathDefined: true
stagingShellScheduleGeneralEditHardeningNotImplemented: true
readyForG9g3e1PostExecutionHardeningImplementation: true
readyForG9g3fRowPickerPlanning: false
readyForG9g3dExecution: false
readyForG9g2Execution: false
readyForG9g3bExecution: false
readyForG9g3cExecution: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

---

## 11. Next

**G-9g3e1-post-execution-hardening-implementation** — freeze G-9g3d PoC re-run, UI/UX hardening items in §4, staging shell notice. No Save / DB write in implementation phase.
