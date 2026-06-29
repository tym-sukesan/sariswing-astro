# G-18c-f — Gosaki Discography existing tracks renumber UPDATE preflight

**Phase:** `G-18c-f-gosaki-discography-tracks-renumber-update-preflight`  
**Status:** **complete** — UPDATE template + gap analysis; **no SQL executed**  
**Date:** 2026-06-29  
**Base commit:** `8fca735`  
**Prior:** G-18c (`gosaki-discography-g18c-tracks-gap-backfill-preflight.md`)

| Check | Status |
| --- | --- |
| Staging `discography_tracks` SELECT (16 rows) | **yes** |
| Renumber targets (7 rows) documented | **yes** |
| Unchanged rows (9 rows) documented | **yes** |
| UPDATE template SQL (2-phase) | **yes** |
| UPDATE / INSERT executed | **no** |

---

## Gates

```txt
gosakiDiscographyG18cFTracksRenumberUpdatePreflightComplete: true
phase: G-18c-f-gosaki-discography-tracks-renumber-update-preflight
readyForG18dTracksRenumberManualSqlExecution: true
readyForG18dTracksBackfillInsertAfterRenumber: false
updateExecutedInThisPhase: false
insertExecutedInThisPhase: false
dbWriteExecutedInThisPhase: false
cursorDbWriteExecuted: false
schemaMigrationExecuted: false
saveExecutedInThisPhase: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**G-18c INSERT template remains execution-prohibited** until this renumber succeeds and post-UPDATE conflict probe returns 0 rows.

---

## 1. G-18c conclusion (carried forward)

| Item | Finding |
| --- | --- |
| DB tracks | 16 rows (compressed `track_number`, sparse titles) |
| Seed / fixture / public | 34 tracks |
| Missing INSERT | 18 rows (G-18c template) |
| INSERT-only blocker | **5 track_number conflicts** with existing 16 rows |
| Required before INSERT | Renumber **7** existing rows to seed positions |

---

## 2. Why INSERT-only is prohibited

G-18c INSERT template assigns seed-intended `track_number` 2–9 to missing titles. Five of those slots are **already occupied** by misnumbered existing rows:

| legacy_id | occupied slot | existing title |
| --- | ---: | --- |
| discography-001 | 5 | Continuous (seed #9) |
| discography-002 | 2 | Skylark (seed #4) |
| discography-002 | 3 | What a Wonderful World (seed #6) |
| discography-003 | 4 | The Look Of Love (seed #7) |
| discography-004 | 2 | Shreveport Stomp (seed #3) |

After renumbering the 7 misaligned rows, slots 2–8 open for G-18c INSERT without collision.

---

## 3. Read-only inventory (staging SELECT — 2026-06-29)

**Table:** `public.discography_tracks` — **16 rows**, columns: `id`, `discography_legacy_id`, `track_number`, `title`, `sort_order`, `created_at`. **No `updated_at`.**

### Full row inventory

| legacy_id | id (uuid) | track_number | sort_order | title | seed # | renumber? |
| --- | --- | ---: | ---: | --- | ---: | --- |
| 001 | 84a3fae9-… | 1 | 1 | Nature Boy | 1 | no |
| 001 | 62c08f32-… | 2 | 2 | Waters Of March | 2 | no |
| 001 | b19e59cc-… | 3 | 3 | With a Song In My Heart | 3 | no |
| 001 | 6f9ea84a-… | 4 | 4 | Here Comes The Sun | 4 | no |
| 001 | 232dbc39-… | 5 | 5 | Continuous | **9** | **yes → 9** |
| 002 | e30c5ea9-… | 1 | 1 | On a Clear Day | 1 | no |
| 002 | 2b92b102-… | 2 | 2 | Skylark | **4** | **yes → 4** |
| 002 | c5c4abd4-… | 3 | 3 | What a Wonderful World | **6** | **yes → 6** |
| 002 | 826d9e4f-… | 4 | 4 | The Water Is Wide | **8** | **yes → 8** |
| 003 | f19cb2e2-… | 1 | 1 | 白玉Bluse | 1 | no |
| 003 | bbb53529-… | 2 | 2 | The Lady Is A Tramp | 2 | no |
| 003 | 38c4ff25-… | 3 | 3 | Honeysuckle Rose | 3 | no |
| 003 | 138da109-… | 4 | 4 | The Look Of Love | **7** | **yes → 7** |
| 004 | 04e987a9-… | 1 | 1 | Mary Ann | 1 | no |
| 004 | 174486e6-… | 2 | 2 | Shreveport Stomp | **3** | **yes → 3** |
| 004 | 8c70d336-… | 3 | 3 | Bourbon Street Parade | **8** | **yes → 8** |

**Note:** User brief listed “Amapola” for discography-002 #4→8; live DB and seed use **The Water Is Wide** — preflight uses live/seed title.

---

## 4. Renumber targets (7 rows)

| # | legacy_id | title | current track_number | current sort_order | target track_number | target sort_order |
| ---: | --- | --- | ---: | ---: | ---: | ---: |
| 1 | discography-001 | Continuous | 5 | 5 | 9 | 9 |
| 2 | discography-002 | Skylark | 2 | 2 | 4 | 4 |
| 3 | discography-002 | What a Wonderful World | 3 | 3 | 6 | 6 |
| 4 | discography-002 | The Water Is Wide | 4 | 4 | 8 | 8 |
| 5 | discography-003 | The Look Of Love | 4 | 4 | 7 | 7 |
| 6 | discography-004 | Shreveport Stomp | 2 | 2 | 3 | 3 |
| 7 | discography-004 | Bourbon Street Parade | 3 | 3 | 8 | 8 |

---

## 5. Renumber not required (9 rows)

| legacy_id | track_number | title |
| --- | ---: | --- |
| discography-001 | 1 | Nature Boy |
| discography-001 | 2 | Waters Of March |
| discography-001 | 3 | With a Song In My Heart |
| discography-001 | 4 | Here Comes The Sun |
| discography-002 | 1 | On a Clear Day |
| discography-003 | 1 | 白玉Bluse |
| discography-003 | 2 | The Lady Is A Tramp |
| discography-003 | 3 | Honeysuckle Rose |
| discography-004 | 1 | Mary Ann |

These rows already match seed/public `track_number` and `sort_order`. **UPDATE template must not modify them.**

---

## 6. Constraints / indexes (read-only survey)

### 6.1 Confirmed via staging SELECT (`select *`)

| Item | Result |
| --- | --- |
| `id` column | **yes** — uuid PK (per-row uuid in live data) |
| `updated_at` column | **no** |
| `created_at` | **yes** — timestamptz |
| Other writable columns | `discography_legacy_id`, `track_number`, `title`, `sort_order` only |

### 6.2 Constraints / indexes (operator SQL Editor probe — not run by Cursor)

Cursor used anon REST SELECT only; `pg_constraint` / `pg_indexes` require SQL Editor. **Run before execution:**

```sql
select conname, pg_get_constraintdef(oid) as def
from pg_constraint
where conrelid = 'public.discography_tracks'::regclass
order by conname;

