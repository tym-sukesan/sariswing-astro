# CMS Core v2 — Schedule site-owner authz + site-writer RLS template

- **Phase:** `cms-core-v2-schedule-site-owner-authz-implementation-and-migration-template`
- **Follow-up:** `cms-core-v2-schedules-site-writer-rls-apply-result-recording` (staging apply recorded 2026-08-06)
- **Follow-up (2026-08-08):** `cms-core-v2-schedule-tbd-create-oneshot-success-recording` — owner write **SUCCESS** via `can_write_site` + site-writer RLS · Doc: `cms-core-v2-schedule-tbd-create-oneshot-success-result.md`
- **Follow-up (2026-08-08):** `cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline-recording` — 80-row baseline fps fixed · Doc: `cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline.md`
- **Date:** 2026-08-06 · oneshot SUCCESS + post-success baseline 2026-08-08
- **Status:** **COMPLETE (offline template + client gate)** · staging RLS **applied** · oneshot INSERT **proved** · post-success baseline **recorded**
- **HEAD baseline (template commit):** `b75cc41…` · **apply HEAD:** `3e5bc88f63f498bf9e673cea4e9985424947c747`
- **This phase (historical):** client gate → `can_write_site` · staging RLS migration templates · offline verifiers

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULE_SITE_OWNER_AUTHZ_IMPLEMENTATION_COMPLETE: true
CMS_CORE_V2_SCHEDULES_SITE_WRITER_RLS_APPLY_RESULT_RECORDED: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_SUCCESS_RECORDED: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_POST_SUCCESS_BASELINE_RECORDED: true
OWNER_ADMIN_DISTINCT: true
SCHEDULE_SITE_MAPPING_SAFE: true
SITE_WRITER_RLS_TEMPLATE_CREATED: true
SITE_WRITER_RLS_APPLIED: true
RLS_MIGRATION_EXECUTED: true
RLS_POSTCHECK_PASS: true
OWNER_VISIBILITY_PASS: true
ANON_VISIBILITY_PASS: true
CAN_WRITE_SITE_PASS: true
OWNER_WRITE_SUCCESS: true
LEGACY_PUBLIC_ADMIN_POLICIES_RETAINED: true
CURRENT_STAGING_SCHEDULES_RLS_FINGERPRINT: 3f6c87dda8edf44159d939ec69fbcc2b
PRE_SITE_WRITER_RLS_FINGERPRINT_HISTORICAL: e7344ff0de1d5e2862965ffc0e4e72cf
POST_SUCCESS_SITE_SLUG_FP: 1d780b234483e3c860a66cec93311718
POST_SUCCESS_DATA_FP: 221256605d1501abc7cab3e044d54e2b
PRE_ONESHOT_SITE_SLUG_FP_HISTORICAL: a4ff22feb81e19789732525937f4be7e
PRE_ONESHOT_DATA_FP_HISTORICAL: 1910b4faa5b17344d63968dc25f89cd6
ONESHOT_GUARD_EXPECTED_TOTAL_REMAINS: 79
POLICY_COUNT: 4
READY_FOR_MIGRATION_EXECUTION: false
SCHEDULE_ROW_WRITE_EXECUTED: true
TARGET_ROW_EXISTS: true
TARGET_ROW_EXACT: true
OUTCOME: INSERTED_EXACT
CURRENT_TOTAL: 80
CURRENT_PUBLISHED: 74
CURRENT_TBD: 1
READY_FOR_RETRY: false
READY_FOR_CLEANUP: false
CLEANUP_EXECUTED: false
ACTUAL_WRITE_READY: false
ACTUAL_WRITE_EXECUTED: true
DB_WRITE_EXECUTED: true
ARMS_OFF: true
ENV_CHANGED: false
PRODUCTION_UNCHANGED: true
COMMIT_READY: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
NEXT: cleanup requires separate explicit approval only (READY_FOR_CLEANUP false)
```

**Pre-apply baseline (historical):** total **79** · published **74** · gosaki **79** · null/orphan/mio/tbd/target **0** · policies: `schedules_public_select`, `schedules_admin_all` · writer policies absent · RLS fp `e7344ff0de1d5e2862965ffc0e4e72cf`.

**Post-apply current (2026-08-06 01:28:23.744153+00 · pre-oneshot):** policy count **4** · same data baseline · owner visibility **79** · anon **74** · `can_write_site=true` · RLS fp `3f6c87dda8edf44159d939ec69fbcc2b` · Doc: `cms-core-v2-schedules-site-writer-rls-apply-result.md`.

**Post-oneshot (2026-08-08):** owner INSERT SUCCESS · total **80** · published **74** · gosaki **80** · TBD **1** · target **1** · path sites → `can_write_site` → preflight → INSERT · legacy public + admin_all retained · Doc: `cms-core-v2-schedule-tbd-create-oneshot-success-result.md`.

**Post-success baseline (2026-08-08):** site_slug fp `1d780b234483e3c860a66cec93311718` · data fp `221256605d1501abc7cab3e044d54e2b` · Doc: `cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline.md`.

---

## 1. Role model (do not conflate)

| Role | SoT | Helper |
| --- | --- | --- |
| site owner | `site_members.role='owner'` | `is_site_member` → **`can_write_site`** |
| editor | `site_members.role='editor'` | same |
| platform admin | `platform_admins.active` | `is_platform_admin` → **`can_write_site`** |
| legacy admin | `admin_users.role='admin'` | `is_admin()` — **not** oneshot owner gate |

**Do not** add owner to `admin_users`.

---

## 2. Client call order (`executeTbdCreateOneshotSave`)

1. Fixed guards / payload / fingerprint / approval
2. Signed-in session (alone is insufficient)
3. Same staging singleton: `sites` where `site_slug='gosaki-piano'` → exactly one `id`
4. 0 / multi / query error → `auth_site_resolve_failed` · INSERT 0
5. `rpc('can_write_site', { p_site_id: siteId })`
6. `data === true` only → preflight (expected total **79**)
7. Same client for preflight
8. PASS → INSERT max 1

**RPC contract:** PostgREST `can_write_site` with named arg **`p_site_id`** (uuid string). Platform admin is allowed via the same helper (no separate `is_platform_admin` client gate).

**Removed:** `rpc('is_admin')` as owner gate · `auth_admin_required` · UI “owner/admin” conflation.

---

## 3. RLS templates (applied on staging 2026-08-06)

| File | Role |
| --- | --- |
| `scripts/supabase/cms-core-v2-schedules-site-writer-rls.template.sql` | forward · **no DROP POLICY** · CREATE two policies · **applied** |
| `scripts/supabase/cms-core-v2-schedules-site-writer-rls-rollback.template.sql` | DROP only the two writer policies · **not executed** |
| `docs/cms-core-v2-schedules-site-writer-rls-apply-result.md` | apply + live JWT probe record |

### Forward policy bodies

```sql
create policy schedules_site_writer_select
  on public.schedules
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sites site_row
      where site_row.site_slug = schedules.site_slug
        and public.can_write_site(site_row.id)
    )
  );

