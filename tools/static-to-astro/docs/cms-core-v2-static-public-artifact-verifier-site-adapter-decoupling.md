# CMS Core v2 — static-public artifact verifier site-adapter decoupling

- **Phase:** `cms-core-v2-static-public-artifact-verifier-site-adapter-decoupling`
- **Date:** 2026-07-30
- **Status:** **COMPLETE**
- **Package generate / FTP:** **not executed**

---

## Gates

```txt
phase: cms-core-v2-static-public-artifact-verifier-site-adapter-decoupling
CMS_CORE_V2_STATIC_PUBLIC_ARTIFACT_VERIFIER_SITE_ADAPTER_DECOUPLING_COMPLETE: true
CORE_GOSAKI_ADMIN_PUBLIC_ENV_IMPORT_REMOVED: true
STAGING_REF_STOP_UNCHANGED: true
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

**Before:** `static-public-artifact-verifier.mjs` → `gosaki-staging-admin-public-env.mjs`
**After:**
- Core accepts optional `resolveEnvAnonKey` (fail closed when unset)
- Adapter `gosaki-static-public-anon-key-resolver.mjs` owns env load
- Entrypoints inject: `verify-static-public-artifact.mjs`, `public-dist-ftp-deployer.mjs`, `url-to-staging-pipeline.mjs` (Gosaki siteKey)

Anon JWT allowlist / service_role reject / attribute strip rules unchanged.

---

## Verify

```bash
npm run verify:cms-core-v2-static-public-artifact-verifier-adapter
npm run verify:cms-core-v2-safety-suite
```
