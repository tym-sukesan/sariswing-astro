# G-20u36e — Gosaki Discography controlled Save auth JWT admin probe UI tools draft

**Phase:** `G-20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft`  
**Status:** **complete** — UI tools draft only · **no browser RPC / HTTP / SQL execution**  
**Date:** 2026-07-14  
**Base commit:** `e915905`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-plan.md](./gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-plan.md)

| Check | Status |
| --- | --- |
| UI tools draft | **yes** (this file + templates) |
| UI implementation draft only | **yes** |
| Real browser RPC execution | **no** |
| HTTP execution | **no** |
| SQL created | **no** |
| SQL executed | **no** |
| GRANT / REVOKE | **no** |
| RLS policy change | **no** |
| DB write | **no** |
| Edge implementation | **no** |
| supabase/functions edit | **no** |
| Edge deploy | **no** |
| operation=save sent | **no** |
| dryRun HTTP re-sent | **no** |
| FTP / upload | **no** |
| service_role | **not used** |
| JWT / access_token / refresh_token displayed | **no** |
| user_id / email displayed (probe result) | **no** |
| Probe connected to Save enabled | **no** |

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthJwtAdminProbeUiToolsDrafted: true
phase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft
uiToolsDraftOnly: true
rpcBrowserExecuted: false
httpExecuted: false
sqlCreated: false
sqlExecuted: false
grantRevokeExecuted: false
rlsPolicyChangeExecuted: false
dbWriteExecuted: false
edgeImplementationExecuted: false
supabaseFunctionsEdited: false
edgeDeployExecuted: false
operationSaveSent: false
dryRunHttpResent: false
ftpUploadExecuted: false
serviceRoleUsed: false
jwtAccessTokenRefreshTokenDisplayed: false
userIdEmailDisplayedInProbeResult: false
saveArmDecoupledFromProbe: true
readyForFirstControlledSaveExecution: false
recommendedNextPhase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 1. Changed files

| Path | Role |
| --- | --- |
| `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts` | Probe helpers · reasonCode · host guard · display formatter |
| `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro` | `#gra-auth` probe UI · manual button · `client.rpc('is_admin')` wiring |
| `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css` | Probe panel spacing |
| This doc | Phase record |
| `scripts/verify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft.mjs` | Verifier |
| `package.json` | `verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft` |
| `docs/ai/00-current-state.md` · `03-next-actions.md` · `handoff-to-chatgpt.md` | Minimal AI context |

**Not changed:** `src/**` · `public/**` · `supabase/functions/**`

---

## 2. UI probe specification

| Item | Spec |
| --- | --- |
| Placement | Staging Auth section `#gra-auth` · below login form |
| Label | **DB admin probe (read-only)** |
| Control | Manual button `#gra-admin-probe-btn` only |
| Auto-run | **none** |
| Call | `client.rpc('is_admin')` via existing session (`getSession`) |
| Result panel | `#gra-admin-probe-result` |
| Copy | Diagnostic only · DB `is_admin()` via `admin_users` · **not** mock allowlist · Save remains disabled |

### Display fields (only)

| Field | Values |
| --- | --- |
| `adminProbeStatus` | `not_run` · `running` · `pass` · `fail` · `error` |
| `isAdmin` | `true` · `false` · `null` |
| `reasonCode` | see below |
| `saveEnabled` | always **`false`** |
| `diagnosticOnly` | always **`true`** |

### reasonCode

| Code | Meaning |
| --- | --- |
| `not_run` | Idle / not finished |
| `session_missing` | No authenticated session |
| `rpc_success_true` | `rpc('is_admin')` → true |
| `rpc_success_false` | → false |
| `rpc_error` | RPC failed (message not shown) |
| `production_ref_blocked` | Non-staging / production host STOP |
| `unexpected` | Malformed response |

### Must not display / log

- access_token · refresh_token · JWT  
- user_id · email (probe result)  
- service_role · `admin_users` / `auth.users` contents  
- Raw RPC `error.message` (mapped to `rpc_error` only)  
- `console.log` of secrets — **none added**

---

## 3. Production guard

| Rule | Behavior |
| --- | --- |
| Staging ref required | `PUBLIC_SUPABASE_URL` / build URL must include `kmjqppxjdnwwrtaeqjta` |
| Production STOP | `vsbvndwuajjhnzpohghh` → `reasonCode: production_ref_blocked` · status `error` |
| Other non-staging | also `production_ref_blocked` |
| Tokens | never shown on block |

Helpers: `assertG20u36eAdminProbeSupabaseHostSafe` · `resolveG20u36eAdminProbeHostBlockReason` · `buildG20u36eAdminProbeDisplay`.

---

## 4. Save separation

| Rule | Status |
| --- | --- |
| Probe PASS enables Save | **no** |
| `saveEnabled` in probe display | always `false` |
| `operation=save` send code added | **no** |
| Permission change / GRANT / RLS | **not** triggered by probe |
| Existing Save buttons | remain disabled |

---

## 5. Helper API (tools draft)

```txt
G20U36E_ADMIN_PROBE_UI_TOOLS_DRAFT_PHASE
G20U36E_ADMIN_PROBE_RPC_NAME = "is_admin"
createG20u36eAdminProbeIdleDisplay()
createG20u36eAdminProbeRunningDisplay()
assertG20u36eAdminProbeSupabaseHostSafe(url)
buildG20u36eAdminProbeDisplay({ supabaseUrl, sessionPresent, rpcData?, rpcFailed? })
formatG20u36eAdminProbeDisplay(display)
```

Caller passes **boolean** `sessionPresent` only — never tokens / user / email into the mapper.

---

## 6. Not executed in this phase

| Item | Status |
| --- | --- |
| Real browser RPC | **no** |
| HTTP | **no** |
| SQL create / execute | **no** |
| GRANT / REVOKE / RLS change | **no** |
| DB write | **no** |
| Edge impl / `supabase/functions` edit / deploy | **no** |
| operation=save · dryRun HTTP re-send | **no** |
| FTP / upload | **no** |
| commit / push | **no** (operator) |
| service_role | **not used** |

---

## 7. Recommended next phase

| Order | Phase |
| --- | --- |
| **1** | **`G-20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify`** — static/local checks before STG click |
| Alt | `G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight` — package rebuild checklist before STG |

Still blocked: First controlled Save · permission-change SQL · Edge Save · operation=save.

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-plan
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-plan
npm run verify:current-active-regression
```
