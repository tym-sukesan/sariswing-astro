# G-20u36e — Gosaki Discography controlled Save auth JWT admin probe UI local verify

**Phase:** `G-20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify`  
**Status:** **complete** — local verify only · **no STG upload / browser RPC / HTTP / SQL**  
**Date:** 2026-07-14  
**Base commit:** `1578cc2`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft.md](./gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft.md)

| Check | Status |
| --- | --- |
| Local verify only | **yes** |
| STG upload | **no** |
| FTP / upload | **no** |
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
| Save enablement | **no** |
| service_role | **not used** |
| JWT / access_token / refresh_token displayed | **no** |
| user_id / email displayed (probe result) | **no** |
| STG public URL reflects this UI | **no** (not reflected yet) |

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthJwtAdminProbeUiLocalVerified: true
phase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify
localVerifyOnly: true
stgUploadExecuted: false
ftpUploadExecuted: false
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
saveEnablementExecuted: false
serviceRoleUsed: false
jwtAccessTokenRefreshTokenDisplayed: false
userIdEmailDisplayedInProbeResult: false
saveArmDecoupledFromProbe: true
stgPublicUrlNotYetReflectingProbeUi: true
readyForFirstControlledSaveExecution: false
recommendedNextPhase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 1. Static checks (PASS)

Sources reviewed (read-only / committed tools-draft):

- `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro`
- `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts`
- `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css`

| # | Check | Result |
| --- | --- | --- |
| 1 | `#gra-admin-probe-btn` present | **PASS** |
| 2 | `#gra-admin-probe-result` shows `adminProbeStatus` / `isAdmin` / `reasonCode` | **PASS** |
| 3 | reasonCode limited to enum below | **PASS** |
| 4 | `client.rpc(G20U36E_ADMIN_PROBE_RPC_NAME)` (`is_admin`) only inside click handler | **PASS** |
| 5 | No automatic RPC on page load | **PASS** |
| 6 | Production guard · staging ref only | **PASS** |
| 7 | Production `vsbvndwuajjhnzpohghh` blocked → `production_ref_blocked` | **PASS** |
| 8 | Target `kmjqppxjdnwwrtaeqjta` required | **PASS** |
| 9 | Probe not wired to Save enablement · `saveEnabled: false` always | **PASS** |
| 10 | No new `operation=save` send in probe | **PASS** |
| 11 | Probe script: no `access_token` / `refresh_token` / Bearer JWT UI | **PASS** |
| 12 | Probe script: no `user.email` / `user.id` / `user_id` UI | **PASS** |
| 13 | Probe script: no `console.log` | **PASS** |
| 14 | RPC errors mapped via `rpcFailed` boolean → `rpc_error` (no raw `error.message`) | **PASS** |
| 15 | No `service_role` in probe path | **PASS** |

### reasonCode enum (verified)

`not_run` · `session_missing` · `rpc_success_true` · `rpc_success_false` · `rpc_error` · `production_ref_blocked` · `unexpected`

### Production guard

| Host | Expected |
| --- | --- |
| URL contains `kmjqppxjdnwwrtaeqjta` | allowed |
| URL contains `vsbvndwuajjhnzpohghh` | **STOP** · `production_ref_blocked` |
| Other / empty | `production_ref_blocked` |

Helpers: `assertG20u36eAdminProbeSupabaseHostSafe` · `buildG20u36eAdminProbeDisplay`.

### Save separation

| Rule | Verified |
| --- | --- |
| Probe PASS does not enable Save buttons | **yes** (finally only re-enables probe btn) |
| Display `saveEnabled` | always `false` |
| `operation=save` send in probe | **absent** |
| Existing Save buttons remain `disabled` | **yes** |

---

## 2. Local build / generate (safe dry-run only)

| Command | Result |
| --- | --- |
| `npm run build:gosaki:staging:dry-run` | **PASS** — dry-run plan only · no convert · no package write · no FTP |
| Dry-run notes | `includeReadOnlyAdmin: true` · `supabaseProjectRef: kmjqppxjdnwwrtaeqjta` · `dryRun: true` |

**Not run:** full convert/package rebuild · STG upload · FTP `--apply` · browser probe click · live RPC/HTTP.

Also: prior tools-draft verifier remains the code-shape gate (`verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft`).

---

## 3. STG not yet reflecting

| Fact | Status |
| --- | --- |
| Tools-draft UI is in git (`1578cc2`) | **yes** |
| STG remote manual-upload package / public URL updated with probe UI | **no** |
| Operator can click probe on live STG today | **no** — package-preflight / rebuild / manual upload still required |

---

## 4. Not executed in this phase

| Item | Status |
| --- | --- |
| STG upload / FTP | **no** |
| Real browser probe button click / RPC | **no** |
| HTTP / SQL create or execute | **no** |
| GRANT / REVOKE / RLS / DB write | **no** |
| Edge impl / `supabase/functions` edit / deploy | **no** |
| operation=save · dryRun HTTP re-send | **no** |
| Save enablement | **no** |
| commit / push | **no** (operator) |
| service_role | **not used** |

---

## 5. Recommended next phase

**`G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight`** — checklist before staging package rebuild / manual upload (still no probe click until preflight + operator approval).

Still blocked: First controlled Save · permission-change SQL · Edge Save · operation=save.

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-plan
npm run verify:current-active-regression
```
