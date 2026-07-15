# G-20u36f — Gosaki Discography marker title restore planning

**Phase:** `G-20u36f-discography-marker-title-restore-planning`  
**Status:** **complete** — planning / preflight prep only · **no SQL / Save / DB write / Edge deploy / package / FTP**  
**Date:** 2026-07-15  
**Latest commit (reference):** `ba3ac5d`  
**Prior:** [G-20u36e slice complete](./gosaki-discography-g20u36e-controlled-save-slice-complete.md) · [manual-upload-ui-pass-result](./gosaki-discography-g20u36e-controlled-save-manual-upload-ui-pass-result.md)

| Check | Status |
| --- | --- |
| Planning only | **yes** |
| SQL executed | **no** |
| Save executed | **no** |
| DB write | **no** |
| Edge deploy | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| Handler changed | **no** |
| service_role | **not used** |
| Production changed | **no** |

---

## Gates

```txt
gosakiDiscographyMarkerTitleRestorePlanned: true
phase: G-20u36f-discography-marker-title-restore-planning
planningOnly: true
sqlExecuted: false
saveExecuted: false
dbWriteExecuted: false
edgeDeployExecuted: false
packageGenerationExecuted: false
ftpUploadExecuted: false
handlerChanged: false
serviceRoleUsed: false
productionChanged: false
handlerReverseCompatibleAsIs: false
handlerMinimalChangeRequired: true
recommendedNextPhase: G-20u36f-discography-marker-title-restore-handler-implementation
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 1. Restore target

| Field | Value |
| --- | --- |
| siteSlug | `gosaki-piano` |
| legacyId / discographyLegacyId | `discography-002` |
| album | **SKYLARK** |
| trackNumber | **1** |
| targetRowId | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| **beforeTitle** (current DB + STG UI) | `On a Clear Day [CMS Kit staging G-20u36e]` |
| **afterTitle** (restore target) | `On a Clear Day` |
| track_count expected | **8** |
| track_7 expected | `Like a Lover` |

**Current state:**

- G-20u36e First controlled Save full loop **COMPLETE**
- DB + STG UI both show **marker title**
- Permission **closed**: authenticated title UPDATE grant = **0** · G-20u36e restrictive policy **removed**
- Re-upload always requires **package regeneration** at current HEAD

---

## 2. Handler reverse compatibility (read-only review)

**Files reviewed (read-only · not modified):**

- `supabase/functions/gosaki-discography-save-dry-run/handler.ts`
- `supabase/functions/gosaki-discography-save-dry-run/index.ts`

### Judgment: **NOT compatible as-is for reverse restore**

The deployed G-20u36e handler is **forward-only** (original → marker). Reverse restore (marker → original) **cannot** use the current Edge path without code changes.

| Check | Result |
| --- | --- |
| Request accepts `beforeTitle` / `afterTitle` in body | **Partially** — fields exist but are **validated against G-20u36e forward constants** |
| Reverse restore usable as-is | **no** |
| `approvalId` / `sliceId` G-20u36e-fixed | **yes** — hard gates |
| `beforeTitle` / `afterTitle` G-20u36e-fixed | **yes** — hard gates + hardcoded UPDATE |
| Minimal handler change required | **yes** |

### Fixed G-20u36e constants (handler.ts)

```txt
SAVE_APPROVAL_ID = "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice"
CONTROLLED_SAVE_SLICE_ID = "G-20u36e1-discography-002-track-1-title-staging-marker"
CONTROLLED_SAVE_TITLE_BEFORE = "On a Clear Day"
CONTROLLED_SAVE_TITLE_AFTER = "On a Clear Day [CMS Kit staging G-20u36e]"
```

### Gate failures for proposed G-20u36f restore body

| Gate | Restore request | Handler expects | Result |
| --- | --- | --- | --- |
| `approvalId` | `G-20u36f-gosaki-discography-marker-title-restore` | `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` | **FAIL** `approval_id_mismatch` |
| `sliceId` | `G-20u36f-discography-002-track-1-title-restore` | `G-20u36e1-discography-002-track-1-title-staging-marker` | **FAIL** `slice_id_mismatch` |
| `beforeTitle` | marker string | `On a Clear Day` only | **FAIL** `before_title_mismatch` |
| `afterTitle` | `On a Clear Day` | marker string only | **FAIL** `requested_title_mismatch` |
| DB pre-check `dbTitles[0]` | marker (current) | `On a Clear Day` | **FAIL** `current_title_mismatch` |
| UPDATE `.eq("title", …)` | needs marker | hardcoded `On a Clear Day` | **wrong direction** |
| UPDATE `{ title: … }` | needs `On a Clear Day` | hardcoded marker | **wrong direction** |

### Minimum change scope (future implementation phase — **not this phase**)

1. Register G-20u36f `approvalId` + `sliceId` (separate from G-20u36e forward slice).
2. Add restore-specific before/after constants **or** generalize gate to accept slice-scoped title pairs from an allowlist.
3. Use request-validated `beforeTitle` / `afterTitle` in UPDATE (not hardcoded forward constants).
4. Pre-save DB check: expect current title = marker (not original).
5. Redeploy Edge after implementation + local verification.

**index.ts:** No change needed for restore — forwards Authorization; routing is in handler.

---

## 3. Expected full loop (execution phases — not this phase)

| Step | Phase | Action |
| --- | --- | --- |
| A | pre-restore SELECT | Preflight snapshot · **SELECT-only** |
| B | permission open | GRANT + G-20u36f restrictive policy |
| C | controlled Save | Edge `operation=save` · **after handler impl** |
| D | post-save SELECT | Verify title restored · track_count=8 |
| E | permission close | REVOKE + DROP G-20u36f policy |
| F | package regen | `build:gosaki:staging` at clean HEAD |
| G | manual FTP | FileZilla · `public-dist/` → `/cms-kit-staging/gosaki-piano/` |
| H | UI verify | Admin + Public show `On a Clear Day` · Like a Lover retained |

---

## 4. Pre-restore SELECT-only SQL (prepared · not executed)

**Output column:** `g20u36f_marker_title_restore_preflight_snapshot`  
**Classification:** SELECT-only · no data mutation · `data_mutation=false` · `operation_save_involved=false`

```sql
-- G-20u36f marker-title-restore PREFLIGHT (SELECT-ONLY) — NOT EXECUTED in planning phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh
-- Forbidden: INSERT UPDATE DELETE ALTER CREATE DROP GRANT REVOKE TRUNCATE

