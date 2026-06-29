# G-18g1-apply — Gosaki Discography tracks UPDATE grant apply preflight

**Phase:** `G-18g1-apply-gosaki-discography-tracks-update-grant-preflight`  
**Status:** **complete** — operator runbook + SQL ready; **GRANT not executed**  
**Date:** 2026-06-29  
**Base commit:** `418c2bd`  
**Prior:** G-18g1 (`gosaki-discography-g18g1-tracks-grant-rls-readonly-check.md`)  
**Approval ID (execution):** `G-18g1-discography-tracks-update-grant-apply`

| Check | Status |
| --- | --- |
| Why GRANT needed documented | **yes** |
| SQL runbook (Step 0–4) | **yes** |
| Pre/post verification queries | **yes** |
| Rollback REVOKE documented | **yes** (not executed) |
| Cursor GRANT execution | **no** |
| Save / row UPDATE | **no** |

---

## Gates

```txt
gosakiDiscographyG18g1ApplyUpdateGrantPreflightComplete: true
phase: G-18g1-apply-gosaki-discography-tracks-update-grant-preflight
approvalId: G-18g1-discography-tracks-update-grant-apply
readyForG18g1ApplyUpdateGrantExecution: true
readyForG18g1ApplyUpdateGrantResultDoc: false
readyForG18g2TracklistSingleTitleSaveDryRunImplementation: false
grantExecutedInThisPhase: false
grantExecutedByCursor: false
policyChangeExecutedInThisPhase: false
cursorDbWriteExecuted: false
cursorSaveExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: 418c2bd
origin/main: 418c2bd
branch: main...origin/main
```

---

## 2. Why this GRANT is needed

G-18g1 read-only check concluded:

```txt
public.discography_tracks — authenticated UPDATE grant: missing
public.discography — authenticated UPDATE grant: present (G-15b-grant)
```

G-18g2 tracklist Save PoC (textarea → single-row `title` UPDATE) uses the **anon Supabase client with operator JWT** (`authenticated` role). Without table-level UPDATE on `discography_tracks`, PostgREST returns `permission denied for table discography_tracks` before RLS is evaluated — same failure class as pre–G-15b `discography` Save.

**Parallel:** G-15b-grant on `public.discography`; Schedule G-6-e4 on `public.schedules`.

---

## 3. What changes

| Item | After operator GRANT |
| --- | --- |
| `authenticated` role | **UPDATE** privilege on `public.discography_tracks` |
| Table-level capability | Admin users satisfying RLS may **issue** UPDATE statements |
| Kit Save path | Unblocks **permission layer** for G-18g2 adapter (RLS + guards still required) |

**Important:** This GRANT grants **capability**, not an automatic data change. No row is modified by the GRANT statement itself.

**High-risk note:** After GRANT, any client using `authenticated` + passing `discography_tracks_admin_all` / `is_admin()` **could** UPDATE track rows. Hence **separate approval**, **manual SQL Editor execution**, and **no Cursor execution**.

---

## 4. What does NOT change

| Item | Unchanged |
| --- | --- |
| Row data | **yes** — GRANT does not write rows |
| `public.discography` grants | **yes** — not touched |
| `anon` grants | **yes** — still SELECT only; **no anon write** |
| INSERT / DELETE on `discography_tracks` | **not granted** |
| RLS policies | **not changed** in this phase |
| Schema / triggers | **not changed** |
| G-18f UI / dry-run | **unchanged** until G-18g2 |
| `service_role` | **not used** by Kit client Save |

---

## 5. Target

| Item | Value |
| --- | --- |
| Project | `static-to-astro-cms-staging` |
| Host ref | `kmjqppxjdnwwrtaeqjta` |
| Table | `public.discography_tracks` only |
| Grant | `UPDATE` → `authenticated` |
| SQL file | `gosaki-discography-tracks-g18g1-apply-update-grant.sql` |

---

## 6. Operator runbook

### 6.1 Before execution checklist

```txt
[ ] Supabase project = static-to-astro-cms-staging (NOT vsbvndwuajjhnzpohghh)
[ ] SQL Editor open in staging only
[ ] No service_role key in use
[ ] Approval ID G-18g1-discography-tracks-update-grant-apply confirmed
[ ] Rollback REVOKE SQL noted (§10)
[ ] G-18g2 Save NOT run in same session
```

