# G-20u44c Gosaki Discography label permission enablement prep

**Phase:** `G-20u44c-gosaki-discography-label-permission-enablement-prep`  
**Status:** SQL prep only · **未実行**  
**Classification:** permission enablement prep — no SQL execution · no DB write · no Save

## Gates (sql-prep phase)

```txt
PERMISSION_PREFLIGHT_SQL_READY: true
PERMISSION_APPLY_SQL_READY: true
POST_APPLY_VERIFY_SQL_READY: true
PERMISSION_ROLLBACK_SQL_READY: true
COLUMN_LEVEL_GRANT_ONLY: true
RESTRICTIVE_POLICY_READY: true
ANON_UPDATE_REMAINS_DENIED: true
TABLE_WIDE_UPDATE_REMAINS_DENIED: true
PRODUCTION_STOP_PRESERVED: true
SQL_EXECUTED: false
DB_WRITE_EXECUTED: false
SAVE_REQUEST_EXECUTED: false
gosakiDiscographyLabelPermissionEnablementPrepComplete: true
sqlPrepOnly: true
grantRevokeExecuted: false
createDropPolicyExecuted: false
dropPolicyIfExistsForbidden: true
service_role: not used
Production changed: no
Save enablement: no
First controlled Save: still not allowed in this phase
```

**Next phase:** `G-20u44d-gosaki-discography-label-permission-preflight-select-execution` (operator runs preflight SELECT only)

---

## Root cause (G-20u44b)

G-20u43 controlled Save returned **403** `G-20u43 label UPDATE denied by RLS or grants` after `is_admin()` and release SELECT succeeded.

| Class | Finding |
| --- | --- |
| **ROOT_CAUSE_CLASS** | **B** — `authenticated` lacks `UPDATE` privilege on `public.discography` |
| **Secondary** | **C** — no RESTRICTIVE UPDATE policy for label slice (required after grant, G-20u36e pattern) |
| **ROOT_CAUSE_CONFIRMED** | **true** |

**History:**

- G-15b: table-wide `GRANT UPDATE` on `public.discography` to `authenticated`
- G-20u36a: **REVOKE UPDATE** on `discography` + `discography_tracks` from `authenticated`
- G-20u36e: re-opened **`UPDATE(title)` on `discography_tracks` only** + RESTRICTIVE policy — **not** `discography.label`
- `discography_admin_all`: PERMISSIVE `FOR ALL` · `TO authenticated` · `USING (public.is_admin())` — requires table/column UPDATE grant first

---

## Target (staging only)

| Field | Value |
| --- | --- |
| Supabase project | `static-to-astro-cms-staging` |
| Project ref | `kmjqppxjdnwwrtaeqjta` |
| **PRODUCTION STOP** | `vsbvndwuajjhnzpohghh` |
| Table | `public.discography` |
| Role | `authenticated` |
| Column | `label` |
| `site_slug` | `gosaki-piano` |
| `legacy_id` | `discography-004` |
| Baseline label | `Mardi Gras JAPAN Records` |
| Temporary label | `[CMS Kit staging] G-20u42 label PoC` |
| Baseline `updated_at` | `2026-07-10T05:59:35.138671+00:00` |
| Expected releases | **4** |
| Expected tracks | **34** |

**Policy name (final):** `discography_g20u43_label_update_restrict` (39 bytes · no collision with existing policies in repo records)

**Forbidden:** production · other tables · other columns · `anon` UPDATE · table-wide UPDATE · `service_role` · RLS disable · data mutation in this phase

---

## STOP conditions

| # | Condition |
| --- | --- |
| 1 | SQL Editor project is **not** `kmjqppxjdnwwrtaeqjta` |
| 2 | Preflight baseline mismatch (label / `updated_at` / release / track counts) |
| 3 | `authenticated` table-wide UPDATE grant count ≠ 0 |
| 4 | `authenticated` label column UPDATE grant already exists (pre-apply) |
| 5 | Policy `discography_g20u43_label_update_restrict` already exists |
| 6 | `discography_admin_all` missing or `public.is_admin()` missing |
| 7 | RLS not enabled on `public.discography` |
| 8 | Apply / rollback SQL not reviewed by ChatGPT |
| 9 | Save re-attempt before post-apply verification PASS |

---

## A. Preflight SELECT-only SQL

**Status:** prepared · **未実行**  
**Purpose:** One paste into Supabase SQL Editor → single result table. **SELECT-only.**

