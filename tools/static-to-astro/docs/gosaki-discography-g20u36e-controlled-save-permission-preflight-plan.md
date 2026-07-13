# G-20u36e — Gosaki Discography controlled Save permission preflight plan

**Phase:** `G-20u36e-controlled-save-permission-preflight-planning`  
**Status:** **complete** — planning only · **no SQL execution** · **no grant/RLS change**  
**Date:** 2026-07-14  
**Base commit:** `708aaf3`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-edge-save-path-plan.md](./gosaki-discography-g20u36e-controlled-save-edge-save-path-plan.md) — **complete**

| Check | Status |
| --- | --- |
| Permission preflight plan | **yes** (this file) |
| Planning only | **yes** |
| SQL executed | **no** |
| Executable SQL blocks created | **no** |
| GRANT / REVOKE | **no** |
| RLS policy change | **no** |
| DB write | **no** |
| Edge implementation | **no** |
| supabase/functions edit | **no** |
| Edge deploy | **no** |
| operation=save sent | **no** |
| dryRun HTTP re-sent | **no** |
| Admin UI change | **no** |
| FTP / upload | **no** |
| service_role | **not used** |

---

## Gates

```txt
gosakiDiscographyControlledSavePermissionPreflightPlanPrepared: true
phase: G-20u36e-controlled-save-permission-preflight-planning
planningOnly: true
sqlExecuted: false
executableSqlBlocksCreated: false
grantRevokeExecuted: false
rlsPolicyChangeExecuted: false
dbWriteExecuted: false
edgeImplementationExecuted: false
supabaseFunctionsEdited: false
edgeDeployExecuted: false
operationSaveSent: false
dryRunHttpResent: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsed: false
permissionSnapshotSelectRequiredBeforeGrantChange: true
readyForG20u36ePermissionSnapshotSelectPrep: true
readyForG20u36eEdgeSavePathToolsDraft: false
readyForFirstControlledSaveExecution: false
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 0. Context — controlled Save target (unchanged)

| Field | Value |
| --- | --- |
| sliceId | `G-20u36e1-discography-002-track-1-title-staging-marker` |
| siteSlug | `gosaki-piano` |
| legacyId | `discography-002` |
| table | `public.discography_tracks` |
| target row | `site_slug=gosaki-piano` · `discography_legacy_id=discography-002` · `track_number=1` · `title=On a Clear Day` |
| after title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track count | **8 → 8** |
| track 7 | **`Like a Lover`** — must not change |
| release scalars | unchanged |

**Edge save path plan (prior phase):** one-row UPDATE recommended · delete/insert/rebuild **NG** · RPC/SECURITY DEFINER **NG** · service_role **STOP**.

**dryRun live verify (prior phase):** Step A wouldWrite=false · Step B wouldWrite=true · changedLines=1 line 1 only · write flags all false.

---

## 1. Current permission risk

### 1.1 Recorded baseline (G-20u36a remediation + G-20u36b deploy preflight — staging)

| Item | Recorded state |
| --- | --- |
| anon SELECT on `discography` + `discography_tracks` | **present** (readBack live verify works) |
| authenticated SELECT | **present** (2 grants) |
| authenticated UPDATE | **0** (revoked in G-20u36a apply — re-confirmed G-20u36b preflight) |
| anon INSERT/UPDATE/DELETE | **0** |
| RLS enabled | **true** on both tables |
| Admin ALL policies | **2 remain** — `discography_admin_all` · `discography_tracks_admin_all` (`is_admin()`) |
| Grant-layer direct PostgREST UPDATE | **blocked** for anon and authenticated (UPDATE grant = 0) |

### 1.2 Why Save is blocked today

| Layer | Block |
| --- | --- |
| Edge handler | `operation=save` → **400 reject** (no write branch deployed) |
| Edge auth client | readBack uses **`SUPABASE_ANON_KEY` only** — no user JWT forwarded to Supabase client for writes |
| PostgREST grants | **authenticated UPDATE = 0** — even if Edge attempted PATCH/UPDATE with anon or authenticated role, grant layer likely denies |
| service_role | **forbidden** by project policy |

**Planning conclusion:** Recommended one-row UPDATE **cannot succeed** under current permission model without a **separate approved permission-change phase** (staging-only, minimal scope).

### 1.3 Staleness risk

G-20u36b deploy preflight result is the last **recorded** grant inventory. Before any grant/RLS change or Save arm:

- **Re-run SELECT-only permission snapshot** on staging (§2)
- Do not assume grants unchanged since G-20u36b

### 1.4 Edge auth context (read-only code review)

| Item | Current implementation |
| --- | --- |
| readBack adapter | `createDefaultAnonSelectReadBackAdapter` — uses `SUPABASE_ANON_KEY` from Edge env |
| Incoming `Authorization` header | Accepted by CORS · **not parsed for user JWT** in handler |
| Authenticated role path | **none** for DB operations today |
| service_role | **not connected** (`SUPABASE_SERVICE_ROLE_CONNECTED = false`) |
| Live dryRun verify auth | Client sends Bearer + apikey with **public anon key** |

**Implication:** Even with restored authenticated UPDATE grant, Edge must be extended to **forward operator authenticated JWT** (or equivalent approved auth path) — anon-only Edge client is insufficient for RLS-scoped operator write.

---

## 2. SELECT-only permission snapshot — policy (next phases)

**This planning phase:** inventory **requirements only** — **no SQL text** · **no execution**.

### 2.1 Purpose

Confirm current staging permission model before any grant/RLS change or Edge Save implementation. Output feeds Option A feasibility and permission-change design (§4).

### 2.2 Investigation areas (operator SELECT-only — future phases)

| Area | What to confirm |
| --- | --- |
| **role_table_grants** | `public.discography` · `public.discography_tracks` · grantees `anon` / `authenticated` · privileges SELECT / INSERT / UPDATE / DELETE |
| **Column-level privileges** | Whether `discography_tracks.title` can receive UPDATE grant **without** granting UPDATE on other columns |
| **pg_class / pg_namespace** | RLS enabled · RLS forced on target tables |
| **pg_policies** | All policies on `discography` · `discography_tracks` — cmd · roles · qual · with_check |
| **G-20u36a revoke re-check** | authenticated UPDATE count = **0** on both tables |
| **Admin policies** | `discography_admin_all` · `discography_tracks_admin_all` still present · `is_admin()` definition unchanged |
| **Effective write path** | Whether any role can UPDATE target row today (expect **no**) |
| **Target row existence** | One row match for slice WHERE clause (read-only count / sample — no mutation) |

### 2.3 Edge auth context checks (non-SQL)

| Check | Method |
| --- | --- |
| Edge env keys present | Deploy config review — anon key yes · service_role must not be exposed |
| Operator JWT path | Staging admin login → session JWT available for future Edge Save? (document in snapshot result phase) |
| `is_admin()` operator | Confirm test operator satisfies admin policy if that path is considered |

### 2.4 Snapshot phase sequence

| Phase | Scope |
| --- | --- |
| **G-20u36e-controlled-save-permission-snapshot-select-prep** | Prepare SELECT-only SQL file + operator checklist · **no execution** |
| **G-20u36e-controlled-save-permission-snapshot-select-execution** | Operator manual SELECT on staging · result record doc |

**This planning phase stops before prep/execution.**

### 2.5 Snapshot PASS criteria (for future result record)

| Check | Expected |
| --- | --- |
| Project ref | `kmjqppxjdnwwrtaeqjta` only |
| authenticated UPDATE grants | **0** (re-confirmed) or documented delta if changed |
| anon write grants | **0** |
| SELECT grants | preserved |
| RLS enabled | true both tables |
| Target row count | **1** for slice WHERE |
| Column-level UPDATE on title alone | **feasible / not feasible / unknown** — must be answered |
| No executable mutation in snapshot run | **required** |

---

## 3. Permission model options (service_role-free)

### Option A — authenticated UPDATE(title) + restrictive RLS + Edge operator JWT

| Aspect | Detail |
| --- | --- |
| Grant | Staging-only **authenticated UPDATE** on `discography_tracks.title` (column-level if supported) |
| RLS | New **restrictive** policy — UPDATE allowed only when `site_slug` · `discography_legacy_id` · `track_number` match slice · optional title old-value guard in policy |
| Edge | Accept **operator authenticated JWT** in Authorization header · Supabase client uses JWT (not anon) for PATCH |
| Scope | **One row** · **one column** · staging · temporary / controlled Save window |
| Rollback | Revoke grant / drop policy after Save + verify — separate phase |
| **Verdict** | **Recommended primary path** if snapshot confirms column-level grant + JWT path |

### Option B — anon UPDATE + restrictive RLS

| Aspect | Detail |
| --- | --- |
| Risk | Any holder of anon key could attempt UPDATE if RLS misconfigured |
| Exposure | Anon key is in browser / static packages |
| **Verdict** | **High risk — avoid** even on staging |

### Option C — manual SQL one-shot UPDATE

| Aspect | Detail |
| --- | --- |
| Validation | Does **not** prove CMS Edge Save path |
| Use | Emergency rollback / fallback only |
| **Verdict** | **Not primary** First controlled Save path |

### Option D — service_role

| **Verdict** | **STOP** — forbidden |

### Option E — RPC / SECURITY DEFINER

| Aspect | Detail |
| --- | --- |
| Risk | Privilege escalation · audit complexity |
| **Verdict** | **Not primary** — defer |

### Options summary

| Option | Verdict |
| --- | --- |
| **A. authenticated UPDATE(title) + RLS + operator JWT** | **Recommended** (pending snapshot) |
| B. anon UPDATE + RLS | **Avoid** |
| C. manual SQL one-shot | **Emergency / fallback only** |
| D. service_role | **STOP** |
| E. RPC / SECURITY DEFINER | **Not primary** |

---

## 4. Recommended model (planning decision)

### 4.1 Sequence

1. **Execute SELECT-only permission snapshot** (prep → operator execution → result record) — **next phases**
2. Review snapshot: column-level title UPDATE feasibility · existing policies · JWT path
3. If feasible: plan **staging-only minimal permission change** in separate phase:
   - authenticated UPDATE on `discography_tracks.title` only (if column grants supported)
   - restrictive RLS policy scoped to slice row
   - **no anon UPDATE**
   - **no service_role**
4. Plan Edge Save path to use **operator JWT** — not anon key — for write client
5. **Edge Save path tools draft** only after permission model approved

### 4.2 Permission change workflow (if required — not this phase)

```txt
permission preflight planning (this doc)
  → permission snapshot SELECT prep
  → operator snapshot SELECT execution + result record
  → permission change SQL preflight (separate phase — executable SQL allowed there only)
  → operator manual GRANT/RLS execution + explicit approval
  → permission change result record
  → Edge Save path tools draft
  → controlled Save execution
