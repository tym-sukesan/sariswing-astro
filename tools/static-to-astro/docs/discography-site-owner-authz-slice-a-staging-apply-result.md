# Discography site-owner authz — Slice A staging apply result

- **Phase:** `discography-site-owner-authz-slice-a-staging-apply-result-recording`
- **Date:** 2026-08-15
- **Status:** **COMPLETE (docs / recording)**
- **HEAD:** `2cec8be41794566f87bbbf4f6f2f6686e0c0abc4`
- **Prior:** `discography-site-owner-authz-slice-a-staging-preflight-result-recording` · apply-packet atomicity hardening
- **This phase:** record operator staging apply (writer SELECT RLS + RPC redefine) + owner non-mutating RPC probe · freeze post-apply baseline · **no** additional SQL write · **no** rollback · **no** Edge deploy · **no** arm/Save · **no** commit/push by Cursor

**Forbidden:** `service_role` · owner → `admin_users` · production `vsbvndwuajjhnzpohghh` · Slice B UPDATE grants · Slice C track INSERT/DELETE grants.

---

## 0. Gates

```txt
DISCOGRAPHY_SITE_OWNER_AUTHZ_SLICE_A_STAGING_APPLY_RESULT_RECORDED: true
SLICE_A_STAGING_APPLY_RECORDED: true
RLS_APPLY_CONFIRMED: true
RPC_REDEFINE_CONFIRMED: true
OWNER_RPC_AUTHZ_PROBE_PASS: true
STAGING_RLS_CHANGE_EXECUTED: true
STAGING_RPC_REDEFINE_EXECUTED: true
DISCOGRAPHY_DATA_WRITE_EXECUTED: false
EDGE_DEPLOY_EXECUTED: false
REAL_SAVE_EXECUTED: false
ROLLBACK_EXECUTED: false
STAGING_REF_OK: true
POLICY_COUNT: 6
ALBUMS_CURRENT: 4
TRACKS_CURRENT: 34
PRE_APPLY_POLICY_FP: 2ae7c19292f2c8c5ae68f27c0fe10221
CURRENT_POLICY_FP: fa62157c08cffc8b49c38256ad8dfe26
CURRENT_POLICY_FP_RECORDED: true
CURRENT_GRANTS_FP: 88986aa562aad21b7defa89648288083
CURRENT_RPC_FP: f4d50563f2e08abcfcded8e8ade7fb3b
HISTORICAL_PRE_APPLY_RPC_FP: a04cb160099bada44a358404c9eed74c
SLICE_A_DB_BASELINE_COMPLETE: true
FORWARD_POLICIES_PRESENT: true
RPC_HAS_CAN_WRITE_SITE: true
RPC_HAS_NO_LEGACY_IS_ADMIN_CALL: true
WRITE_GRANTS_UNCHANGED: true
UPDATE_GRANTS_CHANGED: false
TRACK_WRITE_GRANTS_CHANGED: false
SLICE_A_SCOPE_DRIFT: false
ANON_REST_SELECT_EXECUTED: true
CATALOG_SELECT_EXECUTED_BY_CURSOR: false
PORT_4321_NO_LISTEN: true
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
OWNER_TO_ADMIN_USERS_FORBIDDEN: true
OWNER_ADDED_TO_ADMIN_USERS: false
COMMIT_READY: true
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-edge-deploy
```

`CURRENT_POLICY_FP: fa62157c08cffc8b49c38256ad8dfe26` — live catalog md5 (same algorithm as pre-apply). Pre-apply `2ae7c192…` is **retired**. `must_differ_from_pre_apply: true`.

`CURRENT_GRANTS_FP` retained from pre-apply: Slice A apply did not GRANT/REVOKE **table** privileges (`authenticated_write_grants=0`). Function EXECUTE grants are outside this fingerprint.

`SLICE_A_DB_BASELINE_COMPLETE: true` — policy / grants / RPC fps + albums **4** / tracks **34** frozen.

---

## 1. Step 1 — writer SELECT RLS (operator · staging `kmjqppxjdnwwrtaeqjta`)

| Check | Result |
| --- | --- |
| `step1_post_apply_pass` | **true** |
| `policy_count` | **6** |
| `discography_public_select` | **1** |
| `discography_admin_all` | **1** |
| `discography_tracks_public_select` | **1** |
| `discography_tracks_admin_all` | **1** |
| `discography_site_writer_select` | **1** |
| `discography_tracks_site_writer_select` | **1** |
| authenticated table UPDATE/INSERT/DELETE | **0** |
| albums / tracks | **4** / **34** |

