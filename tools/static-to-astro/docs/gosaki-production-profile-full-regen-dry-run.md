# G-20t4 — Gosaki production profile full regen dry-run

**Phase:** `G-20t4-gosaki-production-profile-full-regen-dry-run`  
**Status:** **complete** — local full regen + verification · **no FTP / deploy / production upload**  
**Date:** 2026-07-09  
**Base commit:** `55d0364`  
**Prior:** G-20t1 sitemap admin exclusion · G-20t2 schedule month discovery · G-20t3 package upload safety hardening

| Check | Status |
| --- | --- |
| Production profile full regen | **yes** (local) |
| G-20t1/t2/t3 reflected | **yes** |
| Admin excluded from production package | **yes** |
| August 2026-08 schedule reflected | **yes** (14 cards) |
| Production upload | **blocked** (`TBD_G-20i`) |
| FTP / deploy | **not executed** |

---

## Gates

```txt
gosakiProductionProfileFullRegenDryRunComplete: true
phase: G-20t4-gosaki-production-profile-full-regen-dry-run
readyForProductionUpload: false
readyForG20jProductionUploadExecution: false
ftpUploadExecuted: false
deployExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
productionRemoteChangeExecuted: false
```

**Production upload remains NG** until G-20j remote path / DNS / SSL / operator sign-off.

---

## 1. Pipeline investigated

| Step | Script | Output |
| --- | --- | --- |
| 1 Convert + Astro build | `build-gosaki-production-package.mjs` → `convert-static-to-astro.mjs` | `output/gosaki-piano-astro-production/` |
| 2 Static-public verify + copy | `verify-static-public-artifact.mjs` (`includeGosakiReadOnlyAdmin=false`) | `output/static-public/gosaki-piano-production/public-dist/` |
| 3 Manual upload package | `create-manual-upload-package.mjs` (production profile args) | `output/manual-upload/gosaki-piano-production/` |
| 4 Verify | `verify-g20i3-...` + G-20t4 verifier | PASS |

**Profile source:** `config/sites/gosaki-piano.deploy-profiles.json` → `profiles.production`

---

## 2. Generation command (executed locally)

```bash
cd tools/static-to-astro
rm -rf output/gosaki-piano-astro-production
npm run build:gosaki-production-package
```

Equivalent to:

```txt
node scripts/build-gosaki-production-package.mjs
  → convert (deployBase=/, baseUrl=https://www.gosaki-piano.com)
  → verify-static-public-artifact (admin excluded)
  → npm run manual-upload:package:gosaki-production
  → verify-g20i3-gosaki-production-package-admin-exclusion.mjs
```

**No FTP / deploy / remote production change.**

---

## 3. Production package output

| Item | Value |
| --- | --- |
| Package dir | `tools/static-to-astro/output/manual-upload/gosaki-piano-production/` |
| public-dist files | **28** (+2 from G-20r August: `schedule/2026-08/` + legacy `2026-08/` stub) |
| Zip | `gosaki-piano-production-manual-upload.zip` |
| static-public source | `output/static-public/gosaki-piano-production/public-dist` |

### MANIFEST.json (key values)

| Field | Value |
| --- | --- |
| `phase` | `G-20t3-package-upload-safety-hardening` |
| `packageProfileName` | `production` |
| `targetEnvironment` | `production` |
| `includesAdmin` | **false** |
| `publicBaseUrl` | `https://www.gosaki-piano.com/` |
| `deployBase` | `/` |
| `intendedRemotePath` | **`TBD_G-20i`** — **STOP / upload blocked** |
| `sourceCommit` | `55d0364e53b4ec2eb2644973c7a8c6ebab203499` |
| `generatedAt` | `2026-07-09T15:08:59.895Z` (build run) |
| `fileCount` | **28** |
| `safeForStaticFtp` | `true` |
| `ftpAutoDeployUsed` | `false` |

---

## 4. Safety verification

### Admin exclusion

| Check | Result |
| --- | --- |
| `admin/index.html` | **absent** |
| `admin/` directory | **absent** |
| `__admin-staging-shell/` | **absent** |
| `includesAdmin` | **false** |

### Sitemap (G-20t1)

12 URLs in `sitemap-0.xml`:

```txt
/  /about/  /contact/  /discography/  /link/  /schedule/
/schedule/2026-03/ … /schedule/2026-08/
```

| Excluded | Present |
| --- | --- |
| `/admin/` | **no** |
| `/api/` | **no** |
| `/preview/` `/draft/` | **no** |
| legacy `/YYYY-MM/` root | **no** |
| `/schedule/2026-08/` | **yes** |

### August schedule (G-20t2 / G-20r)

| Check | Result |
| --- | --- |
| `schedule/2026-08/index.html` | **exists** |
| `2026-08/index.html` legacy stub | **exists** |
| Event cards | **14** (`gosaki-schedule-event-card`) |
| `scheduleDataSource` | `supabase` |
| Build log | 74 published events · 5 month pages |

---

## 5. Staging vs production comparison

| Field | Staging (`gosaki-piano`) | Production (`gosaki-piano-production`) |
| --- | --- | --- |
| `packageProfileName` | `staging` | `production` |
| `targetEnvironment` | `staging` | `production` |
| `includesAdmin` | **true** | **false** |
| `publicBaseUrl` | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` | `https://www.gosaki-piano.com/` |
| `deployBase` | `/cms-kit-staging/gosaki-piano/` | `/` |
| `intendedRemotePath` | `/cms-kit-staging/gosaki-piano/` | **`TBD_G-20i`** (upload STOP) |
| `fileCount` | 29 (includes `admin/`) | 28 (no admin) |
| Zip name | `gosaki-piano-manual-upload.zip` | `gosaki-piano-production-manual-upload.zip` |

**Rule:** Never upload staging package to production root or vice versa. Read `MANIFEST.json` first.

---

## 6. Build observations

- **Schedule:** Supabase read succeeded — `scheduleDataSource=supabase` (74 events)
- **Discography:** Supabase read succeeded — 4 releases
- **static-public copy:** 28 files, `excluded: ["admin"]`
- **G-20i3 file count:** updated from 26 → **28** (August month + legacy stub)

---

## 7. Not executed

| Item | Status |
| --- | --- |
| FTP / manual production upload | **no** |
| DNS / SSL / MX change | **no** |
| DB write / SQL | **no** |
| Remote production change | **no** |

---

## 8. Remaining work

1. **G-20j production upload** — confirm `intendedRemotePath` (replace `TBD_G-20i`), DNS/SSL/MX, operator sign-off
2. **Staging package regen** — optional; staging MANIFEST may be older (`sourceCommit` pre-G-20t4)
3. **Production cutover** — separate approved phase after G-20j preflight PASS

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20t4-gosaki-production-profile-full-regen-dry-run.mjs
npm run verify:manual-upload:gosaki-production
```
