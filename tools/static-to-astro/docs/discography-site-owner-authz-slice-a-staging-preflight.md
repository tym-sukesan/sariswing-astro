# Discography site-owner authz — Slice A staging preflight

- **Phase:** `discography-site-owner-authz-slice-a-staging-preflight`
- **Date:** 2026-08-15
- **Status:** **COMPLETE (SELECT packet + anon spot-check · catalog SQL not executed by Cursor)**
- **HEAD:** `266f7b00a665d9356533975e6cfefea31a80594d`
- **Prior:** `discography-site-owner-authz-implementation-and-migration-template-slice-a`
- **This phase:** fix pre-apply staging baselines via SELECT-only packet + limited anon REST · **no** migration apply · **no** POLICY/RPC change · **no** GRANT/REVOKE · **no** arm/Save/deploy · **no** commit/push by Cursor

**Historical packet snapshot.** Operator catalog SELECT + owner JWT live probe are recorded in `discography-site-owner-authz-slice-a-staging-preflight-result.md`. This file keeps packet-phase gates (`PREFLIGHT_PASS: false`).

**Forbidden:** `service_role` · owner → `admin_users` · production `vsbvndwuajjhnzpohghh` · treat historical `is_admin` RPC as design-correct (current value only).

---

## 0. Gates

```txt
DISCOGRAPHY_SITE_OWNER_AUTHZ_SLICE_A_STAGING_PREFLIGHT_COMPLETE: true
PREFLIGHT_PASS: false
PREFLIGHT_SELECT_PACKET_READY: true
APPLY_PACKET_READY: true
STAGING_APPLY_READY: false
STAGING_REF_OK: true
SITE_MAPPING_SAFE: partial_anon_only
FORWARD_POLICIES_ABSENT: unknown
RPC_IS_HISTORICAL_IS_ADMIN: unknown
OWNER_FIXTURE_READY: false
OWNER_CAN_WRITE_SITE: unknown
OWNER_IS_ADMIN: unknown
SLICE_A_SCOPE_DRIFT: false
DB_WRITE_EXECUTED: false
MIGRATION_APPLIED: false
CATALOG_SELECT_EXECUTED_BY_CURSOR: false
ANON_REST_SELECT_EXECUTED: true
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
OWNER_TO_ADMIN_USERS_FORBIDDEN: true
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-staging-preflight-result
```

### STOP_REASONS (why `PREFLIGHT_PASS=false` / `STAGING_APPLY_READY=false`)

1. Operator has **not** yet run / recorded the catalog SELECT packet (`pg_policies` · grants · RPC def · sites singleton · owner membership inventory).
2. Live owner JWT probe (`can_write_site` / `is_admin`) **not** executed — must not be treated as PASS.
3. Until recorded PASS on `D.forward_policies_absent` + `H.rpc_is_historical_is_admin` + `G.sites_singleton` + site_slug mapping, apply remains blocked.

`SLICE_A_SCOPE_DRIFT: false` — offline templates still SELECT-only · no UPDATE/INSERT/DELETE policies or table write grants in Slice A apply files.

---

## 1. Staging project ref

| Check | Result |
| --- | --- |
| `PUBLIC_SUPABASE_URL` / `SUPABASE_URL` host | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| Production ref present in env URL | **no** |
| `supabase/.temp/linked-project.json` | points at **production** `vsbvndwuajjhnzpohghh` — **do not use** for this phase |
| `STAGING_REF_OK` | **true** (env URL) |

---

## 2. Anon REST SELECT spot-check (2026-08-15 · Cursor · anon JWT only)

Published / public-visible baseline (RLS public select):

| Metric | Value |
| --- | --- |
| `discography` visible | **4** (all `published=true`) |
| `discography` `site_slug` | all `gosaki-piano` · null/empty **0** |
| `legacy_id` | `discography-001`…`004` |
| `discography_tracks` visible | **34** |
| tracks `site_slug` | all `gosaki-piano` · null/empty **0** |
| tracks per album | 001:9 · 002:8 · 003:9 · 004:8 |
| orphan tracks vs visible albums | **0** |
| `sites` via anon | **401** (expected — no anon sites SELECT) |

