# G-20u36d — Gosaki Discography Edge dry-run readBack tracks relation column inspection preflight

**Phase:** `G-20u36d-readback-tracks-relation-column-inspection-preflight`  
**Status:** **complete** — preflight doc only · **no SQL execution / tools-root edit / Edge deploy / Save enablement**  
**Date:** 2026-07-13  
**Base commit:** `e73d79a`  
**Prior:** G-20u36d readBack tracks relation column inspection plan · live verify retry-2 PARTIAL STOP

| Check | Status |
| --- | --- |
| Preflight doc | **yes** (this file) |
| SQL executed by Cursor | **no** |
| SQL executed by operator | **no** (this phase) |
| DB write | **no** |
| Tools / root code edit | **no** |
| Edge Function redeploy | **no** |
| Save enablement | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| Secrets printed | **no** |
| service_role used | **no** |
| Production changed | **no** — **STOP** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackTracksRelationColumnInspectionPreflightReady: true
phase: G-20u36d-readback-tracks-relation-column-inspection-preflight
preflightOnly: true
cursorSqlExecuted: false
operatorSqlExecuted: false
cursorDbWriteExecuted: false
toolsRootEditExecuted: false
edgeDeployExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsedForReadBack: false
anonSelectPreferred: true
proceedToOperatorSelectOnlyExecution: true
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack tracks-relation-column-inspection-preflight scope:** finalize SELECT-only SQL + operator checklist. No SQL execution, no code edit, no Save enablement.

---

## STOP cause (retry-2 — unchanged)

| Observation | Status |
| --- | --- |
| Duration column issue | **resolved** |
| Tracks SELECT fields | `track_number, title, sort_order, site_slug` |
| Tracks SELECT filter (code) | **`release_id=eq.{uuid}`** |
| PostgREST error | **`42703`** · `discography_tracks.release_id does not exist` |
| `readBack.trackCount` | **0** (expected **8**) |
| matching dryRun | **400** |
| write flags | **all false** |

---

## Target environment

| Item | Value |
| --- | --- |
| **Staging project ref** | **`kmjqppxjdnwwrtaeqjta`** |
| **Database** | `static-to-astro-cms-staging` |
| **Production STOP** | **`vsbvndwuajjhnzpohghh`** — **forbidden** |
| Target `site_slug` | `gosaki-piano` |
| Target `legacy_id` | `discography-002` |
| Expected track count | **8** |

---

## Inspection policy (SELECT-only)

| Rule | Value |
| --- | --- |
| Executor | **Human operator** · Supabase SQL Editor |
| Allowed | **`SELECT` only** |
| Forbidden | INSERT / UPDATE / DELETE / ALTER / CREATE / DROP / GRANT / REVOKE / RPC |
| service_role | **not used** |
| Secrets / env values | **not recorded** |
| Cursor execution | **no** |

---

## Operator checklist (before Run)

| # | Check |
| --- | --- |
| 1 | Dashboard project ref = **`kmjqppxjdnwwrtaeqjta`** |
| 2 | If ref = **`vsbvndwuajjhnzpohghh`** → **STOP** |
| 3 | SQL Editor → paste **entire block below** → Run once |
| 4 | Review all result tabs / sections **A–G** |
| 5 | Record findings in **`G-20u36d-readback-tracks-relation-column-inspection-result-record`** (next phase) |
| 6 | **Do not** run mutation SQL · **Do not** enable Save |

---

## Locked SELECT-only SQL (one block — NOT EXECUTED in preflight phase)

**Safety:** Sample track rows use **`to_jsonb(t)`** — no direct reference to candidate relation column names · avoids parse errors when `release_id` / `discography_legacy_id` absent.

Copy-paste **entire block** into Supabase SQL Editor on staging **`kmjqppxjdnwwrtaeqjta`**.

