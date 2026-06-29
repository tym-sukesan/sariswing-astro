# G-18d — Gosaki Discography tracks renumber/backfill manual SQL execution readiness

**Phase:** `G-18d-gosaki-discography-tracks-manual-sql-execution-readiness`  
**Status:** **complete** — runbook + operator read-only SQL; **Cursor did not execute SQL**  
**Date:** 2026-06-29  
**Base commit:** `6d5f78e`  
**Prior:** G-18c (`gosaki-discography-g18c-tracks-gap-backfill-preflight.md`), G-18c-f (`gosaki-discography-g18c-f-tracks-renumber-update-preflight.md`)

| Check | Status |
| --- | --- |
| Template re-inspection (renumber + INSERT) | **yes** |
| Operator read-only SQL prepared | **yes** |
| Execution runbook + success/stop criteria | **yes** |
| Cursor SQL / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyG18dTracksManualSqlExecutionReadinessComplete: true
phase: G-18d-gosaki-discography-tracks-manual-sql-execution-readiness
readyForG18dOperatorReadonlyCheck: true
readyForG18dRenumberExecution: false
readyForG18dInsertExecution: false
readyForG18dResultRecording: false
sqlExecutedByCursor: false
dbWriteExecutedByCursor: false
cursorUpdateExecuted: false
cursorInsertExecuted: false
ftpUploadExecuted: false
packageRegenExecuted: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if project is `sari-site` / `vsbvndwuajjhnzpohghh`.

**G-18c INSERT template is NOT executable until Step 2 renumber succeeds** (conflict probe = 0, temp 9001–9007 absent).

---

## 1. G-18c / G-18c-f conclusions

### G-18c (INSERT gap)

| Item | Value |
| --- | --- |
| Current DB | 16 `discography_tracks` rows |
| Target | 34 rows (seed / fixture / public) |
| Missing INSERT | 18 rows |
| INSERT-only blocker | 5 `track_number` conflicts |
| Template | `scripts/supabase/gosaki-discography-tracks-backfill-g18c.template.sql` |

### G-18c-f (renumber)

| Item | Value |
| --- | --- |
| Renumber targets | 7 existing rows |
| Unchanged | 9 rows |
| Strategy | Phase 1 → `9001`–`9007`; Phase 2 → seed positions |
| Template | `scripts/supabase/gosaki-discography-tracks-renumber-g18c-f.template.sql` |

**Execution order:** renumber UPDATE (Step 2) **then** INSERT backfill (Step 3).

---

## 2. Template re-inspection (file inspection — G-18d)

### 2.1 Renumber template (`gosaki-discography-tracks-renumber-g18c-f.template.sql`)

| Check | Result |
| --- | --- |
| Operation | **UPDATE only** in executable `BEGIN`…`COMMIT` block |
| Rows touched | **7** titles × 2 phases = **14** UPDATE statements |
| INSERT / DELETE / ALTER / UPSERT | **Not in executable section** |
| Table scope | `public.discography_tracks` only |
| Rollback | **Comment-only** inverse UPDATE |
| `vsbvndwuajjhnzpohghh` / `service_role` | **Absent** |
| Production host URL | **Absent** |

### 2.2 INSERT template (`gosaki-discography-tracks-backfill-g18c.template.sql`)

| Check | Result |
| --- | --- |
| Operation | **INSERT only** — **18** value rows |
| UPDATE / DELETE / UPSERT / ON CONFLICT | **Not in executable section** |
| Table scope | `public.discography_tracks` only |
| Rollback | **Comment-only** DELETE by `(legacy_id, title)` |
| `vsbvndwuajjhnzpohghh` / `service_role` | **Absent** |
| Production host URL | **Absent** |

### 2.3 INSERT before renumber

**Prohibited.** G-18c header documents 5 conflicts; operator must not run INSERT until Step 2 post-checks pass.

---

## 3. Operator read-only constraint check SQL

**File (copy-paste):** `scripts/supabase/gosaki-discography-tracks-g18d-operator-readonly-check.sql`

**Rules:** SELECT / catalog queries only. **No** UPDATE, INSERT, DELETE, ALTER, TRUNCATE.

### Summary of checks

