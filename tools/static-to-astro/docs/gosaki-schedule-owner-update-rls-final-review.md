# Gosaki Schedule owner UPDATE RLS final review

- **Phase:** `gosaki-schedule-owner-update-rls-final-review`
- **Date:** 2026-09-22
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **Status:** **READ-ONLY REVIEW COMPLETE**
- **Target project (apply later):** `kmjqppxjdnwwrtaeqjta` only
- **STOP:** production `vsbvndwuajjhnzpohghh`

**This phase did not:** SQL execute · DB write · Edge deploy · Secrets · FTP · commit · push.

---

## 0. Gates

```txt
RLS_FINAL_REVIEW_RESULT: PASS
SAFE_TO_APPLY: true
APPLY_EXECUTED: false
TARGET: kmjqppxjdnwwrtaeqjta
STOP_PRODUCTION: vsbvndwuajjhnzpohghh
POLICY: schedules_site_writer_update
DROP_DELETE_TRUNCATE_ALTER_TABLE: none (forward)
SCHEDULES_ADMIN_ALL: retained (untouched)
SAVE_ARM: false (unchanged)
LIVE_EDGE_DEPLOYED: false (unchanged)
```

`SAFE_TO_APPLY: true` means the template is safe **if** PRECHECK passes on kmjq and a **separate** explicit apply approval is given. This review is **not** that approval.

---

## 1. Checklist (12)

| # | Check | Result |
| --- | --- | --- |
| 1 | Apply SQL full text | `cms-core-v2-schedules-site-writer-update-rls.template.sql` · executable body = `BEGIN` + one `CREATE POLICY` + `COMMIT` |
| 2 | Rollback SQL full text | `cms-core-v2-schedules-site-writer-update-rls-rollback.template.sql` · `DROP POLICY IF EXISTS schedules_site_writer_update` only |
| 3 | Policy name | **`schedules_site_writer_update`** · `FOR UPDATE` · `TO authenticated` |
| 4 | DROP / DELETE / TRUNCATE / table change | **none** in forward executable SQL (`FOR UPDATE` is policy cmd, not DML) |
| 5 | gosaki-piano owner/editor site-scoped UPDATE | **yes** via `sites.site_slug` → `can_write_site(id)` · `is_site_member` = `owner\|editor` · slug **not** hardcoded (same as INSERT/SELECT writer policies) |
| 6 | Cannot UPDATE other site | **yes** · `USING` + `WITH CHECK` both require `can_write_site` on **that row’s** `site_slug` |
| 7 | Platform admin existing rights | **preserved** · `schedules_admin_all` (`is_admin()` ALL) not dropped/altered · `can_write_site` also true for `is_platform_admin()` |
| 8 | No conflict with `schedules_admin_all` | **PERMISSIVE OR** · new policy adds owner UPDATE; does not restrict admin ALL |
| 9 | CREATE / SELECT / DELETE policies | **untouched** · no INSERT/SELECT/DELETE policy create/drop |
| 10 | PRECHECK | SELECT-only · §4 |
| 11 | POSTCHECK | SELECT-only · §5 |
| 12 | Rollback conditions | §6 |

---

## 2. Contract (how UPDATE is scoped)

Existing helper (already live on kmjq; this SQL does **not** redefine it):

```sql
-- can_write_site(p_site_id) =
--   is_platform_admin() OR is_site_member(p_site_id)
-- is_site_member = site_members.role IN ('owner','editor')
```

So:

- gosaki-piano **owner/editor** can UPDATE rows whose `schedules.site_slug` resolves to that site.
- Member of site B **cannot** UPDATE gosaki-piano rows.
- Changing `site_slug` to a site the user cannot write **fails** `WITH CHECK`.
- **viewer** / non-member / anon: no UPDATE via this policy.
- Policy is **not** `site_slug = 'gosaki-piano'` hardcoded (intentional Core v2; matches `schedules_site_writer_insert`).

Current live policies on kmjq (2026-08-06 apply, not rolled back):  
`schedules_public_select` · `schedules_admin_all` · `schedules_site_writer_select` · `schedules_site_writer_insert`  
(`schedules_site_writer_update` **absent** — expected).

`GRANT UPDATE ON public.schedules TO authenticated` already applied (G-6-e4). This template does **not** GRANT/REVOKE.

---

## 3. Exact SQL to execute (apply — later only)

Dashboard: **kmjqppxjdnwwrtaeqjta** · SQL Editor. Not vsbvnd.

