# G-20u36e — Gosaki Discography controlled Save pre-save SELECT-only prep (+ extract)

**Phase:** `G-20u36e-controlled-save-pre-save-select-prep-and-extract`  
**Status:** **complete** — SELECT-only SQL prepared & extracted · **SQL未実行** · **no Save**  
**Date:** 2026-07-14  
**Prior:** [smoke-readonly-check-result](./gosaki-discography-g20u36e-controlled-save-smoke-readonly-check-result.md) · [post-apply-result](./gosaki-discography-g20u36e-controlled-save-permission-change-post-apply-result.md) · [rollback-name-adjustment](./gosaki-discography-g20u36e-controlled-save-rollback-name-adjustment-prep.md)

| Check | Status |
| --- | --- |
| SELECT-only prep / extract | **yes** |
| SQL executed | **no** · 未実行 |
| operation=save | **not sent** · 未送信 |
| Save executed | **no** · 未実行 |
| DB write | **no** · なし |
| Rollback executed | **no** · 未実行 |
| service_role | **not used** · 不使用 |
| Production changed | **no** · production未変更 |

---

## Gates

```txt
gosakiDiscographyControlledSavePreSaveSelectPrepared: true
phase: G-20u36e-controlled-save-pre-save-select-prep-and-extract
selectOnlyPrepAndExtract: true
sqlNotExecuted: true
operationSaveSent: false
saveExecuted: false
dbDataWriteExecuted: false
rollbackExecuted: false
serviceRoleUsed: false
productionChanged: false
recommendedNextPhase: G-20u36e-controlled-save-pre-save-select-execution
```

**Staging project ref:** `kmjqppxjdnwwrtaeqjta`  
**Production STOP:** `vsbvndwuajjhnzpohghh`  
**Actual restrictive policy name:** `discography_tracks_g20u36e_controlled_save_title_update_restric` (63-char truncate)

---

## 1. Target slice (Save直前確認)

| Item | Value |
| --- | --- |
| site_slug | `gosaki-piano` |
| discography_legacy_id | `discography-002` |
| track_number | `1` |
| row id | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| current expected title (old) | `On a Clear Day` |
| save target title (new · not applied yet) | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track_count | `8` |
| track_7_title | `Like a Lover` |

---

## 2. PASS / STOP conditions

### PASS（実行結果が次を満たす）

| Check | Expected |
| --- | --- |
| `expected_project_ref` | `kmjqppxjdnwwrtaeqjta` |
| `production_project_ref_stop` | `vsbvndwuajjhnzpohghh` |
| `target_row_count` | **1** |
| `target_row_id` | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| `target_title` | still **`On a Clear Day`** (old · Save未実行) |
| `track_count` | **8** |
| `track_7_title` | `Like a Lover` |
| `authenticated_title_update_column_grants_count` | **1** |
| `authenticated_table_update_grants_count` | **0** |
| `anon_write_grants_count` | **0** |
| `actual_restrictive_policy_count` | **1** |
| `restrictive_policy_using_matches_expected` | **true** |
| `restrictive_policy_with_check_matches_expected` | **true** |
| `admin_all_policy_count` | **2** |
| `rls_enabled_discography_tracks` | **true** |
| `data_mutation` | **false** |
| `operation_save_involved` | **false** |

### STOP

| Condition |
| --- |
| `target_title` already = new title (`On a Clear Day [CMS Kit staging G-20u36e]`) |
| `target_row_count` ≠ 1 |
| grant / policy / RLS unexpected |
| `anon_write_grants_count` > 0 |
| `authenticated_table_update_grants_count` > 0 (broad UPDATE) |
| production project used |
| SQL text contains INSERT / UPDATE / DELETE / GRANT / REVOKE / CREATE / DROP |

---

## 3. Pre-save SELECT-only SQL (extracted · **未実行**)

**Column:** `g20u36e_controlled_save_pre_save_snapshot`  
**Mode:** SELECT-only · one JSON row · no data mutation  
**Where:** staging Supabase SQL Editor only (`kmjqppxjdnwwrtaeqjta`)

