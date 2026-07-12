# G-20u36c — Gosaki Discography admin dry-run fetch POST wiring

**Phase:** `G-20u36c-admin-discography-dry-run-fetch-post-wiring`  
**Status:** **complete** — admin UI fetch POST wired · **Save still disabled**  
**Date:** 2026-07-12  
**Base commit:** `4e048d4`  
**Prior:** G-20u36b live verify PASS

| Check | Status |
| --- | --- |
| Admin fetch POST wired | **yes** |
| Save enabled | **no** — **disabled** |
| operation | **dryRun only** (fixed) |
| operation=save sent | **no** |
| DB write | **no** |
| service_role used | **no** |
| Edge re-deploy | **no** |
| FTP / package upload | **no** |

---

## Gates

```txt
gosakiDiscographyAdminDryRunFetchPostWired: true
phase: G-20u36c-admin-discography-dry-run-fetch-post-wiring
saveEnabled: false
operation: dryRun only
productionProjectUsed: false
serviceRoleUsed: false
discographySaveDbWriteExecuted: false
cursorDbWriteExecuted: false
cursorSqlExecuted: false
edgeFunctionRedeployed: false
ftpDeployExecuted: false
proceedToStgPackageRebuild: true
proceedToSave: false
```

---

## Endpoint target

| Item | Value |
| --- | --- |
| **URL** | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run` |
| **Project ref** | `kmjqppxjdnwwrtaeqjta` (staging) |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **not used** |
| **Auth** | `Authorization: Bearer <PUBLIC_SUPABASE_ANON_KEY>` + `apikey` (values not logged) |
| **siteSlug** | `gosaki-piano` (fixed) |
| **approvalId** | `G-20u31-gosaki-discography-save-dry-run-endpoint` |

---

## Admin UI changes

| File | Change |
| --- | --- |
| `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts` | Endpoint resolver · payload builder · response sanitizer |
| `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro` | Endpoint dry-run button + fetch POST · Save buttons remain disabled |

### UI safety copy

- **Dry-run only**
- **No DB write**
- **Save is still disabled**
- **This checks the request and endpoint response only**

### Response display (sanitized)

- `httpStatus`, `ok`, `wouldWrite`
- `changedCounts` / `diffSummary`
- `errors`, `warnings`
- `didWrite`, `dbWrite`, `networkWrite`, `saveEnabled` (always false in display)
- **Blocked:** `service_role`, JWT-like strings, `backupToken` / `readBack` values
- **401/403:** auth issue category — no bypass

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Save button enablement | **not executed** |
| operation=save POST | **not sent** |
| SQL mutation | **not executed** |
| DB write | **not executed** |
| Edge re-deploy | **not executed** |
| `supabase/functions/**` edit | **not executed** |
| FTP / manual upload | **not executed** |
| localStorage approval persistence | **not added** |

---

## STG QA follow-up — clientDryRun contract fix

**Phase:** `G-20u36c-admin-discography-endpoint-dry-run-clientDryRun-contract-fix`  
**Issue:** STG browser QA returned **400** — `clientDryRun.wouldWrite must be false (browser never writes)`  
**Cause:** Initial wiring omitted `clientDryRun` (Edge saw `{}` → `wouldWrite` undefined). Not auth/login.  
**Fix:** `buildDiscographyDryRunClientSnapshot()` — always `clientDryRun.wouldWrite: false`; local diff stats optional; local `wouldWrite` never forwarded.  
**Package regen / FTP:** deferred to next operator phase after source fix.

---

## Next phase

1. Local build + regression
2. Staging package rebuild (`manual-upload:package`)
3. Manual FTP upload to STG
4. STG UI dry-run verification (operator browser QA)

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36c-admin-discography-dry-run-fetch-post-wiring
npm run verify:current-active-regression
```

Historical verifier — not in active regression suite (23 verifiers unchanged).
