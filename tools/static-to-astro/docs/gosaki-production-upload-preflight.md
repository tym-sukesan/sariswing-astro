# G-20i — Gosaki production upload preflight

**Phase:** `G-20i-gosaki-production-upload-preflight`  
**Status:** **complete** — upload preflight only; **FTP/upload/DNS/SSL/DB write not executed**  
**Date:** 2026-07-01  
**Base commit:** `adfe27d`  
**Client:** 後藤沙紀さん（gosaki-piano）  
**Prior:** [gosaki-production-package-build-result.md](./gosaki-production-package-build-result.md) (G-20h2)  
**Safety reference:** [ftp-deploy-root-delete-incident-and-safety-hardening.md](./ftp-deploy-root-delete-incident-and-safety-hardening.md) (G-7f1)

| Check | Status |
| --- | --- |
| Production package exists locally | **yes** (27 public-dist files) |
| Upload file manifest | **yes** (this doc §3) |
| Remote path policy | **TBD** (operator confirms on client Lolipop) |
| Server / DNS checklist | **yes** (§4) |
| Upload safety rules | **yes** (§6) |
| G-20j manual upload draft | **yes** (§8) |
| FTP / upload executed | **no** |
| DNS / SSL changed | **no** |
| DB write | **no** |

---

## Gates

```txt
gosakiProductionUploadPreflightComplete: true
phase: G-20i-gosaki-production-upload-preflight
readyForG20jManualProductionUpload: true
uploadScope: first-production-full-package
uploadFileCount: 27
packageTotalFileCount: 31
remoteDocumentRoot: TBD
remoteUploadDestination: TBD
ftpUploadExecuted: false
mirrorSyncDeleteForbidden: true
cursorFtpExecuted: false
cursorDbWriteExecuted: false
dnsChangeExecuted: false
sslChangeExecuted: false
readyForAnyFutureFtpApply: false
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state (verified)

| Item | Value |
| --- | --- |
| `HEAD` | `adfe27d` |
| `origin/main` | `adfe27d` |
| Working tree | clean at preflight start |

---

## 2. Production package existence (verified)

| Item | Value |
| --- | --- |
| Package dir | `tools/static-to-astro/output/manual-upload/gosaki-piano-production/` |
| public-dist dir | `.../gosaki-piano-production/public-dist/` |
| public-dist file count | **27** |
| Package total (README, zip, manifest) | **31** |
| `deployBase` (local build) | `/` |
| `MANIFEST.json` `safeForStaticFtp` | `true` |
| `ftpAutoDeployUsed` | `false` |

### Required paths (all present)

| Path | Role |
| --- | --- |
| `public-dist/index.html` | Home |
| `public-dist/discography/index.html` | Discography |
| `public-dist/schedule/index.html` | Schedule hub |
| `public-dist/about/index.html` | About |
| `public-dist/contact/index.html` | Contact |
| `public-dist/robots.txt` | Production robots (`Allow: /`) |
| `public-dist/sitemap-index.xml` | Sitemap index |
| `public-dist/sitemap-0.xml` | Sitemap URLs |
| `public-dist/_astro/index.YcHrHZH4.css` | Layout CSS |
| `public-dist/_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` | Client JS |

**Note:** This is the **first production full-package upload** — not a staging-style 1-file reflection (cf. G-20c).

---

## 3. Upload target manifest

### 3.1 Upload rule (critical)

```txt
LOCAL SOURCE:
  tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/

UPLOAD:
  Upload the CONTENTS of public-dist/ — NOT the public-dist folder itself.

CORRECT remote layout:
  /index.html
  /about/index.html
  /_astro/index.YcHrHZH4.css
  ...

WRONG remote layout:
  /public-dist/index.html
  /public-dist/about/index.html
