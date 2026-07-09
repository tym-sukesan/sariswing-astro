# G-20t5 — Gosaki staging profile current-head regen dry-run

**Phase:** `G-20t5-gosaki-staging-profile-current-head-regen-dry-run`  
**Status:** **complete** — local staging full regen at current HEAD · **no FTP / deploy**  
**Date:** 2026-07-09  
**Base commit:** `c9d35d7`  
**Prior:** G-20t4 production profile full regen dry-run · G-20t3 package upload safety hardening

| Check | Status |
| --- | --- |
| Staging package full regen | **yes** (local) |
| G-20t1/t2/t3/t4 reflected | **yes** |
| Admin included (staging) | **yes** (`includesAdmin: true`) |
| August 2026-08 schedule | **yes** (14 cards) |
| Sitemap admin excluded | **yes** |
| FTP / deploy | **not executed** |

---

## Gates

```txt
gosakiStagingProfileCurrentHeadRegenDryRunComplete: true
phase: G-20t5-gosaki-staging-profile-current-head-regen-dry-run
ftpUploadExecuted: false
deployExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
productionUploadExecuted: false
```

---

## 1. Generation command (executed locally)

```bash
cd tools/static-to-astro
rm -rf output/gosaki-piano-astro
node scripts/build-gosaki-staging-admin-package.mjs
```

Pipeline:

| Step | Script | Output |
| --- | --- | --- |
| 1 Convert + Astro build | `convert-static-to-astro.mjs` | `output/gosaki-piano-astro/` |
| 2 Static-public verify + copy | `verify-static-public-artifact.mjs` (admin included) | `output/static-public/gosaki-piano/public-dist/` |
| 3 Manual upload package | `npm run manual-upload:package` | `output/manual-upload/gosaki-piano/` |
| 4 Verify | `npm run verify:manual-upload` | PASS |

**No FTP / deploy.**

---

## 2. Staging package output

| Item | Value |
| --- | --- |
| Package dir | `tools/static-to-astro/output/manual-upload/gosaki-piano/` |
| public-dist files | **29** (28 public + `admin/index.html`) |
| Zip | `gosaki-piano-manual-upload.zip` |

### MANIFEST.json (key values)

| Field | Value |
| --- | --- |
| `packageProfileName` | `staging` |
| `targetEnvironment` | `staging` |
| `includesAdmin` | **true** |
| `publicBaseUrl` | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| `intendedRemotePath` | `/cms-kit-staging/gosaki-piano/` |
| `sourceCommit` | `c9d35d7e729ce068bc23f0c1ea69044dc261e567` |
| `generatedAt` | `2026-07-09T15:17:20.154Z` |
| `fileCount` | **29** |
| `ftpAutoDeployUsed` | `false` |

---

## 3. Admin inclusion (staging)

| Check | Result |
| --- | --- |
| `admin/index.html` in package | **present** |
| `includesAdmin` | **true** |
| Sitemap `/admin/` | **excluded** (G-20t1 — admin in package but not in sitemap) |

---

## 4. Sitemap (G-20t1)

13 URLs under deploy base — no `/admin/`, no legacy `/YYYY-MM/` root:

```txt
/cms-kit-staging/gosaki-piano/
/cms-kit-staging/gosaki-piano/schedule/2026-03/ … /schedule/2026-08/
```

| Check | Result |
| --- | --- |
| `/schedule/2026-08/` | **yes** |
| `/admin/` | **no** |
| legacy `/2026-08/` root | **no** |

---

## 5. August schedule (G-20t2 / G-20r)

| Check | Result |
| --- | --- |
| `schedule/2026-08/index.html` | **exists** |
| `2026-08/index.html` legacy stub | **exists** |
| Event cards | **14** |
| `scheduleDataSource` | `supabase` |

---

## 6. Staging vs production (G-20t4 baseline)

| Field | Staging (this run) | Production (G-20t4) |
| --- | --- | --- |
| `sourceCommit` | `c9d35d7…` | `55d0364…` |
| `includesAdmin` | **true** | **false** |
| `fileCount` | **29** | **28** |
| `publicBaseUrl` | staging host | `www.gosaki-piano.com` |
| `intendedRemotePath` | `/cms-kit-staging/gosaki-piano/` | `TBD_G-20i` (upload STOP) |
| `admin/` in package | **yes** | **no** |

---

## 7. Not executed

| Item | Status |
| --- | --- |
| FTP / staging manual upload | **no** (operator when needed) |
| Production upload | **no** |
| DB write / SQL | **no** |

---

## 8. Remaining work

1. **Operator staging upload** — when content changes need reflection on live staging
2. **Production upload** — still blocked (`TBD_G-20i`, G-20j preflight)
3. **Optional:** regen production at `c9d35d7` if parity with staging HEAD desired before cutover

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20t5-gosaki-staging-profile-current-head-regen-dry-run.mjs
npm run verify:manual-upload
```
