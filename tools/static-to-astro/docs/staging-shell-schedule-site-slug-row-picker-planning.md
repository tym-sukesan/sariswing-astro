# Staging shell schedule site_slug row picker planning (G-9g3f)

**Phase:** `G-9g3f-row-picker-planning`  
**Date:** 2026-06-18  
**Prior:** G-9g3e2 smoke — commit `d43cd32`  
**Type:** planning only — **no implementation, no Save, no Preview click, no DB write, no Supabase SQL execution**

| Check | Status |
| --- | --- |
| Save clicked | **no** |
| Preview clicked | **no** |
| DB write executed | **no** |
| SQL executed | **no** |
| Row picker | **read-only planning** |

Prior docs:

- [staging-shell-schedule-site-slug-general-edit-post-execution-hardening-smoke-test-result.md](./staging-shell-schedule-site-slug-general-edit-post-execution-hardening-smoke-test-result.md)
- [staging-shell-schedule-site-slug-general-edit-post-execution-hardening-implementation.md](./staging-shell-schedule-site-slug-general-edit-post-execution-hardening-implementation.md)
- [staging-shell-schedule-site-slug-general-edit-post-execution-hardening-planning.md](./staging-shell-schedule-site-slug-general-edit-post-execution-hardening-planning.md)
- [staging-shell-schedule-site-slug-general-edit-non-dry-run-execution-result.md](./staging-shell-schedule-site-slug-general-edit-non-dry-run-execution-result.md)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save.**

---

## 1. Purpose

Move from a **fixed pilot row** (`aa440e29-5be8-402e-9190-0d81c48434c0`) to **operator-selected schedule rows** within a single `site_slug`, while keeping **multi-tenant safety** as the top priority.

| Goal | Policy |
| --- | --- |
| Real-operation proximity | Operator picks a row before general edit |
| Multi-tenant safety | `site_slug = gosaki-piano` scope only — no cross-site selection |
| Sariswing separation | Staging shell only — **no `/admin` changes** |
| PoC freeze | All G-9 PoC Saves remain re-run prohibited |

### Current state (post G-9g3e2)

```txt
Binding:     G9G1_TARGET_ROW_ID hard-coded in edit binding + UI guards
Read infra:  G-9f list read (loadSchedulesForSiteSlugRead) + G-9g1 single-row read
Edit UI:     AdminStagingScheduleSiteSlugEditSection — frozen PoC Save; general edit form loads pilot row only
Route:       /__admin-staging-shell/musician-basic/#schedule
```

---

## 2. Row picker strategy

### 2.1 What row picker is

A **read-only** UI section placed **above** the general edit form in `#schedule`:

```txt
[Staging shell banner]
[Row picker — read-only list + filters]     ← G-9g3f1
[Selected row summary]                      ← G-9g3f1
[General edit form — bound to selection]    ← G-9g3f3+ (planning in G-9g3f3)
```

Row picker **selects** a row. It does **not** write. Selection drives which row the edit form loads.

### 2.2 Relationship to G-9f read section

`AdminStagingScheduleSiteSlugReadSection` (G-9f) already proves:

- `site_slug` scoped SELECT
- month counts
- read-only table display

**Recommendation:** Evolve G-9f read data into a **picker** rather than duplicate a second full table.

| G-9f read (keep) | Row picker (add) |
| --- | --- |
| Audit / row count proof | Interactive row selection |
| Month summary | Filters + search |
| Static list | Selected row drives edit binding |

G-9g3f1 may add `AdminStagingScheduleSiteSlugRowPickerSection.astro` or extend the read section with picker mode behind a phase flag — prefer **new picker section** to keep G-9f audit table unchanged.

### 2.3 UI components (G-9g3f1 scope)

| Component | Behavior |
| --- | --- |
| Schedule list | Table or card list; one row selectable at a time |
| Future / past filter | `date >= today` / `date < today` / all (default: **all** for visibility) |
| Month filter | Dropdown from `month` column; default **all** |
| Published filter | `published=true` / `false` / all — default **`published=true`** (matches G-9f loader) |
| Search keyword | Client-side filter on `title`, `venue`, `legacy_id` (trim, case-insensitive) |
| Row detail preview | Expandable row detail: `date`, `title`, `venue`, `source_route`, `published`, `show_on_home` |
| Selected row summary | Sticky panel: `id`, `legacy_id`, `site_slug`, `updated_at`, `date`, `title` |
| Clear selection | **Clear** button resets to no selection; edit form shows placeholder |
| Reload | Re-fetch list + re-fetch selected row by `id` + `site_slug` (stale `updated_at` recovery) |

