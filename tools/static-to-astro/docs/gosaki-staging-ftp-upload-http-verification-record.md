# G-20u26b — Gosaki staging FTP upload HTTP verification record

**Phase:** `G-20u26b-staging-ftp-upload-http-verification-record`  
**Status:** **complete** — operator manual FTP upload + HTTP verification recorded  
**Date:** 2026-07-10  
**Base commit:** `3287219` (post G-20u26 package regen + G-20u25 filtered read)  
**Prior:** G-20u26 Gosaki staging package regen · G-20u25 discography filtered read

| Check | Status |
| --- | --- |
| `build:gosaki:staging` | **PASS** (at `3287219`) |
| `preflight:gosaki:staging` | **PASS** (structure + freshness) |
| Manual FTP upload | **complete** (operator · FileZilla) |
| HTTP verification | **PASS** (operator-confirmed primary routes) |
| Production upload | **not executed** · **STOP** (G-20j) |
| Cursor FTP / CLI deploy | **not executed** |

---

## Gates

```txt
gosakiStagingFtpUploadHttpVerificationRecordComplete: true
phase: G-20u26b-staging-ftp-upload-http-verification-record
manualFtpUploadByOperator: true
cursorFtpUploadExecuted: false
cursorCliFtpMirrorSyncDeleteExecuted: false
productionUploadExecuted: false
productionUploadStop: true
```

---

## 1. Package (upload source)

| Item | Value |
| --- | --- |
| `sourceCommit` | `32872197659ebe359f106a5b2db298dbc8ee1cde` |
| `siteKey` | `gosaki-piano` |
| `targetEnvironment` | `staging` |
| `includesAdmin` | `true` |
| `publicBaseUrl` | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| `intendedRemotePath` | `/cms-kit-staging/gosaki-piano/` |
| Local upload source | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` **contents** |
| `ftpAutoDeployUsed` | `false` |

Preflight before upload:

```bash
cd tools/static-to-astro
npm run preflight:gosaki:staging   # PASS (structure + freshness)
```

---

## 2. Manual FTP upload (operator)

| Item | Value |
| --- | --- |
| Method | **Manual FTP** (FileZilla or equivalent) |
| Operator | Human (not Cursor) |
| Upload source | `public-dist/` **contents only** (not the folder itself) |
| Remote target | `/cms-kit-staging/gosaki-piano/` |
| CLI FTP / mirror / sync / delete | **not used** |
| Cursor FTP / deploy | **not executed** |

---

## 3. HTTP verification (operator-confirmed)

Primary routes verified **display OK** after upload:

| URL | Result |
| --- | --- |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/ | **OK** |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/ | **OK** |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/ | **OK** |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-08/ | **OK** |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/ | **OK** |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/ | **OK** |

Includes post–G-20u25 filtered discography read output (4 releases / 34 tracks at build time).

---

## 4. Production

| Item | Status |
| --- | --- |
| Production site (`gosaki-piano.com`) | **not updated** |
| Production upload | **STOP** until G-20j explicit approval |
| `gosaki-piano-production` package | unchanged by this phase |

---

## 5. Not executed (Cursor / automation)

- FTP / deploy / mirror / sync / delete
- Command-line FTP
- DB write / SQL mutation / Save
- Production changes
- Package upload by Cursor

---

## 6. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u26b-staging-ftp-upload-http-verification-record
```
