# G-20u5 — Site package npm convenience & freshness flow

**Phase:** `G-20u5-site-package-npm-convenience-and-freshness-flow`  
**Status:** **complete** — npm convenience scripts + operator flow documented  
**Date:** 2026-07-09  
**Base commit:** `45c84c4`  
**Prior:** G-20u3 build CLI · G-20u4 verify CLI

| Check | Status |
| --- | --- |
| npm convenience scripts | **yes** |
| Operator flow documented | **yes** |
| Freshness semantics | **yes** |
| FTP / deploy | **not executed** |

---

## Gates

```txt
sitePackageNpmConvenienceAndFreshnessFlowComplete: true
phase: G-20u5-site-package-npm-convenience-and-freshness-flow
ftpUploadExecuted: false
deployExecuted: false
cursorDbWriteExecuted: false
productionUploadAllowed: false
```

---

## 1. npm scripts (G-20u5)

### Generic (any registered site)

| Script | Command |
| --- | --- |
| `build:site-package` | `node scripts/build-site-package.mjs` — pass `--site` `--profile` |
| `verify:site-package` | `node scripts/verify-site-package.mjs` — pass `--site` `--profile` |

### Gosaki convenience (gosaki-piano)

| Script | Purpose |
| --- | --- |
| `build:gosaki:staging` | Full staging package build at current HEAD |
| `build:gosaki:production` | Full production package build at current HEAD |
| `build:gosaki:staging:dry-run` | Plan only — no convert/package |
| `build:gosaki:production:dry-run` | Plan only |
| `verify:gosaki:staging` | Package structure + content verify |
| `verify:gosaki:production` | Package structure + content verify |
| `preflight:gosaki:staging` | `verify:gosaki:staging` then `verify:package-freshness:staging` |
| `preflight:gosaki:production` | `verify:gosaki:production` then `verify:package-freshness:production` |

### Freshness (G-20t6)

| Script | Purpose |
| --- | --- |
| `verify:package-freshness:staging` | MANIFEST `sourceCommit` === git HEAD |
| `verify:package-freshness:production` | Same for production package |

### Legacy (retained — do not remove)

| Script | Notes |
| --- | --- |
| `build:gosaki-production-package` | Wrapper → `build-site-package` core |
| `verify:manual-upload` | Legacy staging verifier → generic core |
| `verify:manual-upload:gosaki-production` | G-20i3 production verifier |
| `manual-upload:package` | Package-only step (used by older docs) |

---

## 2. Operator flow — staging

```txt
1. npm run build:gosaki:staging          # at current HEAD — stamps sourceCommit
2. npm run verify:gosaki:staging         # structure/content PASS required
3. npm run verify:package-freshness:staging   # HEAD match PASS required
4. npm run preflight:gosaki:staging      # steps 2+3 combined (optional)
5. Review output/manual-upload/gosaki-piano/CHECKLIST.md
6. Manual FTP upload by operator only — no auto FTP
```

**Remote path:** `/cms-kit-staging/gosaki-piano/`  
**Upload contents:** `public-dist/` files only (not the folder itself)

---

## 3. Operator flow — production

```txt
1. npm run build:gosaki:production       # at current HEAD
2. npm run verify:gosaki:production      # structure/content PASS required
3. npm run verify:package-freshness:production   # HEAD match PASS required
4. npm run preflight:gosaki:production   # steps 2+3 combined (optional)
5. G-20j production upload preflight (DNS/SSL/MX/remote path/sign-off) — still required
6. Production upload: STOP — intendedRemotePath TBD_G-20i
```

**Production upload remains NG** until G-20j cutover is approved and `intendedRemotePath` is finalized.

---

## 4. Freshness semantics (G-20t6)

| State | Meaning |
| --- | --- |
| Immediately after `build:*` at HEAD | **fresh** — `MANIFEST.sourceCommit` === current HEAD |
| After any git commit advances HEAD | **stale** — prior package must not be uploaded |
| `verify:site-package` PASS | Structure/content OK — **does not authorize upload** |
| `verify:package-freshness:*` PASS | HEAD match OK — **required before upload** |

**Rule:** Upload requires **both** `verify:gosaki:*` PASS **and** `verify:package-freshness:*` PASS at **current** HEAD.

Committing G-20u5 (or any tooling change) advances HEAD → on-disk packages become stale → **rebuild at current HEAD before upload**.

---

## 5. Quick reference

```bash
# Plan only (no build)
npm run build:gosaki:staging:dry-run
npm run build:gosaki:production:dry-run

# Full operator preflight chain (structure then freshness)
npm run preflight:gosaki:staging
npm run preflight:gosaki:production

# Generic (future sites)
npm run build:site-package -- --site gosaki-piano --profile staging
npm run verify:site-package -- --site gosaki-piano --profile staging
```

---

## 6. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20u5-site-package-npm-convenience-and-freshness-flow.mjs
```

---

## 7. Not executed

| Item | Status |
| --- | --- |
| FTP / deploy | **no** |
| DB write | **no** |
| Full package regen | **not required** (dry-run + on-disk verify only) |
| Production upload | **STOP** |

---

## 8. Next

| Phase | Scope |
| --- | --- |
| **G-20u6+** | Second site pilot · registry-driven extensions |