### 6.2 Execution order

1. Open `tools/static-to-astro/scripts/supabase/gosaki-discography-tracks-g18g1-apply-update-grant.sql`
2. Run **Step 1** pre-checks — confirm authenticated UPDATE **absent**
3. Run **Step 2** once: `grant update on table public.discography_tracks to authenticated;`
4. Run **Step 3** post-checks — confirm authenticated UPDATE **present**
5. Run **Step 4** — confirm track 7 still `Like a Lover`; test title count **0**
6. Paste results into `G-18g1-apply-result` doc (future phase)

### 6.3 Abort conditions

Abort **before** Step 2 if:

```txt
- Wrong Supabase project / production host visible
- authenticated UPDATE already present (skip GRANT; document and proceed to G-18g2 prep)
- RLS disabled on discography_tracks
- discography_tracks_admin_all policy missing
- Pre-check target row differs from baseline (track 7 not Like a Lover)
- Any unexpected anon UPDATE/INSERT/DELETE grant appears
```

---

## 7. Expected outcomes

### 7.1 Success (good result)

```txt
Step 2: Success. No rows returned.
Step 3a: authenticated | UPDATE present on discography_tracks
Step 3b: 0 rows (anon write)
Step 3c: 0 rows (authenticated INSERT/DELETE/TRUNCATE)
Step 4: track 7 title = Like a Lover; test title rows = 0
```

### 7.2 Failure modes

| Symptom | Likely cause | Action |
| --- | --- | --- |
| `permission denied` on GRANT | Wrong role / not SQL Editor superuser | Stop; use postgres role in SQL Editor |
| authenticated UPDATE still absent | GRANT not committed / wrong schema | Re-run post-check; do not run Save |
| Unexpected anon write grants | Prior misconfiguration | Stop; investigate; do not proceed to Save |
| Target row changed | Unrelated write occurred | Stop; investigate before G-18g2 |

### 7.3 Worst case

```txt
GRANT applied on wrong project (production)
```

**Prevention:** Step 0 host ref check; visual project name confirmation. **STOP** rules for `vsbvndwuajjhnzpohghh`.

If wrong project touched: stop all work; operator incident record; REVOKE on wrong project only with explicit recovery approval.

---

## 8. Pre-check expectations (Step 1)

| Check | Expected |
| --- | --- |
| anon on `discography_tracks` | SELECT only |
| authenticated on `discography_tracks` | SELECT only; **no UPDATE** |
| authenticated on `discography` | UPDATE present (reference) |
| RLS | enabled |
| Policies | `discography_tracks_public_select`, `discography_tracks_admin_all` |
| track 7 | `Like a Lover` |
| `Like a Lover（テスト）` | 0 rows |

---

## 9. Post-check expectations (Step 3–4)

| Check | Expected |
| --- | --- |
| authenticated UPDATE on `discography_tracks` | **present** |
| authenticated SELECT on `discography_tracks` | still present |
| anon UPDATE/INSERT/DELETE | **0 rows** |
| authenticated INSERT/DELETE/TRUNCATE | **0 rows** |
| track 7 title | `Like a Lover` (unchanged) |
| album `discography-002` count | 8 |

---

## 10. Rollback (doc-only — not executed)

If grant must be reverted (no row rollback needed):

```sql
revoke update on table public.discography_tracks from authenticated;
```

Verify after REVOKE:

```sql
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'discography_tracks'
  and grantee = 'authenticated'
  and privilege_type = 'UPDATE';
-- expect: 0 rows
```

**Do not execute** REVOKE in preflight phase.

---

## 11. Results to paste after execution

Operator should capture for `G-18g1-apply-result` doc:

```txt
- Supabase project name + host ref
- Step 2 SQL Editor message
- Step 3a grant table (full result)
- Step 3b / 3c row counts
- Step 4 track 7 title + test title count
- Judgment: grant apply success yes/no
- Target row unchanged yes/no
- readyForG18g2: yes/no
```

---

## 12. Next sequence

```txt
G-18g1-apply-preflight  — done (this doc)
G-18g1-apply-execution  — operator runs SQL once (separate chat / approval)
G-18g1-apply-result     — record grants + row unchanged
G-18g2                  — tracklist Save adapter implementation
```

---

## 13. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18g1-gosaki-discography-tracks-apply-update-grant-preflight.mjs
```