create policy schedules_site_writer_insert
  on public.schedules
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.sites site_row
      where site_row.site_slug = schedules.site_slug
        and public.can_write_site(site_row.id)
    )
  );
```

- Keeps `schedules_public_select` (anon/public **74**) and `schedules_admin_all` (legacy admin).
- No UPDATE/DELETE policies in this phase.
- No `site_slug='gosaki-piano'` hardcode in policy bodies.
- Same-named policy already present → CREATE fails (drift STOP) — forward path must not DROP.

### Rollback

```sql
drop policy if exists schedules_site_writer_select on public.schedules;
drop policy if exists schedules_site_writer_insert on public.schedules;
```

---

## 4. Runtime write contract delta

| Before | After |
| --- | --- |
| signed-in + `is_admin` | signed-in + sites resolve + `can_write_site` |
| admin_users owner conflation | site_members / platform_admins via helper |
| RLS: public + admin_all only | + writer SELECT/INSERT (**after apply**) |
| expected total 79 | **unchanged** |
| INSERT max 1 · no UPDATE/DELETE | **unchanged** |

Until RLS apply: owner JWT may still see published-only (**74**) under current policies — **do not retry CREATE** (`READY_FOR_RETRY=false`).

**Update (apply recorded):** RLS applied · owner **79** / anon **74** / `can_write_site=true` · Schedule row write still **0** · oneshot retry still gated (`READY_FOR_RETRY=false` until retry-readiness gate).

---

## 5. Offline tests

Covered in `verify-cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation` (+ dedicated site-owner verifier):

- owner / editor / platform admin → `can_write_site` true → preflight → INSERT 1
- signed-in non-member / other-site owner → false · INSERT 0
- site resolve 0 / multi · can_write error/null/false · auth missing → INSERT 0
- public visibility contract 74 · writer contract 79 (policy)
- INSERT timeout → ambiguous · retry blocked
- no UPDATE/DELETE · no `is_admin` RPC gate

---

## 6. Verifiers

- `verify:cms-core-v2-schedule-site-owner-authz-rls-implementation`
- Updated: implementation · final-preflight · write-stack (as needed) · Safety Suite registers new step

---

## 7. Explicit non-actions

- Migration **not** applied · SQL **not** executed · process **not** started · arms OFF · Save/Dry-run/login **not** done · DB write **0** · production untouched · commit/push only when operator requests
