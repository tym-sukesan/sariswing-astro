# G-20u36e — Gosaki Discography controlled Save auth UI login blocked tools draft

**Phase:** `G-20u36e-controlled-save-auth-ui-login-blocked-tools-draft`  
**Status:** **complete** — tools draft only · **no package / FTP / browser / probe / RPC / Save**  
**Date:** 2026-07-14  
**Base commit:** `3dabb88`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-diagnosis-plan.md](./gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-diagnosis-plan.md)

| Check | Status |
| --- | --- |
| Tools draft only | **yes** |
| CSS enabled-state fix | **yes** |
| Auth init hardening | **yes** |
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
| Save separation | **confirmed** (probe/login never arm Save) |
| service_role | **not used** (`serviceRoleUsed: false`) |
| JWT / access_token / refresh_token displayed | **no** |
| user_id / email in probe result | **no** |
| Production changed | **no** · production未変更 |

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthUiLoginBlockedToolsDrafted: true
phase: G-20u36e-controlled-save-auth-ui-login-blocked-tools-draft
toolsDraftOnly: true
cssEnabledStateFixApplied: true
authInitHardeningApplied: true
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
readyForStgReadonlyProbeExecution: false
recommendedNextPhase: G-20u36e-controlled-save-auth-ui-login-blocked-local-verify
```

**Staging ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production STOP:** `vsbvndwuajjhnzpohghh`.  
**STG package sourceCommit (still old until rebuild+upload):** `a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe`

---

## Changed files

| File | Change |
| --- | --- |
| `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css` | `:not(:disabled)` enabled styles · keep disabled grey/`not-allowed` |
| `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro` | Auth IIFE harden · YouTube DOM optional · autofill re-eval · probe try/catch |
| This doc + verifier + `package.json` + AI context | tools-draft bookkeeping |
| Prior verifiers (diagnosis / login-blocked-result) | template-dirty check soft-NOTE when tools-draft gate present |

`gosaki-staging-read-only-admin.ts` — **not** changed (Save helpers / probe helpers untouched for this slice).

---

## 1. CSS enabled-state fix

**Problem (diagnosis):** `.gosaki-read-only-admin__btn` always used muted grey + `cursor: not-allowed`, so **enabled** login/probe/primary buttons **looked disabled**.

**Fix:**

```css
.gosaki-read-only-admin__btn:not(:disabled) { ... cursor: pointer; }
.gosaki-read-only-admin__btn--primary:not(:disabled) { ... cursor: pointer; }
```

**Kept:** `:disabled` / `.btn--primary:disabled` muted styles (`cursor: not-allowed`).

---

## 2. Auth init hardening

| Change | Detail |
| --- | --- |
| Early return | Only `if (!body) return` — **not** gated on YouTube dry-run DOM |
| YouTube wiring | Wrapped in `if (btn && input && result)` |
| `updateLoginButton` | Enable = `authConfigured && !signedIn` only · called after config read |
| Listeners | `input` + `change` + `keyup` |
| Autofill re-eval | `setTimeout(updateLoginButton, 0/250/1000)` |
| Login error UI | Generic message — **no** raw `error.message` dump |
| Probe init | `try/catch` around `wireG20u36eAdminProbe` — failure must not stop page |

---

## 3. Save separation / secrets

| Item | Status |
| --- | --- |
| Save arming from login/probe | **none** |
| `saveEnabled: true` new wiring | **none** |
| New `operation=save` send | **none** |
| Probe result shows JWT / token / user_id / email | **no** |
| `console.log` of token / user_id / email | **no** |
| `service_role` | **not used** |

---

## 4. Not executed in this phase

Package · output/manual-upload · FTP · browser · probe click · RPC · HTTP · SQL · DB write · GRANT/RLS · Edge · operation=save · Save enable · production.

---

## 5. Recommended next phase

**`G-20u36e-controlled-save-auth-ui-login-blocked-local-verify`**

Static + local dry-run build checks that CSS/auth draft is present before any package regen / FTP / STG login retry.

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-ui-login-blocked-tools-draft
npm run verify:g20u36e-controlled-save-auth-ui-login-blocked-diagnosis-plan
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result
npm run verify:current-active-regression
```