```sql
-- G-20u44c label permission PREFLIGHT (SELECT-ONLY) — NOT EXECUTED in sql-prep phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh
-- Forbidden: INSERT UPDATE DELETE ALTER CREATE DROP GRANT REVOKE TRUNCATE DO

WITH params AS (
  SELECT
    'G-20u44c-gosaki-discography-label-permission-enablement-preflight'::text AS phase,
    'kmjqppxjdnwwrtaeqjta'::text AS expected_project_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_project_ref_stop,
    'gosaki-piano'::text AS target_site_slug,
    'discography-004'::text AS target_legacy_id,
    'Mardi Gras JAPAN Records'::text AS baseline_label,
    '[CMS Kit staging] G-20u42 label PoC'::text AS temporary_label,
    '2026-07-10T05:59:35.138671+00:00'::timestamptz AS baseline_updated_at,
    4::int AS expected_release_count,
    34::int AS expected_track_count,
    'discography_g20u43_label_update_restrict'::text AS restrictive_policy_name,
    (now() AT TIME ZONE 'utc')::timestamptz AS captured_at
),
table_grants AS (
  SELECT g.grantee, g.privilege_type, count(*)::int AS grant_count
  FROM information_schema.role_table_grants g
  WHERE g.table_schema = 'public'
    AND g.table_name = 'discography'
    AND g.grantee IN ('anon', 'authenticated')
    AND g.privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
  GROUP BY g.grantee, g.privilege_type
),
column_grants AS (
  SELECT c.grantee, c.column_name, count(*)::int AS grant_count
  FROM information_schema.column_privileges c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'discography'
    AND c.column_name = 'label'
    AND c.grantee IN ('anon', 'authenticated')
    AND c.privilege_type = 'UPDATE'
  GROUP BY c.grantee, c.column_name
),
rls_status AS (
  SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'discography'
),
policies AS (
  SELECT
    pol.policyname,
    pol.permissive,
    pol.cmd,
    pol.roles::text AS roles,
    pol.qual,
    pol.with_check
  FROM pg_policies pol
  WHERE pol.schemaname = 'public' AND pol.tablename = 'discography'
),
target_release AS (
  SELECT d.legacy_id, d.label, d.updated_at
  FROM public.discography d
  CROSS JOIN params p
  WHERE d.site_slug = p.target_site_slug
    AND d.legacy_id = p.target_legacy_id
),
gosaki_counts AS (
  SELECT
    (SELECT count(*)::int FROM public.discography d
      CROSS JOIN params p WHERE d.site_slug = p.target_site_slug) AS release_count,
    (SELECT count(*)::int FROM public.discography_tracks t
      CROSS JOIN params p WHERE t.site_slug = p.target_site_slug) AS track_count
),
is_admin_fn AS (
  SELECT (to_regprocedure('public.is_admin()') IS NOT NULL) AS is_admin_function_exists
),
metrics AS (
  SELECT 10 AS sort_order, 'environment'::text AS section, 'current_database'::text AS metric,
         current_database()::text AS value, ''::text AS expected, ''::text AS status
  UNION ALL
  SELECT 20, 'environment', 'table_schema', 'public', '', ''
  UNION ALL
  SELECT 21, 'environment', 'table_name', 'discography', '', ''
  UNION ALL
  SELECT 30, 'rls', 'rls_enabled',
         coalesce((SELECT rls_enabled::text FROM rls_status), 'null'), 'true',
         CASE WHEN coalesce((SELECT rls_enabled FROM rls_status), false) THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 31, 'rls', 'rls_forced',
         coalesce((SELECT rls_forced::text FROM rls_status), 'null'), '(recorded)', 'INFO'
  UNION ALL
  SELECT 40, 'grants', 'authenticated_table_wide_update_count',
         coalesce((SELECT grant_count::text FROM table_grants
           WHERE grantee = 'authenticated' AND privilege_type = 'UPDATE'), '0'), '0',
         CASE WHEN coalesce((SELECT grant_count FROM table_grants
           WHERE grantee = 'authenticated' AND privilege_type = 'UPDATE'), 0) = 0
           THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 41, 'grants', 'authenticated_label_column_update_count',
         coalesce((SELECT grant_count::text FROM column_grants
           WHERE grantee = 'authenticated' AND column_name = 'label'), '0'), '0',
         CASE WHEN coalesce((SELECT grant_count FROM column_grants
           WHERE grantee = 'authenticated' AND column_name = 'label'), 0) = 0
           THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 42, 'grants', 'anon_table_wide_update_count',
         coalesce((SELECT grant_count::text FROM table_grants
           WHERE grantee = 'anon' AND privilege_type = 'UPDATE'), '0'), '0',
         CASE WHEN coalesce((SELECT grant_count FROM table_grants
           WHERE grantee = 'anon' AND privilege_type = 'UPDATE'), 0) = 0
           THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 43, 'grants', 'anon_label_column_update_count',
         coalesce((SELECT grant_count::text FROM column_grants
           WHERE grantee = 'anon' AND column_name = 'label'), '0'), '0',
         CASE WHEN coalesce((SELECT grant_count FROM column_grants
           WHERE grantee = 'anon' AND column_name = 'label'), 0) = 0
           THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 50, 'admin', 'is_admin_function_exists',
         (SELECT is_admin_function_exists::text FROM is_admin_fn), 'true',
         CASE WHEN (SELECT is_admin_function_exists FROM is_admin_fn) THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 60, 'target', 'release_label',
         coalesce((SELECT label FROM target_release), '(missing)'),
         (SELECT baseline_label FROM params),
         CASE WHEN (SELECT label FROM target_release) = (SELECT baseline_label FROM params)
           THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 61, 'target', 'release_updated_at',
         coalesce((SELECT updated_at::text FROM target_release), '(missing)'),
         (SELECT baseline_updated_at::text FROM params),
         CASE WHEN (SELECT updated_at FROM target_release) = (SELECT baseline_updated_at FROM params)
           THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 62, 'counts', 'gosaki_release_count',
         (SELECT release_count::text FROM gosaki_counts),
         (SELECT expected_release_count::text FROM params),
         CASE WHEN (SELECT release_count FROM gosaki_counts) = (SELECT expected_release_count FROM params)
           THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 63, 'counts', 'gosaki_track_count',
         (SELECT track_count::text FROM gosaki_counts),
         (SELECT expected_track_count::text FROM params),
         CASE WHEN (SELECT track_count FROM gosaki_counts) = (SELECT expected_track_count FROM params)
           THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 70, 'policy_collision', 'restrictive_policy_name_collision_count',
         (SELECT count(*)::text FROM policies pol
           CROSS JOIN params p WHERE pol.policyname = p.restrictive_policy_name),
         '0',
         CASE WHEN (SELECT count(*) FROM policies pol CROSS JOIN params p
           WHERE pol.policyname = p.restrictive_policy_name) = 0
           THEN 'PASS' ELSE 'FAIL' END
)
SELECT
  m.sort_order,
  m.section,
  m.metric,
  m.value,
  m.expected,
  m.status,
  (SELECT phase FROM params) AS phase,
  (SELECT expected_project_ref FROM params) AS expected_project_ref,
  (SELECT production_project_ref_stop FROM params) AS production_project_ref_stop,
  (SELECT captured_at FROM params) AS captured_at
FROM metrics m
UNION ALL
SELECT
  100 + row_number() OVER (ORDER BY pol.policyname) AS sort_order,
  'policy'::text,
  pol.policyname,
  pol.permissive || ' · ' || pol.cmd || ' · roles=' || pol.roles,
  left(coalesce(pol.qual, ''), 120),
  left(coalesce(pol.with_check, ''), 120),
  (SELECT phase FROM params),
  (SELECT expected_project_ref FROM params),
  (SELECT production_project_ref_stop FROM params),
  (SELECT captured_at FROM params)
FROM policies pol
ORDER BY sort_order;
```

