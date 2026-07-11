# G-20u36b — Gosaki Discography Edge dry-run endpoint deploy preflight

**Phase:** `G-20u36b-edge-dry-run-endpoint-deploy-preflight`  
**Status:** **complete** — preflight doc + SELECT-only SQL · **no Edge deploy / root supabase/functions edit / SQL execution**  
**Date:** 2026-07-12  
**Base commit:** `94c5c18`  
**Prior:** G-20u36b inert implementation · implementation plan · deploy plan · G-20u36a permissions PASS

| Check | Status |
| --- | --- |
| Preflight doc | **yes** (this file) |
| SELECT-only SQL | **yes** — `gosaki-discography-g20u36b-edge-dry-run-endpoint-deploy-preflight.sql` |
| Edge Function deployed | **no** — Cursor did not deploy |
| Root `supabase/functions/**` changed | **no** |
| SQL executed | **no** — operator only |
| DB write | **no** |
| Save UI enabled | **no** |
| Admin fetch POST added | **no** |
| Secrets printed | **no** |
| Production changed | **no** — **STOP** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunEndpointDeployPreflightPrepared: true
phase: G-20u36b-edge-dry-run-endpoint-deploy-preflight
preflightOnly: true
edgeFunctionDeployed: false
saveEnabled: false
discographySaveDbWriteExecuted: false
cursorDbWriteExecuted: false
cursorSqlExecuted: false
cursorEdgeDeployExecuted: false
cursorFtpUploadExecuted: false
rootSupabaseFunctionsChanged: false
productionUploadStop: true
productionDbWriteStop: true
serviceRoleBrowserExposure: false
secretsPrinted: false
proceedToDeployManual: false
proceedToSave: false
proceedToDbWrite: false
proceedToEdgeDeploy: false
```

**G-20u36b deploy-preflight scope:** doc + SELECT-only SQL only. No deploy, no SQL execution by Cursor, no Save enablement.

---

## Deploy target / STOP target

| Item | Value |
| --- | --- |
| **Endpoint name** | `gosaki-discography-save-dry-run` |
| **Deploy target** | **staging** — `static-to-astro-cms-staging` |
| **Staging project ref** | `kmjqppxjdnwwrtaeqjta` |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **forbidden** |
| **siteSlug** | `gosaki-piano` only |
| **Initial legacyId** | `discography-002` |
| **operation** | **`dryRun` only** — reject `save` |
| **Write flags** | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` = **false** |

---

## A. Git / workspace preflight

| # | Check | Block if fail |
| --- | --- | --- |
| 1 | `HEAD` = `origin/main` (documented commit) | yes |
| 2 | Working tree clean before deploy-manual | yes |
| 3 | Changes only in `tools/static-to-astro/**` for this phase | yes |
| 4 | Root `supabase/functions/**` has no uncommitted change | yes |
| 5 | `src/**` / `public/**` unchanged | yes |
| 6 | `npm run verify:g20u36b-edge-dry-run-endpoint-inert-implementation` PASS | yes |
| 7 | `npm run verify:current-active-regression` PASS | yes |

---

## B. Permissions gate (prerequisite)

| Prerequisite | Expected |
| --- | --- |
| G-20u36a after-verification | **PASS** recorded |
| authenticated UPDATE grants | **0** |
| anon write grants | **0** |
| SELECT grants | **maintained** — anon 2 · authenticated 2 |
| RLS enabled | **true** — both tables |
| Data baseline | **4 / 34** |
| target discography-002 | **1 / 8** |
| Integrity | orphans 0 · duplicates 0 · site_slug mismatch 0 |

**Operator:** Run SELECT-only SQL in staging SQL Editor before deploy-manual. Gate: `H.deploy_preflight.summary` = `READY_FOR_EDGE_DRY_RUN_DEPLOY_PREFLIGHT` or **STOP**.

---

## C. Secrets / env confirmation policy

**This phase does NOT display secret values.** Cursor must not read or log secrets.

| Secret name (confirm existence only) | Purpose |
| --- | --- |
| `SUPABASE_URL` | Edge Function staging project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge internal SELECT-only read (never browser) |
| `ALLOWED_ORIGIN` (optional) | CORS allowlist for staging admin host |

| Rule | Value |
| --- | --- |
| Print secret values | **Forbidden** |
| Log secret values | **Forbidden** |
| Cursor reads secrets | **Forbidden** |
| Operator confirmation | Supabase Dashboard / CLI — **existence only** |
| service_role in browser/response | **Forbidden** |