```

### 4.3 Permission change design requirements (no executable SQL here)

| Requirement | Detail |
| --- | --- |
| Project | **staging `kmjqppxjdnwwrtaeqjta` only** |
| Production | **`vsbvndwuajjhnzpohghh` STOP** |
| Table | `public.discography_tracks` only for write grant |
| Column | **`title` only** if column-level privileges supported — confirm in snapshot |
| Row scope | `site_slug='gosaki-piano'` · `discography_legacy_id='discography-002'` · `track_number=1` |
| RLS WITH CHECK | Updated row must remain within slice scope — no site_slug / legacy_id / track_number drift |
| Title old-value guard | RLS qual may include `title = 'On a Clear Day'` — **Edge server-side guard still mandatory** (defense in depth) |
| Duration | **Temporary / minimal** — revert grant/policy after controlled Save + post-verify |
| Rollback of permissions | Separate phase — document REVOKE / DROP POLICY plan when change phase starts |
| anon | **No anon UPDATE grant** |
| service_role | **Not used** |
| INSERT/DELETE | **Not granted** |
| discography parent table | **No UPDATE** on release scalars |

### 4.4 Edge implementation dependency

Save path implementation (**tools draft**) must not arm `operation=save` on live Edge until:

- Permission snapshot **PASS**
- Permission change (if needed) **executed + recorded**
- Write path tested with **dry contract** (mock or staging JWT probe — separate phase)

---

## 5. STOP conditions

Stop and ask operator if:

| # | Condition |
| --- | --- |
| 1 | **service_role** becomes necessary |
| 2 | **anon UPDATE** grant becomes necessary |
| 3 | production ref `vsbvndwuajjhnzpohghh` in target / SQL / config |
| 4 | write target cannot be limited to **one row** |
| 5 | column cannot be limited to **`title`** — or feasibility **unknown** after snapshot |
| 6 | RLS policy would be **broader** than single-row slice |
| 7 | **authenticated user JWT path** for operator is unknown / unavailable |
| 8 | Edge can only operate with **anon key** and no safe JWT forward path exists |
| 9 | permission change **rollback plan** cannot be documented |
| 10 | planning phase requires **SQL execution** |
| 11 | planning phase requires **DB write** |
| 12 | planning phase requires **operation=save** HTTP send |
| 13 | grant/RLS change attempted without snapshot + explicit approval |
| 14 | delete/insert/rebuild required instead of one-row UPDATE |
| 15 | track count / track 7 / release scalar would change |

---

## 6. Next phases

| Phase | Scope | Order |
| --- | --- | --- |
| **G-20u36e-controlled-save-permission-snapshot-select-prep** | SELECT-only SQL file + checklist for §2 inventory | **Recommended next** |
| **G-20u36e-controlled-save-permission-snapshot-select-execution** | Operator manual SELECT + result record | After prep |
| G-20u36e-controlled-save-permission-change-preflight (TBD) | Grant/RLS change SQL preflight — only if snapshot requires | After snapshot PASS |
| G-20u36e-controlled-save-edge-save-path-tools-draft | Save branch + guards | After permission model firm |

**Do not skip snapshot prep** — grant state may have drifted since G-20u36b.

---

## 7. Explicit negatives (this phase)

| Item | Status |
| --- | --- |
| SQL executed | **no** |
| Executable SQL blocks created | **no** |
| GRANT / REVOKE | **no** |
| CREATE / ALTER / DROP POLICY | **no** |
| DB write | **no** |
| Edge implementation | **no** |
| supabase/functions edit | **no** |
| Edge deploy | **no** |
| operation=save sent | **no** |
| dryRun HTTP re-sent | **no** |
| Save enabled | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| service_role used | **no** |
| First controlled Save | **not executable** |

---

## Verifier

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-permission-preflight-plan
```

Script: `scripts/verify-g20u36e-controlled-save-permission-preflight-plan.mjs`
