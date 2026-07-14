# G-20u36e — Gosaki Discography controlled Save auth JWT admin probe plan

**Phase:** `G-20u36e-controlled-save-auth-jwt-admin-probe-planning`  
**Status:** **complete** — planning only · **no probe / SQL / RPC / HTTP execution**  
**Date:** 2026-07-14  
**Base commit:** `01ba382`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-admin-rls-select-result.md](./gosaki-discography-g20u36e-controlled-save-auth-admin-rls-select-result.md) — snapshot **PASS** · operator JWT admin **unverified**

| Check | Status |
| --- | --- |
| JWT admin probe planning | **yes** (this file) |
| Planning only | **yes** |
| SQL created | **no** |
| Executable SQL blocks | **no** |
| SQL executed | **no** |
| RPC executed | **no** |
| HTTP executed | **no** |
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
| JWT / access_token displayed | **no** |

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthJwtAdminProbePlanPrepared: true
phase: G-20u36e-controlled-save-auth-jwt-admin-probe-planning
planningOnly: true
sqlCreated: false
sqlExecuted: false
rpcExecuted: false
httpExecuted: false
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
jwtAccessTokenDisplayed: false
recommendedProbeOption: OptionC_adminUiSupabaseClientRpc
alternateProbeOption: OptionA_edgeReadOnlyAdminProbeBranch
readyForG20u36eAuthJwtAdminProbeUiPlanning: true
readyForPermissionChangePreflight: false
readyForFirstControlledSaveExecution: false
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 0. Context (from prior result)

| Item | Recorded |
| --- | --- |
| Auth/Admin/RLS snapshot | **PASS** |
| `is_admin()` | `exists (admin_users where user_id = auth.uid() and role = 'admin')` |
| `security_definer` | **true** |
| SQL Editor `is_admin()` | **false** — **not STOP** (≠ JWT context) |
| Restrictive policy on tracks | **0** |
| authenticated UPDATE grants | **0** |
| Operator JWT path (feasibility) | staging shell Auth · YouTube dryRun Bearer pattern |

**Gap this phase addresses:** prove `is_admin() = true` under **operator JWT**, not SQL Editor.

---

## 1. Probe purpose

Confirm **safely**, under operator authenticated JWT:

| # | Question | Allowed evidence |
| --- | --- | --- |
| 1 | Does `auth.uid()` resolve to the signed-in operator user? | boolean / reason code only |
| 2 | Does `public.is_admin()` return **true**? | boolean |
| 3 | Can we infer admin membership (`admin_users` + `role='admin'`) without dumping rows? | via `is_admin()` result only |

**Must never log or paste:** JWT · access_token · full user UUID · email · `admin_users` row dump · service_role.

**Record only:** `{ ok, isAdmin, hasSession, reasonCode, projectRefOk }` style results.

---

## 2. Probe option comparison

### Option A — Edge read-only `adminProbe` branch

| Aspect | Detail |
| --- | --- |
| Idea | Add `operation=adminProbe` (or equivalent) to discography Edge Function · JWT required · call `is_admin()` via user-scoped client · no write |
| Pros | Same JWT path as future Save · server can refuse anon token · aligns with Option A permission model |
| Cons | Needs tools draft · root placement · **Edge deploy** · higher process cost before probe |
| DB write | **none** (design) |
| JWT display | reject logging headers |
| Verdict | **ALTERNATE** — preferred long-term for Save parity · not cheapest first probe |

### Option B — Direct PostgREST `rpc/is_admin` with operator JWT

| Aspect | Detail |
| --- | --- |
| Idea | `POST /rest/v1/rpc/is_admin` with `Authorization: Bearer <user JWT>` + `apikey` anon |
| Pros | No Edge deploy · read-only if EXECUTE exists · uses real JWT context |
| Cons | Token in browser Network tab · easy accidental paste to chat · needs EXECUTE grant / CORS / host allowlist preflight · scripted verify tempts logging |
| DB write | **none** if function is read-only SECURITY DEFINER SELECT |
| Verdict | **CONDITIONAL** — only after dedicated **RPC preflight** · not first pick |

### Option C — Admin UI Supabase client `rpc('is_admin')` read-only probe

| Aspect | Detail |
| --- | --- |
| Idea | Staging read-only admin page · after `getSession()` · `client.rpc('is_admin')` · show boolean + reason only |
| Pros | Session already used (YouTube dryRun) · JWT stays in-memory client · hardest to accidentally paste · matches operator workflow |
| Cons | Needs UI planning + gated probe button · still executes RPC · EXECUTE grant must exist for authenticated |
| DB write | **none** (design) |
| Verdict | **RECOMMENDED first** — safest JWT hygiene for this CMS Kit stage |

### Option D — SQL Editor re-check

| Aspect | Detail |
| --- | --- |
| Idea | Re-run `SELECT is_admin()` in SQL Editor |
| Cons | `auth.uid()` usually null · already returned **false** · **not operator JWT** |
| Verdict | **REJECTED** for JWT admin probe |

### Option E — service_role / auth.users / admin_users dump