### Preflight PASS (before apply)

| check | Expected |
| --- | --- |
| Operator project ref | `kmjqppxjdnwwrtaeqjta` (manual — not in SQL result) |
| `authenticated_table_wide_update_count` | **0** |
| `authenticated_label_column_update_count` | **0** |
| `anon_*_update_count` | **0** |
| `release_label` | `Mardi Gras JAPAN Records` |
| `release_updated_at` | `2026-07-10T05:59:35.138671+00:00` |
| `gosaki_release_count` | **4** |
| `gosaki_track_count` | **34** |
| `restrictive_policy_name_collision_count` | **0** |

---

## B. Apply SQL

**Status:** prepared · **未実行**  
**Purpose:** Grant column-level `UPDATE(label)` + create RESTRICTIVE UPDATE policy.  
**Contains:** fail-closed guards · `GRANT` · `CREATE POLICY` only.  
**Forbidden:** data UPDATE/INSERT/DELETE · anon grant · service_role · `DROP POLICY IF EXISTS` on apply.

```sql
-- G-20u44c label permission APPLY — NOT EXECUTED in sql-prep phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh — DO NOT RUN
-- Operator MUST confirm SQL Editor project ref before running
-- Prerequisites: preflight PASS · rollback SQL reviewed · policy name does NOT exist
-- Forbidden: data UPDATE/INSERT/DELETE · DROP POLICY IF EXISTS · GRANT to anon · service_role

BEGIN;

DO $$
DECLARE
  v_policy_collision int;
  v_table_update int;
  v_label_grant int;
  v_baseline_ok boolean;
BEGIN
  -- Fail-closed: staging fingerprint (label + updated_at + release/track counts)
  -- Indirect production guard: production row state is expected to differ
  SELECT EXISTS (
    SELECT 1
    FROM public.discography d
    WHERE d.site_slug = 'gosaki-piano'
      AND d.legacy_id = 'discography-004'
      AND d.label = 'Mardi Gras JAPAN Records'
      AND d.updated_at = '2026-07-10T05:59:35.138671+00:00'::timestamptz
  ) INTO v_baseline_ok;

  IF NOT v_baseline_ok THEN
    RAISE EXCEPTION 'G-20u44c fail-closed: baseline_label_or_updated_at_mismatch (confirm staging kmjqppxjdnwwrtaeqjta)';
  END IF;

  IF (SELECT count(*) FROM public.discography WHERE site_slug = 'gosaki-piano') <> 4
     OR (SELECT count(*) FROM public.discography_tracks WHERE site_slug = 'gosaki-piano') <> 34 THEN
    RAISE EXCEPTION 'G-20u44c fail-closed: gosaki_release_or_track_count_mismatch (possible wrong project)';
  END IF;

  SELECT count(*) INTO v_policy_collision
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'discography'
    AND policyname = 'discography_g20u43_label_update_restrict';

  IF v_policy_collision > 0 THEN
    RAISE EXCEPTION 'G-20u44c fail-closed: restrictive_policy_name_collision';
  END IF;

  SELECT count(*) INTO v_table_update
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name = 'discography'
    AND grantee = 'authenticated'
    AND privilege_type = 'UPDATE';

  IF v_table_update > 0 THEN
    RAISE EXCEPTION 'G-20u44c fail-closed: authenticated_table_wide_update_grant_exists';
  END IF;

  SELECT count(*) INTO v_label_grant
  FROM information_schema.column_privileges
  WHERE table_schema = 'public'
    AND table_name = 'discography'
    AND column_name = 'label'
    AND grantee = 'authenticated'
    AND privilege_type = 'UPDATE';

  IF v_label_grant > 0 THEN
    RAISE EXCEPTION 'G-20u44c fail-closed: authenticated_label_update_grant_already_exists';
  END IF;

  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'G-20u44c fail-closed: public.is_admin() missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'discography'
      AND policyname = 'discography_admin_all'
  ) THEN
    RAISE EXCEPTION 'G-20u44c fail-closed: discography_admin_all missing';
  END IF;
END $$;

-- Column-level label UPDATE for authenticated (NOT table-wide UPDATE)
GRANT UPDATE (label) ON TABLE public.discography TO authenticated;

-- RESTRICTIVE UPDATE policy — narrows admin_all blast radius to G-20u43 label slice
-- AS RESTRICTIVE · FOR UPDATE TO authenticated
-- USING / WITH CHECK: site_slug + legacy_id + allowlisted label values
-- Admin gate: permissive discography_admin_all (is_admin()) — see §6 RLS design
CREATE POLICY discography_g20u43_label_update_restrict
  ON public.discography
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    site_slug = 'gosaki-piano'
    AND legacy_id = 'discography-004'
    AND label IN (
      'Mardi Gras JAPAN Records',
      '[CMS Kit staging] G-20u42 label PoC'
    )
  )
  WITH CHECK (
    site_slug = 'gosaki-piano'
    AND legacy_id = 'discography-004'
    AND label IN (
      'Mardi Gras JAPAN Records',
      '[CMS Kit staging] G-20u42 label PoC'
    )
  );

COMMIT;
```