```sql
begin;

create policy schedules_site_writer_update
  on public.schedules
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.sites site_row
      where site_row.site_slug = schedules.site_slug
        and public.can_write_site(site_row.id)
    )
  )
  with check (
    exists (
      select 1
      from public.sites site_row
      where site_row.site_slug = schedules.site_slug
        and public.can_write_site(site_row.id)
    )
  );

commit;
```

If `CREATE POLICY` fails because the name exists → **STOP**. Do not DROP in the forward path. Ask human.

---

## 4. Exact PRECHECK (SELECT-only · run before apply)

Expect: `update_policy_exists = 0` · four named policies present · `admin_all` cmd `ALL` · `authenticated` has `UPDATE` grant · `can_write_site` exists.

```sql
-- A. writer UPDATE must not exist yet
select count(*) as update_policy_exists
from pg_policies
where schemaname = 'public'
  and tablename = 'schedules'
  and policyname = 'schedules_site_writer_update';

-- B. current schedules policies (fingerprint)
select policyname, cmd, roles, permissive, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'schedules'
order by policyname;

-- C. required existing names
select policyname
from pg_policies
where schemaname = 'public'
  and tablename = 'schedules'
  and policyname in (
    'schedules_public_select',
    'schedules_admin_all',
    'schedules_site_writer_select',
    'schedules_site_writer_insert'
  )
order by policyname;

-- D. GRANT UPDATE (operational dependency; not changed by apply SQL)
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'schedules'
  and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
order by grantee, privilege_type;

-- E. helper still present
select p.proname, pg_get_function_identity_arguments(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('can_write_site', 'is_site_member', 'is_platform_admin', 'is_admin')
order by p.proname;

-- F. tenancy map (scope is membership, not hardcoded slug)
select site_slug, status
from public.sites
order by site_slug;
```

**STOP PRECHECK if:**

- `update_policy_exists <> 0`
- any of the four required policies missing
- SQL Editor is **not** kmjq
- `can_write_site` missing

---

## 5. Exact POSTCHECK (SELECT-only · after apply)

Expect: `update_policy_exists = 1` · `cmd = UPDATE` · `roles` includes `authenticated` · `qual` and `with_check` contain `can_write_site` · previous four policies still present · **no** extra unexpected policy names.

```sql
select count(*) as update_policy_exists
from pg_policies
where schemaname = 'public'
  and tablename = 'schedules'
  and policyname = 'schedules_site_writer_update';

select policyname, cmd, roles, permissive, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'schedules'
order by policyname;

select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'schedules'
  and policyname = 'schedules_admin_all';
```

Expect `schedules_admin_all` still `ALL`. Do **not** UPDATE/INSERT/DELETE rows in POSTCHECK.

---

## 6. Rollback SQL and conditions

```sql
begin;

drop policy if exists schedules_site_writer_update on public.schedules;

commit;
```

**Run rollback only if** (separate approval):

- apply created the policy but POSTCHECK fails (wrong cmd/roles/qual, or `admin_all` gone — latter would be unexpected; stop and ask human before any extra DROP)
- operator aborts before Edge deploy / Save arm
- unexpected owner-wide write surface must be removed

**Do not** run the SELECT+INSERT writer rollback (`cms-core-v2-schedules-site-writer-rls-rollback.template.sql`) — that drops `select`/`insert` writer policies.

After rollback, POSTCHECK should show the four pre-apply names and **no** `schedules_site_writer_update`.

---

## 7. Risk

| Risk | Level | Note |
| --- | --- | --- |
| Wrong project (vsbvnd) | **STOP** | operator must confirm kmjq SQL Editor |
| Policy already exists | fail-closed | `CREATE POLICY` errors; no DROP in forward |
| Direct PostgREST UPDATE by owner JWT | residual | RLS+GRANT would allow table UPDATE even while Save arm is false / live Edge still `is_admin` · same class as existing INSERT writer policy |
| Cross-site `site_slug` rewrite | low | only if user `can_write_site` **both** sites; Edge Save also pins `gosaki-piano` |
| Admin ALL / DELETE | unchanged | still `is_admin()` only via `schedules_admin_all` |
| Data mutation by this SQL | none | DDL policy only |
| Customer Save becoming live | **no** | Edge not deployed · Save arm false |

---

## 8. SAFE_TO_APPLY

**true** for kmjq after PRECHECK PASS, with a later explicit apply approval.

**false** until then for execution. This review does not apply.
