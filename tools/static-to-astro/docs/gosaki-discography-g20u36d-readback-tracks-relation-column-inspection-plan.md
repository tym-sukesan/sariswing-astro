# G-20u36d — Gosaki Discography Edge dry-run readBack tracks relation column inspection plan

**Phase:** `G-20u36d-readback-tracks-relation-column-inspection-planning`  
**Status:** **complete** — inspection plan only · **no SQL execution / tools-root edit / Edge deploy / Save enablement**  
**Date:** 2026-07-13  
**Base commit:** `cdcb649`  
**Prior:** G-20u36d readBack live verify retry-2 · PARTIAL STOP · `release_id` column missing

| Check | Status |
| --- | --- |
| Inspection plan doc | **yes** (this file) |
| SQL executed by Cursor | **no** |
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
gosakiDiscographyEdgeDryRunReadBackTracksRelationColumnInspectionPlanPrepared: true
phase: G-20u36d-readback-tracks-relation-column-inspection-planning
planOnly: true
cursorSqlExecuted: false
cursorDbWriteExecuted: false
toolsRootEditExecuted: false
edgeDeployExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsedForReadBack: false
anonSelectPreferred: true
proceedToInspectionPreflight: true
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack tracks-relation-column-inspection-planning scope:** plan doc + verifier only. No SQL execution, no code edit, no Save enablement.

---

## STOP cause (live verify retry-2)

| Observation | Status |
| --- | --- |
| `readBack.enabled` / `source` / `releaseFound` | **PASS** |
| Duration column issue | **resolved** (tracks SELECT fields fix deployed) |
| Tracks SELECT fields | `track_number, title, sort_order, site_slug` — **no `duration`** |
| Tracks SELECT filter (current code) | **`release_id=eq.{internal uuid}`** |
| Tracks SELECT outcome | **400** — PostgREST **`42703`** |
| Error | **`column discography_tracks.release_id does not exist`** |
| `readBack.trackCount` | **0** (expected **8**) |
| matching dryRun | **400** |
| +1 track dryRun | **200** · `wouldWrite=true` · `tracksAdded=1` |
| operation=save | **400 reject** |
| write flags | **all false** — not a dangerous failure |

**Progress vs prior STOP (duration):** duration removed from `TRACK_SELECT_FIELDS` · tracks SELECT **reached** · new blocker is **relation column name / FK mismatch** on staging `public.discography_tracks`.

**Prior hint (G-20u36a SELECT-only baseline — not re-run in this phase):** historical staging inspection SQL joined tracks via **`discography_legacy_id`** → `discography.legacy_id`, not `release_id`. Inspection must confirm **actual** column names on staging today.

---

## Inspection goal

Identify the **real column(s)** on staging `public.discography_tracks` that relate rows to `public.discography` / `discography-002`, so a future **tracks SELECT filter fix** can use existing schema (no migration assumption in this phase).

| Candidate relation columns | Notes |
| --- | --- |
| `release_id` | Current Edge readBack filter — **PostgREST reports absent** |
| `discography_id` | Common FK naming |
| `discography_legacy_id` | Used in G-20u36a historical SELECT-only SQL |
| `album_id` | Alternative naming |
| `legacy_id` on tracks | Possible denormalized link |

Also confirm: **`site_slug`**, **`track_number`**, **`title`**, **`sort_order`** (already used in SELECT fields).

---

## Inspection policy (SELECT-only)

| Rule | Value |
| --- | --- |
| Executor | **Human operator** in Supabase SQL Editor |
| Project ref | **`kmjqppxjdnwwrtaeqjta`** (staging only) |
| Production STOP | **`vsbvndwuajjhnzpohghh`** — forbidden |
| Allowed | **`SELECT` only** |
| Forbidden | INSERT / UPDATE / DELETE / ALTER / CREATE / DROP / GRANT / REVOKE / RPC |
| service_role | **not used** · not required for inspection |
| Secrets / env values | **not recorded** in doc or chat |
| Cursor execution | **no** — plan only |

---

## Operator SELECT-only SQL (one block — NOT EXECUTED in planning phase)

Copy-paste **entire block** into Supabase SQL Editor on staging **`kmjqppxjdnwwrtaeqjta`**. Confirm project ref before Run.

