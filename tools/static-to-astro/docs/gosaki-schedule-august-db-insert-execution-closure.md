# G-20r3a — Gosaki schedule August DB INSERT execution closure

**Phase:** `G-20r3a-gosaki-schedule-august-db-insert-execution-closure`  
**Status:** **complete** — operator SQL execution recorded; **G-20r3 batch INSERT chain closed**  
**Date:** 2026-07-09  
**Base commit:** `0c09c98`  
**Prior:** [gosaki-schedule-august-db-insert-preflight.md](./gosaki-schedule-august-db-insert-preflight.md) (G-20r3) · [gosaki-schedule-product-quality-policy.md](./gosaki-schedule-product-quality-policy.md) (G-20r2b)

| Check | Status |
| --- | --- |
| Operator SQL executed (staging) | **yes** |
| afterVerification | **all checks PASS** |
| INSERT count | **17** |
| published=true / false | **14 / 3** |
| hold #8 / #18 excluded | **yes** |
| sort_order bump (+19) | **yes** (60 published rows) |
| unpublished test rows | **unchanged** (2) |
| rollback needed | **no** |
| local package / public-dist | **stale** (no 2026-08) |
| Cursor SQL / DB write | **no** |

---

## Gates

```txt
gosakiScheduleAugustDbInsertExecutionClosureComplete: true
phase: G-20r3a-gosaki-schedule-august-db-insert-execution-closure
priorPhase: G-20r3-gosaki-schedule-august-db-insert-preflight
baseCommit: 0c09c98
approvalId: G-20r3-gosaki-schedule-august-batch-insert-non-dry-run-slice
targetProject: kmjqppxjdnwwrtaeqjta
forbiddenProject: vsbvndwuajjhnzpohghh
insertExecutedCount: 17
holdExcludedCount: 2
publishedTrueCount: 14
publishedFalseCount: 3
existingTotalRowsBefore: 62
existingPublishedRowsBefore: 60
dbTotalRowsAfter: 79
publishedRowsAfter: 74
mutationAffectedRows: 77
sortOrderBumpRows: 60
unpublishedTestRowsUnchanged: 2
augustRowsAfter: 17
afterVerification: all checks PASS
rollbackNeeded: false
rollbackSqlExecuted: false
stagingDbAugustReflected: true
localPackageStale: true
packageRegenExecuted: false
buildExecuted: false
ftpUploadExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
g20r3BatchInsertChainClosed: true
readyForG20r4SchedulePublicReflectionPlan: true
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**Do not re-run G-20r3 batch INSERT** without new approval ID and preflight. G-20r3 / G-20r3a DB write chain is **closed**.

---

## 1. Git state (doc phase)

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` |
| `HEAD` | `0c09c98` |
| `origin/main` | `0c09c98` |

---

## 2. Execution summary (operator — Supabase SQL Editor)

```txt
Execution: PASS
beforeVerification: PASS (G-20r3 preflight / operator)
SQL executed: yes (operator manual, single session — G-20r3a)
DB write performed: yes (Step 0 sort_order +19 · Step 1 INSERT 17 rows)
operation: batch-insert-august-2026
actualWrite: true
insertedCount: 17
published=true: 14
published=false: 3
hold not inserted: schedule-2026-08-008, schedule-2026-08-018
sort_order bump: existing 60 published rows +19
unpublished test rows: 2 unchanged (not in mutation count)
db total rows after: 79 (existing 62 + inserted 17)
published rows after: 74 (existing published 60 + August published true 14)
mutation affected rows: 77 (shifted published 60 + inserted 17)
August rows after: 17 (published true 14 · published false 3)
afterVerification: all checks PASS
service_role used: false (operator SQL editor session)
production touched: false
/admin touched: false
rollback needed: false
rollback executed: false
public reflection: not executed (local package stale)
```

---

## 3. Execution context