| # | Query purpose | Expected before Step 2 |
| --- | --- | --- |
| 1 | `current_database()`, `current_schema()` | Staging DB name (operator confirms project) |
| 2 | `information_schema.columns` | `id`, `discography_legacy_id`, `track_number`, `title`, `sort_order`, `created_at`; no `updated_at` |
| 3 | `pg_constraint` | Document UNIQUE/CHECK/PK — paste to ChatGPT |
| 4 | `pg_indexes` | Document indexes — paste to ChatGPT |
| 5 | `count(*)` | **16** |
| 6 | Per-album counts | 5 / 4 / 4 / 3 |
| 7 | Renumber targets | **7 rows** at current positions |
| 8 | Unchanged rows | **9 rows** |
| 9 | Missing INSERT titles | **0 rows** (not yet present) |
| 10 | G-18c conflict probe | **5 rows** (expected blocker) |
| 11 | Temp `9001`–`9007` | **0** |
| 12 | Duplicate `track_number` per album | **0 rows** |

**If any preflight check fails expectations → STOP. Do not run Step 2.**

---

## 4. Execution runbook (operator — Cursor does NOT execute)

### Step 0 — Supabase project confirmation

| Check | Pass |
| --- | --- |
| Project | `static-to-astro-cms-staging` |
| Project ref | `kmjqppxjdnwwrtaeqjta` |
| **NOT** | `sari-site` / `vsbvndwuajjhnzpohghh` |

UI: Supabase dashboard project name + Settings → General → Reference ID.

### Step 1 — Read-only constraint check

1. Open SQL Editor on **staging** project.
2. Run entire `gosaki-discography-tracks-g18d-operator-readonly-check.sql`.
3. Paste results to ChatGPT.
4. **STOP** if §3 table expectations fail.

**Approval before Step 2** (destructive-operation form):

```txt
承認します。この操作を1回だけ実行してください。
```

### Step 2 — Renumber UPDATE

1. File: `gosaki-discography-tracks-renumber-g18c-f.template.sql`
2. Execute executable `BEGIN`…`COMMIT` block only (14 UPDATEs).
3. Run post-UPDATE SELECTs from template comments (or §5 below).
4. **STOP** if §5 success criteria not met. **Do not run Step 3.**

### Step 3 — INSERT backfill

1. **Only after Step 2 success.**
2. File: `gosaki-discography-tracks-backfill-g18c.template.sql`
3. Execute `BEGIN`…`COMMIT` INSERT block (18 rows).
4. Run post-INSERT SELECTs (§6).

### Step 4 — Final verification

Run §6 success queries. Record results in `G-18d-result-recording` phase doc.

---

## 5. Step 2 renumber — success conditions

| Criterion | Expected |
| --- | --- |
| Total rows | **16** (unchanged count) |
| Continuous | `track_number` = **9**, `sort_order` = **9** |
| Skylark | **4** / **4** |
| What a Wonderful World | **6** / **6** |
| The Water Is Wide | **8** / **8** |
| The Look Of Love | **7** / **7** |
| Shreveport Stomp | **3** / **3** |
| Bourbon Street Parade | **8** / **8** |
| Temp numbers | **0** rows with `9001`–`9007` |
| G-18c conflict probe | **0 rows** |
| Unchanged 9 titles | Still at original `track_number` |

### Step 2 post-UPDATE SELECT (read-only)

```sql
select count(*) from public.discography_tracks;

select discography_legacy_id, track_number, sort_order, title
from public.discography_tracks
order by discography_legacy_id, sort_order;

select count(*) from public.discography_tracks
where track_number between 9001 and 9007 or sort_order between 9001 and 9007;
-- expect: 0

select discography_legacy_id, track_number, title
from public.discography_tracks
where (discography_legacy_id, track_number) in (
  ('discography-001', 5),
  ('discography-002', 2),
  ('discography-002', 3),
  ('discography-003', 4),
  ('discography-004', 2)
);
-- expect: 0 rows
```

---

## 6. Step 3 INSERT — success conditions

| Criterion | Expected |
| --- | --- |
| Total rows | **34** |
| discography-001 | **9** tracks |
| discography-002 | **8** tracks |
| discography-003 | **9** tracks |
| discography-004 | **8** tracks |
| All 34 titles | Match `data/gosaki/discography.seed.json` order |
| Duplicate `track_number` per album | **0** |
| `track_number` = `sort_order` | For all 34 rows (seed convention) |

