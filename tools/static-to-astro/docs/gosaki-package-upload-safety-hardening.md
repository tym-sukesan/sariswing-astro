# G-20t3 — Gosaki staging / production package upload safety hardening

**Phase:** `G-20t3-staging-prod-package-upload-safety-hardening`  
**Status:** **complete** — manifest metadata · environment-aware docs · verifier hardening · **no FTP / deploy**  
**Date:** 2026-07-09  
**Base commit:** `3e78c84`  
**Prior:** G-20t1 sitemap admin exclusion · G-20t2 schedule month discovery · G-20i3 production admin exclusion

| Check | Status |
| --- | --- |
| Package metadata clarified | **yes** |
| Production admin exclusion verified | **yes** |
| Upload checklist hardened | **yes** |
| FTP / deploy executed | **no** |

---

## Gates

```txt
gosakiPackageUploadSafetyHardeningComplete: true
phase: G-20t3-staging-prod-package-upload-safety-hardening
ftpUploadExecuted: false
deployExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
packageRegenExecuted: local only (if operator env present)
```

---

## 1. Problem

Manual upload accidents to prevent:

| Risk | Mitigation |
| --- | --- |
| Staging / production package mix-up | `targetEnvironment` + `packageProfileName` in MANIFEST + README |
| Admin in production upload | `includesAdmin: false` + verifier blocks `admin/` |
| Wrong remote path (root `/`, empty, TBD) | `intendedRemotePath` + STOP checklist |
| Uploading `public-dist/` folder itself | README + CHECKLIST explicit warning |
| Stale package upload | `generatedAt` + `sourceCommit` in MANIFEST · **G-20t6 enforces at preflight** |
| mirror / sync / CLI FTP | Prohibited in README + CHECKLIST |

---

## 2. Package layout (unchanged structure)

```
output/manual-upload/gosaki-piano/              ← staging (admin allowed)
output/manual-upload/gosaki-piano-production/   ← production (admin forbidden)
  ├── public-dist/          ← upload CONTENTS only
  ├── MANIFEST.json         ← read first
  ├── README-UPLOAD.md
  ├── CHECKLIST.md
  └── *.zip
```

**Zip names (G-20t3):**

| Profile | Zip |
| --- | --- |
| staging | `gosaki-piano-manual-upload.zip` |
| production | `gosaki-piano-production-manual-upload.zip` |

---

## 3. MANIFEST.json metadata (G-20t3)

| Field | staging | production |
| --- | --- | --- |
| `phase` | `G-20t3-package-upload-safety-hardening` | same |
| `packageProfileName` | `staging` | `production` |
| `targetEnvironment` | `staging` | `production` |
| `includesAdmin` | `true` | `false` |
| `intendedRemotePath` | `/cms-kit-staging/gosaki-piano/` | `TBD_G-20i` (STOP until confirmed) |
| `publicBaseUrl` | staging host URL | `https://www.gosaki-piano.com/` |
| `deployBase` | `/cms-kit-staging/gosaki-piano/` | `/` |
| `safeForStaticFtp` | `true` | `true` |
| `generatedAt` | ISO timestamp | ISO timestamp |
| `sourceCommit` | git HEAD at build | git HEAD at build |
| `ftpAutoDeployUsed` | `false` | `false` |

Legacy fields retained: `includeGosakiReadOnlyAdmin`, `adminExcludedFromPackage`, `stagingUrl` (alias of `publicBaseUrl`).

---

## 4. Production admin exclusion (verifier guarantees)

Production package must NOT contain:

- `admin/index.html`
- `__admin-staging-shell/`
- `api/` routes in public-dist

Sitemap must NOT list:

- `/admin/`
- `/__admin-staging-shell/`
- `/api/`
- `/preview/` · `/draft/`
- legacy month root `/YYYY-MM/` (non-`/schedule/`)

Verifier: `verify-g20i3-gosaki-production-package-admin-exclusion.mjs` (extended G-20t3 checks).

---

## 5. Staging package (admin allowed)

- `includesAdmin: true` when read-only admin present in public-dist
- `intendedRemotePath` must be under `/cms-kit-staging/`
- README warns: **do not upload to production root**

---

## 6. Upload checklist hardening

CHECKLIST.md now requires:

1. Read `MANIFEST.json` — `targetEnvironment`, `packageProfileName`, `includesAdmin`
2. Confirm `generatedAt` and `sourceCommit`
3. STOP if `intendedRemotePath` is `/`, empty, or `TBD_*`
4. Upload **contents** of `public-dist/`, not the folder
5. No mirror / sync / delete-remote-extras / CLI FTP
6. No staging ↔ production mix-up

---

## 7. Implementation files

| File | Change |
| --- | --- |
| `scripts/lib/manual-upload-package.mjs` | G-20t3 manifest + environment-aware README/CHECKLIST |
| `scripts/lib/package-upload-safety.mjs` | Shared safety helpers + production sitemap sanitization on package copy |
| `scripts/create-manual-upload-package.mjs` | CLI: `--target-environment`, `--package-profile`, `--intended-remote-path` |
| `scripts/verify-manual-upload-package.mjs` | Staging manifest + sitemap safety |
| `scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs` | G-20t3 manifest + sitemap + admin |
| `scripts/verify-g20t3-staging-prod-package-upload-safety-hardening.mjs` | Phase verifier |
| `package.json` | npm scripts pass profile metadata |

---

## 8. Regenerate packages (local only)

```bash
cd tools/static-to-astro
npm run manual-upload:package
npm run verify:manual-upload

npm run manual-upload:package:gosaki-production
npm run verify:manual-upload:gosaki-production

npm run verify:package-upload-safety
```

Full rebuild (requires `.env` public Supabase keys):

```bash
node scripts/build-gosaki-staging-admin-package.mjs
node scripts/build-gosaki-production-package.mjs
```

**No FTP / deploy in this phase.**

---

## 9. Safety

| Item | Status |
| --- | --- |
| FTP / deploy / mirror --delete | **not executed** |
| DB write / SQL | **not executed** |
| `src/**` changes | **none** |
| Secrets / env files | **unchanged** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20t3-staging-prod-package-upload-safety-hardening.mjs
```