```sql
-- G-20u36d — Gosaki Discography tracks relation column inspection (SELECT-ONLY)
-- Phase: G-20u36d-readback-tracks-relation-column-inspection-planning
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh — DO NOT RUN
-- Cursor does NOT execute this block. Operator manual run in preflight/execution phase only.
-- Allowed: SELECT only. Forbidden: INSERT/UPDATE/DELETE/ALTER/CREATE/DROP/GRANT/REVOKE/RPC

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

-- B. foreign keys — discography_tracks referencing discography (if any)
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

-- C. indexes — public.discography_tracks
SELECT
  'C.indexes' AS section,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'discography_tracks'
ORDER BY indexname;

-- D1. sample — public.discography (discography-002 / gosaki-piano)
SELECT
  'D1.discography_sample' AS section,
  d.*
FROM public.discography d
WHERE d.site_slug = 'gosaki-piano'
  AND d.legacy_id = 'discography-002'
LIMIT 5;

-- D2. sample — public.discography (all gosaki-piano releases, summary)
SELECT
  'D2.discography_gosaki_summary' AS section,
  d.legacy_id,
  d.site_slug,
  d.title,
  d.id
FROM public.discography d
WHERE d.site_slug = 'gosaki-piano'
ORDER BY d.legacy_id
LIMIT 20;

-- D3. sample — public.discography_tracks (gosaki-piano, all columns)
-- Uses only site_slug filter; safe even if relation column unknown
SELECT
  'D3.discography_tracks_gosaki_sample' AS section,
  t.*
FROM public.discography_tracks t
WHERE t.site_slug = 'gosaki-piano'
ORDER BY t.track_number NULLS LAST, t.sort_order NULLS LAST
LIMIT 50;

-- D4. sample — tracks for discography-002 IF discography_legacy_id exists (G-20u36a historical pattern)
-- If this query errors (column absent), note in result record — inspection still valid via A/B/C/D3
SELECT
  'D4.tracks_by_discography_legacy_id' AS section,
  t.*
FROM public.discography_tracks t
WHERE t.site_slug = 'gosaki-piano'
  AND t.discography_legacy_id = 'discography-002'
ORDER BY t.track_number NULLS LAST, t.sort_order NULLS LAST
LIMIT 20;

-- D5. relation column presence flags (which candidate columns exist)
SELECT
  'D5.relation_column_flags' AS section,
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
  ) AS has_duration;
```

**Note on D4:** If `discography_legacy_id` does not exist, PostgREST/SQL Editor will error on D4 only — sections A–C, D1–D3, D5 still provide schema baseline. Record which sections succeeded in the result phase.

---

## Expected inspection outputs (for result record phase)

| Section | Purpose |
| --- | --- |
| **A** | Full column list for `discography` + `discography_tracks` |
| **B** | FK constraints on `discography_tracks` |
| **C** | Indexes on `discography_tracks` |
| **D1–D2** | `discography-002` release row · internal `id` if present |
| **D3** | Raw track rows for `gosaki-piano` |
| **D4** | Tracks linked to `discography-002` via `discography_legacy_id` (if column exists) |
| **D5** | Boolean flags for candidate relation columns |

---

## Current code state (unchanged in planning phase)

| Location | Tracks filter |
| --- | --- |
| `buildAnonSelectDiscographyTracksPath()` | `site_slug=eq.{slug}&release_id=eq.{uuid}` |
| Root + tools draft handler | **unchanged** — still assumes `release_id` |

**No code edit in this phase.** Fix planning waits on inspection result.

---

## Next phases (ordered)

| # | Phase | Scope |
| --- | --- | --- |
| 1 | **G-20u36d-readback-tracks-relation-column-inspection-preflight** | Finalize SELECT-only SQL · operator checklist |
| 2 | **operator manual SELECT-only execution** | Run SQL block on staging |
| 3 | **G-20u36d-readback-tracks-relation-column-inspection-result-record** | Record schema findings |
| 4 | **G-20u36d-readback-tracks-relation-filter-fix-planning** | Plan tracks SELECT filter to match real column |
| 5 | tools draft → root placement → Edge deploy → **live verify retry-3** |
| 6 | **G-20u36e-controlled-save-planning** | **only after retry-3 PASS** |

---

## STOP conditions

Stop and ask human operator if:

| Condition | Action |
| --- | --- |
| SELECT-only cannot confirm schema | **STOP** — escalate inspection method |
| Migration / **ALTER TABLE** required to add `release_id` | **STOP** — separate approved migration phase |
| **service_role** required for readBack | **STOP** |
| anon SELECT cannot continue | **STOP** |
| mutation / INSERT / UPDATE / DELETE / UPSERT / RPC required | **STOP** |
| `operation=save` must succeed | **STOP** |
| Production ref `vsbvndwuajjhnzpohghh` involved | **STOP** |
| SQL write / DB write / Save enablement needed in planning | **STOP** |
| Proceed to **G-20u36e** before live verify retry-3 PASS | **STOP** |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| SQL execution (Cursor or operator) | **not executed** |
| DB write | **not executed** |
| Tools / root handler edit | **not executed** |
| Edge deploy | **not executed** |
| Save enablement | **not executed** |
| Live verify retry-3 | **not executed** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-tracks-relation-column-inspection-plan
npm run verify:g20u36d-readback-live-verify-retry-2
npm run verify:g20u36d-readback-tracks-select-fields-fix-edge-deploy-result
```
