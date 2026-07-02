# G-22d3b-blocker — Gosaki Schedule duplicate INSERT permission denied audit

**Phase:** `G-22d3b-blocker-gosaki-schedule-duplicate-insert-permission-denied-audit`  
**Status:** **complete** — audit / design only; **no GRANT / policy change / Save retry**  
**Date:** 2026-07-02  
**Base commit:** `974738c`  
**Prior:** G-22d3b operator Save attempt (failed); [gosaki-schedule-duplicate-insert-final-preflight.md](./gosaki-schedule-duplicate-insert-final-preflight.md)

| Check | Status |
| --- | --- |
| Save failure recorded | **yes** |
| No-write verification SQL template | **yes** |
| Root cause (high confidence) | **missing `authenticated INSERT` on `public.schedules`** |
| Remediation design | **yes** — Option A recommended |
| GRANT / policy executed | **no** |
| Save retry | **no** |

---

## Gates

```txt
gosakiScheduleDuplicateInsertPermissionDeniedAuditComplete: true
phase: G-22d3b-blocker-gosaki-schedule-duplicate-insert-permission-denied-audit
readyForG22d3b2InsertGrantFinalPreflight: true
readyForG22d3bSaveRetry: false
rollbackNeeded: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
grantSqlExecuted: false
policySqlExecuted: false
```

**Supabase:** `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`) only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. G-22d3b failed INSERT — operator record

### 1.1 Environment (confirmed armed)

- `ENABLE_ADMIN_STAGING_WRITE=true`
- `PUBLIC_ADMIN_WRITE_DRY_RUN=false`
- `PUBLIC_ADMIN_WRITE_PROVIDER=supabase`
- `PUBLIC_ADMIN_WRITE_MODULE=schedule`
- `PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice`
- `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=true`

### 1.2 Target slice

| Field | Value |
| --- | --- |
| `sourceId` | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| `sourceLegacyId` | `schedule-2026-03-003` |
| `plannedLegacyId` | `schedule-2026-03-014` |
| `site_slug` | `gosaki-piano` |
| `sort_order` (INSERT payload) | `70` |

### 1.3 Save result

```txt
operation: duplicate-insert
approvalId: G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice
actualWrite: false
insertedId: —
legacy_id: —
error: permission denied for table schedules
rollbackNeeded: false
```

**Interpretation:** App guards, env arm, auth session, and payload build passed. Failure at PostgreSQL/PostgREST when `insertScheduleWrite` called `.insert()` on `public.schedules`.

### 1.4 Write path (code)

| Item | Value |
| --- | --- |
| Client | `getStagingSupabaseClient(url, anonKey)` — **anon key + persisted Supabase Auth session** |
| Effective PostgREST role | **`authenticated`** (signed-in admin) — **not** `service_role` |
| Table | `public.schedules` |
| Operation | **`INSERT`** (`insertScheduleWrite` → `.insert(payload)`) |
| Executor | `executeG22dScheduleDuplicateInsertSave` |

G-9k UPDATE uses the **same client** but `updateScheduleWrite` → `.update()`.

---

## 2. Failed INSERT no-write verification

**Operator / SQL Editor:** paste block from  
`scripts/supabase/gosaki-schedules-g22d3b-insert-permission-readonly-audit.sql` §A.

| Check | Expected after failed Save |
| --- | --- |
| `schedule-2026-03-014` count | **0** |
| Source row `eb1f1898-…` | **unchanged** (`schedule-2026-03-003`, `<Live & Session>`) |
| March 2026 count | **13** (not 14) |
| Title `<Live & Session>（コピー）` rows | **0** |

**Judgment:** Safe failure — no partial row from Kit Save path (PostgREST rejected before insert). Operator should run §A SQL to confirm live.

---

## 3. Permission denied — root cause analysis

### 3.1 Error classification

| Symptom | Typical cause | Match? |
| --- | --- | --- |
| `permission denied for table schedules` | **Missing table-level GRANT** (PostgreSQL rejects before RLS) | **primary — yes** |
| RLS policy violation | Often `42501` with policy text / 0 rows | less likely given exact message |
| Wrong JWT / anon without session | SELECT might fail too; UPDATE would also fail | **no** — G-9k UPDATE works |
| Wrong project | Would not match beforeVerification PASS | **no** |

### 3.2 Why UPDATE worked but INSERT failed

**G-6-e4 (2026):** Operator manually applied on staging:

```sql
grant update on table public.schedules to authenticated;
```

Documented in [schedule-update-grant-manual-apply-result.md](./schedule-update-grant-manual-apply-result.md):

```txt
authenticated UPDATE: confirmed
INSERT: absent
DELETE: absent
```

**G-9a planning** explicitly deferred INSERT:

```txt
Admin write: authenticated UPDATE on schedules（GRANT 済み）— INSERT は別フェーズで explicit approval
```

**G-22d3b** is the first Kit **client-side INSERT** on `public.schedules`. Table grant was never added.

### 3.3 RLS layer (after grant)

Staging audit documents:

- RLS **enabled** on `public.schedules`
- Policies: `schedules_public_select`, `schedules_admin_all` (uses `is_admin()`)
- G-6-e4: UPDATE succeeds for admin via **GRANT + RLS**

Even if `schedules_admin_all` allows INSERT for admins, **PostgreSQL requires table-level `INSERT` grant** on `authenticated` before RLS is evaluated — same lesson as G-15b-fail (discography) and pre–G-6-e4 schedules.

### 3.4 Client role (not SQL Editor)

| Context | Role |
| --- | --- |
| Browser staging shell Save | `authenticated` (JWT from Supabase Auth) |
| SQL Editor preflight | `postgres` / service role — **does not prove browser INSERT** |
| Kit design | **No `service_role` in browser** — anon key + Auth session only |

---

## 4. Investigation SQL (operator manual — SELECT only)

**File:** `scripts/supabase/gosaki-schedules-g22d3b-insert-permission-readonly-audit.sql`

Sections:

| Section | Purpose |
| --- | --- |
| A | No-write verification |
| C | RLS enabled? |
| D | Policy list |
| E–F | Grants (schedules vs discography) |
| G | `is_admin()` definition |
| H | `admin_users` row |
| I | INSERT/UPDATE grant gap summary |

**STOP if:** project ≠ `static-to-astro-cms-staging`; unexpected INSERT grant already present; RLS disabled.

---

## 5. Fix options comparison

### Option A — `GRANT INSERT` on staging + verify RLS (recommended)

```sql
-- Template only — NOT executed in this phase
grant insert on table public.schedules to authenticated;
```

| Criterion | Rating |
| --- | --- |
| Safety | **High** — mirrors G-6-e4 UPDATE; RLS `schedules_admin_all` + `is_admin()` still gates rows |
| Speed | **Fastest** — one GRANT + verification |
| Kit generalization | **Best** — same pattern as discography G-15b-grant / G-18g1 |
| Risks | Must confirm `schedules_admin_all` includes INSERT with `with_check`; no anon INSERT |

### Option B — Edge Function + `service_role`

| Criterion | Rating |
| --- | --- |
| Safety | Medium — bypasses RLS; needs strict server-side guards |
| Speed | Slow — new Edge deploy, secrets, approval stack |
| Kit generalization | Poor fit — contradicts “no service_role in Kit write path” |
| Risks | Broader attack surface; not aligned with AGENTS.md |

**Not recommended** for this single-slice PoC.

### Option C — SQL Editor manual INSERT only

| Criterion | Rating |
| --- | --- |
| Safety | High for one row (operator-controlled) |
| Speed | Fast for PoC row only |
| Kit generalization | **None** — does not fix staging shell Save |
| Risks | Duplicates workflow; no UI validation path proof |

**Acceptable as emergency PoC only** — does not unblock G-22d CMS path.

### Option D — RPC `SECURITY DEFINER` limited INSERT

| Criterion | Rating |
| --- | --- |
| Safety | High if function validates `site_slug`, fields, `is_admin()` |
| Speed | Medium — function + GRANT EXECUTE + client change |
| Kit generalization | Good long-term |
| Risks | More moving parts than Option A for first INSERT |

**Defer** until Option A proven or stricter field-level DB enforcement required.

---

## 6. Recommended approach

**Option A** — staging-only **`GRANT INSERT ON public.schedules TO authenticated`**, with read-only preflight confirming:

1. `schedules_admin_all` policy covers **INSERT** with `is_admin()` in `WITH CHECK`
2. No `anon INSERT`
3. `INSERT` / `DELETE` / `TRUNCATE` remain absent for `anon`
4. afterVerification SELECT only

**Do not** use `service_role` in browser. **Do not** touch Sariswing production.

**Execution:** separate approved phases (below). **Do not retry Save** until grant + policy verification complete.

---

## 7. Next phase split

| Phase | ID | Scope |
| --- | --- | --- |
| **G-22d3b1** | *(this doc)* | Permission audit + design — **complete** |
| **G-22d3b2** | `G-22d3b2-gosaki-schedule-insert-grant-final-preflight` | beforeGrant SQL; rollback plan; abort conditions; approval ID |
| **G-22d3b3** | `G-22d3b3-gosaki-schedule-insert-grant-operator-execution` | Operator manual `GRANT INSERT` once in SQL Editor |
| **G-22d3b4** | `G-22d3b4-gosaki-schedule-duplicate-insert-save-retry` | Re-arm env; **Save once**; record `insertedId` |
| **G-22d3c** | `G-22d3c-gosaki-schedule-duplicate-insert-afterverification` | afterVerification SQL; result doc; closure |

---

## 8. Forbidden (this phase)

| Operation | Executed |
| --- | --- |
| Save retry | **no** |
| GRANT / REVOKE | **no** |
| RLS policy change | **no** |
| SQL INSERT/UPDATE/DELETE | **no** |
| package regen / FTP | **no** |

---

## 9. Fix required?

**Yes — infra gap**, not app payload bug. Proceed to **G-22d3b2** grant final preflight before any Save retry.