WITH params AS (
  SELECT
    'G-20u36f-discography-marker-title-restore-preflight'::text AS phase,
    'kmjqppxjdnwwrtaeqjta'::text AS expected_project_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_project_ref_stop,
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id,
    1::int AS target_track_number,
    'On a Clear Day [CMS Kit staging G-20u36e]'::text AS target_title_marker,
    'On a Clear Day'::text AS target_title_original,
    'Like a Lover'::text AS target_track_7_title_expected,
    8::int AS expected_track_count,
    'e30c5ea9-2857-492b-8a78-58cbfcbe7929'::uuid AS target_row_id_expected,
    'discography_tracks_g20u36f_marker_title_restore_restrictive'::text AS restrictive_policy_name,
    ARRAY['discography', 'discography_tracks']::text[] AS target_tables,
    (now() AT TIME ZONE 'utc')::timestamptz AS captured_at
),
target_row AS (
  SELECT t.*
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
    AND t.track_number = p.target_track_number
),
track_agg AS (
  SELECT
    COUNT(*)::int AS track_count,
    MAX(CASE WHEN track_number = 7 THEN title END) AS track_7_title
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
),
original_title_rows AS (
  SELECT COUNT(*)::int AS original_title_count_for_target
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
    AND t.track_number = p.target_track_number
    AND t.title = p.target_title_original
),
table_grants AS (
  SELECT g.table_schema, g.table_name, g.grantee, g.privilege_type
  FROM information_schema.role_table_grants g
  CROSS JOIN params p
  WHERE g.table_schema = 'public'
    AND g.table_name = ANY (p.target_tables)
    AND g.grantee IN ('anon', 'authenticated')
    AND g.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
),
column_privileges AS (
  SELECT c.table_name, c.column_name, c.grantee, c.privilege_type
  FROM information_schema.column_privileges c
  CROSS JOIN params p
  WHERE c.table_schema = 'public'
    AND c.table_name = 'discography_tracks'
    AND c.column_name = 'title'
    AND c.grantee = 'authenticated'
    AND c.privilege_type = 'UPDATE'
),
policies AS (
  SELECT pol.polname, pol.polcmd, pol.polpermissive, pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
         pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expr
  FROM pg_policy pol
  JOIN pg_class cls ON cls.oid = pol.polrelid
  JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
  CROSS JOIN params p
  WHERE nsp.nspname = 'public'
    AND cls.relname = 'discography_tracks'
),
admin_all AS (
  SELECT COUNT(*)::int AS admin_all_policy_count
  FROM policies
  WHERE polcmd = 'ALL'
    AND (using_expr ILIKE '%is_admin%' OR with_check_expr ILIKE '%is_admin%')
)
SELECT jsonb_build_object(
  'g20u36f_marker_title_restore_preflight_snapshot', jsonb_build_object(
    'phase', p.phase,
    'captured_at', p.captured_at,
    'data_mutation', false,
    'operation_save_involved', false,
    'target_title', tr.title,
    'target_title_is_marker', tr.title = p.target_title_marker,
    'original_title_count_for_target', COALESCE(otr.original_title_count_for_target, 0),
    'target_row_count', (SELECT COUNT(*)::int FROM target_row),
    'target_row_id', tr.id,
    'target_row_id_matches', tr.id = p.target_row_id_expected,
    'track_count', ta.track_count,
    'track_7_title', ta.track_7_title,
    'authenticated_title_update_column_grants_count', (SELECT COUNT(*)::int FROM column_privileges),
    'authenticated_table_update_grants_count', (
      SELECT COUNT(*)::int FROM table_grants
      WHERE grantee = 'authenticated' AND privilege_type = 'UPDATE' AND table_name = 'discography_tracks'
    ),
    'anon_write_grants_count', (
      SELECT COUNT(*)::int FROM table_grants
      WHERE grantee = 'anon' AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
    ),
    'g20u36e_restrictive_policy_count', (
      SELECT COUNT(*)::int FROM policies
      WHERE polname ILIKE '%g20u36e%' AND polpermissive = false AND polcmd = 'w'
    ),
    'g20u36f_restrictive_policy_count', (
      SELECT COUNT(*)::int FROM policies WHERE polname = p.restrictive_policy_name
    ),
    'admin_all_policy_count', aa.admin_all_policy_count,
    'rls_enabled_discography_tracks', (
      SELECT c.relrowsecurity FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'discography_tracks'
    )
  )
) AS g20u36f_marker_title_restore_preflight_snapshot
FROM params p
LEFT JOIN target_row tr ON true
LEFT JOIN track_agg ta ON true
LEFT JOIN original_title_rows otr ON true
LEFT JOIN admin_all aa ON true;
```

### Expected preflight PASS values

| Field | Expected |
| --- | --- |
| `target_title` | `On a Clear Day [CMS Kit staging G-20u36e]` |
| `original_title_count_for_target` | **0** |
| `target_row_count` | **1** |
| `target_row_id_matches` | **true** |
| `track_count` | **8** |
| `track_7_title` | `Like a Lover` |
| `authenticated_title_update_column_grants_count` | **0** |
| `authenticated_table_update_grants_count` | **0** |
| `anon_write_grants_count` | **0** |
| `g20u36e_restrictive_policy_count` | **0** |
| `g20u36f_restrictive_policy_count` | **0** (not yet created) |
| `admin_all_policy_count` | **2** |
| `rls_enabled_discography_tracks` | **true** |
| `data_mutation` | **false** |
| `operation_save_involved` | **false** |

---

## 5. Temporary permission open SQL (draft · not executed)

**Policy name:** `discography_tracks_g20u36f_marker_title_restore_restrictive`

```sql
-- G-20u36f marker-title-restore PERMISSION OPEN — NOT EXECUTED in planning phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- Run only after pre-restore SELECT PASS + handler deployed for G-20u36f restore

