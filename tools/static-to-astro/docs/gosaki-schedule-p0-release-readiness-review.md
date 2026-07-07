# G-22i1 — Gosaki Schedule P0 release readiness review

**Phase:** `G-22i1-gosaki-schedule-p0-release-readiness-review`  
**Status:** **complete** — documentation / verification only; **no Save / DB write / public reflection**  
**Date:** 2026-07-07  
**Base commit:** `4857f77` (G-22h7 republish closure committed)

| Check | Status |
| --- | --- |
| P0 CRUD / UX / republish chains reviewed | **yes** |
| DB state documented | **yes** |
| High-risk items (public reflection / package / FTP) | **not executed** |
| Production deploy | **not executed** |
| Physical DELETE | **deferred** |
| Save re-execution on closed slices | **forbidden** |
| Cursor Save / SQL / GRANT (this phase) | **no** |

---

## Gates

```txt
gosakiScheduleP0ReleaseReadinessReviewComplete: true
phase: G-22i1-gosaki-schedule-p0-release-readiness-review
p0CrudUxRepublishChainComplete: true
readyForG22i2PublicReflectionPlanning: true
readyForG22i3PackageDiffDryRun: false
readyForG22i6ActualPublicReflectionUpload: false
publicReflectionExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
productionDeployExecuted: false
physicalDeleteImplemented: false
rollbackSqlExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**G-22i1 = readiness review only.** No Save, no DB write, no SQL mutation, no package regen, no FTP.

---

## 1. Purpose (G-22i1)

Before entering **public reflection / package / FTP** (high-risk gates), consolidate:

- What P0 Gosaki Schedule CRUD / UX work is **complete**
- Current **staging DB row state** (including test rows)
- What is **not yet reflected** to the public static site
- **Preconditions** for public reflection planning
- **Recommended next phases** (G-22i2+)

---

## 2. P0 CRUD / UX / republish — completion status

### 2.1 Write slices (operator Save once each — all closed)

| Feature | Chain closure | Target row | Operation | Status |
| --- | --- | --- | --- | --- |
| **Duplicate INSERT** | G-22d3d | `schedule-2026-03-014` | INSERT | **closed** — do not re-Save |
| **New event INSERT** | G-22e7 | `schedule-2026-09-001` | INSERT | **closed** — do not re-Save |
| **Unpublish UPDATE** | G-22f7 | `schedule-2026-07-008` | `published=true→false` | **closed** — do not re-Save |
| **Republish UPDATE** | G-22h7 | `schedule-2026-07-008` | `published=false→true` | **closed** — do not re-Save |

### 2.2 Read / UX (no additional DB writes required)

| Feature | Closure / doc | Status |
| --- | --- | --- |
| **Authenticated admin read** | G-22g1f3 | **complete** — SSR bootstrap + login refetch; unpublished rows visible to admin |
| **legacy_id visibility** | G-22g1a | **complete** |
| **dev/mock UI separation** | G-22g1b | **complete** |
| **save preview / target confirmation** | G-22g1c | **complete** |
| **operator procedure hints** | G-22g2 | **complete** |
| **P0 UX read-only QA** | G-22g2a / G-22g2b | **complete** |
| **read-only QA runner** | `run-g22g2a-schedule-p0-ux-readonly-qa.mjs` | **exists** |
| **Republish dry-run UI** | G-22h3–G-22h4 | **complete** |
| **Republish UPDATE implementation** | G-22h6a | **complete** |

### 2.3 Save re-execution policy

| approvalId / slice | Re-Save |
| --- | --- |
| G-22d duplicate INSERT | **forbidden** |
| G-22e new event INSERT | **forbidden** |
| G-22f unpublish UPDATE | **forbidden** |
| G-22h republish UPDATE | **forbidden** |

New work requires **new approval IDs** and **new phases** — not re-clicks on closed slices.

---

## 3. DB state (staging — documented; not mutated in G-22i1)

### 3.1 `schedule-2026-07-008` — primary lifecycle row

| Field | Value |
| --- | --- |
| `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` |
| `legacy_id` | `schedule-2026-07-008` |
| `site_slug` | `gosaki-piano` |
| `date` | `2026-07-17` |
| `title` | `<>` |
| **`published`** | **`true`** (G-22h6b republish) |
| `updated_at` | `2026-07-07T02:30:32.260326+00:00` |
| History | G-22f unpublish (`published=false`) → G-22h6b republish (`published=true`) |

**Public eligible:** **yes** (`published=true`). **Not yet on public static site** until public reflection.

### 3.2 `schedule-2026-03-014` — duplicate test row

| Field | Value |
| --- | --- |
| `id` | `434e4051-86c3-473e-9ad0-39d2e5042fb8` |
| `legacy_id` | `schedule-2026-03-014` |
| **`published`** | **`false`** |
| Role | G-22d duplicate INSERT test row |

**Public eligible:** **no** (`published=false`). Keep as staging test reference.

### 3.3 `schedule-2026-09-001` — new event test row

| Field | Value |
| --- | --- |
| `id` | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` |
| `legacy_id` | `schedule-2026-09-001` |
| **`published`** | **`false`** |
| Role | G-22e new event INSERT test row |