```txt
Supabase project: static-to-astro-cms-staging
Supabase ref: kmjqppxjdnwwrtaeqjta
Execution path: operator SQL on staging SQL Editor
SQL draft: scripts/supabase/gosaki-schedule-august-2026-insert-preflight.sql
Approval ID: G-20r3-gosaki-schedule-august-batch-insert-non-dry-run-slice
Operator: 戸山さん (manual execution)
Cursor involvement: doc closure only — no SQL / Save / DB write
```

---

## 4. Inserted batch (17 rows — G-20r2b classification)

| # | legacy_id | date | title | published | sort_order |
| --- | --- | --- | --- | --- | --- |
| 1 | schedule-2026-08-001 | 2026-08-01 | `<地ビールフェスト2026>` | **true** | 1 |
| 2 | schedule-2026-08-002 | 2026-08-02 | `<地ビールフェスト2026>` | **true** | 2 |
| 3 | schedule-2026-08-003 | 2026-08-06 | `<紀々音>` | **true** | 3 |
| 4 | schedule-2026-08-004 | 2026-08-07 | `<Awesome Songbook 2ndEP"Ep.2"発売!Tour>` | **true** | 4 |
| 5 | schedule-2026-08-005 | 2026-08-08 | `<Awesome Songbook 2ndEP"Ep.2"発売!Tour>` | **true** | 5 |
| 6 | schedule-2026-08-006 | 2026-08-09 | `<Awesome Songbook 2ndEP"Ep.2"発売!Tour>` | **true** | 6 |
| 7 | schedule-2026-08-007 | 2026-08-10 | `<Duo>` | **false** | 7 |
| 9 | schedule-2026-08-009 | 2026-08-15 | `<Duo>` | **false** | 9 |
| 10 | schedule-2026-08-010 | 2026-08-16 | `<Quartet>` | **true** | 10 |
| 11 | schedule-2026-08-011 | 2026-08-16 | `<新谷健介オノマトペ>` | **true** | 11 |
| 12 | schedule-2026-08-012 | 2026-08-20 | `<Brazilian Jazz Trio>` | **true** | 12 |
| 13 | schedule-2026-08-013 | 2026-08-21 | `<原田茅子Quartet>` | **false** | 13 |
| 14 | schedule-2026-08-014 | 2026-08-23 | `<子どもと一緒にジャズライブ>` | **true** | 14 |
| 15 | schedule-2026-08-015 | 2026-08-24 | `<ごさきりかこTrio>` | **true** | 15 |
| 16 | schedule-2026-08-016 | 2026-08-25 | `<ごさきりかこTrio>` | **true** | 16 |
| 17 | schedule-2026-08-017 | 2026-08-28 | `<カリビアンファンクション>` | **true** | 17 |
| 19 | schedule-2026-08-019 | 2026-08-30 | `<KHACHA BAND>` | **true** | 19 |

**Hold — NOT inserted (reserved legacy_id):**

| candidate_order | legacy_id | date | title |
| --- | --- | --- | --- |
| **8** | `schedule-2026-08-008` | 2026-08-11 | `<堤智恵子 Trio>` |
| **18** | `schedule-2026-08-018` | 2026-08-29 | `<Set Sail Special Quartet>` |

---

## 5. Row count semantics（重要）

| Metric | Value | Formula / note |
| --- | --- | --- |
| **DB total rows after** | **79** | existing **62** + inserted **17** |
| **Published rows after** | **74** | existing published **60** + August `published=true` **14** |
| **Mutation affected rows** | **77** | shifted published **60** + inserted **17** — **not** DB total |
| **Retained unpublished test rows** | **2** | unchanged · excluded from mutation count |
| **August rows after** | **17** | `published=true` **14** · `published=false` **3** |

**訂正:** 以前の「合計行数 77 (60 + 17)」は **DB total ではなく mutation affected rows** の表記だった。DB total は **79**。

---