```

### 3.2 Scope summary

| Item | Value |
| --- | --- |
| Upload type | **First production full package** (all 27 files) |
| `_astro/` | **Upload** (required for production first publish) |
| `assets/about/bands/*.jpg` | **Upload** (5 band profile images) |
| `admin/` | Included in package (read-only CMS); operator may upload or skip per client decision — default **upload with package** |
| Staging 1-file diff upload | **Not applicable** |

### 3.3 Full file list (27 files — relative to `public-dist/`)

```txt
index.html
robots.txt
sitemap-index.xml
sitemap-0.xml
2026-03/index.html
2026-04/index.html
2026-05/index.html
2026-06/index.html
2026-07/index.html
_astro/index.YcHrHZH4.css
_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js
about/index.html
admin/index.html
assets/about/bands/careless_hornets.jpg
assets/about/bands/caribbean_function.jpg
assets/about/bands/gosakirikako_trio.jpg
assets/about/bands/kikioto.jpg
assets/about/bands/onomatopoeia.jpg
contact/index.html
discography/index.html
link/index.html
schedule/index.html
schedule/2026-03/index.html
schedule/2026-04/index.html
schedule/2026-05/index.html
schedule/2026-06/index.html
schedule/2026-07/index.html
```

---

## 4. Client server — unresolved operator checklist

Operator must confirm **before G-20j upload**. All items start as **TBD** until client/Lolipop panel verified.

| # | Item | Status | Notes |
| --- | --- | --- | --- |
| S1 | Lolipop contract plan | **TBD** | Economy plan expected sufficient for static Astro site (HTML/CSS/JS only) |
| S2 | FTP host / port | **TBD** | From Lolipop user panel — do not store in repo |
| S3 | FTP username / password | **TBD** | Operator-held only — never commit |
| S4 | FTP access restriction / IP allowlist | **TBD** | May need temporary unlock for operator |
| S5 | Custom domain `www.gosaki-piano.com` attached | **TBD** | Currently on Wix |
| S6 | Document root for `www` | **TBD** | Often `public_html/` or domain-specific folder on Lolipop |
| S7 | Apex `gosaki-piano.com` handling | **TBD** | Redirect to `www` or separate vhost? |
| S8 | Free SSL (Let's Encrypt) on Lolipop | **TBD** | Enable before or immediately after DNS cutover |
| S9 | Email / MX records | **TBD** | Confirm no MX disruption if DNS changes |
| S10 | Wix site backup / export | **TBD** | Operator should preserve Wix content before cutover |
| S11 | DNS management owner | **TBD** | Wix DNS vs registrar vs Lolipop |
| S12 | Cutover timing window | **TBD** | Coordinate with client; low-traffic window preferred |
| S13 | TTL shortening before cutover | **TBD** | Recommended 300s if registrar DNS; plan 24–48h before switch |

---

## 5. Remote path policy

| Item | Value |
| --- | --- |
| **remote document root** | **TBD** — confirm in Lolipop for `www.gosaki-piano.com` |
| **remote public directory** | **TBD** — likely domain web root (not account FTP login `/` unless confirmed) |
| **upload destination** | **TBD** — same as document root when serving `https://www.gosaki-piano.com/` |
| **backup destination** | **TBD** — local operator backup folder if remote already has files |
| **Profile JSON placeholder** | `config/sites/gosaki-piano.deploy-profiles.json` → `production.remotePath: TBD_G-20i` |

### Path confirmation procedure (G-20j pre-step)

1. Connect with FTP client (FileZilla etc.) using client credentials.
2. Screenshot remote directory listing.
3. Confirm path maps to `https://www.gosaki-piano.com/` (not another site on shared host).
4. **STOP** if path is account root `/` with unrelated domains — do not upload until scoped subfolder confirmed.
5. Record exact remote path in G-20j execution doc before first file upload.

**G-7f lesson:** Staging incident uploaded to FTP login root `/` instead of `/cms-kit-staging/gosaki-piano/` — production must not repeat this class of error.

---

## 6. Upload safety rules (mandatory)

| Rule | Required |
| --- | --- |
| FTP client manual upload only (FileZilla / Lolipop FTP) | **yes** |
| Upload `public-dist/` **contents** only | **yes** |
| Do **not** create remote `public-dist/` folder | **yes** |
| Do **not** delete remote root or sibling sites | **yes** |
| Do **not** bulk-delete existing remote files | **yes** |
| **mirror** forbidden | **yes** |
| **sync** forbidden | **yes** |
| **delete** / delete-remote-extras forbidden | **yes** |
| Diff sync / mirror-with-delete forbidden | **yes** |
| Command-line FTP (`lftp`, `ftp`, scripts) forbidden | **yes** |
| `rsync` / `scp` forbidden | **yes** |
| AI / Cursor automated FTP forbidden | **yes** |
| `deploy-public-dist-ftp.mjs --apply` forbidden | **yes** (`readyForAnyFutureFtpApply: false`) |
| Screenshot remote path before upload | **yes** |
| HTTP verify after upload (G-20k) | **yes** |
| On failure: **STOP** — no retry, no cleanup, no alternative commands | **yes** |

### G-7f1 destructive-operation approval

Automated FTP requires explicit operator approval per AGENTS.md. **G-20j uses manual FTP only** — no script `--apply`.

---

## 7. Backup / rollback policy

### Before DNS cutover

| Layer | Fallback |
| --- | --- |
| Public site | **Wix remains live** until DNS points to Lolipop |
| Lolipop upload | Site not public until DNS switch — upload is preparatory |

### If Lolipop directory already has files

- Operator **manually downloads** existing files to local backup folder before overwrite.
- Use FTP client download — **not** mirror/delete remotely.
- Do not assume Lolipop backup exists (G-7f: no backup was available).

### After DNS cutover (rollback)

| Action | Owner | Phase |
| --- | --- | --- |
| Revert DNS to Wix | Operator / client | Separate approval — not G-20j |
| Delete Lolipop files | **Avoid** — DNS revert restores Wix first |
| Production package rollback upload | Separate phase + approval | Not in G-20i/G-20j |

**Wix fallback:** Until DNS TTL expires, some users may still hit Wix — plan cutover communication accordingly.

---

## 8. G-20j manual production upload — procedure draft

**Phase:** `G-20j-gosaki-manual-production-upload` (execution — not this phase)

### 8.1 Preconditions

- [ ] G-20i preflight PASS
- [ ] G-20h2 package present locally (27 files)
- [ ] Remote path confirmed + screenshot
- [ ] Client FTP credentials available to operator
- [ ] Optional: remote backup downloaded if files exist

### 8.2 Local source

```txt
/Users/toyamayusuke/sariswing-astro/tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/
```

Upload **all contents** (27 files, preserving directory structure).

### 8.3 Remote destination

```txt
TBD — operator confirms (see §5)
Example candidates (verify in panel):
  /public_html/
  /www.gosaki-piano.com/
  /gosaki-piano/   (only if vhost maps here)
```

### 8.4 Upload scope

| Scope | Files |
| --- | --- |
| Full first production package | **27** |
| Includes `_astro/` | **yes** |
| Includes `assets/about/bands/` | **yes** (5 JPG) |
| Includes legacy month stubs `2026-XX/` | **yes** |
| Includes `admin/` | package default **yes** (read-only CMS) |

### 8.5 Forbidden during upload

- mirror / sync / delete-remote
- uploading `public-dist` as a folder name
- uploading to wrong host path (account root with other sites)
- command-line FTP tools
- Cursor/AI executing FTP

### 8.6 Post-upload HTTP verify URLs (G-20k)

| URL | Check |
| --- | --- |
| `https://www.gosaki-piano.com/` | HTTP 200, production canonical |
| `https://www.gosaki-piano.com/discography/` | HTTP 200, no test titles |
| `https://www.gosaki-piano.com/schedule/` | HTTP 200 |
| `https://www.gosaki-piano.com/about/` | HTTP 200 |
| `https://www.gosaki-piano.com/contact/` | HTTP 200 |
| `https://www.gosaki-piano.com/robots.txt` | `Allow: /` |
| `https://www.gosaki-piano.com/sitemap-index.xml` | production URLs |
| `https://www.gosaki-piano.com/_astro/index.YcHrHZH4.css` | HTTP 200 |

**Note:** HTTP verify may fail until DNS points to Lolipop — distinguish upload success vs DNS pending.

---

## 9. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| FTP / upload | **no** |
| mirror / sync / delete | **no** |
| DNS / SSL change | **no** |
| DB write / Save | **no** |
| commit / push | **no** |

---

## 10. Next phase

**G-20j** — operator manual production FTP upload (full 27-file package, manual client only).

**G-20k** — production HTTP verify + result doc (after upload and/or DNS cutover).

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20i-gosaki-production-upload-preflight.mjs
```
