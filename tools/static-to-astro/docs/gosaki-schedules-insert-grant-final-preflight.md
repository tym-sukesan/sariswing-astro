# G-22d3b2 — Gosaki schedules INSERT grant final preflight

**Phase:** `G-22d3b2-gosaki-schedules-insert-grant-final-preflight`  
**Status:** **complete** — final preflight / SQL templates only; **GRANT not executed**  
**Date:** 2026-07-02  
**Base commit:** `f61ab6e`  
**Prior:** [gosaki-schedule-duplicate-insert-permission-denied-audit.md](./gosaki-schedule-duplicate-insert-permission-denied-audit.md) (G-22d3b-blocker)

| Check | Status |
| --- | --- |
| Root cause confirmed | **yes** — missing `authenticated INSERT` |
| GRANT SQL fixed | **yes** — single statement |
| afterVerification SQL | **yes** |
| Rollback SQL | **yes** (not executed) |
| GRANT executed | **no** |
| Save retry | **no** |

---

## Gates

```txt
gosakiSchedulesInsertGrantFinalPreflightComplete: true
phase: G-22d3b2-gosaki-schedules-insert-grant-final-preflight
approvalId: G-22d3b2-gosaki-schedules-insert-grant-apply
readyForG22d3b3InsertGrantOperatorExecution: true
readyForG22d3b4DuplicateInsertSaveRetry: false
grantExecuted: false
grantExecutedByCursor: false
policyChangeExecuted: false
revokeExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**Project:** `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta.supabase.co`) only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` |
| `HEAD` | `f61ab6e` |
| `origin/main` | `f61ab6e` |

---

## 2. Confirmed root cause (G-22d3b + read-only audit)

### 2.1 Save failure

```txt
error: permission denied for table schedules
operation: duplicate-insert
approvalId: G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice
actualWrite: false
insertedId: —
rollbackNeeded: false
```

### 2.2 No-write verification (confirmed)

| Check | Result |
| --- | --- |
| `schedule-2026-03-014` | **0 rows** |
| March 2026 count | **13** |
| `<Live & Session>（コピー）` | **0 rows** |
| Source `eb1f1898-…` | unchanged |

### 2.3 Permission audit (confirmed)

| Item | State |
| --- | --- |
| RLS on `public.schedules` | **enabled** |
| `schedules_admin_all` | **exists** — `authenticated`, `ALL`, `qual=is_admin()`, `with_check=is_admin()` |
| `schedules_public_select` | **exists** |
| `authenticated` SELECT | **yes** |
| `authenticated` UPDATE | **yes** (G-6-e4) |
| `authenticated` INSERT | **no** ← blocker |
| `authenticated` DELETE | **no** |
| `anon` INSERT | **no** |
| Operator `ysktoyamax@gmail.com` | **admin** in `admin_users` |

**Conclusion:** RLS would allow admin INSERT, but PostgreSQL rejects before RLS because **table-level `INSERT` grant is missing** on `authenticated`. Same class as pre–G-6-e4 UPDATE / G-15b discography.

**Kit client:** `getStagingSupabaseClient(anonKey)` + Supabase Auth session → PostgREST role **`authenticated`**. No `service_role` in browser.

---

## 3. GRANT target (fixed)

| Field | Value |
| --- | --- |
| Project | `static-to-astro-cms-staging` |
| Host | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| Schema.table | `public.schedules` |
| Role | `authenticated` |
| Privilege | **INSERT only** |

**Parallel precedent:** G-6-e4 `GRANT UPDATE ON public.schedules TO authenticated` (staging only).

---

## 4. Operator procedure (G-22d3b3 — not in this phase)

1. Confirm Supabase Dashboard project = **`static-to-astro-cms-staging`**
2. Run **pre-GRANT** SQL (§6 / script file §PRE-GRANT) — all expectations PASS
3. Run **exactly one** GRANT statement (§5)
4. Run **afterVerification** SQL (§7)
5. Record result in G-22d3b3 result doc
6. **Do not** retry Save until afterVerification PASS (G-22d3b4)

---

## 5. Execution SQL (single statement — G-22d3b3 only)

```sql
grant insert on table public.schedules to authenticated;
```

**Expected SQL Editor result:** `Success. No rows returned`

**This phase:** Cursor / operator does **not** execute in G-22d3b2.

---

## 6. Forbidden SQL (must NOT appear in execution)

