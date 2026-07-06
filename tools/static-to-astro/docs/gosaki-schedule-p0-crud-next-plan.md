# G-22g — Gosaki Schedule P0 CRUD remaining tasks / next implementation plan

**Phase:** `G-22g-gosaki-schedule-p0-crud-next-plan`  
**Status:** **complete** — inventory + prioritization only; **no implementation**  
**Date:** 2026-07-06  
**Base commit:** `82668b4`  
**Prior:** [gosaki-schedule-unpublish-update-closure.md](./gosaki-schedule-unpublish-update-closure.md) (G-22f7)

| Check | Status |
| --- | --- |
| G-22d/e/f chain survey | **yes** |
| P0/P1/P2 classification | **yes** |
| UX lessons from G-22f reflected | **yes** |
| Next phase recommendation | **yes** |
| Save / DB write / FTP | **no** |

---

## Gates

```txt
gosakiScheduleP0CrudNextPlanComplete: true
phase: G-22g-gosaki-schedule-p0-crud-next-plan
readyForG22g1ScheduleListUxImprovement: true
readyForG22g2OperatorProcedureImprovement: true
readyForG22hPhysicalDeletePlanning: false
readyForG22iScheduleCrudChainSummary: true
readyForG23PublicReflectionPlanning: false
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
writeArmedDevServerStopped: true
port4321ListenConfirmedNone: true
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` (clean) |
| `HEAD` | `82668b4` |
| `origin/main` | `82668b4` |
| write-armed dev server | **stopped** (operator Ctrl+C; G-22f7) |
| port 4321 LISTEN | **none** (G-22g verified) |

---

## 2. Completed chains (G-22d / G-22e / G-22f)

| Chain | Closure doc | DB action | Closed row | Re-Save |
| --- | --- | --- | --- | --- |
| **G-22d** duplicate INSERT | `gosaki-schedule-duplicate-insert-chain-closure.md` | 1 INSERT | `schedule-2026-03-014` | **forbidden** |
| **G-22e** new event INSERT | `gosaki-schedule-new-event-insert-chain-closure.md` | 1 INSERT | `schedule-2026-09-001` | **forbidden** |
| **G-22f** unpublish UPDATE | `gosaki-schedule-unpublish-update-closure.md` | 1 UPDATE (`published` only) | `schedule-2026-07-008` | **forbidden** |

**Physical DELETE:** not implemented — `#gosaki-schedule-delete-btn` disabled; unpublish is `published=false` only.

**Public reflection / package / FTP:** not executed for G-22d/e/f test rows (`published=false` or unpublish-only).

---

## 3. DB test rows / protected rows (staging)

| `legacy_id` | `id` | `published` | Role |
| --- | --- | --- | --- |
| `schedule-2026-03-014` | `434e4051-86c3-473e-9ad0-39d2e5042fb8` | `false` | G-22d duplicate INSERT test — **protected** |
| `schedule-2026-09-001` | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` | `false` | G-22e new event INSERT test — **protected** |
| `schedule-2026-07-008` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` | **`false`** | G-22f unpublish target — **closed slice** |

Do not re-Save / re-touch closed slices without new approval IDs.

---

## 4. Schedule CRUD P0 — current state

| Capability | Operator UI | Non-dry-run proven | Notes |
| --- | --- | --- | --- |
| **Read / list** | yes (Supabase) | n/a | `data-read-source=supabase` |
| **Existing UPDATE** | yes (`更新する`) | yes (G-9k / G-14b1 routine) | env arm + approval; safe fields |
| **Duplicate INSERT** | yes (`複製案を作成`) | yes (G-22d single slice) | closed test row |
| **New event INSERT** | yes (`新規追加案を作成`) | yes (G-22e single slice) | closed test row |
| **Unpublish UPDATE** | yes (`非公開化案を作成`) | yes (G-22f single slice) | `published=true→false` only |
| **Physical DELETE** | **no** (`削除（準備中）`) | **no** | deferred |
| **Republish** | partial (checkbox) | not sliced | no dedicated non-dry-run slice |
| **Public reflection** | manual package | partial (G-14b1 routine) | high risk; separate planning |
| **Operator safety** | env arms + approvalId | yes | mutual exclusion between arms |

### Prior foundation (pre-G-22)

| Area | Status |
| --- | --- |
| G-9k existing event save button | implemented + proven (field slices) |
| G-14b1 routine edit + reflection | closed for `schedule-2026-04-005` price PoC |
| G-6-g1/g2 title/time slices | Sariswing staging shell PoCs (not operator-primary) |
| Dev-tools sections (G-6/G-9 PoCs) | still on schedule page — **UX confusion risk** |