**Does not touch:** `discography_admin_all` · public SELECT policies · RLS enabled flag · row data · `discography_tracks` grants.

---

## C. Post-apply verification SELECT-only SQL

**Status:** prepared · **未実行**  
**Purpose:** Run once immediately after apply. **SELECT-only.**

```sql
-- G-20u44c label permission POST-APPLY verify (SELECT-ONLY) — NOT EXECUTED in sql-prep phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta

WITH params AS (
  SELECT
    'G-20u44c-gosaki-discography-label-permission-post-apply'::text AS phase,
    'discography_g20u43_label_update_restrict'::text AS restrictive_policy_name,
    'gosaki-piano'::text AS target_site_slug,
    'discography-004'::text AS target_legacy_id,
    'Mardi Gras JAPAN Records'::text AS baseline_label,
    '2026-07-10T05:59:35.138671+00:00'::timestamptz AS baseline_updated_at,
    4::int AS expected_release_count,
    34::int AS expected_track_count,
    (now() AT TIME ZONE 'utc')::timestamptz AS captured_at
),
table_grants AS (
  SELECT g.grantee, g.privilege_type, count(*)::int AS grant_count
  FROM information_schema.role_table_grants g
  WHERE g.table_schema = 'public' AND g.table_name = 'discography'
    AND g.grantee IN ('anon', 'authenticated')
    AND g.privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
  GROUP BY g.grantee, g.privilege_type
),
column_grants AS (
  SELECT c.grantee, c.column_name, count(*)::int AS grant_count
  FROM information_schema.column_privileges c
  WHERE c.table_schema = 'public' AND c.table_name = 'discography'
    AND c.column_name = 'label'
    AND c.grantee IN ('anon', 'authenticated')
    AND c.privilege_type = 'UPDATE'
  GROUP BY c.grantee, c.column_name
),
policy_row AS (
  SELECT pol.policyname, pol.permissive, pol.cmd, pol.roles::text AS roles,
         pol.qual, pol.with_check
  FROM pg_policies pol
  CROSS JOIN params p
  WHERE pol.schemaname = 'public'
    AND pol.tablename = 'discography'
    AND pol.policyname = p.restrictive_policy_name
),
target_release AS (
  SELECT d.label, d.updated_at
  FROM public.discography d
  CROSS JOIN params p
  WHERE d.site_slug = p.target_site_slug AND d.legacy_id = p.target_legacy_id
),
gosaki_counts AS (
  SELECT
    (SELECT count(*)::int FROM public.discography d
      CROSS JOIN params p WHERE d.site_slug = p.target_site_slug) AS release_count,
    (SELECT count(*)::int FROM public.discography_tracks t
      CROSS JOIN params p WHERE t.site_slug = p.target_site_slug) AS track_count
),
metrics AS (
  SELECT 10 AS sort_order, 'grants' AS section, 'authenticated_table_wide_update_count' AS metric,
         coalesce((SELECT grant_count::text FROM table_grants
           WHERE grantee = 'authenticated' AND privilege_type = 'UPDATE'), '0') AS value,
         '0' AS expected,
         CASE WHEN coalesce((SELECT grant_count FROM table_grants
           WHERE grantee = 'authenticated' AND privilege_type = 'UPDATE'), 0) = 0
           THEN 'PASS' ELSE 'FAIL' END AS status
  UNION ALL
  SELECT 11, 'grants', 'authenticated_label_column_update_count',
         coalesce((SELECT grant_count::text FROM column_grants
           WHERE grantee = 'authenticated' AND column_name = 'label'), '0'), '1',
         CASE WHEN coalesce((SELECT grant_count FROM column_grants
           WHERE grantee = 'authenticated' AND column_name = 'label'), 0) = 1
           THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 12, 'grants', 'anon_update_grant_count',
         coalesce((SELECT sum(grant_count)::text FROM table_grants WHERE grantee = 'anon'), '0'), '0',
         CASE WHEN coalesce((SELECT sum(grant_count) FROM table_grants WHERE grantee = 'anon'), 0) = 0
           THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 20, 'policy', 'restrictive_policy_count',
         (SELECT count(*)::text FROM policy_row), '1',
         CASE WHEN (SELECT count(*) FROM policy_row) = 1 THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 21, 'policy', 'restrictive_policy_permissive',
         coalesce((SELECT permissive FROM policy_row LIMIT 1), '(missing)'), 'RESTRICTIVE',
         CASE WHEN (SELECT permissive FROM policy_row LIMIT 1) = 'RESTRICTIVE' THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 22, 'policy', 'restrictive_policy_cmd',
         coalesce((SELECT cmd FROM policy_row LIMIT 1), '(missing)'), 'UPDATE',
         CASE WHEN (SELECT cmd FROM policy_row LIMIT 1) = 'UPDATE' THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 23, 'policy', 'restrictive_policy_roles',
         coalesce((SELECT roles FROM policy_row LIMIT 1), '(missing)'), '{authenticated}',
         CASE WHEN (SELECT roles FROM policy_row LIMIT 1) LIKE '%authenticated%' THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 30, 'data', 'release_label_unchanged',
         coalesce((SELECT label FROM target_release), '(missing)'),
         (SELECT baseline_label FROM params),
         CASE WHEN (SELECT label FROM target_release) = (SELECT baseline_label FROM params)
           THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 31, 'data', 'release_updated_at_unchanged',
         coalesce((SELECT updated_at::text FROM target_release), '(missing)'),
         (SELECT baseline_updated_at::text FROM params),
         CASE WHEN (SELECT updated_at FROM target_release) = (SELECT baseline_updated_at FROM params)
           THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 32, 'counts', 'gosaki_release_count',
         (SELECT release_count::text FROM gosaki_counts),
         (SELECT expected_release_count::text FROM params),
         CASE WHEN (SELECT release_count FROM gosaki_counts) = (SELECT expected_release_count FROM params)
           THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 33, 'counts', 'gosaki_track_count',
         (SELECT track_count::text FROM gosaki_counts),
         (SELECT expected_track_count::text FROM params),
         CASE WHEN (SELECT track_count FROM gosaki_counts) = (SELECT expected_track_count FROM params)
           THEN 'PASS' ELSE 'FAIL' END
)
SELECT m.*,
       (SELECT phase FROM params) AS phase,
       left(coalesce((SELECT qual FROM policy_row LIMIT 1), ''), 200) AS policy_qual_preview,
       left(coalesce((SELECT with_check FROM policy_row LIMIT 1), ''), 200) AS policy_with_check_preview
FROM metrics m
ORDER BY m.sort_order;
```

