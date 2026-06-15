# FTP deploy root delete incident and safety hardening

- **Phases:** G-7f-gosaki-staging-upload-execution / G-7f1-ftp-deploy-safety-hardening
- **Last updated:** 2026-06-15
- **Status:** incident recorded; hardening applied in code (G-7f1); **all FTP apply suspended**

---

## Incident summary

| Item | Value |
|------|-------|
| **phase** | G-7f-gosaki-staging-upload-execution |
| **incident** | FTP deploy root mirror delete accident |
| **suspected command** | `deploy-public-dist-ftp.mjs --apply` |
| **intended remote dir** | `/cms-kit-staging/gosaki-piano/` |
| **likely actual execution dir** | FTP login root `/` |
| **local source** | `tools/static-to-astro/output/static-public/gosaki-piano/public-dist/` |

---

## Likely cause

```txt
cd /cms-kit-staging/gosaki-piano failed (directory missing or path mismatch)
↓
lftp continued (semicolon-chained commands, no cmd:fail-exit)
↓
mirror -R --delete ran in FTP login root
↓
existing root directories deleted; gosaki public-dist placed at root
```

**Pre-G-7f1 script behavior:**

- `buildLftpMirrorScript()` used `;` command chaining without `set cmd:fail-exit true`
- `mirror -R --delete` was **always enabled**
- No `pwd` verification after `cd`
- `verify-staging-ftp-safety.mjs` was **not** required before `--apply`

---

## Delete behavior (pre-hardening)

- `mirror -R --delete` — remote files/dirs not in local public-dist were deleted
- Optional `rm -r -f public-dist` legacy cleanup

---

## Impact

- Lolipop document root may have lost legacy folders (`images/`, `jazzmedance/`, `js/`, `libertad/`, `lindystation/`, `sari/`, `sarisuke/`, `sunandmoon/`, `tlha/`, `tlha2/`, etc.)
- Root may now contain gosaki public-dist-like files (`2026-03`…`2026-07`, `about/`, `contact/`, `index.html`, `robots.txt`, sitemaps)
- TLHA / libertad / other domain public folders may be affected
- No Lolipop backup available (operator confirmed)

---

## Not caused by

- GitHub `workflow_dispatch` (`.github/workflows/deploy.yml` — not executed; no `--delete`; different artifact)
- Supabase / DB writes
- `.ftpaccess` deletion
- Explicit `GOSAKI_STAGING_FTP_SERVER_DIR=/`
- Sariswing production deploy workflow

---

## Immediate mitigation (in effect)

```txt
stop all FTP deploys
stop all mirror / sync / delete
do not retry
preserve evidence (screenshots, FTP listings)
do not cleanup root remotely
```

---

## G-7f1 hardening (code changes)

| Control | Change |
|---------|--------|
| Fail-fast | `set cmd:fail-exit true` in all lftp scripts |
| cd / mirror split | Preflight (`mkdir`, `cd`, `pwd`) then mirror only if pwd matches |
| Remote dir blocklist | `''`, `/`, `.`, `./`, `~`, `../` blocked |
| Staging path required | Must include `cms-kit-staging` or `staging` (and related markers) |
| `--delete` | **Default OFF** — requires `--allow-delete` |
| Legacy cleanup | **Default OFF** — requires `--legacy-cleanup` |
| Safety verifier | **Required for `--apply`** via `--safety-report` |
| Manifest | Records `deleteEnabled`, `pwdVerified`, `safetyVerifierPassed`, etc. |

**New / updated files:**

- `scripts/lib/ftp-remote-dir-safety.mjs`
- `scripts/lib/public-dist-ftp-deployer.mjs`
- `scripts/deploy-public-dist-ftp.mjs`
- `scripts/verify-public-dist-ftp-deployer-safety.mjs`

---

## Gates

```txt
ftpDeploySafetyHardeningComplete: true
ftpDeployApplyBlockedUntilSafetyPatch: true
deleteByDefaultDisabled: true
readyForAnyFutureFtpApply: false
```

FTP apply may resume only after:

1. Operator confirms recovery / evidence preserved
2. New preflight + `verify-staging-ftp-safety.mjs` PASS
3. Explicit approval: `承認します。この操作を1回だけ実行してください。`
4. `--allow-delete` NOT used unless separately justified and approved

---

## Recovery priority (operator-led)

1. Preserve evidence — screenshot FTP root and domain public folders
2. Restore TLHA from local copy
3. Assess other domains / folders
4. Do **not** run deploy scripts until gates above are satisfied