### 2.4 Selection → edit form flow (G-9g3f3 binding phase)

```txt
1. Operator selects row in picker (client event)
2. Picker validates row.site_slug === binding.siteSlug
3. Single-row SELECT reload (loadScheduleRowForSiteSlugRead) — id + site_slug
4. General edit form receives dynamic targetId / legacyId / row snapshot
5. Loaded-from-DB columns refresh; candidate inputs reset to loaded values
6. Preview session cleared (must re-Preview after row change)
7. Save remains disabled until operational path armed (G-9g3g+)
```

**G-9g3f1:** picker + selection summary only — edit form **still** bound to pilot row or shows “select a row” placeholder.  
**G-9g3f3:** planning for dynamic edit binding.  
**G-9g3g:** first operational non-dry-run on operator-chosen non-PoC row.

### 2.5 Stale / reload behavior

| Event | Behavior |
| --- | --- |
| Row change | Clear preview state; disable Save; show “Re-run Preview after row change” |
| Reload click | Re-SELECT selected `id` + `site_slug`; refresh `updated_at` |
| `updated_at` drift vs preview | Existing stale lock banner — block Save |
| Picker list stale | Reload list only; preserve selection if row still in filtered set |

---

## 3. site_slug safety (multi-tenant)

**Non-negotiable:** row picker must never expose or select rows outside the bound `site_slug`.

| Layer | Enforcement |
| --- | --- |
| Config | `STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG` (later: deployment `site_slug` config) |
| SELECT | `.eq("site_slug", siteSlug)` on every query — **no optional site_slug from UI** |
| Single-row load | `.eq("id", targetId).eq("site_slug", siteSlug)` + post-load `row.site_slug === siteSlug` |
| UI | `site_slug` displayed read-only; not editable |
| Write (G-9g3g+) | `assertBeforeSnapshotSiteSlugScope` + `writeScope: { siteSlug, legacyId }` unchanged |
| Cross-site UPDATE | Impossible if SELECT + write scope both enforce `site_slug` |

**Production host block:** reuse `evaluateSupabaseHostGate` — STOP banner if `vsbvndwuajjhnzpohghh.supabase.co`.

**`/admin`:** no changes. All work in `/__admin-staging-shell/musician-basic/#schedule`.

---

## 4. Read-only data fetch policy

### 4.1 Principles

```txt
Row picker stage:     read-only (SELECT only)
service_role:         prohibited permanently
Auth:                 anon key + Supabase Auth session + RLS
Cursor / AI:          no SQL execution in implementation/smoke unless HTTP GET SSR
DB mutation:          none in G-9g3f / G-9g3f1 / G-9g3f2
```

### 4.2 Reuse existing loaders

| Function | File | Use |
| --- | --- | --- |
| `loadSchedulesForSiteSlugRead` | `staging-schedule-read.ts` | Picker list (G-9f) |
| `loadScheduleRowForSiteSlugRead` | `staging-schedule-read.ts` | Selected row refresh (G-9g1) |

### 4.3 G-9g3f1 loader extensions (implementation note)

Current `loadSchedulesForSiteSlugRead` filters:

- `.eq("site_slug", siteSlug)`
- `.eq("published", true)` — **hard-coded**
- canonical `source_route` under `/schedule/YYYY-MM/`
- `READ_LIMIT = 100`

**Planning decisions:**

| Topic | Decision |
| --- | --- |
| Published filter in UI | Add loader option `publishedFilter: "true" \| "false" \| "all"` — default **`true`** |
| Unpublished rows | Visible only when operator sets published filter to `all` or `false` — read-only |
| SELECT columns | Minimize display: `id`, `legacy_id`, `site_slug`, `date`, `month`, `title`, `venue`, `published`, `source_route`, `updated_at` — full safe fields on row detail expand |
| New SELECT paths | No unscoped queries; no `service_role`; no RPC |
| Read vs write gates | `ENABLE_ADMIN_STAGING_DATA_READ` for picker; `ENABLE_ADMIN_STAGING_WRITE` still `false` in G-9g3f1/f2 |