---

## D. Rollback SQL

**Status:** prepared · **未実行**  
**Purpose:** Undo apply only. **No** data change · **no** RLS disable · **no** `discography_admin_all` change · **no** service_role.

```sql
-- G-20u44c label permission ROLLBACK — NOT EXECUTED in sql-prep phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- Does NOT change target row data · does NOT disable RLS · does NOT drop admin_all

BEGIN;

DO $$
DECLARE
  v_policy_count int;
  v_label_grant int;
BEGIN
  SELECT count(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'discography'
    AND policyname = 'discography_g20u43_label_update_restrict';

  IF v_policy_count <> 1 THEN
    RAISE EXCEPTION 'G-20u44c rollback fail-closed: expected exactly 1 G-20u43 restrictive policy';
  END IF;

  SELECT count(*) INTO v_label_grant
  FROM information_schema.column_privileges
  WHERE table_schema = 'public'
    AND table_name = 'discography'
    AND column_name = 'label'
    AND grantee = 'authenticated'
    AND privilege_type = 'UPDATE';

  IF v_label_grant <> 1 THEN
    RAISE EXCEPTION 'G-20u44c rollback fail-closed: expected exactly 1 authenticated label UPDATE grant';
  END IF;
END $$;

REVOKE UPDATE (label) ON TABLE public.discography FROM authenticated;

DROP POLICY discography_g20u43_label_update_restrict ON public.discography;

COMMIT;
```

