# G-15b-grant-apply — Gosaki Discography UPDATE grant apply result

**Phase:** `G-15b-grant-apply-gosaki-discography-update-grant-apply-result`  
**Status:** **complete** — operator applied `GRANT UPDATE` on staging; grants verified; target row unchanged; **no Save retry in this phase**  
**Date:** 2026-06-28  
**Base commit:** `5e832fb`  
**Prior:** G-15b-fail (`gosaki-discography-save-permission-failure-and-investigation.md`) — committed

| Check | Status |
| --- | --- |
| GRANT UPDATE applied (operator) | **yes** |
| After grants SELECT (operator) | **yes** — authenticated UPDATE present |
| RLS `discography_admin_all` | **yes** — already existed (operator) |
| Target row unchanged | **yes** — Cursor REST SELECT + operator judgment |
| Save retry | **no** |
| Cursor SQL execution | **no** |

---

## Gates

```txt
gosakiDiscographyUpdateGrantApplyResultComplete: true
phase: G-15b-grant-apply-gosaki-discography-update-grant-apply-result
readyForG15bRetrySaveExecution: true
readyForAnyDbWrite: false
readyForAdditionalGrantOrPolicyChange: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorGrantSqlExecuted: false
rollbackNeeded: false
```

**Next:** `G-15b-retry` — operator manual Save once on `discography-002` / `purchase_url` (new execution approval).

---

## 1. Git state (verified at phase start)

```txt
git status --short: (empty)
HEAD: 5e832fb
origin/main: 5e832fb
branch: main...origin/main
```

---

## 2. Purpose

Record the result of manually applying `authenticated UPDATE` on `public.discography` in `static-to-astro-cms-staging`, mirroring Schedule G-6-e4.

This phase does **not** execute SQL, retry Save, change policies, or write discography rows.

---

## 3. Manual apply summary (operator)

```txt
Project: static-to-astro-cms-staging
Host: kmjqppxjdnwwrtaeqjta.supabase.co
Executor: operator (Supabase SQL Editor)
Cursor executed SQL: no
```

**SQL executed (once):**

```sql
grant update on table public.discography to authenticated;
```

**SQL Editor result:**

```txt
success.
```

---

## 4. After verification — grants (operator SELECT)

```sql
select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'discography'
order by grantee, privilege_type;
```

| grantee | privilege_type |
| --- | --- |
| anon | SELECT |
| authenticated | SELECT |
| authenticated | **UPDATE** |
| postgres | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

### 4.1 Broad grants check (authenticated)

| Privilege | authenticated | Expected | Match |
| --- | --- | --- | --- |
| SELECT | present | yes | **yes** |
| UPDATE | present | yes | **yes** |
| INSERT | absent | no | **yes** |
| DELETE | absent | no | **yes** |
| TRUNCATE | absent | no | **yes** |
| TRIGGER | absent | no | **yes** |
| REFERENCES | absent | no | **yes** |

**anon UPDATE:** absent — **pass**

**`discography_tracks`:** untouched — **pass**

---

## 5. RLS / policy verification (operator)

Operator confirmed:

```txt
discography_admin_all already existed before grant apply
```

**Expected policy model (Kit draft — operator confirmed presence):**

```txt
discography_public_select — SELECT, published = true
discography_admin_all — FOR ALL, authenticated, is_admin()
```

**Not changed in this phase:** no CREATE/DROP POLICY; no ALTER TABLE.

**Read-only policy detail SELECT (for operator archive — run in SQL Editor if re-audit needed):**

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'discography'
order by policyname;
```

---

## 6. Target row unchanged (Save not retried)

```sql
select id, legacy_id, title, purchase_url, updated_at
from public.discography
where legacy_id = 'discography-002';
```

| Field | Expected (unchanged) | Operator / verifier |
| --- | --- | --- |
| **id** | `ed59d236-881a-45ce-ab9f-de5427e39dad` | confirmed |
| **legacy_id** | `discography-002` | confirmed |
| **title** | `SKYLARK` | confirmed |
| **purchase_url** | `https://gosaakiii.base.shop/` | confirmed |
| **updated_at** | `2026-06-05T17:39:44.201802+00:00` | confirmed |

Cursor read-only REST SELECT (verifier): same baseline — **no DB write from grant apply**.

---

## 7. Permission model after grant (discography)

```txt
public.discography:
- anon: SELECT (RLS-constrained)
- authenticated: SELECT + table-level UPDATE grant
- actual UPDATE still constrained by RLS discography_admin_all + is_admin()
- grant alone does not execute any update
```

**Parallel:** Schedule G-6-e4 (`schedule-update-grant-manual-apply-result.md`).

---

## 8. What changed

```txt
Only table-level UPDATE grant on public.discography for role authenticated (staging).
```

## 9. What did not change

```txt
No RLS policy change
No schema change
No discography row updated
No discography_tracks touched
No Save retry
No production project touched
No /admin route changes
```

---

## 10. G-15b Save failure context (resolved prerequisite)

| Item | Before grant | After grant |
| --- | --- | --- |
| Save error | `permission denied for table discography` | prerequisite removed (grant present) |
| `actualWrite` | false | retry phase TBD |
| Row state | unchanged | unchanged |

---

## 11. Recommended next phase — G-15b-retry

1. Arm G-15b env stack (or new `G-15b-retry-*` approval ID if operator prefers).
2. Sign in staging admin (`admin_users` + `is_admin()`).
3. Open Discography admin; select `discography-002`.
4. Set `purchase_url` → `https://gosakirikako.base.shop/`.
5. 「変更を確認」→ `saveReadiness: ready_to_save`, `stale: false`.
6. 「更新する」**once** (operator only).
7. read-only afterVerification SELECT.
8. Disarm env; routine dev `PUBLIC_ADMIN_WRITE_DRY_RUN=true`.

**Do not** re-click Save without documenting result. **Do not** retry if stale.

---

## 12. Safety statement

```txt
Cursor grant SQL executed: false
Cursor Save executed: false
Cursor DB write executed: false
service_role used by Cursor: false
production touched: false
FTP / deploy: none
rollback SQL: none
```

---

## Related

- [gosaki-discography-save-permission-failure-and-investigation.md](./gosaki-discography-save-permission-failure-and-investigation.md)
- [gosaki-discography-save-slice-final-preflight.md](./gosaki-discography-save-slice-final-preflight.md)
- [schedule-update-grant-manual-apply-result.md](./schedule-update-grant-manual-apply-result.md)
- `scripts/supabase/gosaki-discography-update-permission.template.sql`
