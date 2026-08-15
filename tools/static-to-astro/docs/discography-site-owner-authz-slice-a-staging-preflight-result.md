# Discography site-owner authz — Slice A staging preflight result

- **Phase:** `discography-site-owner-authz-slice-a-staging-preflight-result-recording`
- **Date:** 2026-08-15
- **Status:** **COMPLETE (docs / offline recording)**
- **HEAD:** `266f7b00a665d9356533975e6cfefea31a80594d`
- **Prior:** `discography-site-owner-authz-slice-a-staging-preflight`
- **This phase:** record operator catalog SELECT-only + owner JWT live probe · freeze pre-apply fingerprints · judge apply readiness · **no** SQL write · **no** POLICY/RPC apply · **no** GRANT/REVOKE · **no** arm/Save/deploy · **no** commit/push by Cursor

**Forbidden:** `service_role` · owner → `admin_users` · production `vsbvndwuajjhnzpohghh` · treat historical `is_admin` RPC as design-correct (current baseline only).

---

## 0. Gates

```txt
DISCOGRAPHY_SITE_OWNER_AUTHZ_SLICE_A_STAGING_PREFLIGHT_RESULT_RECORDED: true
PREFLIGHT_RECORDED: true
CATALOG_PREFLIGHT_PASS: true
OWNER_JWT_LIVE_PROBE_PASS: true
OWNER_FIXTURE_READY: true
OWNER_CAN_WRITE_SITE: true
OWNER_IS_ADMIN: false
STAGING_REF_OK: true
SITE_MAPPING_SAFE: true
FORWARD_POLICIES_ABSENT: true
RPC_IS_HISTORICAL_IS_ADMIN: true
CURRENT_POLICY_FP: 2ae7c19292f2c8c5ae68f27c0fe10221
CURRENT_GRANTS_FP: 88986aa562aad21b7defa89648288083
CURRENT_RPC_FP: a04cb160099bada44a358404c9eed74c
SLICE_A_SCOPE_DRIFT: false
UPDATE_GRANTS_CHANGED: false
TRACK_WRITE_GRANTS_CHANGED: false
APPLY_PACKET_READY: true
STAGING_APPLY_READY: true
COMMIT_READY: true
STAGING_APPLY_EXECUTED: false
MIGRATION_APPLIED: false
DB_WRITE_EXECUTED: false
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
OWNER_TO_ADMIN_USERS_FORBIDDEN: true
PORT_4321_NO_LISTEN: false
DEV_SERVER_OPERATOR_STATED_STOPPED: true
PORT_4321_LISTEN_AT_RECORDING: true
PORT_4321_LISTEN_PID: 11341
PORT_4321_LISTEN_COMMAND: astro dev
PORT_4321_LISTEN_ADDR: [::1]:4321
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-staging-apply
```

`STAGING_APPLY_READY: true` means packets + baselines + owner fixture are recorded. **Apply still requires a separate explicit operator approval.** Do not apply in this phase.

`PORT_4321_NO_LISTEN: false` — operator stated the dev server was stopped; at recording time Cursor still observed `astro dev` LISTEN on `[::1]:4321` (PID **11341**). Local listen does **not** block SQL Editor apply readiness. Cursor did not kill the process.

---

## 1. Catalog SELECT-only (operator · staging `kmjqppxjdnwwrtaeqjta`)

Cursor did **not** execute the catalog SQL. Operator recorded:

| Check | Result |
| --- | --- |
| Staging ref | `kmjqppxjdnwwrtaeqjta` |
| RLS `discography` | **true** |
| RLS `discography_tracks` | **true** |
| Current policies | **4** |
| Slice A writer SELECT present | **0** (`FORWARD_POLICIES_ABSENT: true`) |
| authenticated table UPDATE/INSERT/DELETE | **0** |
| albums | total **4** / published **4** / gosaki **4** / null slug **0** |
| tracks | total **34** / gosaki **34** / null slug **0** |
| orphan tracks | **0** |
| `sites` gosaki-piano | singleton **1** |
| operational RPC exists | **1** |
| RPC SECURITY DEFINER | **true** |
| RPC authz (current) | historical `is_admin()` · **no** `can_write_site` in body |
| RPC EXECUTE | authenticated **true** / anon **false** |
| `can_write_site` EXECUTE | authenticated **true** / anon **false** |
| `site_members` owner inventory | **1** |
| `owners_in_admin_users` | **0** |