---

## D. Function source readiness (inert module)

| Check | Status (local verifier) |
| --- | --- |
| Inert module exists | `gosaki-discography-edge-dry-run-endpoint-inert.mjs` |
| dryRun valid | **PASS** |
| operation=save reject | **PASS** |
| wrong siteSlug reject | **PASS** |
| invalid / save approval reject | **PASS** |
| write flags false | **PASS** |
| service_role exposure | **none** |
| DB mutation | **none** |
| Root `supabase/functions/**` placement | **Not in this phase** |

---

## E. Future manual deploy command draft

```txt
NOT EXECUTED IN THIS PHASE
HUMAN OPERATOR ONLY
STAGING ONLY — project ref kmjqppxjdnwwrtaeqjta
STOP if project ref = vsbvndwuajjhnzpohghh (production)
```

Future draft (confirm in deploy-manual phase — **do not run now**):

```bash
# NOT EXECUTED — draft only
# 1. Confirm Supabase CLI linked to staging project ref kmjqppxjdnwwrtaeqjta
# 2. Confirm root supabase/functions/gosaki-discography-save-dry-run/ exists (future phase)
# 3. Operator explicit one-time approval required

# supabase functions deploy gosaki-discography-save-dry-run \
#   --project-ref kmjqppxjdnwwrtaeqjta
```

| Rule | Value |
| --- | --- |
| Execute in this phase | **no** |
| Production deploy | **STOP** |
| Deploy without preflight SQL PASS | **STOP** |
| Deploy without operator approval | **STOP** |

---

## F. Live verify plan (after deploy-manual — not this phase)

| Case | Expected |
| --- | --- |
| Valid dryRun payload | HTTP 200 · `ok: true` · diff returned |
| `operation=save` | reject · no write |
| Wrong `siteSlug` | reject |
| Invalid approvalId | reject |
| `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` | **always false** |
| Table data | unchanged — 4/34 · discography-002/8 |
| Permissions | authenticated UPDATE = 0 |
| Admin UI Save | **remains disabled** |

---

## G. Rollback / disable plan (document only — not executed)

| Scenario | Action |
| --- | --- |
| Endpoint returns unexpected write flags | **STOP** — do not wire admin UI |
| Endpoint unreachable / 500 | Investigate logs — **no secrets in logs** |
| Data change detected post-deploy | **STOP** — separate incident phase |
| Disable function | Supabase Dashboard disable or delete — **separate operator approval** |
| UI impact | Limited — admin UI has **no fetch POST** yet |

**This phase:** no disable, delete, rollback, or deploy operations.

---

## STOP conditions

| Condition | Action |
| --- | --- |
| Production project `vsbvndwuajjhnzpohghh` | **STOP** |
| Project ref cannot be confirmed | **STOP** |
| Root `supabase/functions/**` unexpected change | **STOP** |
| service_role exposed to browser/response/logs | **STOP** |
| `operation=save` accepted | **STOP** |
| `didWrite` / `dbWrite` / `networkWrite` = true | **STOP** |
| DB write method added | **STOP** |
| Save button enabled | **STOP** |
| Admin fetch POST added | **STOP** |
| SQL mutation | **STOP** |
| Secrets printed/logged | **STOP** |
| Edge calls GitHub/FTP/deploy | **STOP** |
| Permissions remediation degraded (UPDATE grants > 0) | **STOP** |
| Working tree dirty at deploy attempt | **STOP** |
| Preflight SQL gate = STOP | **STOP** — do not deploy |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Edge Function deploy / Supabase CLI deploy | **not executed** |
| Root `supabase/functions/**` edit | **not executed** |
| SQL execution (Cursor) | **not executed** |
| DB write | **not executed** |
| Save enablement | **not executed** |
| Admin fetch POST | **not added** |
| Secrets/env change | **not executed** |
| FTP / production | **not executed** |

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-20u36b-edge-dry-run-endpoint-deploy-preflight-result-record** | Operator SQL result record |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual** | Operator manual deploy — staging only |
| **G-20u36b-edge-dry-run-endpoint-live-verify** | Live HTTP verify |
| **G-20u36c** | Admin UI dry-run fetch POST wiring |
| **G-20u36e** | First controlled Save — blocked until live-verify PASS |

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36b-edge-dry-run-endpoint-deploy-preflight
npm run verify:current-active-regression
```

Historical verifier — not in active regression suite (23 verifiers unchanged).