| Aspect | Detail |
| --- | --- |
| Idea | service_role SELECT of users/admin_users · email dumps |
| Cons | secrets · PII · overbroad · violates safety rules |
| Verdict | **REJECTED** · **STOP** if proposed |

---

## 3. Recommended probe approach

### Primary: **Option C** — Admin UI Supabase client read-only `rpc('is_admin')`

| Rule | Requirement |
| --- | --- |
| Auth | Operator signed in on staging shell / Gosaki read-only admin |
| Token | Obtained via `getSession()` · **never displayed** · never copied to chat/doc |
| Call | In-browser Supabase JS `rpc('is_admin')` under user session |
| Response stored | `isAdmin: true/false` · `reasonCode` · staging ref check · timestamp |
| Forbidden | service_role · anon UPDATE · DB write · Save · GRANT/RLS change · production ref |

### Alternate: **Option A** — Edge read-only adminProbe

Use after Option C **PASS**, or if UI probe is blocked (EXECUTE missing, UI gate conflict). Reuses Save JWT pipeline; requires tools draft + staging Edge deploy (separate phases).

### Explicitly not next

| Item | Why |
| --- | --- |
| Permission-change SQL | JWT admin still unverified |
| Edge Save implementation | Probe first |
| Option B live RPC from Cursor scripts | Token leak risk until preflight |
| Option D / E | Wrong context / forbidden |

---

## 4. Probe success conditions

| # | Condition |
| --- | --- |
| 1 | Operator authenticated session exists on staging UI |
| 2 | `access_token` obtainable and **not** displayed / logged / pasted |
| 3 | Probe runs with **operator JWT** PostgREST role (`authenticated`) |
| 4 | Project host/ref = **`kmjqppxjdnwwrtaeqjta`** only |
| 5 | `is_admin()` / `rpc('is_admin')` returns **true** |
| 6 | No DB write · no Save · no permission change |
| 7 | No production ref · no service_role |

**PASS probe unlocks:** JWT-scoped admin verified → permission-change preflight planning may proceed.  
**PASS probe does not unlock:** First controlled Save · Edge Save deploy · GRANT execution.

---

## 5. Probe failure handling

| Failure | Likely cause | Next handling |
| --- | --- | --- |
| `is_admin() = false` with valid session | Operator UID missing from `public.admin_users` with `role='admin'` | Separate **admin_users enrollment** planning — **no registration SQL in this phase** |
| Token / session unavailable | Auth UI / env / host gate | Fix staging Auth session path before probe |
| RPC 404 / permission denied | `EXECUTE` on `is_admin` missing for authenticated · or PostgREST exposure | `G-20u36e-controlled-save-auth-jwt-admin-probe-rpc-preflight` (SELECT-only privilege inspect) |
| Probe design requires service_role | architecture error | **STOP** |
| Need to dump emails / admin_users rows | overbroad | **STOP** — redesign to boolean-only |

---

## 6. STOP conditions

| # | Condition |
| --- | --- |
| 1 | JWT / access_token cannot be handled without display in doc/chat/log |
| 2 | Operator session cannot be obtained |
| 3 | Operator JWT context cannot invoke `is_admin()` (even after RPC preflight) |
| 4 | **service_role** required |
| 5 | `auth.users` / `admin_users` PII dump required |
| 6 | DB write required for probe |
| 7 | GRANT / REVOKE / RLS change required for probe itself |
| 8 | operation=save required |
| 9 | Production ref `vsbvndwuajjhnzpohghh` in target |
| 10 | Option E proposed as primary |

**This phase:** none triggered (planning only).

---

## 7. Recommended next phases

| Order | Phase | Purpose |
| --- | --- | --- |
| **1** | **`G-20u36e-controlled-save-auth-jwt-admin-probe-ui-planning`** | Design gated read-only probe UI on staging admin (Option C) · no UI edit yet if planning-only, or minimal plan detail before tools |
| 2 | `G-20u36e-controlled-save-auth-jwt-admin-probe-rpc-preflight` | If EXECUTE / PostgREST exposure unclear — SELECT-only privilege inspect (**after** UI plan or if UI blocked) |
| 3 | `G-20u36e-controlled-save-auth-jwt-admin-probe-tools-draft-planning` | Option A Edge `adminProbe` draft (after UI probe PASS or if UI rejected) |

**Still blocked after this planning doc alone:**

- permission-change SQL
- Edge Save path tools draft for write
- First controlled Save

---

## 8. Not executed in this phase

| Item | Status |
| --- | --- |
| Probe implementation | **not executed** |
| SQL / executable SQL | **not created** |
| SQL / RPC / HTTP execution | **not executed** |
| GRANT / REVOKE / RLS | **not executed** |
| DB write | **not executed** |
| Edge / supabase/functions / deploy | **not executed** |
| operation=save / dryRun HTTP | **not sent** |
| Admin UI change | **not executed** |
| JWT / access_token shown | **no** |
| service_role | **not used** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-plan
npm run verify:g20u36e-controlled-save-auth-admin-rls-select-result
npm run verify:g20u36e-controlled-save-auth-admin-rls-select-prep
npm run verify:current-active-regression
```
