# G-20u36e — Gosaki Discography controlled Save auth UI login blocked local verify

**Phase:** `G-20u36e-controlled-save-auth-ui-login-blocked-local-verify`  
**Status:** **complete** — local verify only · **no package / FTP / browser / probe / RPC / Save**  
**Date:** 2026-07-14  
**Base commit:** `767f29c`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-tools-draft.md](./gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-tools-draft.md)

| Check | Status |
| --- | --- |
| Local verify only | **yes** |
| Package generation | **no** (`packageGenerated: false`) |
| output/manual-upload update | **no** (`outputManualUploadUpdated: false`) |
| FTP re-upload | **no** (`ftpReuploadExecuted: false`) |
| Browser operation | **no** (`browserOperationExecuted: false`) |
| Probe button clicked | **no** (`probeButtonClicked: false`) |
| RPC executed | **no** (`rpcExecuted: false`) |
| HTTP executed | **no** (`httpExecuted: false`) |
| SQL created | **no** (`sqlCreated: false`) |
| SQL executed | **no** (`sqlExecuted: false`) |
| DB write | **no** (`dbWriteExecuted: false`) |
| GRANT / REVOKE | **no** (`grantRevokeExecuted: false`) |
| RLS change | **no** (`rlsPolicyChangeExecuted: false`) |
| Edge implementation | **no** (`edgeImplementationExecuted: false`) |
| Edge deploy | **no** (`edgeDeployExecuted: false`) |
| operation=save | **not sent** (`operationSaveSent: false`) |
| Save enablement | **no** (`saveEnablementExecuted: false`) |
| Save separation | **confirmed** |
| service_role | **not used** (`serviceRoleUsed: false`) |
| JWT / access_token / refresh_token displayed | **no** |
| user_id / email in probe result | **no** |
| Production changed | **no** · production未変更 |
| STG reflects login-button fix | **no** (STG未反映 · package sourceCommit still `a92d45d…`) |

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthUiLoginBlockedLocalVerified: true
phase: G-20u36e-controlled-save-auth-ui-login-blocked-local-verify
localVerifyOnly: true
packageGenerated: false
outputManualUploadUpdated: false
ftpReuploadExecuted: false
browserOperationExecuted: false
probeButtonClicked: false
rpcExecuted: false
httpExecuted: false
sqlCreated: false
sqlExecuted: false
dbWriteExecuted: false
grantRevokeExecuted: false
rlsPolicyChangeExecuted: false
edgeImplementationExecuted: false
edgeDeployExecuted: false
operationSaveSent: false
saveEnablementExecuted: false
saveSeparationConfirmed: true
serviceRoleUsed: false
jwtAccessTokenRefreshTokenDisplayed: false
userIdEmailDisplayedInProbeResult: false
productionChanged: false
stgLoginButtonFixNotYetReflected: true
readyForStgReadonlyProbeExecution: false
recommendedNextPhase: G-20u36e-controlled-save-auth-ui-login-blocked-package-generate-freshness
```

**Staging ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production STOP:** `vsbvndwuajjhnzpohghh`.  
**STG package sourceCommit (old):** `a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe` — login-button fix **not** on STG yet.

---

## 1. CSS confirmation (PASS)

Source: `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css`

| # | Check | Result |
| --- | --- | --- |
| 1 | `.gosaki-read-only-admin__btn:not(:disabled)` present | **PASS** |
| 2 | Enabled uses `cursor: pointer` | **PASS** |
| 3 | `.gosaki-read-only-admin__btn--primary:not(:disabled)` present (dark slate, not muted) | **PASS** |
| 4 | Disabled retained: grey + `cursor: not-allowed` | **PASS** |
| 5 | Primary `:disabled` keeps muted / not-allowed | **PASS** |

---

## 2. Auth init confirmation (PASS)

Source: `GosakiStagingReadOnlyAdminPage.astro` inline auth IIFE + probe module

| # | Check | Result |
| --- | --- | --- |
| 1 | `updateLoginButton()` after auth config read | **PASS** |
| 2 | `input` / `change` / `keyup` listeners | **PASS** |
| 3 | Autofill re-eval `setTimeout(..., 0/250/1000)` | **PASS** |
| 4 | Enable = `!supabaseAuthConfigured \|\| signedIn` → disable; else enable | **PASS** |
| 5 | Early return body-only (`if (!body) return`) — not YouTube-gated | **PASS** |
| 6 | YouTube wiring behind `if (btn && input && result)` | **PASS** |
| 7 | Probe init `try/catch` — “must never stop auth” | **PASS** |

---

## 3. Save separation / secrets (PASS)

| # | Check | Result |
| --- | --- | --- |
| 1 | No new `operation: "save"` send in auth/probe scripts | **PASS** |
| 2 | No `saveEnabled: true` wiring from probe | **PASS** (`saveEnabled: false` typed) |
| 3 | Probe PASS does not arm Save | **PASS** |
| 4 | Probe formatter: status / isAdmin / reasonCode only | **PASS** |
| 5 | No `console.log` of token / user_id / email in auth/probe | **PASS** |
| 6 | No `service_role` in auth/probe scripts | **PASS** |
| 7 | `supabase/functions/**` unmodified in this phase | **PASS** |
| 8 | `output/manual-upload/**` unmodified in this phase | **PASS** |

---

## 4. Local build / dry-run (PASS)

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run build:gosaki:staging:dry-run
```

| Item | Result |
| --- | --- |
| Command | `build:gosaki:staging:dry-run` |
| Outcome | **DRY-RUN PASS** |
| Wrote package / convert / FTP | **no** (plan only) |
| External HTTP / RPC / SQL | **no** |

---

## 5. STG未反映

| Item | Value |
| --- | --- |
| Repo HEAD | `767f29c` (tools-draft committed) |
| STG package sourceCommit | `a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe` |
| Login-button CSS/auth fix on STG | **not yet** |
| Next needed | package regenerate → freshness → manual FTP |

---

## 6. Not executed in this phase

Package · output/manual-upload · FTP · browser · probe click · RPC · HTTP · SQL · DB write · GRANT/RLS · Edge · operation=save · Save enable · production.

---

## 7. Recommended next phase

**`G-20u36e-controlled-save-auth-ui-login-blocked-package-generate-freshness`**

Regenerate staging package at current HEAD so login-button fix can be manually uploaded (FTP apply still suspended — manual FileZilla only).

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-ui-login-blocked-local-verify
npm run verify:g20u36e-controlled-save-auth-ui-login-blocked-tools-draft
npm run verify:g20u36e-controlled-save-auth-ui-login-blocked-diagnosis-plan
npm run verify:current-active-regression
```