`RPC_IS_HISTORICAL_IS_ADMIN: true` is a **pre-apply current-value** check, not an endorsement of legacy admin as owner substitute.

---

## 2. Pre-apply fingerprints (frozen)

| Surface | Fingerprint |
| --- | --- |
| Policy | `2ae7c19292f2c8c5ae68f27c0fe10221` |
| Grants | `88986aa562aad21b7defa89648288083` |
| RPC definition | `a04cb160099bada44a358404c9eed74c` |

Use these as the Slice A apply before-snapshot. Drift vs these fps → **STOP** before apply.

---

## 3. Owner JWT live probe (PASS)

First Console attempt failed **before** RPC (`supabaseConfigFound=false`) — not an authz FAIL. Retry used Vite modules `getStagingAuthConfig` + `getStagingSupabaseClient` (same as login). Secrets / JWT / anon key / email / user id were not recorded.

| Field | Value |
| --- | --- |
| `stagingHostOk` | **true** |
| `productionHostBlocked` | **false** |
| `sessionPresent` | **true** |
| `siteSingletonOk` | **true** |
| `siteRowCount` | **1** |
| `siteSlug` | `gosaki-piano` |
| `siteStatus` | `active` |
| `can_write_site` | **true** |
| `is_admin` | **false** |
| `ownerJwtProbePass` | **true** |
| `stopReason` | **null** |

`OWNER_FIXTURE_READY: true` — site owner can write via `can_write_site` and is **not** legacy admin. Do **not** add this owner to `admin_users`.

---

## 4. Scope (unchanged)

| Item | Status |
| --- | --- |
| Slice A writer SELECT templates | ready · not applied |
| Slice A RPC `can_write_site` redefine template | ready · not applied |
| Slice B UPDATE grants / UPDATE RLS | **out of scope** · unchanged |
| Slice C tracks INSERT/DELETE RLS | **out of scope** · unchanged |
| Album CREATE/DELETE | **out of scope** |
| `SLICE_A_SCOPE_DRIFT` | **false** |

---

## 5. Apply packets (do not run this phase)

| Packet | Path |
| --- | --- |
| RLS FORWARD | `scripts/supabase/gosaki-discography-site-writer-select-rls.template.sql` |
| RLS ROLLBACK | `scripts/supabase/gosaki-discography-site-writer-select-rls-rollback.template.sql` |
| RPC FORWARD | `scripts/supabase/gosaki-discography-operational-save-rpc-can-write-site.template.sql` |
| RPC ROLLBACK | `scripts/supabase/gosaki-discography-operational-save-rpc-is-admin-rollback.template.sql` |

Suggested order **after** explicit approval: writer SELECT RLS → RPC redefine → SELECT-only verify against new fps (expect +2 SELECT policies; RPC body `can_write_site`; public 4/34 unchanged).

Required approval form (or equivalent):

```txt
承認します。この操作を1回だけ実行してください。
```

---

## 6. Explicit non-actions (this phase)

- No CREATE/DROP POLICY · no RPC redefine · no GRANT/REVOKE
- No arm ON · no Save · no deploy · no production
- Owner not added to `admin_users`
- Cursor did not kill PID 11341
- No commit/push unless operator separately requests

---

## 7. Next

**`discography-site-owner-authz-slice-a-staging-apply`** — human-approved staging apply of Slice A RLS + RPC packets only.

---

## 8. Apply-packet atomicity hardening (2026-08-15)

Offline template wrap + comment alignment only. **Not applied.** Policy/RPC logic unchanged.

```txt
RPC_FORWARD_ATOMIC: true
RPC_ROLLBACK_ATOMIC: true
RLS_SCOPE_UNCHANGED: true
WRITE_GRANTS_UNCHANGED: true
ROLLBACK_BASELINE_TARGET_OK: true
STAGING_APPLY_READY: true
COMMIT_READY: true
STAGING_APPLY_EXECUTED: false
```

- FORWARD/ROLLBACK RPC: function redefine + `COMMENT` + `REVOKE` + `GRANT EXECUTE` in one `BEGIN`/`COMMIT`.
- ROLLBACK RPC restores historical `is_admin()` gate; expected baseline RPC fingerprint `a04cb160099bada44a358404c9eed74c`.
- FORWARD RLS remains two `SELECT` policies only. No table UPDATE/INSERT/DELETE grants.
- RLS comments no longer imply RESTRICTIVE slice policies exist on current catalog (count = 4).
- Apply still requires a separate explicit operator approval.