### Expected 34 titles (seed SoT)

**discography-001:** Nature Boy, Waters Of March, With a Song In My Heart, Here Comes The Sun, Ain't She Sweet, Boplicity, Double Rainbow, Verrazano Moon, Continuous  

**discography-002:** On a Clear Day, My Blue Heaven, How Deep Is The Ocean, Skylark, Set Sail, What a Wonderful World, Like a Lover, The Water Is Wide  

**discography-003:** 白玉Bluse, The Lady Is A Tramp, Honeysuckle Rose, Darn That Dream, The Old Country, The Sweetest Sounds, The Look Of Love, Samba De Cafe Terrasse, I'd Climb The Highest Mountain  

**discography-004:** Mary Ann, Nearer My God To Thee, Shreveport Stomp, A Fool Such As I, Si Tu Vois Ma Mere, St. Phillip Street Break Down, Girl Of My Dream, Bourbon Street Parade  

### Step 3 / Step 4 post-INSERT SELECT (read-only)

```sql
select count(*) from public.discography_tracks;

select discography_legacy_id, count(*) as cnt
from public.discography_tracks
group by discography_legacy_id
order by discography_legacy_id;
-- expect: 9, 8, 9, 8

select discography_legacy_id, track_number, sort_order, title
from public.discography_tracks
order by discography_legacy_id, sort_order;

select discography_legacy_id, track_number, count(*) as dup_cnt
from public.discography_tracks
group by discography_legacy_id, track_number
having count(*) > 1;
-- expect: 0 rows
```

---

## 7. Stop conditions

| # | Condition | Action |
| ---: | --- | --- |
| 1 | Wrong Supabase project | **STOP** |
| 2 | `track_total` ≠ 16 before Step 2 | **STOP** — investigate |
| 3 | Renumber target count ≠ 7 | **STOP** — G-18c-f refinement |
| 4 | Missing INSERT titles already present | **STOP** — partial prior run |
| 5 | Constraints/indexes contradict 2-phase UPDATE plan | **STOP** — revise template |
| 6 | After Step 2: `9001`–`9007` still present | **STOP** — rollback or fix |
| 7 | After Step 2: conflict probe > 0 | **STOP** — do not INSERT |
| 8 | After Step 3: `track_total` ≠ 34 | **STOP** — partial INSERT |
| 9 | Duplicate `track_number` per album | **STOP** |
| 10 | Title/order mismatch vs seed | **STOP** — rollback INSERT |

---

## 8. Rollback policy

| Phase failed | Rollback | Scope |
| --- | --- | --- |
| Step 3 (INSERT) | Comment-only DELETE in G-18c template | 18 inserted titles only; 16 pre-existing untouched |
| Step 2 (UPDATE) | Comment-only inverse UPDATE in G-18c-f template | 7 renumbered rows only |
| Order | Rollback INSERT **before** renumber if both ran | INSERT DELETE → renumber inverse |

**Cursor does not execute rollback.** Operator approval required for each rollback.

---

## 9. Outcomes

### 好結果

`discography_tracks` が 16 → 34 行。全アルバムで seed/public と title + `track_number` が一致。tracks SoT の土台完成。

### 失敗

Step 2 または Step 3 の一部が失敗し行数・衝突・重複が残る。実行後 SELECT で検出し、rollback または再計画。

### 最悪ケース

誤った renumber または誤 INSERT。7 行 UPDATE + 18 行 INSERT は `(legacy_id, title)` で限定 rollback 可能（template comment-only 案）。

---

## 10. Cursor scope (this phase)

| Action | Cursor |
| --- | --- |
| Read-only file inspection | **yes** |
| Operator SQL / runbook authoring | **yes** |
| SQL execution | **no** |
| UPDATE / INSERT / DELETE | **no** |

---

## 11. Next phases

| Phase | Operator action |
| --- | --- |
| **G-18d-operator-readonly-check** | Run Step 1 SQL; paste results |
| **G-18d-renumber-execution** | Step 2 with approval; verify §5 |
| **G-18d-insert-execution** | Step 3 after §5 pass; verify §6 |
| **G-18d-result-recording** | Document counts, snapshots, `rollbackNeeded: false` |

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18d-gosaki-discography-tracks-manual-sql-execution-readiness.mjs
```