**Note:** Rollback uses fail-closed `DROP POLICY` (not `IF EXISTS`). Apply must **not** use DROP/recreate.

---

## E. Post-rollback verification SELECT-only SQL

**Status:** operator executed · **PASS** (corrected verification)

```sql
-- G-20u44c label permission POST-ROLLBACK verify (SELECT-ONLY) — NOT EXECUTED in sql-prep phase

WITH params AS (
  SELECT
    'G-20u44c-gosaki-discography-label-permission-post-rollback'::text AS phase,
    'discography_g20u43_label_update_restrict'::text AS restrictive_policy_name,
    'gosaki-piano'::text AS target_site_slug,
    'discography-004'::text AS target_legacy_id,
    'Mardi Gras JAPAN Records'::text AS baseline_label,
    '2026-07-16T18:35:15.236693+00:00'::timestamptz AS final_updated_at,
    4::int AS expected_release_count,
    34::int AS expected_track_count,
    (now() AT TIME ZONE 'utc')::timestamptz AS captured_at
),
column_grants AS (
  SELECT c.grantee, count(*)::int AS grant_count
  FROM information_schema.column_privileges c
  WHERE c.table_schema = 'public' AND c.table_name = 'discography'
    AND c.column_name = 'label' AND c.privilege_type = 'UPDATE'
    AND c.grantee IN ('anon', 'authenticated')
  GROUP BY c.grantee
),
table_grants AS (
  SELECT g.grantee, g.privilege_type, count(*)::int AS grant_count
  FROM information_schema.role_table_grants g
  WHERE g.table_schema = 'public' AND g.table_name = 'discography'
    AND g.grantee IN ('anon', 'authenticated')
    AND g.privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
  GROUP BY g.grantee, g.privilege_type
),
target_release AS (
  SELECT d.label, d.updated_at
  FROM public.discography d
  CROSS JOIN params p
  WHERE d.site_slug = p.target_site_slug AND d.legacy_id = p.target_legacy_id
),
checks AS (
  SELECT
    coalesce((SELECT grant_count FROM column_grants WHERE grantee = 'authenticated'), 0) AS auth_label_grant,
    coalesce((SELECT grant_count FROM table_grants
      WHERE grantee = 'authenticated' AND privilege_type = 'UPDATE'), 0) AS auth_table_update,
    coalesce((SELECT sum(grant_count) FROM table_grants WHERE grantee = 'anon'), 0) AS anon_write,
    coalesce((SELECT grant_count FROM column_grants WHERE grantee = 'anon'), 0) AS anon_label_update,
    (SELECT count(*) FROM pg_policies pol CROSS JOIN params p
      WHERE pol.schemaname = 'public' AND pol.tablename = 'discography'
        AND pol.policyname = p.restrictive_policy_name) AS policy_count,
    (SELECT label FROM target_release) AS label,
    (SELECT updated_at FROM target_release) AS updated_at,
    (SELECT count(*)::int FROM public.discography d CROSS JOIN params p
      WHERE d.site_slug = p.target_site_slug) AS release_count,
    (SELECT count(*)::int FROM public.discography_tracks t CROSS JOIN params p
      WHERE t.site_slug = p.target_site_slug) AS track_count
)
SELECT
  (SELECT phase FROM params) AS phase,
  (SELECT captured_at FROM params) AS captured_at,
  c.auth_label_grant AS authenticated_label_update_count,
  c.auth_table_update AS authenticated_table_update_count,
  c.anon_write AS anon_table_write_count,
  c.anon_label_update AS anon_label_update_count,
  c.policy_count AS restrictive_policy_count,
  c.label AS target_label,
  c.updated_at AS target_updated_at,
  c.release_count,
  c.track_count,
  CASE WHEN c.auth_label_grant = 0
    AND c.auth_table_update = 0
    AND c.anon_write = 0
    AND c.anon_label_update = 0
    AND c.policy_count = 0
    AND c.label = (SELECT baseline_label FROM params)
    AND c.updated_at = (SELECT final_updated_at FROM params)
    AND c.release_count = (SELECT expected_release_count FROM params)
    AND c.track_count = (SELECT expected_track_count FROM params)
    THEN 'PASS' ELSE 'FAIL' END AS post_rollback_status
FROM checks c;
```