### 4.4 Read-only vs write-enabled stages

```txt
G-9g3f1–f2:  picker read-only; write flag off; dry-run on
G-9g3f3:     edit binding to selected row — Preview dry-run only
G-9g3g:      operational write enabled — new approval ID + env; operator preflight
```

---

## 5. Edit safety after row selection

All policies from G-9g3e **carry forward** unchanged:

| Policy | Status |
| --- | --- |
| changed-fields-only payload | **Keep** |
| full-form overwrite prohibited | **Keep** — `assertG9G3dGeneralEditPayloadOnly` or operational equivalent |
| `title` empty → abort Save | **Keep** |
| nullable fields `""` → `null` | **Keep** |
| Scope lock `id + legacy_id + site_slug + updated_at` | **Keep** |
| Preview required before Save | **Keep** |
| Host gate | **Keep** |
| Staging admin auth | **Keep** |
| Save manual one-click only | **Keep** — no auto-click |
| PoC Save re-run | **Frozen** — do not use G-9g3d PoC executor for operational writes |

### Operational path (G-9g3g — defer env design to G-9g3g preflight)

| Item | Proposed |
| --- | --- |
| Approval ID | `G-9g3-schedule-site-slug-general-edit` (**new** — do not reuse G-9g3d PoC ID) |
| Env arm | `PUBLIC_ADMIN_SCHEDULE_SITE_SLUG_GENERAL_EDIT_ENABLED=true` (proposed) |
| Executor | Rename/wrap `executeG9G3dGeneralEditNonDryRunSave` → operational save without PoC freeze check |
| First write | Minimal fields (1–2) on operator-confirmed non-PoC row |

---

## 6. Fixed pilot row policy