---

## 2. Step 2 — operational RPC redefine (operator · staging)

| Check | Result |
| --- | --- |
| `step2_post_apply_pass` | **true** |
| RPC rows | **1** |
| SECURITY DEFINER | **true** |
| `has_can_write_site` | **true** |
| `has_no_legacy_is_admin_call` | **true** |
| authenticated EXECUTE | **true** |
| anon EXECUTE | **denied** |
| `policy_count` after RPC | **6** (unchanged by RPC) |
| authenticated write grants | **0** |
| albums / tracks | **4** / **34** |
| RPC definition md5 | `f4d50563f2e08abcfcded8e8ade7fb3b` |
| Historical pre-apply RPC md5 | `a04cb160099bada44a358404c9eed74c` |

---

## 3. Owner JWT non-mutating RPC probe (PASS)

Secrets / JWT / anon key / email / user id were not recorded.

| Field | Value |
| --- | --- |
| `stagingHostOk` | **true** |
| `productionHostBlocked` | **false** |
| `sessionPresent` | **true** |
| `siteSingletonOk` | **true** |
| `can_write_site` | **true** |
| `is_admin` | **false** |
| `rpcTransportOk` | **true** |
| `rpcOk` | **false** |
| `rpcReasonCode` | `legacy_id_mismatch` |
| `rpcHttpStatus` | **400** |
| `ownerRpcAuthzProbePass` | **true** |
| `stopReason` | **null** |

Interpretation: owner JWT passed site resolve + `can_write_site` **inside** the SECURITY DEFINER RPC, then an intentionally invalid `legacy_id` stopped execution **before** row lock / UPDATE / DELETE / INSERT. `DISCOGRAPHY_DATA_WRITE_EXECUTED: false`.

---

## 4. Anon REST SELECT spot-check (2026-08-15 · Cursor · anon JWT only)

Staging host `kmjqppxjdnwwrtaeqjta.supabase.co` · production host blocked · not `service_role`.

| Metric | Value |
| --- | --- |
| `discography` visible | **4** (all `published=true` · all `gosaki-piano` · null slug **0**) |
| `legacy_id` | `discography-001`…`004` |
| `discography_tracks` visible | **34** (all `gosaki-piano` · null slug **0**) |
| tracks per album | 001:9 · 002:8 · 003:9 · 004:8 |
| `sites` via anon | **401** (expected) |

Public 4/34 unchanged vs pre-apply. Catalog `pg_policies` / function def **not** readable via anon.

---

## 5. Postcheck SELECT-only packets

**Apply inventory:** `scripts/supabase/gosaki-discography-site-owner-authz-slice-a-staging-apply-postcheck-select-only.sql` (Cursor did not execute)

**Policy fingerprint (operator · 2026-08-15 · SELECT-only · once):** `scripts/supabase/gosaki-discography-site-owner-authz-slice-a-post-apply-policy-fingerprint-select-only.sql`

Same canonicalization as pre-apply: `md5(string_agg(tablename|policyname|cmd|qual|with_check, LF ORDER BY tablename, policyname))`.

| Check | Result |
| --- | --- |
| `C.policy_count` | **PASS** / **6** |
| `C.existing_four_each_one` | **PASS** |
| `C.writer_select_each_one` | **PASS** |
| `CURRENT_POLICY_FP` | `fa62157c08cffc8b49c38256ad8dfe26` |
| `PRE_APPLY_POLICY_FP` | `2ae7c19292f2c8c5ae68f27c0fe10221` |
| `must_differ_from_pre_apply` | **true** |

Cursor did not execute this SQL. Grants / RPC / row data were not selected or mutated.

---

## 6. Explicit non-actions (this phase)

- No additional SQL write · no rollback · no CREATE/DROP POLICY · no GRANT/REVOKE
- No Edge deploy · no arm ON · no Save · no production
- Owner not added to `admin_users`
- Slice B UPDATE grants unchanged · Slice C track INSERT/DELETE unchanged
- No commit/push unless operator separately requests

---

## 7. Next

**`discography-site-owner-authz-slice-a-edge-deploy`** — deploy Edge `gosaki-discography-save-dry-run` (`assertCanWriteSiteForSiteSlug`) so the admin path matches the applied RPC. Separate explicit approval. No Save until Edge is live and a later dry-run/Save phase is approved.