select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'discography_tracks';
```

### 6.3 Planning assumptions (G-18c + repo schema reference)

| Check | Assessment |
| --- | --- |
| UNIQUE on `(discography_legacy_id, track_number)` | **Likely** — G-18c INSERT conflict analysis; operator must confirm via §6.2 |
| UNIQUE on `(discography_legacy_id, sort_order)` | **Unknown** — probe §6.2; template sets both identically |
| CHECK constraints | **Unknown** — probe §6.2; none documented in `gosaki-discography-schema.template.sql` |
| Direct single-step UPDATE 2→4, 4→8 | **Unsafe** on discography-002 — slot collision |

**Template strategy:** **2-phase UPDATE** — stage to `9001`–`9007`, then move to final seed positions (§7).

---

## 7. UPDATE template summary

**File:** `scripts/supabase/gosaki-discography-tracks-renumber-g18c-f.template.sql`

| Property | Value |
| --- | --- |
| Operation | `UPDATE` only — 14 statements (7 phase-1 + 7 phase-2) |
| Rows touched | **7** unique titles |
| WHERE clause | `discography_legacy_id` + `title` + current `track_number` + current `sort_order` |
| INSERT / DELETE / ALTER | Not in executable section |
| Transaction | Single `BEGIN` / `COMMIT` |
| Collision avoidance | Phase 1 → 9001–9007; Phase 2 → seed positions |
| Rollback | Comment-only inverse UPDATE |

---

## 8. Preflight / postflight / rollback

### Before UPDATE

- `count(*) = 16`
- 7-row renumber target SELECT matches §4
- Optional: `pg_constraint` / `pg_indexes` probe (§6.2)

### After UPDATE (success)

- `count(*) = 16` (unchanged row count)
- 7 rows at target positions (§4)
- G-18c conflict probe returns **0 rows** (slots 5, 2, 3, 4, 2 freed on respective albums)

### Rollback

Comment-only reverse in template: phase-2 inverse → phase-1 inverse → restores G-18c pre-renumber state.

---

## 9. Outcomes

### 好結果

既存16行のうち7行が seed/public の正しい `track_number` / `sort_order` に揃い、G-18c INSERT（18行）が衝突なく実行可能な状態になる。

### 失敗

UPDATE 対象が 7 行にならない、または UNIQUE 制約衝突。実行後 SELECT で検出し、rollback 判断が必要。

### 最悪ケース

誤った既存 track を renumber。7 行限定のため comment-only rollback UPDATE で復旧可能。

---

## 10. Operator approval

SQL execution **prohibited in G-18c-f preflight phase.**

Before G-18d renumber execution:

```txt
承認します。この操作を1回だけ実行してください。
```

Preflight: exact SQL file, staging only, 7-row scope, post-SELECT + conflict probe, rollback path.

---

## 11. Next phase candidates

| Phase | Content |
| --- | --- |
| **G-18d-renumber** | Operator runs renumber template in SQL Editor + post-SELECT verify |
| **G-18d-insert** | Operator runs G-18c INSERT template (18 rows) after renumber success |
| G-18e+ | Tracks title-edit Save slice planning |

**Order:** renumber (this template) → INSERT (`gosaki-discography-tracks-backfill-g18c.template.sql`) → verify 34 rows.

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18c-f-gosaki-discography-tracks-renumber-update-preflight.mjs
```