### 6.1 Pilot row audit trail

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
price:      [CMS Kit staging] G-9g3d general edit price PoC
updated_at: 2026-06-18T01:04:51.312817+00:00
```

| Policy | Verdict |
| --- | --- |
| Restore PoC markers | **No** — audit history |
| Re-edit pilot row | **No** — exclude from default picker selection |
| Show in picker list | **Optional** with badge `PoC audit row — do not edit` and row disabled for selection |
| G-9g3d frozen Save UI | **Keep** on pilot row if ever displayed — audit only |

**Recommendation:** Filter pilot row **out of selectable rows** by default (`legacy_id !== schedule-2026-07-010` or explicit exclude list). Show in collapsed “PoC audit rows” `<details>` read-only if operator needs reference.

### 6.2 Legacy smoke verifier baseline cleanup

| Item | When | Action |
| --- | --- | --- |
| `verify-g9g3d-general-edit-dry-run-smoke.mjs` `PILOT_ROW.price` | **G-9g3f1 or G-9g3f2** | Update to post-G-9g3d4 price string **or** mark script as legacy PoC-only and add note |
| `UPDATED_AT_BASELINE` in same script | Same phase | Align with G-9g3d4 `updated_at` if script remains active |
| New row-picker smoke verifier | **G-9g3f2** | `verify-g9g3f-row-picker-read-only-smoke.mjs` — selection markers, no Save |

Not a G-9g3f planning blocker. Documented here and in `03-next-actions.md`.

---

## 7. First candidate row selection policy (G-9g3g preflight)

Row picker smoke (G-9g3f2) uses **read-only selection only**. No operational write.

For **first operational write** (G-9g3g), operator picks candidate via **SELECT only** (manual Supabase dashboard or documented SQL template — Cursor does not execute):

### Selection criteria

| Criterion | Preference |
| --- | --- |
| Exclude PoC row | **Required** — not `schedule-2026-07-010` |
| Title prefix | No `[CMS Kit staging]` PoC markers |
| `published` | `true` |
| `source_route` | Canonical `/schedule/YYYY-MM/` |
| Date risk | Prefer **future** or **recent past** over ancient rows |
| Field blast radius | First write: **1–2 safe fields** (e.g. `venue` or `open_time` only) |
| `show_on_home` | Note in preflight; non-blocking |

### Recommended first pass

1. G-9g3f2: operator selects any **non-PoC published** row in picker — read-only smoke  
2. G-9g3g preflight: operator confirms one row via SELECT; document `id`, `legacy_id`, `updated_at`  
3. G-9g3g execution: operator manual Preview → Save once on that row

---

## 8. Phase recommendations

```txt
G-9g3f-row-picker-planning                          ← this phase (complete)
G-9g3f1-row-picker-implementation                   ← picker UI + filters; read-only; no edit binding change
G-9g3f2-row-picker-read-only-smoke-test             ← HTTP GET + operator row select; no Preview/Save
G-9g3f3-row-picker-general-edit-binding-planning    ← dynamic edit form binding to selected row; Preview dry-run only
G-9g3g-operational-general-edit-preflight             ← new approval ID; candidate row; rollback SQL doc
G-9g3g-operational-general-edit-execution             ← operator manual Save once (minimal fields)
```

**Recommended immediate next:** `G-9g3f1-row-picker-implementation`

| Phase | Save | Preview | DB write | SQL |
| --- | --- | --- | --- | --- |
| G-9g3f1 | no | no | no | no (SSR SELECT via existing loaders at runtime only) |
| G-9g3f2 | no | no | no | no |
| G-9g3f3 planning | no | no | no | no |
| G-9g3g preflight | no | no | no | operator SELECT only |
| G-9g3g execution | operator once | operator once | yes (one UPDATE) | operator only |

---

## 9. CMS Kit / repo separation strategy

### 9.1 Row picker as Kit milestone

Row picker is the first **operator-driven** step toward Musician CMS Kit schedule editing:

```txt
Fixed PoC row  →  site_slug-scoped picker  →  operational general edit  →  multi-site_slug
```

### 9.2 site_slug generalization

| Stage | site_slug handling |
| --- | --- |
| G-9g3f1 (Gosaki) | `STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG` constant |
| G-9g4+ | Deployment config `config/sites/{slug}.json` → binding `siteSlug` |
| Kit extract | Picker + edit parameterized by `siteSlug`; no hard-coded `gosaki-piano` in guards |

Gosaki-specific CSS / band profiles stay in `config/sites/gosaki-piano*` — not in write path.

### 9.3 Second site_slug timing

**After G-9g3g operational write succeeds** on `gosaki-piano`:

- Prove read + picker + write on one customer
- Then G-9g4: second `site_slug` read binding (Sariswing or next customer staging)
- Do **not** add second site_slug before operational write proof

### 9.4 Repo separation timing

**Defer repo separation planning until G-9g3g execution success** (unchanged from G-9g3e).

Evaluate separate Kit deployable repo when:

```txt
1. Two site_slug customers have staging write paths
2. PoC code archived / isolated from operational path
3. Row picker + operational approval ID proven
4. FTP manual upload workflow documented per customer
5. Sariswing /admin still untouched
```

---

## 10. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Cross-site row selection | `site_slug` in every SELECT; UI cannot change scope |
| Accidental PoC row re-edit | Exclude pilot row from selectable set; PoC Save frozen |
| Full-form overwrite on new row | changed-fields-only + guard |
| Picker shows production host | Host gate STOP |
| `service_role` temptation for list | Prohibited; anon + RLS only |
| Operator confuses picker with Save | Read-only banner; no Save in picker section |
| Unpublished row accidental publish edit | Default published filter; preflight documents `published` state |

---

## 11. Gates

```txt
stagingShellScheduleSiteSlugRowPickerPlanningComplete: true
stagingShellScheduleRowPickerReadOnlyPolicyDefined: true
stagingShellScheduleRowPickerSiteSlugScopeFixed: true
stagingShellScheduleRowPickerServiceRoleProhibited: true
stagingShellScheduleRowPickerNotImplemented: true
readyForG9g3f1RowPickerImplementation: true
readyForG9g3fRowPickerPlanning: false
readyForG9g3gOperationalGeneralEditPreflight: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

**Save was not clicked.** **Preview was not clicked.** **DB write was not executed.**

---

## 12. Next

**G-9g3f1-row-picker-implementation** — read-only picker UI + filters + selected row summary. No Save / no edit binding change / no DB write in implementation phase.
