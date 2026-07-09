# G-20u4 — Verify site package generic CLI

**Phase:** `G-20u4-verify-site-package-generic-cli`  
**Status:** **complete** — generic verifier CLI + shared core · Gosaki wrappers delegate  
**Date:** 2026-07-09  
**Base commit:** `bbb174f`  
**Prior:** G-20u3 build-site-package generic CLI

| Check | Status |
| --- | --- |
| `verify-site-package.mjs` | **yes** |
| Shared core | **yes** (`verify-site-package-core.mjs`) |
| Gosaki extensions | **yes** (`verify-site-package-gosaki-extensions.mjs`) |
| Legacy verifiers retained | **yes** |
| FTP / deploy | **not executed** |

---

## Gates

```txt
verifySitePackageGenericCliComplete: true
phase: G-20u4-verify-site-package-generic-cli
ftpUploadExecuted: false
deployExecuted: false
cursorDbWriteExecuted: false
legacyVerifierRemoved: false
```

---

## 1. CLI specification

```bash
node tools/static-to-astro/scripts/verify-site-package.mjs \
  --site gosaki-piano \
  --profile staging

node tools/static-to-astro/scripts/verify-site-package.mjs \
  --site gosaki-piano \
  --profile production
```

| Flag | Required | Description |
| --- | --- | --- |
| `--site` | yes | Registry `siteKey` |
| `--profile` | yes | `staging` \| `production` |
| `--package-dir` | no | Override package path (default from registry) |
| `--help` | no | Usage |

**npm:**

```bash
npm run verify:site-package -- --site gosaki-piano --profile staging
npm run verify:site-package -- --site gosaki-piano --profile production
```

---

## 2. Verification scope

### Registry-driven (all sites)

| Field / check | Source |
| --- | --- |
| `targetEnvironment` | registry `packageProfiles` |
| `packageProfileName` | registry |
| `siteKey` | registry (if present in MANIFEST) |
| `publicBaseUrl` | registry |
| `intendedRemotePath` | registry |
| `includesAdmin` | registry |
| `sourceCommit` / `generatedAt` | must exist in MANIFEST |
| `fileCount` | must be > 0 |
| Sitemap safety | no admin/api/preview/draft/legacy month root |
| `/schedule/2026-08/` | page + sitemap entry |
| Staging | `admin/` present when `includesAdmin=true`; sitemap excludes `/admin/` |
| Production | `admin/` absent |

### Gosaki extensions (`siteKey === gosaki-piano`)

- **Staging:** schedule hub/month HTML, discography structure, index nav/footer (from legacy G-7g verifier)
- **Production:** production SEO canonical/og:url, robots/sitemap-index, discography title cleanup

---

## 3. Wrapper compatibility

| Legacy verifier | Behavior |
| --- | --- |
| `verify-manual-upload-package.mjs` | Delegates to `verifySitePackage(gosaki-piano, staging)` |
| `verify-g20i3-gosaki-production-package-admin-exclusion.mjs` | Runs generic verify + G-20i3-specific asserts (file count, docs) |

---

## 4. Freshness (G-20t6)

`verify-site-package` checks **`sourceCommit` exists** — it does **not** compare to current git HEAD.

| Step | Command |
| --- | --- |
| Package structure / content | `verify:site-package` |
| Upload freshness (HEAD match) | `verify:package-freshness:staging` \| `:production` |

Regen stamps HEAD at build time. **Any commit after regen makes the package stale** until regen at current HEAD + freshness PASS.

---

## 5. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20u4-verify-site-package-generic-cli.mjs
```

---

## 6. Not executed

| Item | Status |
| --- | --- |
| FTP / deploy | **no** |
| DB write | **no** |
| Package regen (optional) | **not required** for G-20u4 |
| Legacy verifier removal | **no** |

---

## 7. Next

| Phase | Scope |
| --- | --- |
| **G-20u5** | npm convenience scripts + freshness by `--site` |
