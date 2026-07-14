# G-20u36e — Gosaki Discography controlled Save auth JWT admin probe UI STG readonly probe execution result

**Phase:** `G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result-record`  
**Status:** **complete** — result record only · STG readonly probe execution **PASS** · operator JWT admin **VERIFIED** · **no permission change / Save / DB write**  
**Date:** 2026-07-14  
**STG package sourceCommit:** `724d951f4d64eb5fa03e96d9d97c79da1c91bade`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-stg-login-check-result.md](./gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-stg-login-check-result.md) · [gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight.md](./gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight.md)

| Check | Status |
| --- | --- |
| STG readonly probe execution | **PASS** |
| Operator JWT admin status | **VERIFIED** |
| `public.is_admin()` under operator JWT context | **true** |
| Probe executed | **exactly once** |
| RPC | **read-only** (`client.rpc('is_admin')`) |
| DB write | **no** |
| operation=save | **not sent** · 未送信 |
| Save enablement | **no** · なし |
| Permission change | **no** · なし |
| GRANT / REVOKE | **no** · なし |
| RLS change | **no** · なし |
| Edge implementation / deploy | **no** · なし |
| service_role | **not used** · 不使用 |
| JWT / access_token / refresh_token displayed | **no** · 非表示 |
| user_id / email in probe result | **no** · 非表示 |
| Production changed | **no** · production未変更 |
| First controlled Save | **still not allowed** |
| FTP re-upload (this phase) | **no** |
| SQL created / executed (this phase) | **no** |
| commit / push (this phase) | **no** |

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthJwtAdminProbeUiStgReadonlyProbeExecutionResultRecorded: true
phase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result-record
stgReadonlyProbeExecutionPass: true
operatorJwtAdminStatusVerified: true
publicIsAdminTrueUnderOperatorJwtContext: true
adminProbeStatus: pass
isAdmin: true
reasonCode: rpc_success_true
saveEnabled: false
diagnosticOnly: true
probeExecutedExactlyOnce: true
rpcReadOnly: true
dbWriteExecuted: false
operationSaveSent: false
saveEnablementExecuted: false
permissionChangeExecuted: false
grantRevokeExecuted: false
rlsPolicyChangeExecuted: false
edgeImplementationExecuted: false
edgeDeployExecuted: false
serviceRoleUsed: false
jwtAccessTokenRefreshTokenDisplayed: false
userIdEmailDisplayedInProbeResult: false
productionChanged: false
readyForFirstControlledSaveExecution: false
firstControlledSaveStillNotAllowed: true
authenticatedUpdateGrantStillZero: true
recommendedNextPhase: G-20u36e-controlled-save-permission-change-planning
alternateNextPhase: G-20u36e-controlled-save-authenticated-title-update-rls-planning
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.  
**STG admin:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/`

---

## 1. Probe execution result (operator · exactly once)

Operator was signed in on STG admin, clicked **DB admin probe (read-only)** once.

```json
{
  "adminProbeStatus": "pass",
  "isAdmin": true,
  "reasonCode": "rpc_success_true",
  "saveEnabled": false,
  "diagnosticOnly": true
}
```

| Field | Value |
| --- | --- |
| adminProbeStatus | `pass` |
| isAdmin | `true` |
| reasonCode | `rpc_success_true` |
| saveEnabled | `false` |
| diagnosticOnly | `true` |

**Interpretation:** Under **operator JWT** context, `public.is_admin()` returned **true**. Operator JWT admin status is **VERIFIED**.

JWT / access_token / refresh_token / user_id / email — **not** shown in probe result.

---

## 2. Important judgment

| Item | Status |
| --- | --- |
| Operator JWT → DB admin (`is_admin`) | **confirmed** |
| authenticated UPDATE grant | **still 0** (unchanged) |
| First controlled Save | **still not allowed** |
| Next work | permission change / restrictive RLS / authenticated title UPDATE **planning only** |
| SQL execution now | **not yet** |

Save remained disabled · probe does **not** arm Save · `saveEnabled: false` · `diagnosticOnly: true`.

---

## 3. Not executed in this phase

| Item | Status |
| --- | --- |
| Permission change | **no** |
| GRANT / REVOKE | **no** |
| CREATE / ALTER / DROP POLICY | **no** |
| SQL create / execute | **no** |
| DB write (UPDATE / INSERT / DELETE) | **no** |
| Edge implementation / deploy | **no** |
| operation=save / Save enable | **no** |
| FTP re-upload | **no** |
| service_role | **not used** |
| Production change | **no** |

---

## 4. Recommended next phase

**Primary:** `G-20u36e-controlled-save-permission-change-planning`

**Alternate:** `G-20u36e-controlled-save-authenticated-title-update-rls-planning`

Plan Option A (authenticated UPDATE(title) + restrictive RLS + operator JWT) — **planning only**. No SQL execution / GRANT / RLS apply until an explicit later approval phase.

Still blocked: First controlled Save · `operation=save` · Edge Save arm.

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result
npm run verify:g20u36e-controlled-save-auth-ui-login-blocked-stg-login-check-result
npm run verify:g20u36e-controlled-save-auth-ui-login-blocked-manual-ftp-reupload-result
```
