# G-20t6 — Gosaki package freshness gate

**Phase:** `G-20t6-package-freshness-gate`  
**Status:** **complete** — upload preflight freshness check · **no FTP / deploy**  
**Date:** 2026-07-09  
**Base commit:** `3fcb625`  
**Prior:** G-20t3 upload safety hardening · G-20t4 production regen · G-20t5 staging regen

| Check | Status |
| --- | --- |
| Freshness gate implemented | **yes** |
| Staging + production applicable | **yes** |
| Stale package → STOP | **yes** |
| FTP / deploy executed | **no** |

---

## Gates

```txt
packageFreshnessGateComplete: true
phase: G-20t6-package-freshness-gate
ftpUploadExecuted: false
deployExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
```

---

## 1. Purpose

Prevent uploading a **stale** manual-upload package when git HEAD has moved since package build.

| Risk | Gate |
| --- | --- |
| Old package after new commits | `sourceCommit` must match current HEAD |
| Unclear build age | `generatedAt` shown in preflight + README/CHECKLIST |
| Wrong environment upload | Combined with G-20t3 `targetEnvironment` / `packageProfileName` |

---

## 2. Specification

### Rule

```txt
IF manifest.sourceCommit matches current git HEAD → PASS (fresh)
IF manifest.sourceCommit !== current HEAD       → STOP (stale — do not upload)
```

**Match logic:** full SHA or short SHA prefix match (either direction).

### Fields used

| Field | Role |
| --- | --- |
| `sourceCommit` | Git HEAD at package build time — **gate key** |
| `generatedAt` | ISO timestamp — operator visibility |
| `packageProfileName` | `staging` \| `production` |
| `targetEnvironment` | `staging` \| `production` |

### STOP behavior

- Upload preflight exits **non-zero**
- Operator must regen package at current HEAD before FTP
- No automatic FTP / no auto-regen in this phase

---

## 3. Implementation

| File | Role |
| --- | --- |
| `scripts/lib/package-upload-safety.mjs` | `validatePackageFreshness` · `verifyPackageUploadFreshness` · `commitsMatch` |
| `scripts/verify-package-upload-freshness.mjs` | Upload preflight CLI |
| `scripts/lib/manual-upload-package.mjs` | README/CHECKLIST freshness section |
| `fixtures/package-freshness/stale-manifest.mock.json` | Stale mock for verifier |

---

## 4. Operator commands (before FTP)

### Staging

```bash
cd tools/static-to-astro
npm run verify:package-freshness:staging
```

### Production

```bash
cd tools/static-to-astro
npm run verify:package-freshness:production
```

**Expected output (fresh):**

```txt
=== Package freshness gate (G-20t6) ===
fresh: PASS
generatedAt: 2026-07-09T...
manifest sourceCommit: 3fcb625...
current git HEAD: 3fcb625...
=== UPLOAD PREFLIGHT: PASS (fresh package) ===
```

**Expected output (stale):**

```txt
fresh: STOP
...
=== UPLOAD PREFLIGHT: STOP (stale package) ===
```

Regen if stale:

| Profile | Command |
| --- | --- |
| staging | `node scripts/build-gosaki-staging-admin-package.mjs` |
| production | `npm run build:gosaki-production-package` |

---

## 5. Staging vs production scope

| Profile | Package path | Preflight npm script |
| --- | --- | --- |
| staging | `output/manual-upload/gosaki-piano/` | `verify:package-freshness:staging` |
| production | `output/manual-upload/gosaki-piano-production/` | `verify:package-freshness:production` |

Same gate logic; different package directories.

---

## 6. Relationship to G-20t3

G-20t3 records `sourceCommit` + `generatedAt` in MANIFEST.  
G-20t6 **enforces** them at upload preflight time.

Other G-20t3 gates (remote path, includesAdmin, mix-up prevention) still apply after freshness PASS.

---

## 7. Not executed

| Item | Status |
| --- | --- |
| FTP / deploy | **no** |
| Package regen (G-20t6 phase) | **no** (unless operator runs separately) |
| DB write / SQL | **no** |

---

## 8. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20t6-package-freshness-gate.mjs
```

Mock stale manifest: `fixtures/package-freshness/stale-manifest.mock.json`

On-disk packages built at older HEAD (e.g. `c9d35d7` staging vs `3fcb625` HEAD) also trigger STOP without regen.