**Limits:** anon cannot see unpublished rows · cannot read `pg_policies` / function defs · cannot probe `can_write_site` / `is_admin` / `site_members`.

`SITE_MAPPING_SAFE: partial_anon_only` — public mapping looks clean; full-table + sites singleton still need SQL Editor packet.

---

## 3. SELECT-only preflight packet (operator)

**Path:** `tools/static-to-astro/scripts/supabase/gosaki-discography-site-owner-authz-slice-a-staging-preflight-select-only.sql`

| Group | Covers |
| --- | --- |
| A | Staging vs production ref reminder |
| B | RLS enabled both tables |
| C | Policy inventory + fingerprint |
| D | Slice A forward policies **absent** |
| E | Grants inventory + fingerprint · write-grant scope |
| F | Album/track counts · site_slug distribution · orphans |
| G | `sites` gosaki-piano exact singleton |
| H | RPC exists · SECURITY DEFINER · historical `is_admin` current gate · EXECUTE grants |
| I | Core helpers present · `can_write_site` authenticated EXECUTE |
| J | Owner membership **inventory only** (not JWT probe) |
| K | Public-read impact prediction (Slice A SELECT-only) |
| Z | Summary → `READY_FOR_OPERATOR_RECORD` or STOP |

### Operator procedure

1. Dashboard → confirm project **`kmjqppxjdnwwrtaeqjta`** (if `vsbvndwuajjhnzpohghh` → **STOP**).
2. SQL Editor → paste entire file → Run **once**.
3. Paste/result-record into next phase doc.
4. **Do not** apply RLS/RPC templates in this phase.

---

## 4. Expected gate values after operator SELECT (not yet recorded)

| Gate | Expected when PASS |
| --- | --- |
| `FORWARD_POLICIES_ABSENT` | **true** |
| `RPC_IS_HISTORICAL_IS_ADMIN` | **true** (current value only) |
| `CURRENT_RLS_BASELINE` | policy fingerprint from `C.policy_fingerprint` |
| `CURRENT_GRANTS_BASELINE` | grants fingerprint from `E.grants_fingerprint` |
| `CURRENT_RPC_BASELINE` | RPC `definition_md5` from `H.rpc_exists` |
| `OWNER_FIXTURE_READY` | still **false** until separate owner JWT probe |

---

## 5. Apply packets (ready offline · not to run)

| Packet | Path |
| --- | --- |
| RLS FORWARD | `gosaki-discography-site-writer-select-rls.template.sql` |
| RLS ROLLBACK | `gosaki-discography-site-writer-select-rls-rollback.template.sql` |
| RPC FORWARD | `gosaki-discography-operational-save-rpc-can-write-site.template.sql` |
| RPC ROLLBACK | `gosaki-discography-operational-save-rpc-is-admin-rollback.template.sql` |

Suggested apply order **after** preflight-result PASS + explicit approval: RLS writer SELECT → RPC redefine → SELECT-only verify.

---

## 6. Public read impact prediction

Slice A adds **authenticated** `FOR SELECT` policies only. Anon `*_public_select` untouched → published 4/34 visibility should remain stable if apply is scope-clean.

---

## 7. Explicit non-actions

- Catalog SQL **not** executed by Cursor
- No live owner JWT `can_write_site` / `is_admin` probe
- No migration / POLICY / RPC apply
- No GRANT/REVOKE · no arm · no Save · no deploy · no production
- No commit/push unless operator separately requests

---

## 8. Next

**`discography-site-owner-authz-slice-a-staging-preflight-result`** — operator runs SELECT packet once · record fingerprints · then decide `STAGING_APPLY_READY`.
