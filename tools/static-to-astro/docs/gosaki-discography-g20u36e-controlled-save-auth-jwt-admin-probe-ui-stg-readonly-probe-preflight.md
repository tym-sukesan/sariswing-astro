# G-20u36e — Gosaki Discography controlled Save auth JWT admin probe UI STG readonly probe preflight

**Phase:** `G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight`  
**Status:** **complete** — preflight only · **probe button not clicked** · **no RPC / HTTP / SQL execution**  
**Date:** 2026-07-14  
**Base commit:** `98681de` (upload-result docs; STG package still `a92d45d…`)  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result.md](./gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result.md)

| Check | Status |
| --- | --- |
| Preflight only | **yes** |
| Probe button clicked | **no** |
| RPC executed | **no** |
| HTTP executed | **no** |
| SQL created | **no** |
| SQL executed | **no** |
| DB write | **no** |
| GRANT / REVOKE | **no** |
| RLS policy change | **no** |
| Edge implementation | **no** |
| Edge deploy | **no** |
| operation=save sent | **no** |
| Save enablement | **no** |
| FTP re-upload | **no** |
| service_role | **not used** |
| JWT / access_token / refresh_token displayed | **no** |
| user_id / email displayed | **no** |

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthJwtAdminProbeUiStgReadonlyProbePreflightPrepared: true
phase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight
preflightOnly: true
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
ftpReuploadExecuted: false
serviceRoleUsed: false
jwtAccessTokenRefreshTokenDisplayed: false
userIdEmailDisplayed: false
readyForFirstControlledSaveExecution: false
recommendedNextPhase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.  
**STG package sourceCommit (uploaded):** `a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe`  
**Repo HEAD (this preflight base):** `98681de` — docs/verifier only; **does not invalidate** STG probe UI display.

**STG admin URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/`

---

## 1. Purpose

Confirm under **operator JWT session** whether DB `public.is_admin()` returns **true**.

| Item | Detail |
| --- | --- |
| DB meaning | row in `public.admin_users` with `user_id = auth.uid()` and `role = 'admin'` |
| Client call | `client.rpc('is_admin')` — read-only |
| Nature | **Diagnostic only** |
| Does **not** | enable Save · run GRANT/RLS · send `operation=save` · First controlled Save |

Signed-out STG display already **PASS** (`not_run` / `isAdmin=null` / `saveEnabled=false`). This preflight prepares **one** signed-in probe click in the **next** phase.

---

## 2. Pre-login checks (operator browser)

Before sign-in, confirm:

| # | Check |
| --- | --- |
| 1 | URL is `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/` |
| 2 | **Not** production host / production path |
| 3 | STG admin page loads |
| 4 | Idle probe: `adminProbeStatus = not_run` |
| 5 | Save buttons remain **disabled** |
| 6 | No `operation=save` action path |
| 7 | Only target: **DB admin probe (read-only)** (`#gra-admin-probe-btn`) |

---

## 3. Post-login checks (operator browser · still no probe click in this phase)

After staging Auth sign-in (execution phase), confirm before clicking probe:

| # | Check |
| --- | --- |
| 1 | Supabase Auth shows **configured** |
| 2 | Login **succeeds** |
| 3 | **DB admin probe** button is usable |
| 4 | Save buttons stay **disabled** |
| 5 | Probe result / UI does **not** show JWT · access_token · user_id · email |

*(Auth status email for sign-in UX may exist outside probe result — do **not** paste email to ChatGPT.)*

---

## 4. Allowed operation (execution phase only · not this preflight)

| Rule | Detail |
| --- | --- |
| Action | Click **DB admin probe (read-only)** **once** |
| Call | `rpc('is_admin')` read-only diagnostic |
| Record | Result JSON / panel fields only (see §6) |
| Do not | re-click without a new phase · click Save · send `operation=save` · open production |

**This preflight phase:** probe button **not** clicked.

---

## 5. Expected outcomes (after one click · next phase)

### PASS

| Field | Value |
| --- | --- |
| `adminProbeStatus` | `pass` |
| `isAdmin` | `true` |
| `reasonCode` | `rpc_success_true` |
| `saveEnabled` | `false` |
| `diagnosticOnly` | `true` |

PASS does **not** authorize First controlled Save / permission change / Edge Save.

### FAIL (safe)

| Field | Value |
| --- | --- |
| `adminProbeStatus` | `fail` |
| `isAdmin` | `false` |
| `reasonCode` | `rpc_success_false` |

Likely: operator missing `admin_users` row with `role='admin'`. **Enrollment SQL = separate phase.** Do not invent registration SQL in execution.

### ERROR

| Field | Value |
| --- | --- |
| `adminProbeStatus` | `error` |
| `reasonCode` | `rpc_error` or `unexpected` |

Follow-up: RPC EXECUTE / client / PostgREST exposure — separate phase.

### STOP

| Condition |
| --- |
| `reasonCode = production_ref_blocked` |
| Save became enabled |
| Evidence of `operation=save` sent |
| JWT / access_token / user_id / email shown in probe result |
| Possible DB write side effect |
| Production URL used |
| service_role required |

---

## 6. What to paste to ChatGPT vs never paste

### OK to paste

- `adminProbeStatus` · `isAdmin` · `reasonCode` · `saveEnabled` · `diagnosticOnly`
- Screenshot of probe **result panel** (with tokens/PII not visible)
- Short verdict: PASS / FAIL(safe) / ERROR / STOP

### Never paste

- JWT · access_token · refresh_token  
- user_id · email · password  
- service_role  
- Contents of `auth.users` / `admin_users`  
- Raw Network tab Authorization headers  

---

## 7. Not executed in this phase

| Item | Status |
| --- | --- |
| Probe button | **not clicked** |
| RPC / HTTP / SQL | **no** |
| DB write / GRANT / RLS | **no** |
| Edge / deploy | **no** |
| operation=save / Save enable | **no** |
| FTP re-upload | **no** |
| service_role / token display | **no** |

---

## 8. Recommended next phase

**`G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution`**

1. Commit/push this preflight  
2. Operator opens STG admin URL (staging only)  
3. Sign in with staging Auth  
4. Confirm Save still disabled · no secrets in probe UI  
5. Click **DB admin probe (read-only)** **once**  
6. Paste only safe fields + optional screenshot to ChatGPT for result-record phase  

Still blocked: First controlled Save · permission-change SQL · Edge Save · operation=save.

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify
```