---

## 6. RLS design notes

| Layer | Responsibility |
| --- | --- |
| **Column grant** | `UPDATE(label)` on `public.discography` to `authenticated` only — **not** table-wide |
| **Permissive admin** | `discography_admin_all` · `public.is_admin()` · `SECURITY DEFINER` function on `public.admin_users` |
| **RESTRICTIVE slice** | `discography_g20u43_label_update_restrict` · `gosaki-piano` + `discography-004` + allowlisted label values |
| **Edge handler** | Original ↔ temporary transition only · optimistic lock `WHERE updated_at = expected` |
| **Anon** | No UPDATE grant · SELECT via `discography_public_select` only |
| **service_role** | **Not used** |
| **RLS** | Remains **enabled** — never disabled in this phase |

### Admin predicate placement (decision)

**Chosen:** RESTRICTIVE policy **without** repeating `public.is_admin()` — same as G-20u36e track-title slice.

**Reason:**

1. PostgreSQL combines PERMISSIVE policies with OR and RESTRICTIVE with AND.
2. For UPDATE, non-admin `authenticated` users have **no permissive UPDATE policy** (`discography_admin_all` requires `is_admin()`).
3. Even after column grant, non-admin UPDATE is denied at RLS before row predicates matter.
4. Admin UPDATE requires **both** `discography_admin_all` (permissive) **and** the RESTRICTIVE slice (fail-closed narrowing).
5. Duplicating `is_admin()` in RESTRICTIVE would be defense-in-depth but is redundant and diverges from the proven G-20u36e pattern.

### Transition direction (RLS vs Edge)

PostgreSQL RLS `USING` / `WITH CHECK` cannot compare OLD vs NEW label for exact bidirectional transition (`original → temporary` restore only). The RESTRICTIVE policy allowlists **both** label values on old and new rows.

