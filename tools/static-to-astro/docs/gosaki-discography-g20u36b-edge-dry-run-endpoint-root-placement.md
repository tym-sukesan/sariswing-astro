# G-20u36b — Gosaki Discography Edge dry-run endpoint root placement

**Phase:** `G-20u36b-edge-dry-run-endpoint-root-placement`  
**Status:** **complete** — root source placed · **no Edge deploy / SQL / Save enablement**  
**Date:** 2026-07-12  
**Base commit:** `4453258`  
**Prior:** G-20u36b root-placement-plan · function-source-staging · deploy-preflight-result READY

| Check | Status |
| --- | --- |
| Root source placed | **yes** |
| Scope exception files | **2 only** — index.ts + handler.ts |
| Other `supabase/functions/**` changed | **no** |
| Edge Function deployed | **no** — Cursor did not deploy |
| Supabase CLI deploy | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Save UI enabled | **no** |
| Admin fetch POST added | **no** |
| Secrets printed | **no** |
| service_role exposed | **no** |
| Production changed | **no** — **STOP** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunEndpointRootPlaced: true
phase: G-20u36b-edge-dry-run-endpoint-root-placement
rootPlacementExecuted: true
scopeExceptionFiles: 2
edgeFunctionDeployed: false
saveEnabled: false
discographySaveDbWriteExecuted: false
cursorDbWriteExecuted: false
cursorSqlExecuted: false
cursorEdgeDeployExecuted: false
serviceRoleConnected: false
supabaseClientConnected: false
proceedToDeployManualExecutionPlan: true
proceedToDeployManualExecution: false
proceedToSave: false
```

**G-20u36b root-placement scope:** copy tools draft to root only. No deploy, no SQL, no Save enablement.

---

## Copy map (executed)

| Copy from (tools draft) | Copy to (repo root) |
| --- | --- |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts` | `supabase/functions/gosaki-discography-save-dry-run/index.ts` |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | `supabase/functions/gosaki-discography-save-dry-run/handler.ts` |

---

## Scope exception

| Rule | Value |
| --- | --- |
| Allowed root edits | **`supabase/functions/gosaki-discography-save-dry-run/index.ts`** · **`handler.ts` only** |
| Other `supabase/functions/**` | **unchanged** |
| `_shared/` dependency added | **no** |
| Intentional diff from tools draft | **header comments + phase constant name only** |

---

## Endpoint policy (root source)

| Item | Value |
| --- | --- |
| **Function name** | `gosaki-discography-save-dry-run` |
| **Deploy target (future)** | staging `kmjqppxjdnwwrtaeqjta` / `static-to-astro-cms-staging` |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **forbidden** |
| **HTTP method** | **POST only** (+ OPTIONS) |
| **Content-Type** | `application/json` |
| **siteSlug** | `gosaki-piano` only |
| **operation** | **`dryRun` only** — `save` rejected |
| **approvalId** | dry-run ID only — save approval ID rejected |
| **Write flags** | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` = **false** |
| **service_role** | **NOT CONNECTED** — `SUPABASE_SERVICE_ROLE_CONNECTED = false` |
| **Supabase client** | **NOT CONNECTED** |
| **DB mutations** | **none** |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Edge Function deploy / Supabase CLI deploy | **not executed** |
| SQL execution | **not executed** |
| DB write | **not executed** |
| Save button enablement | **not executed** |
| Admin Discography fetch POST | **not added** |
| Secrets/env change | **not executed** |
| FTP / production | **not executed** |

---

## Next phases

| Phase | Scope | Deploy? |
| --- | --- | --- |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual-execution-plan** | Optional execution plan refresh before deploy | no |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual** | Operator manual deploy — staging only · separate approval | yes (operator) |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual-result-record** | Record deploy outcome | no |
| **G-20u36b-edge-dry-run-endpoint-live-verify** | Live HTTP verify | no write |
| **G-20u36c** | Admin UI dry-run fetch POST wiring | no Save |

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36b-edge-dry-run-endpoint-root-placement
npm run verify:current-active-regression
```

Historical verifier — not in active regression suite (23 verifiers unchanged).

---

## Verifier post-commit fix (G-20u36b-root-placement-verifier-postcommit-fix)

**Issue:** On clean working tree after root-placement commit, `supabase/functions changes only gosaki-discography-save-dry-run` failed because the verifier only inspected unstaged/untracked git changes.

**Fix:** Verifier now unions **committed** diff (`4453258..HEAD` under `supabase/functions/`) with **working tree** changes. Post-commit clean state PASS when committed scope is exactly the two allowed root files and other `supabase/functions/**` paths are untouched.
