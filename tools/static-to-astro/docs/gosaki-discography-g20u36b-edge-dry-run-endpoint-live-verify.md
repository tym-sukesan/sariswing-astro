# G-20u36b — Gosaki Discography Edge dry-run endpoint live verify

**Phase:** `G-20u36b-edge-dry-run-endpoint-live-verify`  
**Status:** **complete** — live HTTP verify PASS · **no re-deploy / SQL / Save enablement**  
**Date:** 2026-07-12  
**Base commit:** `7fe788b`  
**Prior:** G-20u36b deploy-manual-result · root-placement · deploy-preflight-result READY

| Check | Status |
| --- | --- |
| Live HTTP verify | **PASS** |
| Target URL | staging only |
| Auth | Bearer `PUBLIC_SUPABASE_ANON_KEY` (value not logged) |
| Production project used | **no** — **STOP** |
| Write flags (all cases) | **false** |
| service_role exposed | **no** |
| DB write | **no** |
| Save UI | **disabled** |
| Save enabled | **no** |
| Admin fetch POST added | **no** |
| Edge re-deploy by Cursor | **no** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunEndpointLiveVerified: true
phase: G-20u36b-edge-dry-run-endpoint-live-verify
liveVerifyExecuted: true
liveVerifySummary: PASS
authMethod: bearer_public_supabase_anon_key
authSecretValuesLogged: false
serviceRoleUsed: false
productionProjectUsed: false
edgeFunctionRedeployed: false
saveEnabled: false
adminFetchPostAdded: false
discographySaveDbWriteExecuted: false
cursorDbWriteExecuted: false
cursorSqlExecuted: false
proceedToG20u36cAdminFetchPost: true
proceedToSave: false
```

---

## Target

| Item | Value |
| --- | --- |
| **URL** | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run` |
| **Project** | `static-to-astro-cms-staging` |
| **Project ref** | `kmjqppxjdnwwrtaeqjta` |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **not used** |
| **Function** | `gosaki-discography-save-dry-run` |

---

## Auth

| Item | Value |
| --- | --- |
| **Method** | `Authorization: Bearer <PUBLIC_SUPABASE_ANON_KEY>` |
| **Key source** | repo `.env` / `.env.local` — **presence only · values not logged** |
| **SUPABASE_SERVICE_ROLE_KEY** | **not used** · **not referenced** |
| **Unauthenticated POST** | **401** — `UNAUTHORIZED_NO_AUTH_HEADER` (expected) |

---

## Executed cases (sanitized)

| Case | Status | ok | wouldWrite | write flags | Category / note |
| --- | --- | --- | --- | --- | --- |
| **OPTIONS** | 200 | — | — | — | CORS preflight OK · `allow-methods=POST, OPTIONS` |
| **valid dryRun** | 200 | true | true | all false | dryRun accepted · small track change payload |
| **no-change dryRun** | 200 | true | true | all false | no track addition · **schema-only baseline** · wouldWrite true without DB snapshot |
| **operation=save** | 400 | false | — | all false | save rejected |
| **wrong siteSlug** | 400 | false | — | all false | siteSlug rejected |
| **empty approvalId** | 400 | false | — | all false | approvalId rejected |
| **save approval ID** | 400 | false | — | all false | save approvalId rejected |
| **unauthenticated probe** | 401 | — | — | — | Bearer anon required |

### Write flags (all POST cases)

| Flag | Value |
| --- | --- |
| `didWrite` | **false** |
| `dbWrite` | **false** |
| `networkWrite` | **false** |
| `saveEnabled` | **false** |

### Response safety

| Check | Result |
| --- | --- |
| `service_role` in body | **absent** |
| `SUPABASE_SERVICE_ROLE_KEY` in body | **absent** |
| `backupToken` | **null** |
| `readBack` | **null** |
| JWT / secret-like strings logged | **no** |

---

## Notes

- **no-change dryRun `wouldWrite=true`:** expected with current handler — `SUPABASE_SERVICE_ROLE_CONNECTED=false` · no DB baseline snapshot · release metadata compared against empty snapshot.
- **401/403 on authenticated cases:** none — auth issue would block next phase (not observed).

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Edge re-deploy / Supabase CLI deploy | **not executed** |
| `supabase/functions/**` edit | **not executed** |
| SQL mutation | **not executed** |
| DB write | **not executed** |
| Save button enablement | **not executed** · Save **disabled** |
| Admin Discography fetch POST | **not added** |

---

## Next phase

| Phase | Scope |
| --- | --- |
| **G-20u36c** | Admin UI dry-run fetch POST wiring — **no Save** |

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36b-edge-dry-run-endpoint-live-verify
npm run verify:current-active-regression
```

Historical verifier — not in active regression suite (23 verifiers unchanged).