-- STOP if policy already exists
-- STOP if authenticated already has UPDATE(title)

GRANT UPDATE (title) ON TABLE public.discography_tracks TO authenticated;

CREATE POLICY discography_tracks_g20u36f_marker_title_restore_restrictive
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    site_slug = 'gosaki-piano'
    AND discography_legacy_id = 'discography-002'
    AND track_number = 1
    AND title = 'On a Clear Day [CMS Kit staging G-20u36e]'
  )
  WITH CHECK (
    site_slug = 'gosaki-piano'
    AND discography_legacy_id = 'discography-002'
    AND track_number = 1
    AND title = 'On a Clear Day'
  );
```

**Safety:**

- **RESTRICTIVE** only · narrow USING / WITH CHECK
- **No** anon write grant
- **No** DROP POLICY IF EXISTS on apply — if policy exists → **STOP**
- **No** data UPDATE in this SQL block

---

## 6. Controlled Save curl draft (not executed)

**Requires:** G-20u36f handler implementation + Edge deploy + permission open + operator JWT (admin).

```bash
cd ~/sariswing-astro
curl -sS -X POST \
  'https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run' \
  -H 'Content-Type: application/json' \
  -H 'apikey: <SUPABASE_ANON_KEY>' \
  -H 'Authorization: Bearer <OPERATOR_JWT>' \
  -d '{
    "operation": "save",
    "siteSlug": "gosaki-piano",
    "legacyId": "discography-002",
    "discographyLegacyId": "discography-002",
    "approvalId": "G-20u36f-gosaki-discography-marker-title-restore",
    "sliceId": "G-20u36f-discography-002-track-1-title-restore",
    "targetRowId": "e30c5ea9-2857-492b-8a78-58cbfcbe7929",
    "trackNumber": 1,
    "beforeTitle": "On a Clear Day [CMS Kit staging G-20u36e]",
    "afterTitle": "On a Clear Day"
  }'
