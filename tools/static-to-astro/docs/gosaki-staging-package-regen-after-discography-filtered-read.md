# G-20u26 — Gosaki staging package regen after discography filtered read

**Phase:** `G-20u26-gosaki-staging-package-regen-after-discography-filtered-read`  
**Status:** **complete** — local staging full regen at `72b064c` · **no FTP / deploy / package upload**  
**Date:** 2026-07-10  
**Base commit:** `72b064c` (post G-20u25 filtered read enablement)  
**Prior:** G-20u25 discography filtered read · G-20u24d site_slug migration

| Check | Status |
| --- | --- |
| Current active regression | **23/23 PASS** (pre-regen) |
| Staging package regen | **yes** (local) |
| Preflight | **PASS** (structure + freshness) |
| `DISCOGRAPHY_SITE_SLUG_COLUMN_READY` | **true** |
| Discography filtered read | **4 releases / 34 tracks** |
| August 2026-08 schedule | **14 cards** |
| Admin included (staging) | **yes** (`includesAdmin: true`) |
| Sitemap admin excluded | **yes** |
| FTP / deploy | **not executed** |

---

## Gates

```txt
gosakiStagingPackageRegenAfterDiscographyFilteredReadComplete: true
phase: G-20u26-gosaki-staging-package-regen-after-discography-filtered-read
ftpUploadExecuted: false
deployExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
productionUploadExecuted: false
```

---

## 1. Commands executed

```bash
cd tools/static-to-astro
npm run verify:current-active-regression   # 23/23 PASS
npm run build:gosaki:staging               # PASS
npm run preflight:gosaki:staging           # PASS
```

Build log (discography):

```txt
Discography data: discographyDataSource=supabase (4 releases, … 34 track rows)
Schedule data: scheduleDataSource=supabase (74 events)
```

**No FTP / deploy / package upload.**

---

## 2. MANIFEST.json (key values)

| Field | Value |
| --- | --- |
| `siteKey` | `gosaki-piano` |
| `packageProfileName` | `staging` |
| `targetEnvironment` | `staging` |
| `includesAdmin` | **true** |
| `includeGosakiReadOnlyAdmin` | **true** |
| `publicBaseUrl` | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| `intendedRemotePath` | `/cms-kit-staging/gosaki-piano/` |
| `sourceCommit` | `72b064c1685a991eee194a819fb8ef9e9319e4f9` |
| `fileCount` | **29** |
| `ftpAutoDeployUsed` | `false` |

---

## 3. Preflight result

| Step | Result |
| --- | --- |
| `verify-site-package` | **PASS** |
| `verify-package-upload-freshness` | **PASS** (fresh at HEAD) |

Upload rule: **manual FTP only** — operator-driven. Production upload **STOP** (G-20j).

---

## 4. Content verification

| Area | Result |
| --- | --- |
| Schedule August | `/schedule/2026-08/` · **14** `gosaki-schedule-event-card` |
| Discography | **4** repeater albums · `discographyDataSource=supabase` · **34** track rows (filtered) |
| Filtered read | `siteSlugFilterApplied: true` · `DISCOGRAPHY_SITE_SLUG_COLUMN_READY=true` |
| Sitemap | includes `/schedule/2026-08/` · **no** `/admin/` |
| Admin | `admin/index.html` present in package |

---

## 5. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u26-gosaki-staging-package-regen-after-discography-filtered-read
```

---

## 6. Not executed

- FTP / deploy / mirror / sync / delete
- DB write / SQL mutation / Save
- Production changes
- Package upload to remote
