# G-20u36e — Gosaki Discography controlled Save auth JWT admin probe UI package preflight prep

**Phase:** `G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep`  
**Status:** **complete** — prep only · **package not generated** · **output/manual-upload not updated** · **no FTP**  
**Date:** 2026-07-14  
**Base commit:** `7a39027`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify.md](./gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify.md)

| Check | Status |
| --- | --- |
| Package preflight prep | **yes** (this file) |
| Package generation | **no** |
| output/manual-upload updated | **no** |
| FTP / upload | **no** |
| STG public URL reflect | **no** (still not reflecting probe UI) |
| Real browser RPC | **no** |
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
| Save enablement | **no** |
| service_role | **not used** |
| JWT / access_token / refresh_token displayed | **no** |
| user_id / email displayed | **no** |

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthJwtAdminProbeUiPackagePreflightPrepared: true
phase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep
packageGenerated: false
outputManualUploadUpdated: false
ftpUploadExecuted: false
stgPublicUrlReflectingProbeUi: false
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
saveEnablementExecuted: false
serviceRoleUsed: false
jwtAccessTokenRefreshTokenDisplayed: false
userIdEmailDisplayed: false
readyForFirstControlledSaveExecution: false
recommendedNextPhase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-generate-freshness
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

**Why prep before generate:** If package is generated now, then this prep is committed, `MANIFEST.sourceCommit` would point at pre-prep HEAD and fail freshness vs new HEAD. Generate package **after** this prep is on `main`.

---

## 1. Package generation command candidates (not executed)

### Recommended (full staging pipeline)

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run build:gosaki:staging
```

- Registry-driven: convert → static-public → manual-upload package  
- Site: `gosaki-piano` · profile: `staging`  
- Includes read-only admin (`includeReadOnlyAdmin: true`)  
- Writes `output/manual-upload/gosaki-piano/` (including `public-dist/` + `MANIFEST.json`)  
- **No FTP**

### Optional packaging-only (if public-dist already rebuilt at HEAD)

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run manual-upload:package:gosaki:staging
```

Equivalent to:

```bash
node scripts/create-manual-upload-package.mjs \
  --site-key gosaki-piano \
  --profile staging \
  --public-dir output/static-public/gosaki-piano/public-dist \
  --out output/manual-upload/gosaki-piano
```

Prefer **`build:gosaki:staging`** so convert + public-dist + package stay in sync with current templates (probe UI).

### Dry-run plan only (already used in local-verify — safe)

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run build:gosaki:staging:dry-run
```

Prints plan only — no convert / package / FTP. **Not a substitute for freshness package generate.**

### Post-generate checks (next phase — not this phase)

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:package-freshness:gosaki:staging
npm run preflight:gosaki:staging
```

### MANIFEST / sourceCommit

| Item | Detail |
| --- | --- |
| Manifest file | `output/manual-upload/gosaki-piano/MANIFEST.json` |
| `sourceCommit` | Written via `resolveSourceCommit(repoRoot)` = `git rev-parse HEAD` at package create time (`scripts/lib/package-upload-safety.mjs` / `manual-upload-package.mjs`) |
| Freshness verifier | `verify:package-freshness:gosaki:staging` — **STOP** if `sourceCommit !==` current HEAD |
| Registry remote | `config/sites/gosaki-piano.deploy-profiles.json` → `remotePath: /cms-kit-staging/gosaki-piano/` |
| Package out | `output/manual-upload/gosaki-piano` |
| Public source for package | `output/static-public/gosaki-piano/public-dist` |

### Do not use for this STG admin probe package

| Command / profile | Why |
| --- | --- |
| `build:gosaki:production` / `manual-upload:package:gosaki:production` | production profile · admin exclusion · wrong target |
| Any FTP / `lftp` / `mirror` / CLI upload | G-7f FTP apply suspended · manual FileZilla only |
| Generate while dirty tree or before prep commit lands | freshness / HEAD mismatch risk |

### Current on-disk package (observation only — not regenerated)

Existing `output/manual-upload/gosaki-piano/MANIFEST.json` `sourceCommit` starts with `c2fcdb8…` · current HEAD `7a39027` → **stale · upload NG** until next-phase generate at matching HEAD.

---

## 2. Package freshness conditions