| Forbidden | Reason |
| --- | --- |
| `grant insert ... to anon` | Public insert risk |
| `grant delete` / `grant all` | Out of scope |
| `grant update` | Already applied (G-6-e4) — do not duplicate blindly |
| `revoke` (in same session as apply) | Rollback is separate decision |
| `create policy` / `alter policy` / `drop policy` | RLS unchanged this phase |
| `alter table ... disable row level security` | Critical safety violation |
| Any `service_role` / production project | Kit safety |
| `insert into public.schedules` | Data change — G-22d3b4 Save only |
| Touch `vsbvndwuajjhnzpohghh` | Sariswing production |

---

## 7. afterVerification SQL (SELECT — run after G-22d3b3 GRANT)

Paste from `scripts/supabase/gosaki-schedules-g22d3b2-insert-grant-final-preflight.sql` **POST-GRANT** section, or:

```sql
-- Grant summary
select grantee,
  max(case when privilege_type = 'INSERT' then 'yes' else 'no' end) as has_insert,
  max(case when privilege_type = 'UPDATE' then 'yes' else 'no' end) as has_update,
  max(case when privilege_type = 'DELETE' then 'yes' else 'no' end) as has_delete
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'schedules'
  and grantee in ('anon', 'authenticated')
group by grantee order by grantee;

-- RLS still on
select c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'schedules';

-- schedules_admin_all unchanged
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'schedules'
  and policyname = 'schedules_admin_all';

-- No accidental row insert from GRANT itself
select count(*) from public.schedules
where site_slug = 'gosaki-piano' and legacy_id = 'schedule-2026-03-014';
select count(*) from public.schedules
where site_slug = 'gosaki-piano' and month = '2026-03';
```

### Expected afterVerification

| Check | Expected |
| --- | --- |
| `authenticated.has_insert` | **yes** |
| `authenticated.has_update` | **yes** |
| `authenticated.has_delete` | **no** |
| `anon.has_insert` | **no** |
| `schedules_admin_all` | unchanged (`ALL`, `is_admin()`) |
| RLS enabled | **true** |
| `schedule-2026-03-014` count | **0** |
| March count | **13** |

---

## 8. Rollback SQL (not executed in G-22d3b2)

Use only if operator decides to remove INSERT capability after failed verification or aborted G-22d3b4.

```sql
revoke insert on table public.schedules from authenticated;
```

**Pre-rollback check:**

```sql
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'schedules'
  and grantee = 'authenticated' and privilege_type = 'INSERT';
-- Expect 1 row before REVOKE
```

**Note:** REVOKE does not delete any rows. If G-22d3b4 INSERT already succeeded, row cleanup is separate (G-22d3c rollback DELETE — not this REVOKE).

---

## 9. STOP conditions

**STOP immediately** — do not run GRANT — if:

| # | Condition |
| --- | --- |
| 1 | Supabase project is not `static-to-astro-cms-staging` / host ≠ `kmjqppxjdnwwrtaeqjta` |
| 2 | Sariswing production ref `vsbvndwuajjhnzpohghh` visible |
| 3 | SQL includes `anon`, `DELETE`, `ALL`, policy DDL, or RLS disable |
| 4 | RLS disabled on `public.schedules` |
| 5 | `schedules_admin_all` missing or `is_admin()` not in qual/with_check |
| 6 | Operator not `admin` in `admin_users` |
| 7 | `schedule-2026-03-014` already exists (unexpected row) |
| 8 | Pre-GRANT shows `authenticated INSERT` already **yes** (drift — re-audit) |
| 9 | Target table ≠ `public.schedules` or role ≠ `authenticated` |
| 10 | Any ambiguity about staging vs production |

---

## 10. Next phases

| Phase | Scope |
| --- | --- |
| **G-22d3b3** | Operator manual GRANT once + afterVerification |
| **G-22d3b4** | Duplicate INSERT Save retry once (`schedule-2026-03-014`) |
| **G-22d3c** | afterVerification + result record |

---

## 11. Forbidden (this phase)

| Operation | Executed |
| --- | --- |
| GRANT / REVOKE | **no** |
| Policy change | **no** |
| Save retry | **no** |
| SQL INSERT on schedules | **no** |
| package regen / FTP | **no** |

---

## 12. Fix required?

**No** for preflight doc. **Yes** for infra — proceed to **G-22d3b3** operator GRANT when approved.
