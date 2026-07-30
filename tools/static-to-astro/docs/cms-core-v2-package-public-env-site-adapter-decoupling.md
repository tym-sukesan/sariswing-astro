# CMS Core v2 — package public-env site-adapter decoupling

- **Phase:** `cms-core-v2-package-public-env-site-adapter-decoupling`
- **Date:** 2026-07-30
- **Status:** **COMPLETE**
- **Core:** `site-package-build-preflight.mjs` + `build-site-package-core.mjs` (`resolveBuildEnv`)
- **Gosaki adapter:** `gosaki-package-build-env-preflight.mjs` (`createGosakiResolveBuildEnv`)
- **Package generate / FTP:** **not executed**

---

## Gates

```txt
phase: cms-core-v2-package-public-env-site-adapter-decoupling
CMS_CORE_V2_PACKAGE_PUBLIC_ENV_SITE_ADAPTER_DECOUPLING_COMPLETE: true
CORE_GOSAKI_PUBLIC_ENV_IMPORT_REMOVED: true
RUNTIME_BEHAVIOR_CHANGED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## Import graph (after)

```txt
build-site-package-core.mjs
  → site-package-build-preflight.mjs   (Core · no gosaki-*)
  ✗ gosaki-staging-admin-public-env     (removed)

build-site-package.mjs / build-gosaki-*-package.mjs
  → createGosakiResolveBuildEnv        (adapter)
  → createGosakiBeforeFirstFilesystemWrite (mutex adapter)
  → runSitePackageBuild({ resolveBuildEnv, beforeFirstFilesystemWrite })
```

---

## Prefight order

```txt
resolveBuildEnv (staging/production STOP · env merge)
→ git clean
→ beforeFirstFilesystemWrite (Save UI mutex)
→ first filesystem write (stale relocate / convert)
```

Each callback at most **once** per `runSitePackageBuild` invocation.

---

## Verify

```bash
npm run verify:cms-core-v2-package-public-env-adapter
npm run verify:cms-core-v2-safety-suite
npm run verify:cms-core-v2-global-save-arm-mutex-package-gate
```