**Edge fail-closed** (`gosaki-discography-save-dry-run` G-20u43 path) enforces:

- `operation=save` with approval `G-20u43-gosaki-discography-label-controlled-save-slice`
- nested payload allowlist (label only)
- transition: `Mardi Gras JAPAN Records` ↔ `[CMS Kit staging] G-20u42 label PoC` only
- optimistic lock on `updated_at`

RLS prevents other releases, columns, and arbitrary label strings; Edge prevents invalid transitions within the allowlisted pair.

---

## 7. Operator execution order (documented only — not executed in G-20u44c)

| Step | Action |
| --- | --- |
| 1 | Run **§A Preflight SELECT-only SQL** on staging `kmjqppxjdnwwrtaeqjta` |
| 2 | ChatGPT reviews preflight table (confirm project ref + PASS rows) |
| 3 | Run **§B Apply SQL** once |
| 4 | Run **§C Post-apply verification SELECT-only SQL** |
| 5 | ChatGPT reviews post-apply (grants + policy + data unchanged) |
| 6 | Controlled Save once (G-20u43 label PoC) — operator manual |
| 7 | Temporary label read verification |
| 8 | Restore Save (exact original label) |
| 9 | Exact restore verification |
| 10 | **§D Rollback SQL** or retain as limited CMS capability — operator decision |

**G-20u44c executes none of steps 1–10.**

---

## Related phases

| Phase | Role |
| --- | --- |
| G-20u42 | Controlled Save enablement preflight (baseline values) |
| G-20u43 | Label controlled Save slice (Edge + UI) |
| G-20u44b | 403 diagnosis — root cause Class B |
| **G-20u44c** | **This doc** — permission SQL prep |
| G-20u44d | Preflight SELECT execution (operator + ChatGPT) |
| G-20u44 | Controlled Save round-trip (operator) — **complete** |

---

## G-20u44 follow-up (controlled Save round-trip — complete)

Operator executed permission apply (G-20u44c §B–§C) then G-20u43 label controlled Save round-trip on `local_shell`. Cursor read-only verification **2026-07-17**.

| Item | Value |
| --- | --- |
| `discography-004.label` (final) | `Mardi Gras JAPAN Records` (exact) |
| post-restore `updated_at` | `2026-07-16T18:35:15.236693+00:00` |
| releases / tracks | **4** / **34** |
| other releases unchanged | **yes** |
| local dev terminated | **yes** |
| env arm残留 | **none** |
| STG package disarmed | **yes** |

```txt
CONTROLLED_SAVE_TEMPORARY_WRITE_PASSED: true
CONTROLLED_SAVE_RESTORE_PASSED: true
FINAL_LABEL_RESTORED: true
OTHER_DATA_UNCHANGED: true
LOCAL_ARM_TERMINATED: true
CONTROLLED_SAVE_ROUND_TRIP_COMPLETED: true
```

**Next:** Commit/Push → next CMS feature development.

---

## G-20u44c permission rollback result (operator — complete)

**Target:** `static-to-astro-cms-staging` · `kmjqppxjdnwwrtaeqjta`
**§D Rollback SQL:** success · no rows returned
**§E corrected post-rollback verification:** **PASS**

| Metric | Result |
| --- | --- |
| authenticated label UPDATE | **0** |
| authenticated table UPDATE | **0** |
| anon table write | **0** |
| anon label UPDATE | **0** |
| restrictive policy count | **0** |
| final label | `Mardi Gras JAPAN Records` |
| final `updated_at` | `2026-07-16T18:35:15.236693+00:00` |
| releases / tracks | **4** / **34** |
| post-rollback status | **PASS** |

```txt
PERMISSION_ROLLBACK_COMPLETED: true
AUTHENTICATED_LABEL_UPDATE_REVOKED: true
AUTHENTICATED_TABLE_UPDATE_REMAINS_DENIED: true
ANON_UPDATE_REMAINS_DENIED: true
RESTRICTIVE_POLICY_REMOVED: true
FINAL_LABEL_RESTORED: true
FINAL_UPDATED_AT_VERIFIED: true
OTHER_DATA_UNCHANGED: true
CONTROLLED_SAVE_ROUND_TRIP_COMPLETED: true
VERIFICATION_PERMISSION_CLOSED: true
DB_DATA_WRITE_EXECUTED_DURING_ROLLBACK: false
SAVE_REQUEST_EXECUTED_DURING_ROLLBACK: false
PRODUCTION_CHANGED: false
```
