# CMS Core v2 — residual Core→site dependency audit (+ package-freshness fix)

- **Phase:** `cms-core-v2-residual-core-to-site-dependency-audit`
- **Date:** 2026-07-30
- **Status:** **COMPLETE**
- **Selected fix:** `package-freshness-target.mjs` — drop `gosaki-package-build-profile` import
- **Package generate / FTP:** **not executed**

---

## Gates

```txt
phase: cms-core-v2-residual-core-to-site-dependency-audit
CMS_CORE_V2_RESIDUAL_CORE_TO_SITE_DEPENDENCY_AUDIT_COMPLETE: true
SELECTED_FIX: package-freshness-target-gosaki-profile-import
RUNTIME_BEHAVIOR_CHANGED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## Selected fix

**Before:** `package-freshness-target.mjs` → `gosaki-package-build-profile.mjs`
**After:** `package-freshness-target.mjs` → `site-registry.mjs` only
Legacy `--profile`-only still defaults to `GOSAKI_SITE_KEY` via registry (`resolution: "legacy-gosaki-profile"`).

---

## Next residual reverse deps (not this phase)

1. `supabase-schedule-read` → `gosaki-wix-schedule-extractor` (split wrapper)
2. `verify-site-package-core` → gosaki extensions (inject verifier)
3. `static-public-artifact-verifier` → gosaki admin public-env
4. `site-generator-hooks` → many gosaki-* (high HTML risk)
5. Soft hardcodes: `package-run-marker` / contracts / `deploy-base`

---

## Verify

```bash
npm run verify:g20u10-package-freshness
npm run verify:cms-core-v2-safety-suite
```
