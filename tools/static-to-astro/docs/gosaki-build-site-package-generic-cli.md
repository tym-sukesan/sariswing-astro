# G-20u3 — Build site package generic CLI

**Phase:** `G-20u3-build-site-package-generic-cli`  
**Status:** **complete** — generic CLI + shared core · Gosaki wrappers delegate  
**Date:** 2026-07-09  
**Base commit:** `567b169`  
**Prior:** G-20u2 site registry foundation

| Check | Status |
| --- | --- |
| `build-site-package.mjs` | **yes** |
| Shared core | **yes** (`build-site-package-core.mjs`) |
| Gosaki wrappers retained | **yes** (delegate to core) |
| FTP / deploy | **not executed** |

---

## Gates

```txt
buildSitePackageGenericCliComplete: true
phase: G-20u3-build-site-package-generic-cli
ftpUploadExecuted: false
deployExecuted: false
cursorDbWriteExecuted: false
gosakiWrapperRemoved: false
```

---

## 1. CLI specification

```bash
node tools/static-to-astro/scripts/build-site-package.mjs \
  --site gosaki-piano \
  --profile staging

node tools/static-to-astro/scripts/build-site-package.mjs \
  --site gosaki-piano \
  --profile production \
  --dry-run
```

| Flag | Required | Description |
| --- | --- | --- |
| `--site` | yes | Registry `siteKey` (e.g. `gosaki-piano`) |
| `--profile` | yes | `staging` \| `production` |
| `--dry-run` | no | Print plan + manifestMeta only — no convert/package |
| `--help` | no | Usage |

**npm:**

```bash
npm run build:site-package -- --site gosaki-piano --profile staging
npm run build:site-package -- --site gosaki-piano --profile production --dry-run
```

---

## 2. Pipeline (shared core)

1. `resolveSitePackageBuildProfile(siteKey, profileName)` — registry
2. Validate public Supabase env (Gosaki interim — all kit sites use staging ref)
3. `convert-static-to-astro.mjs` — fixture → astro out
4. `verify-static-public-artifact.mjs` — static-public + manifest
5. `createManualUploadPackage` — registry manifest fields (`siteKey`, `cmsSiteSlug`, …)
6. Site-specific post-build verifier (Gosaki: G-7g / G-20i3)

**No FTP.** Production `intendedRemotePath: TBD_G-20i` — upload remains blocked.

---

## 3. Wrapper compatibility

| Wrapper | Delegates to |
| --- | --- |
| `build-gosaki-staging-admin-package.mjs` | `runSitePackageBuild({ siteKey: gosaki-piano, profileName: staging })` |
| `build-gosaki-production-package.mjs` | `runSitePackageBuild({ siteKey: gosaki-piano, profileName: production })` |

Existing npm scripts unchanged:

- `build:gosaki-production-package`
- `manual-upload:package` (still used by external docs; core calls `createManualUploadPackage` directly)

---

## 4. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20u3-build-site-package-generic-cli.mjs
```

---

## 5. Next

| Phase | Scope |
| --- | --- |
| **G-20u4** | `verify-site-package.mjs` parameterized |
| **G-20u5** | npm `package:site` / freshness by `--site` |

---

## 6. Not executed

| Item | Status |
| --- | --- |
| FTP / deploy | **no** |
| DB write | **no** |
| Wrapper removal | **no** |

---

## 7. Package freshness (G-20t6)

G-20u3 regen sets `MANIFEST.sourceCommit` to **git HEAD at regen time**. Freshness is evaluated at **upload preflight**, not at regen time alone.

| When | Freshness |
| --- | --- |
| Immediately after regen | **fresh** — `sourceCommit` === current HEAD |
| After any commit advances HEAD | **stale** — `sourceCommit` !== new HEAD |
| Before upload | Regen at **current** HEAD, then `verify:package-freshness:*` must **PASS** |

```bash
npm run verify:package-freshness:staging
npm run verify:package-freshness:production
```

**Do not** assume a package stays fresh after committing tooling changes (including G-20u3). Committing G-20u3 advances HEAD; any package built at the prior HEAD becomes stale until regen.
