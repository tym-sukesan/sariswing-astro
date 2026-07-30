# CMS Core v2 — site-generator-hooks boundary audit

- **Phase:** `cms-core-v2-site-generator-hooks-boundary-audit` (+ follow-up adapter move)
- **Date:** 2026-07-30
- **Status:** **COMPLETE** — audit done; factory moved in `cms-core-v2-gosaki-site-generator-hooks-adapter`
- **Package generate / FTP:** **not executed**

---

## Gates

```txt
phase: cms-core-v2-site-generator-hooks-boundary-audit
CMS_CORE_V2_SITE_GENERATOR_HOOKS_BOUNDARY_AUDIT_COMPLETE: true
CODE_EXTRACT_EXECUTED: false (audit phase)
FOLLOW_UP_ADAPTER_MOVED: true
ADAPTER_PHASE: cms-core-v2-gosaki-site-generator-hooks-adapter
RUNTIME_BEHAVIOR_CHANGED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## Import graph (after adapter move + lazy registration)

```txt
astro-generator.mjs
  → site-generator-hooks.mjs (Core: resolve / merge / DEFAULT / register / ensure*)
       → site-registry (loadSiteRegistry / getSiteRegistryEntry)
       → (lazy) import(registry.generatorHooksAdapter) when siteKey/fixture matches

gosaki-site-generator-hooks-adapter.mjs (only when ensured)
  → gosaki-* presentation modules
  → site-generator-hooks.registerSiteGeneratorHookFactory

Core site-generator-hooks.mjs
  → (no gosaki-* imports)
  → (no static adapter import)
```

Callers use `resolveSiteGeneratorHooksAsync` / `generateAstroProject` (awaits ensure). Generic Core-only or pilot siteKey leaves factories without Gosaki.

---

## Classification

| Layer | Items |
| --- | --- |
| **Core共通** | `DEFAULT_SITE_GENERATOR_HOOKS`, `mergeSiteGeneratorHooks`, `resolveSiteGeneratorHooks`, `isRegisteredSiteGeneratorHook`, `registerSiteGeneratorHookFactory`, `SITE_GENERATOR_HOOK_FACTORIES` map |
| **Gosaki site adapter** | `createGosakiPianoHookMethods` + presentation imports (`gosaki-site-generator-hooks-adapter.mjs`) |
| **source adapter** | Wix live-crawl month basename / schedule fixture matching via registry (in adapter) |
| **HTML presentation** | footer Astro, About/YouTube/Contact/Admin inject, schedule data pages, discography HTML patch, legacy month stubs (adapter) |
| **historical / legacy** | `gosakiScheduleBundle` / `gosakiDiscographyBundle` aliases, `gosaki-static-site` visual slug |

---

## Core→gosaki-* reverse deps (direct imports)

**None** after adapter move. Presentation deps live in `gosaki-site-generator-hooks-adapter.mjs`.

---

## Verify

```bash
npm run verify:cms-core-v2-gosaki-site-generator-hooks-html-baseline
npm run verify:cms-core-v2-safety-suite
git diff --check
```
