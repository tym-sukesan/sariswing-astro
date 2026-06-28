# G-15b-fail — Gosaki Discography Save permission failure and read-only investigation

**Phase:** `G-15b-fail-gosaki-discography-save-permission-failure-and-investigation`  
**Status:** **complete** — Save failure recorded; afterVerification confirms no DB change; root cause **high confidence** (missing authenticated UPDATE grant on `public.discography`); remediation SQL template prepared (doc-only)  
**Date:** 2026-06-28  
**Base commit:** `eda9047`  
**Prior:** G-15b Save slice (`gosaki-discography-save-slice-final-preflight.md`) — committed; operator Save attempted once

| Check | Status |
| --- | --- |
| Save failure recorded | **yes** |
| afterVerification (row unchanged) | **yes** |
| rollback not needed | **yes** |
| read-only SELECT (target row) | **yes** — Cursor re-verified |
| pg_policies / grants live SQL | **deferred** — requires SQL Editor (templates in §6) |
| Root cause candidate | **yes** — GRANT gap (Schedule G-6-e4 parallel) |
| Remediation SQL template | **yes** — not executed |
| Cursor Save retry | **no** |
| DB write | **no** |

---

## Gates

```txt
gosakiDiscographySavePermissionFailureRecorded: true
phase: G-15b-fail-gosaki-discography-save-permission-failure-and-investigation
readyForG15bGrantPrepOrManualApply: true
readyForG15bSaveRetry: false
rollbackNeeded: false
readyForAnyDbWrite: false
readyForAnyDbGrantOrPolicyChange: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
grantSqlExecuted: false
policySqlExecuted: false
```

**Do not retry Save** until authenticated UPDATE grant (+ policy verification) is applied in a separate approved phase.

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: eda9047
origin/main: eda9047
branch: main...origin/main
```

---

## 2. Save failure record (operator — G-15b execution)

### 2.1 Environment

G-15b env stack armed (staging shell, write module `discography`, approval ID `G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run`, dry-run off, optimistic lock on).

### 2.2 Target

```txt
legacy_id: discography-002
title: SKYLARK
field: purchase_url only
before: https://gosaakiii.base.shop/
after: https://gosakirikako.base.shop/
```

### 2.3 Dry-run Preview (before Save)

```txt
ok: true
dryRun: true
actualWrite: false
wouldWrite: true
changedFields: ["purchase_url"]
payloadKeys: ["purchase_url"]
payload: {"purchase_url":"https://gosakirikako.base.shop/"}
expectedBeforeUpdatedAt: 2026-06-05T17:39:44.201802+00:00
stale: false
hostGatePassed: true
saveReadiness: ready_to_save
saveAllowed: true
guardErrors: none
```

### 2.4 Save attempt (operator clicked 「更新する」 once)

```txt
actualWrite: false
error: permission denied for table discography
```

**Interpretation:** Client guards, dry-run binding, optimistic lock, and auth session checks passed. Failure occurred at **Supabase/PostgreSQL** when `updateDiscographyWrite` called `.update()` on `public.discography`.

### 2.5 Write path (code — for auth role audit)

| Item | Value |
| --- | --- |
| Client | `getStagingSupabaseClient(url, anonKey)` — **anon key + persisted Auth session** |
| Effective DB role | **`authenticated`** (when signed in) — not `service_role` |
| Table | `public.discography` |
| Operation | `UPDATE` (`purchase_url` only) |
| Adapter | `discography-write-adapter.ts` → `updateDiscographyWrite` |
| Executor | `executeG15bDiscographyPurchaseUrlSave` |

Matches Schedule G-9k / G-14b1 pattern. UI requires signed-in staging admin (`isSignedInStagingAuth`).

---

## 3. afterVerification (operator read-only SELECT)

```sql
select id, legacy_id, title, purchase_url, updated_at
from public.discography
where legacy_id = 'discography-002';
```

| Field | Value after failed Save |
| --- | --- |
| **id** | `ed59d236-881a-45ce-ab9f-de5427e39dad` |
| **legacy_id** | `discography-002` |
| **title** | `SKYLARK` |
| **purchase_url** | `https://gosaakiii.base.shop/` (**unchanged**) |
| **updated_at** | `2026-06-05 17:39:44.201802+00` (**unchanged**) |

### Cursor re-verification (read-only REST SELECT — G-15b-fail)

Method: `GET /rest/v1/discography?legacy_id=eq.discography-002` — anon key; staging `kmjqppxjdnwwrtaeqjta` only.

**Result:** **PASS** — same values; `purchase_url` and `updated_at` match before Save baseline.

---

## 4. Rollback judgment

```txt
rollbackNeeded: false
rollbackSqlExecuted: false
```

Failed Save did not modify the row. No compensating UPDATE required.

---

## 5. Permission / RLS / grant investigation

### 5.1 What we can confirm without SQL Editor

| Observation | Implication |
| --- | --- |
| Admin **SELECT** returns 4 discography rows | `GRANT SELECT` + read RLS policy path works for current client role |
| Save error text: **`permission denied for table discography`** | Classic **table-level privilege** failure (same symptom as schedules **before** G-6-e4) |
| Schedule Save succeeded on same staging project | `authenticated` UPDATE on `schedules` + `schedules_admin_all` + `is_admin()` path is proven |
| G-15 MVP assumed “Schedule pattern” but **no G-6-e4 equivalent** for discography | Grant/policy gap likely **oversight**, not app bug |

### 5.2 Schedule precedent (documented — staging)

