# CMS Core v2 — site-package verifier extension decoupling

- **Phase:** `cms-core-v2-site-package-verifier-extension-decoupling`
- **Date:** 2026-07-30
- **Status:** **COMPLETE**
- **Package generate / FTP:** **not executed**
- **deployed package `dc1c5b6…`:** **unchanged** (read-only if present)

---

## Gates

```txt
phase: cms-core-v2-site-package-verifier-extension-decoupling
CMS_CORE_V2_SITE_PACKAGE_VERIFIER_EXTENSION_DECOUPLING_COMPLETE: true
CORE_GOSAKI_EXTENSION_IMPORT_REMOVED: true
SITE_EXTENSION_VERIFIER_OPTIONAL: true
RUNTIME_BEHAVIOR_CHANGED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## Separation

**Before:** `verify-site-package-core` → `verify-site-package-gosaki-extensions` + inline `GOSAKI_SITE_KEY` branches
**After:**
- Core: common package/manifest/sitemap/admin safety + optional `siteExtensionVerifier` (at most once when provided; call count not part of return object)
- Adapter: `gosaki-site-package-verifier-adapter.mjs` (PACKAGE_RUN / About bake / schedule months / content extensions)
- Entrypoints inject for Gosaki (`verify-site-package`, `verify-manual-upload`, g20i3/g20u4)
- Return shape unchanged vs pre-decoupling (`ok`, `errors`, `manifest`, `meta`, `profile`, `packageDir`, `publicDist`, `zipName`, `expectAboutSaveUiArmed`, `expectPublicAboutBuildRead`)

---

## Verify

```bash
npm run verify:cms-core-v2-site-package-verifier-extension-decoupling
npm run verify:cms-core-v2-safety-suite
```
