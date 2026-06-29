# G-18d-result — Gosaki Discography tracks renumber/backfill SQL execution result

**Phase:** `G-18d-result-gosaki-discography-tracks-sql-execution-result`  
**Status:** **success** — operator manual SQL; Cursor read-only re-confirmation  
**Date:** 2026-06-29  
**Base commit:** `86df73c`  
**Prior:** G-18d readiness (`gosaki-discography-g18d-tracks-manual-sql-execution-readiness.md`)

| Check | Status |
| --- | --- |
| Step 1 read-only preflight | **pass** (operator) |
| Step 2 renumber UPDATE | **success** (operator) |
| Step 3 INSERT backfill | **success** (operator) |
| Final `discography_tracks` = 34 | **pass** |
| Cursor read-only SELECT re-confirm | **pass** |
| Cursor SQL / DB write | **no** |
| Rollback needed | **no** |

---

## Gates

```txt
gosakiDiscographyG18dTracksSqlExecutionResultRecorded: true
phase: G-18d-result-gosaki-discography-tracks-sql-execution-result
gosakiDiscographyTracksBackfillSuccess: true
discographyTracksRowCount: 34
tracksSoTReadyForNextPlanning: true
readyForG18eTracksTitleEditSaveSlicePlanning: true
rollbackNeeded: false
additionalSqlNeeded: false
renumberExecutedByOperator: true
insertBackfillExecutedByOperator: true
sqlExecutedByCursor: false
dbWriteExecutedByCursor: false
cursorUpdateExecuted: false
cursorInsertExecuted: false
saveExecuted: false
ftpUploadExecuted: false
packageRegenExecuted: false
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` — confirmed by Cursor read-only SELECT. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Closed scalar chains — do not re-Save / re-upload:**
- `discography-001` / `artist` (G-16b-f)
- `discography-002` / `purchase_url` (G-15c-f)
- `discography-003` / `artist` (G-15e-f)
- `discography-004` / `label` (G-17e-f)

**Do not re-run** G-18c-f renumber or G-18c INSERT templates without new approval and documented diff.

---

## 1. Operator execution summary

| Step | Template | Executor | SQL Editor result |
| --- | --- | --- | --- |
| 1 | `gosaki-discography-tracks-g18d-operator-readonly-check.sql` | Operator | Read-only — preflight pass |
| 2 | `gosaki-discography-tracks-renumber-g18c-f.template.sql` | Operator | Success. No rows returned |
| 3 | `gosaki-discography-tracks-backfill-g18c.template.sql` | Operator | Success. No rows returned |

Cursor did **not** execute Steps 2–3.

---

## 2. Step 1 — read-only check (before renumber)

### Row inventory

| Metric | Value |
| --- | --- |
| Total rows | **16** |
| discography-001 | 5 |
| discography-002 | 4 |
| discography-003 | 4 |
| discography-004 | 3 |
| Renumber targets | **7** |
| Unchanged rows | **9** |
| Missing 18 INSERT titles | **0** (not yet present) |
| G-18c conflict probe | **5 rows** (expected blocker) |
| Temp `9001`–`9007` | **0** |
| Duplicate `track_number` per album | **0** |

### Schema observations (operator)

| Item | Finding |
| --- | --- |
| Columns | `id`, `discography_legacy_id`, `track_number`, `title`, `sort_order`, `created_at` |
| `updated_at` | **Absent** |
| PK | `id` only |
| UNIQUE `(discography_legacy_id, track_number)` | **Not observed** — 2-phase renumber still succeeded |
| Indexes | `discography_tracks_pkey`, `discography_tracks_legacy_id_idx` |

---

## 3. Step 2 — renumber UPDATE result

**Template:** `gosaki-discography-tracks-renumber-g18c-f.template.sql`  
**Outcome:** **success**

### Post-renumber state (operator)

| Metric | Value |
| --- | --- |
| Total rows | **16** (unchanged count) |
| Per-album counts | 5 / 4 / 4 / 3 |

