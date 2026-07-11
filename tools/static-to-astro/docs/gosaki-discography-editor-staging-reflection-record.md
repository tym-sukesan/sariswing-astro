# G-20u29b — Gosaki Discography editor staging reflection record

**Phase:** `G-20u29b-gosaki-discography-editor-staging-reflection-record`  
**Status:** **complete** — G-20u29 Discography Editor Prototype reflected on STG + operator verification recorded  
**Date:** 2026-07-11  
**Doc HEAD:** `2a5dc68`  
**Deployed STG package:** `2a5dc6825dcab03b1b28705877f5bcd5423ba37c` (`2a5dc68`)  
**Prior:** G-20u29 Discography edit UI prototype · G-20u28b admin UI STG reflection (`f03122b`)

| Check | Status |
| --- | --- |
| `build:gosaki:staging` | **PASS** (at `2a5dc68`) |
| `preflight:gosaki:staging` | **PASS** |
| Manual FTP upload | **complete** (operator · FileZilla) |
| `/admin/` Discography Editor Prototype on STG | **PASS** (operator-confirmed) |
| Track list UI (1 textarea / album) | **PASS** (operator-confirmed) |
| Sitemap `/admin/` exclusion | **PASS** (operator-confirmed · 0 matches) |
| Production upload | **not executed** · **STOP** (G-20j) |
| Cursor FTP / deploy / DB write | **not executed** |

---

## Gates

```txt
gosakiDiscographyEditorStagingReflectionRecordComplete: true
phase: G-20u29b-gosaki-discography-editor-staging-reflection-record
deployedPackageSourceCommit: 2a5dc6825dcab03b1b28705877f5bcd5423ba37c
manualFtpUploadByOperator: true
cursorFtpUploadExecuted: false
cursorCliFtpMirrorSyncDeleteExecuted: false
cursorDbWriteExecuted: false
productionUploadExecuted: false
productionUploadStop: true
discographyEditorG20u29ReflectedOnStaging: true
trackListTextareaPerAlbumVerified: true
not34FixedTrackInputs: true
sitemapAdminExclusionVerified: true
```

---

## 1. Package (upload source)

| Item | Value |
| --- | --- |
| `sourceCommit` | `2a5dc6825dcab03b1b28705877f5bcd5423ba37c` |
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
npm run build:gosaki:staging      # PASS at 2a5dc68
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

Replaces prior STG package `f03122b` (G-20u28b) with G-20u29 Discography Editor Prototype build.

---

## 3. STG verification — Discography Editor Prototype (operator-confirmed)

**URL:** https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/

| Check | Result |
| --- | --- |
| Discography Editor Prototype section visible | **yes** (`#gra-discography-editor`) |
| Album cards displayed | **yes** — **4** albums |
| Track list textarea per album | **yes** — **1 textarea per album** (not 34 fixed inputs) |
| `1 line = 1 track` label | **yes** |
| Save disabled display | **yes** |
| Save / Publish / Deploy / FTP buttons | **disabled display only** |
| Dashboard Discography card | **yes** — **4** releases · **34** tracks |
| Editor prototype dashboard link | **yes** |
| production STOP (G-20j) | **displayed** (safety banner) |
| DB write | **none** (read-only prototype) |

---

## 4. Track list UI policy (verified on STG)

| Rule | STG result |
| --- | --- |
| Layout | **One multiline textarea per album** |
| Line format | **1 line = 1 track** |
| Fixed 34 track inputs | **not used** |
| Save | **disabled** |
| localStorage | **not used** |

---

## 5. STG verification — sitemap admin exclusion (operator-confirmed)

**URL:** https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/sitemap-0.xml

| Check | Result |
| --- | --- |
| `admin` string search | **0 / 0** matches |
| `/admin/` in sitemap | **no** (expected) |

Staging package may include `/admin/` page; production package and sitemap must not advertise it.

---

## 6. Production safety

| Item | Status |
| --- | --- |
| Production upload | **not executed** |
| Production upload STOP | **continues** (G-20j) |
| Cursor FTP / CLI deploy | **not executed** |
| DB write / Save | **not executed** |

---

## 7. Next phase candidates

| ID | Candidate |
| --- | --- |
| A | Discography dry-run validation |
| B | Discography Save design |
| C | YouTube edit UI |
| D | About edit UI |

---

## 8. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u29b-gosaki-discography-editor-staging-reflection-record
```