## 6. afterVerification results (operator — all PASS)

| Check | Expected | Result |
| --- | --- | --- |
| DB total `gosaki-piano` rows | **79** | **PASS** |
| Published `gosaki-piano` rows | **74** | **PASS** |
| Mutation affected rows | **77** | **PASS** |
| August row count | **17** | **PASS** |
| August `published=true` | **14** | **PASS** |
| August `published=false` | **3** | **PASS** |
| Hold legacy_ids absent (008, 018) | **0 rows** | **PASS** |
| July `sort_order` range post-bump | **20–33** | **PASS** |
| Anon-visible August (`published=true`) | **14** | **PASS** |
| Unpublished test rows unchanged | **2** | **PASS** |
| **Final** | all checks PASS | **PASS** |

---

## 7. sort_order outcome

| Step | Action | Result |
| --- | --- | --- |
| **0** | `UPDATE … SET sort_order = sort_order + 19 WHERE site_slug = 'gosaki-piano'` | **60 rows** bumped |
| **1** | INSERT 17 August rows · `sort_order` = candidate_order | **17 rows** inserted |
| **Outcome** | August occupies sort_order 1–19 band (8, 18 reserved) · July → 20–33 | **PASS** |

**Unpublished test rows (2):** content, identity, and `sort_order` **unchanged** — not included in the 60-row shift or mutation count.

---

## 8. Staging DB vs local package (stale)

| Layer | 2026-08 status |
| --- | --- |
| **Staging DB** `public.schedules` | **reflected** — 17 August rows live |
| **Local `gosaki-schedules.json` export** | **stale** — pre-G-20r3a artifact (03–07 only) |
| **`output/manual-upload/gosaki-piano-production/public-dist/`** | **stale** — `schedule/` has 2026-03 … 2026-07 only; **no `2026-08/`** |
| **`sitemap-0.xml` in public-dist** | **stale** — **0** `2026-08` entries |

**Implication:** staging Supabase is SoT for August data; static site preview / FTP package does **not** yet show August until **G-20r4** regen + reflection.

---

## 9. Rollback (staging only · not needed · not executed)

Per G-20r3 preflight §9:

1. DELETE 17 `legacy_id` rows (listed in §4)
2. `UPDATE public.schedules SET sort_order = sort_order - 19 WHERE site_slug = 'gosaki-piano' AND sort_order >= 20;`

**Rollback SQL:** `scripts/supabase/gosaki-schedule-august-2026-insert-preflight.sql` (commented tail)

**Status:** `rollbackNeeded: false` · **not executed**

---

## 10. G-20r3 closure

| Phase | Status |
| --- | --- |
| **G-20r3** preflight + SQL draft | **complete** (execution delegated to G-20r3a) |
| **G-20r3a** operator batch INSERT | **complete** — this doc |
| Batch INSERT re-execution | **forbidden** without new approval |

---

## 11. 次フェーズ — G-20r4 schedule public reflection plan

| Phase | Scope |
| --- | --- |
| **G-20r4-schedule-public-reflection-plan** | Export staging schedules → `gosaki-schedules.json` · Astro build · `public-dist` diff · sitemap `2026-08` · hub/month page QA · manual upload plan (no FTP auto-apply) |

**Prerequisites met:**

- Staging DB has 17 August rows (14 published visible to anon)
- G-20r2b quality classification applied
- hold #8/#18 remain for future client confirmation slice

**Out of scope for G-20r4 plan phase:** FTP `--apply` · production · `schedule_months` write

---

## 12. 今回（G-20r3a doc phase）実行していないこと

| Operation | Executed |
| --- | --- |
| SQL execution | **no** (operator only — prior to this doc) |
| DB write / Save | **no** |
| package regen / build | **no** |
| FTP / deploy | **no** |
| network access | **no** |
| commit / push | **no** |

---

## 13. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-august-db-insert-execution-closure.mjs
```