---

## 5. Implemented code inventory

| Layer | Key modules |
| --- | --- |
| **Operator UI** | `AdminGosakiStagingScheduleOperatorPage.astro`, `gosaki-staging-schedule-operator-ui.ts` |
| **Read** | `staging-schedule-read.ts`, `staging-schedule-site-slug-row-picker-binding.ts` |
| **Existing UPDATE** | `gosaki-schedule-existing-update-config.ts`, `gosaki-schedule-existing-update-guards.ts`, `gosaki-schedule-existing-update-save.ts` |
| **Duplicate INSERT** | `gosaki-schedule-duplicate-insert-config.ts`, `gosaki-schedule-duplicate-insert-guards.ts`, `gosaki-schedule-duplicate-insert-save.ts` |
| **New event INSERT** | `gosaki-schedule-new-event-insert-config.ts`, `gosaki-schedule-new-event-insert-guards.ts`, `gosaki-schedule-new-event-insert-save.ts` |
| **Unpublish UPDATE** | `gosaki-schedule-unpublish-update-config.ts`, `gosaki-schedule-unpublish-update-guards.ts`, `gosaki-schedule-unpublish-update-save.ts` |
| **Approval registry** | `staging-write-approval-ids.ts` (G-22d/e/f IDs registered) |
| **Dry-run adapters** | `gosaki-schedule-*-dry-run.ts` per slice |
| **Verifiers** | `verify-g22d*` … `verify-g22f7*`, `verify-g22g*` |

Physical DELETE: UI placeholder only — no save module, no approval ID, no guards.

---

## 6. Remaining tasks — P0 / P1 / P2

### P0 — required for safe day-to-day operator use

| ID | Task | Why P0 | DB write | Risk |
| --- | --- | --- | --- | --- |
| **P0-1** | **List UX: show `legacy_id` + row identifiers** | G-22f5 operator could not find `schedule-2026-07-008` by legacy_id in list | **no** | **low** |
| **P0-2** | **Isolate dev/mock sections from operator UI** | Mock dry-run block confused G-22f5 operator | **no** | **low** |
| **P0-3** | **Write-armed save panel: emphasize target `legacy_id` / date / title** | Prevents wrong-row Save | **no** (display only) | **low** |
| **P0-4** | **Per-operation operator procedure hints** (duplicate / new / unpublish / update) | Reduces wrong-button clicks | **no** | **low** |
| **P0-5** | **Routine existing UPDATE documentation + re-verification** | G-9k/G-14b1 proven but not re-tested after G-22 UI growth | read-only QA | **low** |
| **P0-6** | **Closed-slice / protected-row guard audit** | Prevent accidental re-touch of G-22d/e/f rows | read-only | **low** |

### P1 — UX polish (not blocking CRUD proof)

| ID | Task | Notes |
| --- | --- | --- |
| **P1-1** | Fix Save result `expectedBeforeUpdatedAt` label vs `updated_at_after` display | G-22f6 cosmetic confusion |
| **P1-2** | Japanese search terms in operator docs (`非公開` not `unpublish`) | doc-only |
| **P1-3** | Selected-row summary banner (purpose + lock baseline) | complements P0-3 |
| **P1-4** | Collapse or move G-6/G-9 dev PoC sections below fold / behind toggle | complements P0-2 |
| **P1-5** | Unpublish flow visual stepper (`案を作成` → `確認` → `保存`) | complements P0-4 |

### P2 — deferred / high-risk

| ID | Task | Notes |
| --- | --- | --- |
| **P2-1** | **Physical DELETE** planning + implementation | G-22f7 deferred; needs strong guards |
| **P2-2** | **Republish** dedicated non-dry-run slice | checkbox exists; no proven slice |
| **P2-3** | **G-22i** full CRUD chain summary doc | documentation only |
| **P2-4** | **G-23** public reflection / package / FTP automation | production-adjacent; FTP suspended |
| **P2-5** | Additional field slices (price, venue, description general UI) | G-6-g3/g4 deferred |
| **P2-6** | CMS Kit generalization beyond gosaki-piano | broader product goal |

---

## 7. G-22f UX lessons (must carry forward)

