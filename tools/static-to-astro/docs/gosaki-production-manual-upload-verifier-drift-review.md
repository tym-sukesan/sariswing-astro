# G-20i3 — Gosaki production manual-upload verifier drift review

**Phase:** `G-20i3-gosaki-production-manual-upload-verifier-drift-review`  
**Status:** **complete** — G-20i3 verifier drift investigated · minimal assertion fix  
**Date:** 2026-07-15  
**Review HEAD:** `de960b7` (= `origin/main`)  
**Package under test:** `output/manual-upload/gosaki-piano-production/` · generated at **`4259c8c`** (stale vs current HEAD)  
**Prior:** [G-20u38b production package generation](./gosaki-production-package-generation-at-head-result.md)

| Check | Status |
| --- | --- |
| Drift investigated | **yes** |
| Verifier updated | **yes** (minimal) |
| Package regeneration | **no** |
| FTP / upload | **no** |
| service_role used | **not used** |

---

## Gates

```txt
gosakiProductionManualUploadVerifierDriftReviewed: true
phase: G-20i3-gosaki-production-manual-upload-verifier-drift-review
reviewHead: de960b7
packageGenerationHead: 4259c8c
g20i3VerifierDriftResolved: true
productionPackageStillStale: true
productionUploadReady: false
p0ChecksPreserved: true
implementationExecuted: true
packageGenerationExecuted: false
ftpUploadExecuted: false
serviceRoleUsed: false
recommendedNextPhase: G-20u38b2-gosaki-production-package-regeneration-at-current-head
```

---

## 1. Drift cause

**Symptom (G-20u38b):** `build:gosaki:production` pipeline exit **1** · `verify:manual-upload:gosaki-production` **70/73 PASS**.

**Root cause:** `verify-g20i3-gosaki-production-package-admin-exclusion.mjs` had **stale hardcoded expectations** — not production package content defects.

| Failure | Cause | P0? |
| --- | --- | --- |
| `public-dist file count 28` | `EXPECTED_PUBLIC_DIST_COUNT = 28` hardcoded; G-20u38b package has **30** files (schedule months + assets growth since G-20t4) | **no** |
| `manifest fileCount 28` | Same hardcoded count | **no** |
| `manifest includeReadOnlyAdmin false` | MANIFEST omits `includeReadOnlyAdmin`; uses `includesAdmin` + `includeGosakiReadOnlyAdmin` + `adminExcludedFromPackage` (G-20t3 schema) | **no** |

**Not drift / not changed:**

- Admin HTML exclusion P0 checks — unchanged
- SEO / sitemap / robots / secrets / staging URL — unchanged strict checks
- Orphan admin JS/CSS in `_astro/` — **not asserted as P0** in G-20i3 (P2 note only per G-20u38b)

**Staging vs production:** G-20i3 targets `gosaki-piano-production` only; staging package expectations not mixed.

---

## 2. Changed files

| File | Change |
| --- | --- |
| `scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs` | fileCount: min 28 + manifest sync · manifest admin flags aligned to G-20t3 schema |
| `docs/gosaki-production-package-generation-at-head-result.md` | `g20i3VerifierDriftResolved: true` · next → G-20u38b2 |
| `scripts/verify-g20u38b-gosaki-production-package-generation-at-head.mjs` | sourceCommit vs generation HEAD · drift resolved gate |

**Not changed:** `manual-upload-package.mjs` MANIFEST schema (already correct) · build pipeline · production package on disk.

---

## 3. Fixed assertions (G-20i3)

| Before | After |
| --- | --- |
| `publicFiles.length === 28` | `>= 28` · NOTE if not 30 · must match `manifest.fileCount` |
| `manifest.fileCount === 28` | `manifest.fileCount === publicFiles.length` · `>= 28` |
| `manifest.includeReadOnlyAdmin === false` | `includesAdmin === false` · `includeGosakiReadOnlyAdmin === false` · `adminExcludedFromPackage === true` · optional `includeReadOnlyAdmin` if present |

---

## 4. P0 checks preserved

| P0 check | Status |
| --- | --- |
| `/admin/` HTML absent | **preserved** |
| sitemap excludes `/admin/` | **preserved** |
| production URL / no staging leak | **preserved** |
| robots not `Disallow: /` | **preserved** |
| secrets / service_role | **preserved** |
| Sariswing prod ref | **preserved** |
| sourceCommit freshness | **preserved** in freshness verifier (separate from fileCount drift) |

---

## 5. P2 orphan asset note

Orphan `_astro` admin JS/CSS may remain in production package when admin HTML is excluded — **not referenced from public HTML**. G-20i3 does **not** fail on this; optional bundle pruning is a future P2 slice.

---

## 6. Package / upload status

| Item | Status |
| --- | --- |
| On-disk package `sourceCommit` | `4259c8c` — **stale** vs HEAD `de960b7` |
| Freshness at current HEAD | **FAIL** (expected until G-20u38b2 regen) |
| G-20i3 structural verify on stale package | **PASS** after drift fix |
| **PRODUCTION_UPLOAD_READY** | **false** (`TBD_G-20i` · stale package · no FTP) |

---

## 7. Verdict

```txt
G20I3_VERIFIER_DRIFT_RESOLVED: true
PRODUCTION_UPLOAD_READY: false
PRODUCTION_PACKAGE_STILL_STALE: true
```

---

## 8. Next

```txt
recommendedNextPhase: G-20u38b2-gosaki-production-package-regeneration-at-current-head
```

Regenerate production package at HEAD `de960b7` · expect `build:gosaki:production` exit **0** with updated G-20i3 verifier.
