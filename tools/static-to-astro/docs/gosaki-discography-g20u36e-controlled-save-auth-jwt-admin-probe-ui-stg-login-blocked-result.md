# G-20u36e — Gosaki Discography controlled Save auth JWT admin probe UI STG login blocked result

**Phase:** `G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result-record`  
**Status:** **complete** — result record only · STG login **blocked** (operator screenshot) · **no UI fix** · **probe not clicked**  
**Date:** 2026-07-14  
**Repo HEAD (record base):** `d2915d0`  
**STG package sourceCommit:** `a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight.md](./gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight.md)

| Check | Status |
| --- | --- |
| STG login blocked | **yes** (operator observation) |
| 未ログイン display | **yes** |
| Login button appears disabled | **yes** |
| Logout button disabled | **yes** |
| DB admin probe disabled | **yes** |
| Probe button clicked | **no** |
| RPC executed | **no** |
| HTTP executed | **no** |
| SQL executed | **no** |
| DB write | **no** |
| operation=save sent | **no** |
| Save enablement | **no** (Save still disabled) |
| UI code fix (this phase) | **no** |
| service_role | **not used** |
| JWT / access_token / refresh_token displayed | **no** |
| user_id / email in probe result | **no** |
| Production changed | **no** |

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthJwtAdminProbeUiStgLoginBlockedResultRecorded: true
phase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result-record
stgLoginBlocked: true
signedOutDisplayConfirmed: true
loginButtonAppearsDisabled: true
logoutDisabled: true
dbAdminProbeDisabled: true
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
uiFixExecuted: false
serviceRoleUsed: false
jwtAccessTokenRefreshTokenDisplayed: false
userIdEmailDisplayedInProbeResult: false
productionChanged: false
readyForStgReadonlyProbeExecution: false
recommendedNextPhase: G-20u36e-controlled-save-auth-ui-login-blocked-diagnosis-planning
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.  
**STG admin URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/`

---

## 1. Situation judgment

Operator attempted STG Auth sign-in **before** readonly probe execution.

| Observation (screenshot) | Value |
| --- | --- |
| Auth status copy | **未ログイン** |
| Supabase Auth | **configured** (UI copy) |
| Email / password fields | values present (do **not** record values) |
| Login button | appears **disabled** |
| Logout button | **disabled** |
| DB admin probe button | **disabled** |
| Probe panel | idle defaults below |
| Verdict | **STG login blocked** — cannot proceed to signed-in `rpc('is_admin')` probe until login path works |

### Probe panel (unchanged idle)

| Field | Value |
| --- | --- |
| `adminProbeStatus` | `not_run` |
| `isAdmin` | `null` |
| `reasonCode` | `not_run` |
| `saveEnabled` | `false` |
| `diagnosticOnly` | `true` |

**Impact:** Readonly probe **execution** is **blocked** by login UX. This is **not** a probe RPC failure (probe was never clicked).

---

## 2. Not executed in this phase

| Item | Status |
| --- | --- |
| UI fix / template change | **no** |
| Probe button click | **no** |
| RPC / HTTP / SQL | **no** |
| DB write / GRANT / RLS | **no** |
| Edge / deploy | **no** |
| operation=save / Save enable | **no** |
| FTP re-upload | **no** |
| console error collection | **deferred** to diagnosis phase |
| service_role / token display | **no** |

---

## 3. Next-phase diagnosis candidates (planning only · no fix here)

Recommended next: **`G-20u36e-controlled-save-auth-ui-login-blocked-diagnosis-planning`**

Investigate (read-only / planning — no STG click required for planning):

| # | Candidate |
| --- | --- |
| 1 | Login button `disabled` conditions (`updateLoginButton` / `supabaseAuthConfigured` / `signedIn`) |
| 2 | Whether `input` events / form validation actually fire after autofill |
| 3 | Auth config UI says configured but runtime client / handler never arms login |
| 4 | `#gra-auth` DOM id duplication / wrong element binding |
| 5 | Side effect from adding admin probe UI next to YouTube dry-run auth IIFE |
| 6 | Early `return` in shared auth IIFE if YouTube dry-run DOM missing (`gra-youtube-dry-run-btn` etc.) — would skip all auth wiring |
| 7 | `getSession()` result incorrectly setting UI signed-in / button state |
| 8 | Login enable/disable control race (refreshAuthStatus vs input listeners) |
| 9 | Browser console errors — **separate follow-up** observation, not this record |

Do **not** apply UI fixes in this result-record phase.

---

## 4. Recommended next phase

**`G-20u36e-controlled-save-auth-ui-login-blocked-diagnosis-planning`**

Plan how to confirm root cause (static code review + optional STG DevTools checklist) without clicking probe, without Save, without secrets dump.

Readonly probe execution remains **deferred** until login works.

Still blocked: First controlled Save · permission-change SQL · Edge Save · operation=save.

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result
```