From `schedule-update-grant-manual-apply-result.md` (G-6-e4):

```txt
Before: authenticated had SELECT only on public.schedules
Symptom: permission denied (table-level) on UPDATE attempts
Fix: grant update on table public.schedules to authenticated;
RLS: schedules_admin_all (authenticated, is_admin()) unchanged
Result: admin-only UPDATE allowed through RLS after grant
```

### 5.3 Kit RLS draft (repo — not proof of staging apply state)

`tools/static-to-astro/scripts/lib/rls-draft-generator.mjs` defines:

```txt
GRANT SELECT on discography to anon, authenticated  (section 3)
discography_public_select — SELECT, published = true
discography_admin_all — FOR ALL, authenticated, is_admin()
```

**Note:** Draft includes admin policy but section 3 grants **SELECT only** — UPDATE still requires separate `GRANT UPDATE` (same as schedules).

### 5.4 RLS vs GRANT — error classification

| Failure type | Typical PostgREST / Postgres message | G-15b fit |
| --- | --- | --- |
| Missing table GRANT | `permission denied for table discography` | **yes — primary** |
| RLS policy blocks row | Often `0 rows` / `PGRST116` / policy violation text | less likely given exact message |
| Not signed in | App guard `auth_session_missing` | ruled out (Save reached DB) |
| Wrong host | host gate in app | ruled out (`hostGatePassed: true`) |

**Conclusion:** **High confidence** root cause is **missing `GRANT UPDATE ON public.discography TO authenticated`**, with possible secondary gap if `discography_admin_all` policy was never applied on staging (confirm via §6 SQL).

### 5.5 Comparison: schedules vs discography (expected staging state)

| Item | `public.schedules` (working) | `public.discography` (G-15b fail) |
| --- | --- | --- |
| anon SELECT | yes | likely yes |
| authenticated SELECT | yes | likely yes |
| authenticated UPDATE (table grant) | **yes** (G-6-e4 manual) | **likely no** |
| RLS enabled | yes | unknown — confirm §6 |
| admin write policy | `schedules_admin_all` | `discography_admin_all` — **confirm §6** |
| `is_admin()` | used | same helper if policy exists |
| G-15b write adapter role | authenticated JWT | authenticated JWT |

### 5.6 `discography_tracks`

Not touched by G-15b (`purchase_url` only on parent row). No grant change required for this slice.

---

## 6. Read-only audit SQL (operator SQL Editor — not executed by Cursor)

Run on **`static-to-astro-cms-staging` only**. Full template:

`tools/static-to-astro/scripts/supabase/gosaki-discography-update-permission.template.sql`

Key queries:

```sql
-- Policies
select * from pg_policies
where schemaname = 'public' and tablename = 'discography';

-- Grants
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'discography'
order by grantee, privilege_type;

-- RLS flag
select relname, relrowsecurity from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and relname = 'discography';
```

**Compare** `discography` grant rows side-by-side with `schedules` (§5.5).

---

## 7. Estimated root cause

**Primary (high confidence):**

```txt
public.discography lacks GRANT UPDATE for role authenticated.
PostgreSQL rejects UPDATE before RLS policy is evaluated.
Error: permission denied for table discography
```

**Secondary (confirm via §6):**

```txt
discography_admin_all RLS policy may be missing on staging even if grant is added later.
Both table GRANT and RLS policy are required (Schedule G-6-e4 + schedules_admin_all precedent).
```

**Not the cause:**

```txt
- App payload / guards / optimistic lock (dry-run passed)
- service_role requirement (Kit path uses authenticated + RLS)
- discography_tracks
- production host
- accidental row change (afterVerification clean)
```

---

## 8. Remediation plan (doc-only — separate approval required)

### Phase G-15b-grant (recommended next)

1. Run §6 read-only audit in SQL Editor; capture grants + policies.
2. If authenticated UPDATE absent on `discography`:
   ```sql
   grant update on table public.discography to authenticated;
   ```
3. If `discography_admin_all` missing, apply Kit draft policy (review `is_admin()` first).
4. Re-verify grants (SELECT-only query).
5. **Do not** grant anon UPDATE, INSERT, DELETE, or touch `discography_tracks`.
6. New approval ID for **single** Save retry on `discography-002`.

### After grant — Save retry phase (G-15b-retry)

- Re-arm G-15b stack (or new `G-15b-retry-*` approval ID).
- Operator: Preview → Save once → afterVerification SELECT.
- Disarm env; routine dev `PUBLIC_ADMIN_WRITE_DRY_RUN=true`.

---

## 9. Safety statement

```txt
Cursor Save executed: false
Cursor DB write executed: false
GRANT executed: false
Policy change executed: false
Rollback SQL executed: false
service_role used: false
production touched: false
FTP / deploy: none
```

---

## 10. Related artifacts

| File | Purpose |
| --- | --- |
| `gosaki-discography-update-permission.template.sql` | Audit + proposed grant/policy (template) |
| `gosaki-discography-save-slice-final-preflight.md` | G-15b Save slice preflight |
| `schedule-update-grant-manual-apply-result.md` | Schedule grant precedent |
| `verify-g15b-gosaki-discography-save-permission-failure-and-investigation.mjs` | Phase verifier |

---

## 11. Next phase

**Recommended:** `G-15b-grant-gosaki-discography-update-permission-prep` → operator manual GRANT apply → `G-15b-retry` Save once.

**Do not:** retry Save before grant; do not use `service_role` in browser; do not change RLS in this failure-recording phase.