### Renumbered rows (7)

| legacy_id | title | final track_number |
| --- | --- | ---: |
| discography-001 | Continuous | 9 |
| discography-002 | Skylark | 4 |
| discography-002 | What a Wonderful World | 6 |
| discography-002 | The Water Is Wide | 8 |
| discography-003 | The Look Of Love | 7 |
| discography-004 | Shreveport Stomp | 3 |
| discography-004 | Bourbon Street Parade | 8 |

| Post-check | Value |
| --- | --- |
| Temp `9001`–`9007` | **0** |
| G-18c INSERT conflict probe | **0 rows** |
| Duplicate per album | **0** |

---

## 4. Step 3 — INSERT backfill result

**Template:** `gosaki-discography-tracks-backfill-g18c.template.sql`  
**Outcome:** **success** — 18 rows inserted

### Post-INSERT state (operator)

| Metric | Value |
| --- | --- |
| Total rows | **34** |
| discography-001 | **9** |
| discography-002 | **8** |
| discography-003 | **9** |
| discography-004 | **8** |
| Duplicate per album | **0** |
| Temp `9001`–`9007` | **0** |

---

## 5. Final 34 rows (operator + Cursor SELECT agree)

### discography-001 (9)

1 Nature Boy · 2 Waters Of March · 3 With a Song In My Heart · 4 Here Comes The Sun · 5 Ain't She Sweet · 6 Boplicity · 7 Double Rainbow · 8 Verrazano Moon · 9 Continuous

### discography-002 (8)

1 On a Clear Day · 2 My Blue Heaven · 3 How Deep Is The Ocean · 4 Skylark · 5 Set Sail · 6 What a Wonderful World · 7 Like a Lover · 8 The Water Is Wide

### discography-003 (9)

1 白玉Bluse · 2 The Lady Is A Tramp · 3 Honeysuckle Rose · 4 Darn That Dream · 5 The Old Country · 6 The Sweetest Sounds · 7 The Look Of Love · 8 Samba De Cafe Terrasse · 9 I'd Climb The Highest Mountain

### discography-004 (8)

1 Mary Ann · 2 Nearer My God To Thee · 3 Shreveport Stomp · 4 A Fool Such As I · 5 Si Tu Vois Ma Mere · 6 St. Phillip Street Break Down · 7 Girl Of My Dream · 8 Bourbon Street Parade

### Cursor read-only re-confirmation (2026-06-29)

| Check | Result |
| --- | --- |
| Host | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| `count(*)` | **34** |
| Per-album | 9 / 8 / 9 / 8 |
| Title order vs `discography.seed.json` | **match** |
| `track_number` = `sort_order` | **yes** (all 34) |
| Temp `9001`–`9007` | **0** |

---

## 6. Rollback / additional SQL

| Item | Decision |
| --- | --- |
| Rollback | **not needed** |
| Additional SQL | **not needed** |
| Re-run renumber INSERT templates | **prohibited** without new phase |

Rollback SQL in templates remains **comment-only** — not executed.

---

## 7. Outcome judgment

```txt
G-18d SQL execution: success
discography_tracks backfill: 16 → 34 success
renumber: success
INSERT: success
rollbackNeeded: false
additionalSqlNeeded: false
tracks SoT: ready for next planning phase (title-edit Save slice, price/personnel DDL)
```

Public `/discography/` HTML still Wix-derived — **no package regen / upload in this phase**. Tracks DB inventory is now aligned with seed/fixture/public title lists.

---

## 8. Next phase

| Candidate | Notes |
| --- | --- |
| **G-18e** tracks title-edit Save slice planning | First tracks CMS Save; dry-run default |
| G-18f price column migration preflight | Per G-18b design |
| G-18g personnel JSONB design | Per G-18b design |
| Public tracks reflection hook | After Save slice pattern established |

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18d-gosaki-discography-tracks-sql-execution-result.mjs
```
