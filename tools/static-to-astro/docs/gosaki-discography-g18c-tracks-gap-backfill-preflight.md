# G-18c — Gosaki Discography tracks gap plan + INSERT backfill preflight

**Phase:** `G-18c-gosaki-discography-tracks-gap-backfill-preflight`  
**Status:** **complete** — gap matrix + SQL template; **no INSERT executed**  
**Date:** 2026-06-29  
**Base commit:** `c2bbcd1`  
**Prior:** G-18b (`gosaki-discography-g18b-tracks-personnel-price-design.md`)

| Check | Status |
| --- | --- |
| Staging `discography` + `discography_tracks` SELECT re-confirmed | **yes** |
| Gap matrix (4 releases × 18 missing) | **yes** |
| INSERT template SQL (18 rows) | **yes** |
| INSERT executed | **no** |
| UPDATE / DELETE executed | **no** |

---

## Gates

```txt
gosakiDiscographyG18cTracksGapBackfillPreflightComplete: true
phase: G-18c-gosaki-discography-tracks-gap-backfill-preflight
readyForG18cFTrackNumberRenumberPreflight: true
readyForG18dTracksBackfillManualSqlExecution: false
insertExecutedInThisPhase: false
dbWriteExecutedInThisPhase: false
cursorDbWriteExecuted: false
schemaMigrationExecuted: false
saveExecutedInThisPhase: false
ftpUploadExecuted: false
packageRegenExecuted: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Recommendation:** **G-18c-f** track_number renumber preflight (UPDATE plan for 7 existing rows) **before** G-18d operator INSERT execution. INSERT-only as-is has **5 track_number conflicts**.

---

## 1. G-18b conclusion (carried forward)

| Item | G-18b finding |
| --- | --- |
| DB `discography_tracks` | 16 rows — partial, not SoT |
| Seed / fixture / public | 34 tracks (canonical) |
| Missing | 18 rows |
| Next step | G-18c gap plan + backfill preflight |

Scalar Save chains remain **closed** — do not re-Save `purchase_url`, `artist`, `label`.

---

## 2. G-18c re-inventory finding (important)

G-18b described existing DB rows as a **strict prefix** of seed order. G-18c re-inventory shows:

**Existing 16 rows use compressed `track_number` (1..N) with sparse title selection** — not seed-aligned numbering.

| legacy_id | DB pattern | Example |
| --- | --- | --- |
| discography-001 | Tracks 1–4 match seed; track 5 is seed **#9** (Continuous) | Middle tracks 5–8 missing |
| discography-002 | DB titles = seed #1, #4, #6, #8 numbered 1–4 | Skylark at DB #2 = seed #4 |
| discography-003 | DB titles = seed #1–3, #7 numbered 1–4 | The Look Of Love at DB #4 = seed #7 |
| discography-004 | DB titles = seed #1, #3, #8 numbered 1–3 | Bourbon Street Parade at DB #3 = seed #8 |

**Impact:** INSERT with seed-intended `track_number` / `sort_order` collides with **5 existing rows** (see §5). Template SQL documents target state; **G-18c-f renumber plan required before execution**.

---

## 3. Read-only inventory (staging SELECT — 2026-06-29)

### 3.1 `public.discography` (4 rows)

| legacy_id | title |
| --- | --- |
| discography-001 | Continuous |
| discography-002 | SKYLARK |
| discography-003 | About Us!! |
| discography-004 | Ja-Jaaaaan! |

### 3.2 `public.discography_tracks` (16 rows — unchanged)

| legacy_id | track_number | sort_order | title |
| --- | ---: | ---: | --- |
| discography-001 | 1 | 1 | Nature Boy |
| discography-001 | 2 | 2 | Waters Of March |
| discography-001 | 3 | 3 | With a Song In My Heart |
| discography-001 | 4 | 4 | Here Comes The Sun |
| discography-001 | 5 | 5 | Continuous |
| discography-002 | 1 | 1 | On a Clear Day |
| discography-002 | 2 | 2 | Skylark |
| discography-002 | 3 | 3 | What a Wonderful World |
| discography-002 | 4 | 4 | The Water Is Wide |
| discography-003 | 1 | 1 | 白玉Bluse |
| discography-003 | 2 | 2 | The Lady Is A Tramp |
| discography-003 | 3 | 3 | Honeysuckle Rose |
| discography-003 | 4 | 4 | The Look Of Love |
| discography-004 | 1 | 1 | Mary Ann |
| discography-004 | 2 | 2 | Shreveport Stomp |
| discography-004 | 3 | 3 | Bourbon Street Parade |

Seed / admin JSON / fixture: **same 34 titles** in same album order (verified against `discography.seed.json`).

---

## 4. Gap matrix (4 releases)

| legacy_id | album title | expected | existing DB | missing | missing tracks (track_number / title / sort_order) |
| --- | --- | ---: | ---: | ---: | --- |
| discography-001 | Continuous | 9 | 5 | 4 | 5 / Ain't She Sweet / 5; 6 / Boplicity / 6; 7 / Double Rainbow / 7; 8 / Verrazano Moon / 8 |
| discography-002 | SKYLARK | 8 | 4 | 4 | 2 / My Blue Heaven / 2; 3 / How Deep Is The Ocean / 3; 5 / Set Sail / 5; 7 / Like a Lover / 7 |
| discography-003 | About Us!! | 9 | 4 | 5 | 4 / Darn That Dream / 4; 5 / The Old Country / 5; 6 / The Sweetest Sounds / 6; 8 / Samba De Cafe Terrasse / 8; 9 / I'd Climb The Highest Mountain / 9 |
| discography-004 | Ja-Jaaaaan! | 8 | 3 | 5 | 2 / Nearer My God To Thee / 2; 4 / A Fool Such As I / 4; 5 / Si Tu Vois Ma Mere / 5; 6 / St. Phillip Street Break Down / 6; 7 / Girl Of My Dream / 7 |
| **Total** | | **34** | **16** | **18** | |

**Existing 16 rows are NOT INSERT targets** — they remain untouched in this preflight.

---

## 5. 18 missing tracks (INSERT targets)

| # | legacy_id | track_number | sort_order | title | track_number conflict? |
| ---: | --- | ---: | ---: | --- | --- |
| 1 | discography-001 | 5 | 5 | Ain't She Sweet | **yes** — Continuous at 5 |
| 2 | discography-001 | 6 | 6 | Boplicity | no |
| 3 | discography-001 | 7 | 7 | Double Rainbow | no |
| 4 | discography-001 | 8 | 8 | Verrazano Moon | no |
| 5 | discography-002 | 2 | 2 | My Blue Heaven | **yes** — Skylark at 2 |
| 6 | discography-002 | 3 | 3 | How Deep Is The Ocean | **yes** — What a Wonderful World at 3 |
| 7 | discography-002 | 5 | 5 | Set Sail | no |
| 8 | discography-002 | 7 | 7 | Like a Lover | no |
| 9 | discography-003 | 4 | 4 | Darn That Dream | **yes** — The Look Of Love at 4 |
| 10 | discography-003 | 5 | 5 | The Old Country | no |
| 11 | discography-003 | 6 | 6 | The Sweetest Sounds | no |
| 12 | discography-003 | 8 | 8 | Samba De Cafe Terrasse | no |
| 13 | discography-003 | 9 | 9 | I'd Climb The Highest Mountain | no |
| 14 | discography-004 | 2 | 2 | Nearer My God To Thee | **yes** — Shreveport Stomp at 2 |
| 15 | discography-004 | 4 | 4 | A Fool Such As I | no |
| 16 | discography-004 | 5 | 5 | Si Tu Vois Ma Mere | no |
| 17 | discography-004 | 6 | 6 | St. Phillip Street Break Down | no |
| 18 | discography-004 | 7 | 7 | Girl Of My Dream | no |

**Conflicts: 5 / 18.** Non-conflicting INSERTs alone would leave incorrect `track_number` on 7+ existing rows.

---

## 6. SQL template summary

**File:** `scripts/supabase/gosaki-discography-tracks-backfill-g18c.template.sql`

| Property | Value |
| --- | --- |
| Operation | `INSERT` only — 18 value rows |
| Columns | `discography_legacy_id`, `track_number`, `title`, `sort_order` |
| Transaction | `BEGIN` / `COMMIT` around INSERT |
| Existing 16 rows | Not referenced in executable SQL |
| UPDATE / DELETE / UPSERT / ON CONFLICT | Not in executable section |
| Rollback | Comment-only `DELETE` by `(legacy_id, title)` tuple |

**SQL execution is prohibited in G-18c.** Operator runs only after G-18c-f + G-18d approval.

---

## 7. Preflight / postflight / rollback

### 7.1 Before INSERT (SELECT)

```sql
select count(*) from public.discography_tracks;  -- expect 16
select discography_legacy_id, count(*) from public.discography_tracks group by 1;
select discography_legacy_id, track_number, title from public.discography_tracks order by 1, 2;
```

### 7.2 After INSERT (SELECT — success case)

```sql
select count(*) from public.discography_tracks;  -- expect 34
select discography_legacy_id, count(*) from public.discography_tracks group by 1;
-- expect: 001=9, 002=8, 003=9, 004=8
```

### 7.3 Rollback (comment-only in template)

Delete 18 inserted titles by `(discography_legacy_id, title)` — existing 16 untouched. See template SQL comments.

---

## 8. Outcomes

### 好結果

`discography_tracks` が 16 → 34 行になり、全アルバムで seed/fixture/public と title + order が一致。tracks SoT の土台ができる。

**前提:** G-18c-f で既存 7 行の `track_number` / `sort_order` を seed 位置へ UPDATE した後、18 行 INSERT。

### 失敗

一部 INSERT が UNIQUE 制約または track_number 衝突で失敗し、行数が 34 未満。実行後 SELECT で検出し、追加判断（ロールバック or G-18c-f）が必要。

### 最悪ケース

誤った title / order を INSERT。既存 16 行は触らず、18 行限定のため comment-only rollback DELETE で復旧可能。

---

## 9. Operator approval

Destructive-operation approval required before any SQL execution:

```txt
承認します。この操作を1回だけ実行してください。
```

Preflight must include: exact SQL file, staging project, row count 16→34, conflict resolution plan (G-18c-f), rollback DELETE comment path.

---

## 10. Next phase candidates

| Option | When |
| --- | --- |
| **G-18c-f** track_number renumber preflight | **Recommended now** — resolves 5 conflicts + 7 misnumbered existing rows |
| **G-18d** manual SQL execution preflight / approval | After G-18c-f; operator runs INSERT template in SQL Editor |
| G-18e+ tracks title-edit Save slice | After DB inventory = 34 and SoT established |

**Do not** run INSERT in G-18c-f planning phase without separate approval.

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18c-gosaki-discography-tracks-gap-backfill-preflight.mjs
```