```

**Note:** This curl will **FAIL** against current deployed handler until G-20u36f restore gates are implemented.

**Expected success (after impl):**

- `ok=true` · `controlledSave=true` · `updatedRows=1`
- `beforeTitle` = marker · `afterTitle` = `On a Clear Day`
- readBack: `trackCount=8` · `track_7=Like a Lover`

---

## 7. Permission close / rollback SQL (draft · not executed)

**Purpose:** Close permissions after restore Save · **does not revert title** (title stays restored).

```sql
-- G-20u36f marker-title-restore PERMISSION CLOSE — NOT EXECUTED in planning phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- Run after post-save SELECT PASS

REVOKE UPDATE (title) ON TABLE public.discography_tracks FROM authenticated;

DROP POLICY discography_tracks_g20u36f_marker_title_restore_restrictive
  ON public.discography_tracks;
```

**If Save fails mid-loop:** Operator may need rollback SQL that **also** restores marker title via controlled Save — plan separately; this close block assumes Save already PASS.

---

## 8. Post-restore package + FTP (reference · not this phase)

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run build:gosaki:staging
npm run verify:package-freshness:gosaki:staging
npm run preflight:gosaki:staging
npm run verify:manual-upload
# grep: public-dist/discography/index.html + admin/index.html contain "On a Clear Day"
# but NOT the full marker string
# manual FileZilla: public-dist/ contents → /cms-kit-staging/gosaki-piano/
```

---

## 9. STOP conditions

| # | Condition |
| --- | --- |
| 1 | Project ref ≠ `kmjqppxjdnwwrtaeqjta` |
| 2 | Preflight `target_title` ≠ marker string |
| 3 | `original_title_count_for_target` > **0** (already restored?) |
| 4 | `target_row_count` ≠ **1** |
| 5 | `track_count` ≠ **8** · `track_7_title` ≠ `Like a Lover` |
| 6 | Handler not updated for G-20u36f restore |
| 7 | Save attempted before permission open |
| 8 | G-20u36f policy already exists on apply |
| 9 | service_role required |
| 10 | Production path / ref involved |

---

## 10. What was NOT done this phase

| Item | Status |
| --- | --- |
| SQL execution | **no** |
| Save / operation=save | **no** |
| DB write | **no** |
| GRANT / REVOKE / CREATE / DROP POLICY | **no** |
| Edge deploy | **no** |
| Handler change | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| service_role | **not used** |
| Production change | **no** |

---

## 11. Next

```txt
recommendedNextPhase: G-20u36f-discography-marker-title-restore-handler-implementation
```

Then: pre-restore SELECT execution → permission open → controlled Save → close → package regen → manual FTP → UI verify.
