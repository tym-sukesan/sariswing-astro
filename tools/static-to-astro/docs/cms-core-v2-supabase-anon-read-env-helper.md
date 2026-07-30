# CMS Core v2 — Supabase anon read env helper

- **Phase:** `cms-core-v2-next-high-value-safe-extraction`
- **Date:** 2026-07-30
- **Status:** **COMPLETE**
- **Extraction:** relocate `resolveSupabaseAnonReadEnv` + `loadDotEnvLocal` to site-agnostic Core
- **Runtime behavior:** unchanged (re-export + identical merge rules)
- **Package / FTP / DB / Save / Edge:** none

---

## Gates

```txt
phase: cms-core-v2-next-high-value-safe-extraction
CMS_CORE_V2_NEXT_HIGH_VALUE_SAFE_EXTRACTION_COMPLETE: true
EXTRACTION: supabase-anon-read-env-utils
RUNTIME_BEHAVIOR_CHANGED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## SoT / dependency

```txt
supabase-anon-read-env-utils.mjs   (Core SoT)
  ↑ schedule-read (re-export)
  ↑ discography-read
  ↑ site-cms-features (embeds + page_fields)
```

Core **must not** import Gosaki modules.

---

## Why this extraction

- Already shared by Schedule · Discography · YouTube · About build-reads
- Was incorrectly owned by `supabase-schedule-read.mjs`
- High next-site reuse; no HTML / Admin UI / Save / approval / Edge change

---

## Deferred (not this phase)

- Build-read try/catch envelope skeleton (YT+About)
- Loader `*DataSource` / reason-code unify
- Admin Save-gate / dataset bake / package-marker generalization
- Gosaki `gosaki-staging-admin-public-env` merge into Core

---

## Verify

```bash
npm run verify:cms-core-v2-supabase-anon-read-env
npm run verify:cms-core-v2-safety-suite
```
