# G-20u36e — Gosaki Discography controlled Save auth JWT admin probe UI manual FTP upload result

**Phase:** `G-20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result-record`  
**Status:** **complete** — result record only · operator manual FTP done · STG admin probe UI visible (signed-out) · **probe not clicked**  
**Date:** 2026-07-14  
**Package sourceCommit:** `a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe`  
**Prior:** package generate-freshness at HEAD `a92d45d` · [gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep.md](./gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep.md)

| Check | Status |
| --- | --- |
| Manual FTP upload | **done** (operator · FileZilla) |
| Package sourceCommit | `a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe` |
| Remote target | `/cms-kit-staging/gosaki-piano/` |
| Upload source | `public-dist/` **contents** |
| STG admin display confirmation | **PASS** (operator screenshot) |
| Signed-out / 未ログイン | **yes** |
| DB admin probe UI visible | **yes** |
| Probe button clicked | **no** |
| RPC executed | **no** |
| HTTP executed (this phase) | **no** |
| SQL executed | **no** |
| DB write | **no** |
| GRANT / REVOKE | **no** |
| RLS change | **no** |
| Edge implementation / deploy | **no** |
| operation=save sent | **no** |
| Save enablement | **no** (Save still disabled) |
| JWT / access_token / refresh_token in probe result | **no** |
| user_id / email in probe result | **no** |
| service_role | **not used** |
| Production changed | **no** |
| FTP re-upload (this phase) | **no** |
| commit / push (this phase) | **no** (operator) |

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthJwtAdminProbeUiManualFtpUploadResultRecorded: true
phase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result-record
manualFtpUploadExecutedByOperator: true
packageSourceCommit: a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe
stgAdminDisplayConfirmed: true
stgAdminDisplayPass: true
signedOutStateConfirmed: true
dbAdminProbeUiVisible: true
adminProbeStatus: not_run
isAdmin: null
reasonCode: not_run
saveEnabled: false
diagnosticOnly: true
probeButtonClicked: false
rpcExecuted: false
httpExecuted: false
sqlExecuted: false
dbWriteExecuted: false
operationSaveSent: false
saveStillDisabled: true
jwtAccessTokenUserIdEmailDisplayedInProbeResult: false
serviceRoleUsed: false
productionChanged: false
readyForFirstControlledSaveExecution: false
recommendedNextPhase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-ready-check
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 1. Upload summary

| Item | Value |
| --- | --- |
| Method | Operator **manual FileZilla** (or equivalent) |
| Local source | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` **contents** |
| Remote | `/cms-kit-staging/gosaki-piano/` |
| Package `sourceCommit` | `a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe` |
| Cursor / CLI FTP / mirror / delete | **not used** |
| Production path | **not targeted** |

---

## 2. STG admin display confirmation (signed-out · screenshot)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/`

| Observation | Result |
| --- | --- |
| STG admin page loads with probe section | **PASS** |
| Auth state | **未ログイン** (signed out) |
| Section title | **DB admin probe (read-only)** visible |
| `#gra-admin-probe-btn` present | **yes** (not clicked) |
| Probe result panel | idle defaults below |

### Probe result values (idle · not_run)

| Field | Value |
| --- | --- |
| `adminProbeStatus` | `not_run` |
| `isAdmin` | `null` |
| `reasonCode` | `not_run` |
| `saveEnabled` | `false` |
| `diagnosticOnly` | `true` |

### Must not show (confirmed absent in probe result)

- access_token · refresh_token · JWT  
- user_id · email  
- service_role  

### Save

Save buttons remain **disabled** · probe display `saveEnabled: false` · no Save arm.

---

## 3. Not executed in this phase

| Item | Status |
| --- | --- |
| Probe button click | **no** |
| `rpc('is_admin')` / any RPC | **no** |
| HTTP (beyond operator viewing admin page) | **no** intentional probe/HTTP client from Cursor |
| SQL / GRANT / RLS / DB write | **no** |
| Edge implement / deploy | **no** |
| operation=save | **not sent** |
| Save enablement | **no** |
| FTP re-upload | **no** |
| Production change | **no** |
| service_role | **not used** |

---

## 4. Recommended next phase

| Order | Phase | Why |
| --- | --- | --- |
| **1** | **`G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-ready-check`** | Confirm staging Auth sign-in ready before probe click |
| Alt | `G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight` | Checklist before one manual STG `is_admin` probe click |

Still blocked until later approved phases: probe click · First controlled Save · permission-change SQL · Edge Save · operation=save.

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify
```