```sql
-- G-20u36e controlled Save PRE-SAVE verify (SELECT-ONLY) — NOT EXECUTED in prep/extract phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh
-- No INSERT / UPDATE / DELETE / GRANT / REVOKE / CREATE / DROP

WITH params AS (
  SELECT
    'G-20u36e-controlled-save-pre-save-select'::text AS phase,
    'kmjqppxjdnwwrtaeqjta'::text AS expected_project_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_project_ref_stop,
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id,
    1::int AS target_track_number,
    'e30c5ea9-2857-492b-8a78-58cbfcbe7929'::uuid AS target_row_id,
    'On a Clear Day'::text AS title_old,
    'On a Clear Day [CMS Kit staging G-20u36e]'::text AS title_new,
    'Like a Lover'::text AS target_track_7_title_expected,
    8::int AS expected_track_count,
    'discography_tracks_g20u36e_controlled_save_title_update_restric'::text AS actual_restrictive_policy_name,
    ARRAY['discography', 'discography_tracks']::text[] AS target_tables,
    (now() AT TIME ZONE 'utc')::timestamptz AS captured_at
),
table_grants AS (
  SELECT g.table_name, g.grantee, g.privilege_type
  FROM information_schema.role_table_grants g
  CROSS JOIN params p
  WHERE g.table_schema = 'public'
    AND g.table_name = ANY (p.target_tables)
    AND g.grantee IN ('anon', 'authenticated')
    AND g.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
),
column_privileges AS (
  SELECT c.grantee, c.privilege_type, c.column_name
  FROM information_schema.column_privileges c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'discography_tracks'
    AND c.column_name = 'title'
    AND c.grantee IN ('anon', 'authenticated')
    AND c.privilege_type = 'UPDATE'
),
rls_status AS (
  SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN params p
  WHERE n.nspname = 'public' AND c.relname = ANY (p.target_tables)
),
policies AS (
  SELECT pol.tablename, pol.policyname, pol.permissive, pol.roles, pol.cmd,
         pol.qual, pol.with_check
  FROM pg_policies pol
  CROSS JOIN params p
  WHERE pol.schemaname = 'public' AND pol.tablename = ANY (p.target_tables)
),
target_row AS (
  SELECT t.id, t.title, t.track_number, t.site_slug, t.discography_legacy_id
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
    AND t.track_number = p.target_track_number
),
target_tracks AS (
  SELECT t.track_number, t.title
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
),
restrictive_pol AS (
  SELECT pol.qual, pol.with_check, pol.permissive, pol.cmd, pol.policyname
  FROM policies pol
  CROSS JOIN params p
  WHERE pol.policyname = p.actual_restrictive_policy_name
),
checks AS (
  SELECT
    (SELECT count(*) FROM column_privileges cp
      WHERE cp.grantee = 'authenticated')::int
      AS authenticated_title_update_column_grants_count,
    (SELECT count(*) FROM table_grants tg
      WHERE tg.grantee = 'authenticated' AND tg.table_name = 'discography_tracks'
        AND tg.privilege_type = 'UPDATE')::int
      AS authenticated_table_update_grants_count,
    (SELECT count(*) FROM table_grants tg
      WHERE tg.grantee = 'anon' AND tg.privilege_type IN ('INSERT', 'UPDATE', 'DELETE'))::int
      AS anon_write_grants_count,
    (SELECT count(*) FROM restrictive_pol)::int AS actual_restrictive_policy_count,
    (SELECT rp.qual FROM restrictive_pol rp LIMIT 1) AS restrictive_policy_using,
    (SELECT rp.with_check FROM restrictive_pol rp LIMIT 1) AS restrictive_policy_with_check,
    (
      SELECT coalesce(
        position(p.title_old IN coalesce(rp.qual, '')) > 0
        AND position(p.target_site_slug IN coalesce(rp.qual, '')) > 0
        AND position(p.target_legacy_id IN coalesce(rp.qual, '')) > 0
        AND position('track_number = 1' IN coalesce(rp.qual, '')) > 0,
        false
      )
      FROM restrictive_pol rp CROSS JOIN params p LIMIT 1
    ) AS restrictive_policy_using_matches_expected,
    (
      SELECT coalesce(
        position(p.title_new IN coalesce(rp.with_check, '')) > 0
        AND position(p.target_site_slug IN coalesce(rp.with_check, '')) > 0
        AND position(p.target_legacy_id IN coalesce(rp.with_check, '')) > 0
        AND position('track_number = 1' IN coalesce(rp.with_check, '')) > 0,
        false
      )
      FROM restrictive_pol rp CROSS JOIN params p LIMIT 1
    ) AS restrictive_policy_with_check_matches_expected,
    (SELECT count(*) FROM policies pol
      WHERE pol.policyname IN ('discography_admin_all', 'discography_tracks_admin_all'))::int
      AS admin_all_policy_count,
    (SELECT coalesce(bool_or(rs.rls_enabled), false)
      FROM rls_status rs WHERE rs.table_name = 'discography_tracks') AS rls_enabled_discography_tracks,
    (SELECT count(*) FROM target_row)::int AS target_row_count,
    (SELECT tr.id::text FROM target_row tr LIMIT 1) AS target_row_id,
    (SELECT (tr.id = p.target_row_id) FROM target_row tr CROSS JOIN params p LIMIT 1)
      AS target_row_id_matches,
    (SELECT tr.title FROM target_row tr LIMIT 1) AS target_title,
    (SELECT count(*) FROM target_tracks)::int AS track_count,
    (SELECT tt.title FROM target_tracks tt WHERE tt.track_number = 7 LIMIT 1) AS track_7_title,
    false AS data_mutation,
    false AS operation_save_involved
)
SELECT jsonb_build_object(
  'phase', (SELECT phase FROM params),
  'expected_project_ref', (SELECT expected_project_ref FROM params),
  'production_project_ref_stop', (SELECT production_project_ref_stop FROM params),
  'captured_at', (SELECT captured_at FROM params),
  'actual_restrictive_policy_name', (SELECT actual_restrictive_policy_name FROM params),
  'title_old', (SELECT title_old FROM params),
  'title_new', (SELECT title_new FROM params),
  'checks', (SELECT to_jsonb(c) FROM checks c)
) AS g20u36e_controlled_save_pre_save_snapshot;
```

---

## 4. Operator procedure (次フェーズ · 本フェーズでは実行しない)

1. Open staging SQL Editor (`kmjqppxjdnwwrtaeqjta` only).
2. Paste the SQL block above · run once.
3. Paste JSON result (column `g20u36e_controlled_save_pre_save_snapshot`) to ChatGPT / Cursor for PASS/STOP judgment.
4. Do **not** run Save · `operation=save` · Rollback until an explicit later phase.

---

## 5. What was NOT done this phase

- SQL execution
- `operation=save`
- controlled Save
- DB data write
- Rollback / REVOKE / DROP POLICY
- Edge redeploy
- production change
- service_role

---

## 6. Next

```txt
recommendedNextPhase: G-20u36e-controlled-save-pre-save-select-execution
```

Operator runs the SELECT once · record result · still **no Save**.