**Public eligible:** **no** (`published=false`). Keep as staging test reference.

### 3.4 Public reflection gap

| Layer | State |
| --- | --- |
| Staging DB (`kmjqppxjdnwwrtaeqjta`) | `008` **published=true** |
| Static public output / Lolipop staging | **not regenerated** for this republish |
| Gosaki production Wix / live | **not touched** |

---

## 4. UI state — operator shell

| Area | Status |
| --- | --- |
| Republish dry-run preview + Save | **succeeded** (G-22h6b retry3) |
| Session gate / dry-run preservation | **fixed** (G-22h6b blockers) |
| Gate display mixing | **minor UX polish candidate** — `env arm` / `dry-run ok` / `Save gate` panels improved in retry2 fix; some wording overlap may remain |
| Blocker for P0 readiness | **no** — execution succeeded; polish is optional before or after public reflection |

**UX polish candidates (optional, low risk):**

- Unify Save disabled reason copy (remove stale G-22h6-era phrases if any remain)
- Save target panel: clearer hierarchy for `saveEnabled` vs `dry-run ok` vs `Save gate`
- Post-Save result panel: emphasize `publicReflectionPending`

---

## 5. High-risk items — not executed

| Item | Status |
| --- | --- |
| **Public reflection** (DB → static schedule output) | **not executed** |
| **package generation** (`manual-upload:package` etc.) | **not executed** |
| **FTP upload** | **not executed** (G-7f incident — all auto `--apply` suspended) |
| **production deployment** | **not executed** |
| **rollback SQL** | **not executed** (not needed) |
| **physical DELETE** | **not implemented** — deferred |
| **RLS / GRANT / REVOKE** | **unchanged** |
| **`service_role`** | **not used** |

---

## 6. Before public reflection (G-22i2+) — confirmation checklist

### 6.1 Which rows go to public site?

| Row | Include in public output? |
| --- | --- |
| `schedule-2026-07-008` | **yes** — `published=true` |
| `schedule-2026-03-014` | **no** — test row, `published=false` |
| `schedule-2026-09-001` | **no** — test row, `published=false` |
| Other `gosaki-piano` rows | Per existing `published` filter in static generator |

### 6.2 Diff / package / deploy scope

| Question | Notes |
| --- | --- |
| Existing schedule public output baseline? | Last Gosaki manual-upload package / staging FTP state (pre-republish) |
| Expected delta for 008? | `published=true` — row should appear (or reappear) on month page `/2026-07/` |
| Package generation target | `output/manual-upload/gosaki-piano/` (gitignored) — G-22i3 dry-run |
| FTP target | Lolipop `/cms-kit-staging/gosaki-piano/` — **operator approval only** |
| Sariswing production | **never** — host allowlist / `vsbvndwuajjhnzpohghh` **STOP** |
| `schedule_months` | **read-only derived** — do not write |

### 6.3 Safety gates (carry forward)

- No `service_role` in browser or scripts
- No FTP `--apply` without G-7f1 preflight + explicit operator approval
- No production Supabase ref
- Separate approval IDs for public reflection slice
- Operator-driven; Cursor does not click Save / FTP

---

## 7. Recommended next phases

| Order | Phase | Scope | Risk |
| --- | --- | --- | --- |
| 1 | **G-22i1** | P0 release readiness review (this doc) | **none** |
| 2 | **G-22i2** | Public reflection **planning** | low |
| 3 | **G-22i3** | Package / diff **dry-run** | medium |
| 4 | **G-22i4** | Public output **review** (local / staging preview) | medium |
| 5 | **G-22i5** | FTP / deploy **planning** | high |
| 6 | **G-22i6** | Actual public reflection + upload | **high** |

**Optional insert:** UX polish (G-22g-style minor fixes) between G-22i1 and G-22i2 if operator prefers cleaner gate copy before reflection work.

**Deferred:** physical DELETE planning — separate future phase with own approval.

---

## 8. Safety (G-22i1 phase)

| Item | Status |
| --- | --- |
| Save / Save re-execution | **no** |
| DB write / SQL mutation | **no** |
| Rollback SQL | **no** |
| GRANT / REVOKE / RLS | **no** |
| package regen / FTP / deploy | **no** |
| dev server | **not started** |
| commit / push (G-22i1) | per operator instruction |

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22i1-gosaki-schedule-p0-release-readiness-review.mjs
```

---

## 10. Fix required?

**No** for P0 CRUD readiness. **Yes** for public visibility — but only via **G-22i2+** with explicit planning and operator approval. P0 operator CMS path is **ready for public reflection planning**.
