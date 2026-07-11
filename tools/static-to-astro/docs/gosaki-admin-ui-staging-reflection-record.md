# G-20u28b — Gosaki admin UI staging reflection record

**Phase:** `G-20u28b-gosaki-admin-ui-staging-reflection-record`  
**Status:** **complete** — G-20u28 admin UI reflected on STG + operator verification recorded  
**Date:** 2026-07-11  
**Doc HEAD:** `f03122b`  
**Deployed STG package:** `f03122b59fcb289d6b3e527bd5420a1bdd776084` (`f03122b`)  
**Prior:** G-20u28 admin UI foundation polish · G-20u27 staging post-upload verification (`3287219`)

| Check | Status |
| --- | --- |
| `build:gosaki:staging` | **PASS** (at `f03122b`) |
| `preflight:gosaki:staging` | **PASS** |
| Manual FTP upload | **complete** (operator · FileZilla) |
| `/admin/` new dashboard UI on STG | **PASS** (operator-confirmed) |
| Sitemap `/admin/` exclusion | **PASS** (operator-confirmed · 0 matches) |
| Production upload | **not executed** · **STOP** (G-20j) |
| Cursor FTP / deploy / DB write | **not executed** |

---

## Gates

```txt
gosakiAdminUiStagingReflectionRecordComplete: true
phase: G-20u28b-gosaki-admin-ui-staging-reflection-record
deployedPackageSourceCommit: f03122b59fcb289d6b3e527bd5420a1bdd776084
manualFtpUploadByOperator: true
cursorFtpUploadExecuted: false
cursorCliFtpMirrorSyncDeleteExecuted: false
cursorDbWriteExecuted: false
productionUploadExecuted: false
productionUploadStop: true
adminUiG20u28ReflectedOnStaging: true
sitemapAdminExclusionVerified: true
```

---

## 1. Package (upload source)

| Item | Value |
| --- | --- |
| `sourceCommit` | `f03122b59fcb289d6b3e527bd5420a1bdd776084` |
| `siteKey` | `gosaki-piano` |
| `targetEnvironment` | `staging` |
| `fileCount` | **30** |
| `includesAdmin` | `true` |
| `safeForStaticFtp` | `true` |
| `publicBaseUrl` | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| `intendedRemotePath` | `/cms-kit-staging/gosaki-piano/` |
| Local upload source | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` **contents** |
| `ftpAutoDeployUsed` | `false` |

Build + preflight before upload:

```bash
cd tools/static-to-astro
npm run build:gosaki:staging      # PASS at f03122b
npm run preflight:gosaki:staging # PASS
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

Replaces prior STG package `3287219` (G-20u26b) with G-20u28 admin UI polish build.

---

## 3. STG verification — `/admin/` new UI (operator-confirmed)

**URL:** https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/

| Check | Result |
| --- | --- |
| New dashboard UI visible | **yes** |
| READ-ONLY badge | **yes** |
| STAGING ONLY badge | **yes** |
| Save disabled display | **yes** |
| Schedule card | **yes** — **74** events · 2026-08: **14** cards |
| Discography card | **yes** — **4** releases · **34** tracks |
| YouTube card | **yes** |
| About card | **yes** |
| Contact card | **yes** |
| Link card | **yes** |
| Production readiness / Upload safety card | **yes** |
| Save / Publish / Deploy / FTP buttons | **disabled display only** |
| production STOP (G-20j) | **displayed** |

---

## 4. STG verification — sitemap admin exclusion (operator-confirmed)

**URL:** https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/sitemap-0.xml

| Check | Result |
| --- | --- |
| `admin` string search | **0 / 0** matches |
| `/admin/` in sitemap | **no** (expected) |

Staging package may include `/admin/` page; production package and sitemap must not advertise it.

---

## 5. Production safety

| Item | Status |
| --- | --- |
| Production upload | **not executed** |
| Production upload STOP | **continues** (G-20j) |
| Cursor FTP / CLI deploy | **not executed** |
| DB write / Save | **not executed** |

---

## 6. Next phase candidates

| ID | Candidate |
| --- | --- |
| A | Discography edit UI |
| B | YouTube edit UI |
| C | About edit UI |
| D | Schedule UI polish |

---

## 7. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u28b-gosaki-admin-ui-staging-reflection-record
```