| # | Issue | Impact | Proposed fix (phase) |
| --- | --- | --- | --- |
| 1 | List does not show `legacy_id` | Operator cannot find row by doc ID | **G-22g1** P0-1 |
| 2 | Instructions said `schedule-2026-07-008` but list shows date/title | Search failure | Docs + **G-22g1** show both |
| 3 | Dev-tools mock UI looks like live operator UI | Wrong section, no Save | **G-22g1** P0-2 |
| 4 | Search `unpublish` finds nothing — UI is Japanese | Operator confusion | **G-22g2** P1-2 |
| 5 | Unpublish flow is 3-step, not obvious | Missed buttons | **G-22g2** P0-4 / P1-5 |
| 6 | Save result `expectedBeforeUpdatedAt` looks like post-save value | Trust erosion | **G-22g2** P1-1 |
| 7 | Write-armed state not obvious at page top | Mock banner shown instead | **G-22g1** P0-3 |

---

## 8. Next phase candidates

| Phase | Scope | DB write | Risk | Depends on |
| --- | --- | --- | --- | --- |
| **G-22g1** Schedule list UX improvement | P0-1, P0-2, P0-3 | **no** | **low** | — |
| **G-22g2** Operator procedure + save-panel UX | P0-4, P1-1, P1-5 | **no** | **low** | G-22g1 optional |
| **G-22h** Physical DELETE planning | P2-1 | planning only first | **high** | explicit need confirmation |
| **G-22i** Schedule CRUD chain summary | P2-3 | **no** | **low** | after g1/g2 or parallel |
| **G-23** Public reflection / package / FTP | P2-4 | maybe later | **very high** | operator approval; FTP suspended |

---

## 9. Recommended next phase

### **Primary recommendation: G-22g1 — Schedule list UX improvement**

**Rationale (user-stated priorities):**

1. **Immediate operator value** — G-22f5 proved identification-by-`legacy_id` fails in current UI.
2. **Zero DB write risk** — HTML/CSS/JS display only; dry-run dev safe.
3. **Accident prevention** — clearer row identity before any future armed Save.
4. **Fast to ship** — small, reviewable slices (legacy_id column, dev-section banner, armed-target highlight).
5. **CMS Kit generalization** — list patterns reusable for other sites.

**Suggested G-22g1 slices:**

| Slice | Deliverable |
| --- | --- |
| G-22g1a | Add `legacy_id` (+ optional short `id` prefix) to schedule list table |
| G-22g1b | Banner when `data-read-source=supabase` vs mock; collapse dev PoC block |
| G-22g1c | Selected-row + pre-save panel shows `legacy_id`, `date`, `title`, `updated_at` |

**Second:** G-22g2 (procedure hints + Save result label fix) — still no DB write.

**Defer:** G-22h physical DELETE, G-23 public reflection until UX/safety baseline is solid.

---

## 10. Risk classification summary

| Category | Phases | DB write |
| --- | --- | --- |
| **Low risk** | G-22g1, G-22g2, G-22i | no |
| **Medium risk** | G-22g routine UPDATE re-QA, republish slice | yes (controlled slices) |
| **High risk** | G-22h physical DELETE | yes (irreversible) |
| **Very high** | G-23 package/FTP/production reflection | yes + deploy |

---

## 11. What is NOT in scope for G-22g

- Implementation of G-22g1/g2/h/i/23
- Save / DB write / SQL mutation
- package regen / FTP / public reflection
- physical DELETE
- dev server start (port 4321 verified none)
- commit / push

---

## 12. Safety confirmation (G-22g)

| Check | Status |
| --- | --- |
| Save executed | **no** |
| DB write executed | **no** |
| SQL INSERT/UPDATE/DELETE | **no** |
| rollback SQL executed | **no** |
| GRANT/REVOKE | **no** |
| package regen | **no** |
| FTP/upload/deploy | **no** |
| write-armed dev server | **stopped** |
| port 4321 LISTEN | **none** |
| Sariswing production ref | **not used** |

---

## Related docs

- [gosaki-schedule-unpublish-update-closure.md](./gosaki-schedule-unpublish-update-closure.md)
- [gosaki-schedule-duplicate-insert-chain-closure.md](./gosaki-schedule-duplicate-insert-chain-closure.md)
- [gosaki-schedule-new-event-insert-chain-closure.md](./gosaki-schedule-new-event-insert-chain-closure.md)
- [gosaki-schedule-existing-update-operator-ui.md](./gosaki-schedule-existing-update-operator-ui.md) (if exists)

---

**G-22g complete.** Next: **G-22g1-schedule-list-ux-improvement** (recommended).