| # | Condition | Upload if fail |
| --- | --- | --- |
| 1 | `git status` clean (no uncommitted code/doc/package churn) before generate | **NG** |
| 2 | `HEAD` = `origin/main` before generate | **NG** |
| 3 | After generate: `MANIFEST.sourceCommit` = `git rev-parse HEAD` (full or equivalent short match per freshness tool) | **NG** if mismatch |
| 4 | MANIFEST points at older commit than current HEAD | **NG** |
| 5 | Package generated, then a new commit made without regenerating | **NG** |
| 6 | Package generated, then code/docs changed without regenerating | **NG** |

**Prep sequencing:** commit/push this prep → then run package-generate-freshness at that clean HEAD → upload **without** further commits until freshness still PASS.

---

## 3. Upload target (manual FTP — not this phase)

| Item | Value |
| --- | --- |
| Local source | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` **contents** |
| Remote target | `/cms-kit-staging/gosaki-piano/` |
| Method | Operator **FileZilla** (or equivalent GUI) — manual only |
| What to upload | **Inside** `public-dist/` — not the wrapper folder name as remote root mistake |
| Overwrite | **OK** |
| delete / sync delete / mirror / CLI FTP | **NG** |
| Cursor / agent FTP `--apply` | **NG** (suspended) |

---

## 4. Manual FTP notes

- Confirm freshness PASS immediately before upload.  
- Do not upload `MANIFEST.json` requirement as a substitute for content — upload **public-dist body** needed for admin HTML/assets.  
- Do not delete remote files to “clean”; overwrite only.  
- Production path / production Supabase ref must not appear in checklist.  
- After upload, STG admin URL may show probe UI — **do not click probe in this prep**; click is a later phase.

---

## 5. STG reflection — planned verification (after upload · later phases)

| Item | Plan |
| --- | --- |
| Admin URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/` |
| Expect | `#gra-admin-probe-btn` visible |
| Expect | Save buttons remain disabled · probe PASS does not enable Save |
| Expect | Probe is manual only · no auto-run |
| Expect | No JWT / access_token / refresh_token / user_id / email in probe result |
| Probe click | **Later phase only** — after upload + explicit operator phase |
| operation=save | **not sent** |

---

## 6. STOP conditions

| # | Condition |
| --- | --- |
| 1 | `git status` not clean |
| 2 | `HEAD` ≠ `origin/main` |
| 3 | `MANIFEST.sourceCommit` ≠ `git` HEAD |
| 4 | Commit occurred after package generate without regen |
| 5 | Local upload source is not `…/public-dist/` contents |
| 6 | Remote target is not `/cms-kit-staging/gosaki-piano/` |
| 7 | Production ref `vsbvndwuajjhnzpohghh` or production path mixed in |
| 8 | FTP delete / sync delete / mirror required |
| 9 | CLI FTP required |
| 10 | Save enablement required |
| 11 | operation=save required |
| 12 | DB write / GRANT / RLS change / Edge deploy required |
| 13 | Need to display JWT / secrets / email to proceed |

**This phase:** none of the above triggered as execution paths — prep documentation only; package/FTP not run.

---

## 7. Not executed in this phase

| Item | Status |
| --- | --- |
| Package generation (`build:gosaki:staging` etc.) | **no** |
| output/manual-upload update | **no** |
| FTP / upload | **no** |
| STG reflect | **no** |
| Browser probe / RPC / HTTP | **no** |
| SQL / GRANT / RLS / DB write | **no** |
| Edge / `supabase/functions` / deploy | **no** |
| operation=save / Save enable | **no** |
| service_role / token display | **no** |

---

## 8. Recommended next phase

**`G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-generate-freshness`**

1. Ensure this prep is committed/pushed · working tree clean · HEAD = origin/main  
2. Run `npm run build:gosaki:staging` once  
3. Run `verify:package-freshness:gosaki:staging` + `preflight:gosaki:staging`  
4. Confirm `MANIFEST.sourceCommit` matches HEAD  
5. **Do not** commit again before operator manual upload (or regenerate if any commit lands)  
6. Operator manual FTP of `public-dist/` → `/cms-kit-staging/gosaki-piano/`  
7. Probe button click remains a **later** phase

Still blocked: First controlled Save · permission-change SQL · Edge Save · operation=save.

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft
npm run verify:current-active-regression
```
