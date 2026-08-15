# Discography site-owner authz — Slice A implementation + migration templates

- **Phase:** `discography-site-owner-authz-implementation-and-migration-template-slice-a`
- **Date:** 2026-08-12
- **Status:** **COMPLETE (offline implementation / templates · not applied)**
- **HEAD (start):** `280a1eb330511ec4583ed4eb3acd44abf76d9143`
- **Prior:** `discography-site-owner-authz-planning`
- **This phase:** Edge + RPC gate → `can_write_site` · writer SELECT RLS templates · offline verifier · **no** staging SQL apply · **no** DB write · **no** arm/Save/deploy · **no** commit/push by Cursor

---

## 0. Gates

```txt
DISCOGRAPHY_SITE_OWNER_AUTHZ_SLICE_A_IMPLEMENTATION_COMPLETE: true
SLICE_A_IMPLEMENTED: true
EDGE_AUTHZ_ALIGNED: true
RPC_AUTHZ_ALIGNED: true
WRITER_SELECT_TEMPLATE_READY: true
ROLLBACK_TEMPLATE_READY: true
UPDATE_GRANTS_CHANGED: false
TRACK_WRITE_GRANTS_CHANGED: false
DB_WRITE_EXECUTED: false
MIGRATION_APPLIED: false
MIGRATION_EXECUTED: false
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
STAGING_APPLY_READY: false
OWNER_TO_ADMIN_USERS_FORBIDDEN: true
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-staging-preflight
```

`STAGING_APPLY_READY: false` until SELECT-only preflight packet + explicit operator approval for (1) writer SELECT RLS apply and (2) RPC redefine apply.

---

## 1. What changed

### 1.1 Edge (`gosaki-discography-save-dry-run`)

- Removed `assertOperatorIsAdmin` / `rpc('is_admin')` owner gate.
- Added `assertCanWriteSiteForSiteSlug`: exact singleton `sites` resolve by `site_slug` → `rpc('can_write_site', { p_site_id })`.
- Wired into controlled label Save, controlled track-title Save, and operational Save.
- Mirror: `tools/static-to-astro/scripts/edge-functions/.../handler.ts` kept in sync.
- Arms / approval IDs / dry-run / DEFINER RPC call path unchanged.

### 1.2 RPC templates (not applied)

| File | Role |
| --- | --- |
| `gosaki-discography-operational-save-rpc-can-write-site.template.sql` | FORWARD redefine gate → sites + `can_write_site` |
| `gosaki-discography-operational-save-rpc-is-admin-rollback.template.sql` | ROLLBACK to legacy `is_admin` body |

Album+tracks atomic DELETE+INSERT replace retained inside SECURITY DEFINER. Authz is mandatory inside DEFINER (RLS alone is insufficient).

Historical applied migration `supabase/migrations/20260721100000_gosaki_discography_operational_save_rpc.sql` left as-is (staging still `is_admin` until operator applies FORWARD).

### 1.3 RLS Slice A templates (not applied)

| File | Policies |
| --- | --- |
| `gosaki-discography-site-writer-select-rls.template.sql` | `discography_site_writer_select`, `discography_tracks_site_writer_select` |
| `gosaki-discography-site-writer-select-rls-rollback.template.sql` | DROP those two only |

No UPDATE/INSERT/DELETE policies. No GRANT changes. Public select + `*_admin_all` retained.

---

## 2. Explicit non-changes

- Slice B UPDATE grants / UPDATE RLS
- Slice C tracks INSERT/DELETE RLS
- Album CREATE/DELETE
- owner → `admin_users`
- staging SQL apply / Edge deploy / arm ON / Save
- `/admin` production path
- production project `vsbvndwuajjhnzpohghh`

---

## 3. Next: staging pre-apply gate

Recommended phase: `discography-site-owner-authz-slice-a-staging-preflight`

1. SELECT-only `pg_policies` + grant fingerprint for `discography` / `discography_tracks`
2. Confirm FORWARD policies absent (drift check)
3. Confirm current RPC still `is_admin` (pre-apply)
4. Owner JWT fixture (`can_write_site` true · `is_admin` false) inventory
5. Explicit approval form for RLS apply then RPC redefine (separate or combined packet)
6. Apply order: writer SELECT RLS → RPC redefine → SELECT-only verify → (later) owner hydrate / dry-run / armed Save under separate approvals

---

## 4. Evidence paths

| Kind | Path |
| --- | --- |
| Planning | `docs/discography-site-owner-authz-planning.md` |
| Edge | `supabase/functions/gosaki-discography-save-dry-run/handler.ts` |
| RLS fwd/rb | `scripts/supabase/gosaki-discography-site-writer-select-rls*.template.sql` |
| RPC fwd/rb | `scripts/supabase/gosaki-discography-operational-save-rpc-*.template.sql` |
| Verifier | `scripts/verify-discography-site-owner-authz-slice-a-implementation.mjs` |
