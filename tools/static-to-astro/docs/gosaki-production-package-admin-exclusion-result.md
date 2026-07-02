# G-20i3 — Gosaki production package admin exclusion result

**Phase:** `G-20i3-gosaki-production-package-admin-exclusion`  
**Status:** **complete** — production package rebuilt without `admin/`; verifier **63/63 PASS**  
**Date:** 2026-07-01  
**Base commit:** `d34646d`  
**Prior:** [gosaki-production-upload-finalization-admin-and-remote-path.md](./gosaki-production-upload-finalization-admin-and-remote-path.md) (G-20i2)

| Check | Status |
| --- | --- |
| Admin excluded from production package | **yes** |
| Production package rebuild | **yes** (local) |
| public-dist file count | **26** |
| SEO / content verify | **PASS** |
| FTP / upload | **no** |
| DNS / SSL | **no** |
| DB write | **no** |

---

## Gates

```txt
gosakiProductionPackageAdminExclusionComplete: true
phase: G-20i3-gosaki-production-package-admin-exclusion
productionPackageBuildExecuted: true
uploadFileCount: 26
packageTotalFileCount: 30
adminExcludedFromPackage: true
includeGosakiReadOnlyAdmin: false
ftpUploadExecuted: false
packageRegenExecuted: true
cursorDbWriteExecuted: false
dnsChangeExecuted: false
sslChangeExecuted: false
readyForG20jManualProductionUpload: false
readyForG20ui1AdminUiAdjustment: true
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Admin exclusion rationale (G-20i2 Option B)

- Hosted admin **deferred** — client does not operate `/admin/` on production yet.
- CMS updates: operator local regen → manual upload.
- Read-only admin exposes staging anon key + auth UI if uploaded to `www.gosaki-piano.com`.
- Astro source still generates `src/pages/admin/` at convert time — **excluded at static-public copy**, not deleted from source.

---

## 2. Implementation changes

| File | Change |
| --- | --- |
| `config/sites/gosaki-piano.deploy-profiles.json` | `includeGosakiReadOnlyAdmin: false` (production) |
| `scripts/lib/gosaki-package-build-profile.mjs` | validates + exports `includeGosakiReadOnlyAdmin` |
| `scripts/lib/static-public-artifact-verifier.mjs` | explicit override (no auto-include admin) |
| `scripts/verify-static-public-artifact.mjs` | `--include-gosaki-read-only-admin` |
| `scripts/build-gosaki-production-package.mjs` | passes flag; G-20i3 verifier |
| `scripts/lib/manual-upload-package.mjs` | MANIFEST `adminExcludedFromPackage` |
| `scripts/create-manual-upload-package.mjs` | `--include-gosaki-read-only-admin` |
| `package.json` | production scripts updated |
| `scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs` | new verifier |

**Staging:** `build-gosaki-staging-admin-package.mjs` **unchanged**.

---

## 3. Build command

```bash
cd tools/static-to-astro
npm run build:gosaki-production-package
```

**Result:** PASS — static-public copy `excluded: admin`, `copiedCount: 26`.

---

## 4. Output

| Item | Value |
| --- | --- |
| Package dir | `tools/static-to-astro/output/manual-upload/gosaki-piano-production/` |
| public-dist files | **26** |
| Package total (README, zip, manifest) | **30** |
| `public-dist/admin/` | **absent** |
| MANIFEST `fileCount` | **26** |
| MANIFEST `adminExcludedFromPackage` | **true** |
| MANIFEST `includeGosakiReadOnlyAdmin` | **false** |

---

## 5. SEO / content verification

| Check | Result |
| --- | --- |
| Primary routes canonical / og:url | `https://www.gosaki-piano.com` |
| Staging URL leak (primary routes) | **absent** |
| noindex on primary routes | **absent** |
| `Like a Lover（テスト）` / `Mary Ann（テスト）` | **absent** |
| `Like a Lover` / `Mary Ann` | **present** |
| robots / sitemap | production URLs |
| `_astro/` assets | present |

---

## 6. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| FTP / upload | **no** |
| DNS / SSL change | **no** |
| DB write / Save | **no** |
| commit / push | **no** |

---

## 7. Next phases

| Phase | Scope |
| --- | --- |
| **Operator** | Remote path / DNS / SSL / MX checklist (G-20i2 §5) — **required before G-20j** |
| **G-20ui1** | Admin UI adjustment (parallel while server contract pending) |
| **G-20j** | Manual FTP — **STOP** until remote path confirmed |

---

## 8. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs
```

**Result:** 63 passed, 0 failed.