```sql
-- G-20u36d — Gosaki Discography tracks relation column inspection (SELECT-ONLY · PREFLIGHT)
-- Phase: G-20u36d-readback-tracks-relation-column-inspection-preflight
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh — DO NOT RUN
-- Classification: SELECT-ONLY — operator manual execution in result-record phase only
-- Cursor does NOT execute this block.
-- Allowed: SELECT only. Forbidden: INSERT UPDATE DELETE ALTER CREATE DROP GRANT REVOKE RPC

-- A. columns — public.discography + public.discography_tracks
SELECT
  'A.columns' AS section,
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.ordinal_position
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('discography', 'discography_tracks')
ORDER BY c.table_name, c.ordinal_position;

-- B. foreign keys — discography_tracks
SELECT
  'B.foreign_keys' AS section,
  tc.constraint_name,
  tc.table_name AS fk_table,
  kcu.column_name AS fk_column,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'discography_tracks'
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- C. indexes — discography_tracks
SELECT
  'C.indexes' AS section,
  pi.schemaname,
  pi.tablename,
  pi.indexname,
  pi.indexdef
FROM pg_indexes pi
WHERE pi.schemaname = 'public'
  AND pi.tablename = 'discography_tracks'
ORDER BY pi.indexname;

-- D. parent rows — discography-002 / gosaki-piano
WITH params AS (
  SELECT
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id
)
SELECT
  'D.discography_parent_rows' AS section,
  d.legacy_id,
  d.site_slug,
  d.title,
  d.id,
  to_jsonb(d) AS release_row_json
FROM public.discography d
CROSS JOIN params p
WHERE d.site_slug = p.target_site_slug
  AND d.legacy_id = p.target_legacy_id
LIMIT 5;

-- E. track sample rows — json only (no candidate relation column names in SQL)
WITH params AS (
  SELECT 'gosaki-piano'::text AS target_site_slug
)
SELECT
  'E.discography_tracks_sample_json' AS section,
  t.site_slug,
  to_jsonb(t) AS track_row_json
FROM public.discography_tracks t
CROSS JOIN params p
WHERE t.site_slug = p.target_site_slug
ORDER BY (to_jsonb(t)->>'track_number') NULLS LAST,
         (to_jsonb(t)->>'sort_order') NULLS LAST
LIMIT 50;

-- F. candidate relation / optional column presence flags
SELECT
  'F.relation_column_flags' AS section,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'discography_tracks' AND column_name = 'release_id'
  ) AS has_release_id,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'discography_tracks' AND column_name = 'discography_id'
  ) AS has_discography_id,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'discography_tracks' AND column_name = 'discography_legacy_id'
  ) AS has_discography_legacy_id,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'discography_tracks' AND column_name = 'album_id'
  ) AS has_album_id,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'discography_tracks' AND column_name = 'duration'
  ) AS has_duration,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'discography_tracks' AND column_name = 'site_slug'
  ) AS has_site_slug,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'discography_tracks' AND column_name = 'track_number'
  ) AS has_track_number,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'discography_tracks' AND column_name = 'title'
  ) AS has_title,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'discography_tracks' AND column_name = 'sort_order'
  ) AS has_sort_order;

-- G. join feasibility hints — metadata + json key overlap (no failing column refs)
WITH params AS (
  SELECT
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id,
    8::int AS expected_track_count
)
SELECT
  'G.join_feasibility_hints' AS section,
  p.target_legacy_id,
  p.expected_track_count,
  (SELECT count(*) FROM public.discography d
    WHERE d.site_slug = p.target_site_slug AND d.legacy_id = p.target_legacy_id) AS parent_row_count,
  (SELECT count(*) FROM public.discography_tracks t
    WHERE t.site_slug = p.target_site_slug) AS tracks_site_slug_count,
  (
    SELECT count(*)
    FROM public.discography_tracks t
    WHERE t.site_slug = p.target_site_slug
      AND (to_jsonb(t)->>'discography_legacy_id') = p.target_legacy_id
  ) AS tracks_matching_legacy_id_in_json,
  (
    SELECT count(*)
    FROM public.discography_tracks t
    WHERE t.site_slug = p.target_site_slug
      AND (to_jsonb(t)->>'release_id') IS NOT NULL
  ) AS tracks_with_release_id_key_in_json,
  (
    SELECT count(*)
    FROM public.discography_tracks t
    WHERE t.site_slug = p.target_site_slug
      AND (to_jsonb(t)->>'discography_id') IS NOT NULL
  ) AS tracks_with_discography_id_key_in_json
FROM params p;
```

### Section guide

| Section | Purpose |
| --- | --- |
| **A** | Full column inventory |
| **B** | FK constraints on `discography_tracks` |
| **C** | Indexes on `discography_tracks` |
| **D** | Parent release row(s) for `discography-002` · includes internal `id` |
| **E** | Track rows as JSON — inspect keys/values for real relation field |
| **F** | Boolean flags for candidate columns |
| **G** | Count hints via `to_jsonb(t)->>'column'` — **missing keys return NULL, not SQL error** |

**Note on G json counts:** `to_jsonb(t)->>'discography_legacy_id'` returns NULL when key absent — query still succeeds. Use **A + E + G** together to pick the real relation column for filter-fix planning.

---

## Operator execution readiness

**Proceed to operator SELECT-only execution when ALL are true:**

| # | Criterion |
| --- | --- |
| 1 | Preflight verifiers **PASS** |
| 2 | Dashboard project ref = **`kmjqppxjdnwwrtaeqjta`** |
| 3 | SQL block pasted **in full** |
| 4 | Operator understands **SELECT-only** · no mutation |
| 5 | Result will be recorded in **result-record** phase |

---

## STOP conditions

| Condition | Action |
| --- | --- |
| Project ref ≠ `kmjqppxjdnwwrtaeqjta` | **STOP** |
| Production ref involved | **STOP** |
| Mutation / ALTER required during inspection | **STOP** — separate approved phase |
| `service_role` required | **STOP** |
| Proceed to **G-20u36e** before retry-3 PASS | **STOP** |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| SQL execution (Cursor or operator) | **not executed** |
| DB write | **not executed** |
| Tools / root handler edit | **not executed** |
| Edge deploy | **not executed** |
| Save enablement | **not executed** |
| Result record | **not executed** |

---

## Next phases

| Phase | Scope |
| --- | --- |
| **operator manual SELECT-only execution** | Run locked SQL on staging |
| **G-20u36d-readback-tracks-relation-column-inspection-result-record** | Record schema findings |
| **G-20u36d-readback-tracks-relation-filter-fix-planning** | Plan tracks filter fix |
| **live verify retry-3** | After filter fix + deploy |
| **G-20u36e-controlled-save-planning** | After retry-3 PASS |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-tracks-relation-column-inspection-preflight
npm run verify:g20u36d-readback-tracks-relation-column-inspection-plan
npm run verify:g20u36d-readback-live-verify-retry-2
```
