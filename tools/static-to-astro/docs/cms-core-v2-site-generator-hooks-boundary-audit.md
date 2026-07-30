# CMS Core v2 — site-generator-hooks boundary audit

- **Phase:** `cms-core-v2-site-generator-hooks-boundary-audit`
- **Date:** 2026-07-30
- **Status:** **COMPLETE (audit-only — no code extract)**
- **Package generate / FTP:** **not executed**

---

## Gates

```txt
phase: cms-core-v2-site-generator-hooks-boundary-audit
CMS_CORE_V2_SITE_GENERATOR_HOOKS_BOUNDARY_AUDIT_COMPLETE: true
CODE_EXTRACT_EXECUTED: false
SELECTED_PURE_HELPER_EXTRACTED: false
DEFER_REASON: no pure helper both reduces Core→gosaki-* and avoids HTML/presentation risk
RUNTIME_BEHAVIOR_CHANGED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## Import graph (summary)

```txt
astro-generator.mjs
  → site-generator-hooks.mjs (resolveSiteGeneratorHooks)
       → site-registry / site-cms-features / schedule-pages / base-url / site-fixture-match
       → gosaki-about-band-profiles
       → gosaki-about-content
       → gosaki-home-youtube-embed
       → gosaki-contact-hubspot-embed
       → gosaki-schedule-data-pages
       → gosaki-staging-read-only-admin
       → gosaki-footer-social
       → supabase-discography-read (patchGosakiDiscographySupabaseFields)
```

Callers: `astro-generator.mjs`, g20u6/u7/u8/u16/u19/u20/u21 verifiers, url-to-staging verifier, About vertical slice verifier.

---

## Classification

| Layer | Items |
| --- | --- |
| **Core共通** | `DEFAULT_SITE_GENERATOR_HOOKS`, `mergeSiteGeneratorHooks`, `resolveSiteGeneratorHooks`, `isRegisteredSiteGeneratorHook`, `SITE_GENERATOR_HOOK_FACTORIES` map, `toCanonicalScheduleMonthPage` (route/SEO only) |
| **Gosaki site adapter** | `createGosakiPianoHookMethods` (entire hook surface) |
| **source adapter** | Wix live-crawl month basename / schedule fixture matching via registry |
| **HTML presentation** | footer Astro, About/YouTube/Contact/Admin inject, schedule data pages, discography HTML patch, legacy month stubs |
| **historical / legacy** | `gosakiScheduleBundle` / `gosakiDiscographyBundle` aliases, `gosaki-static-site` visual slug |

---

## Core→gosaki-* reverse deps (direct imports)

1. `gosaki-about-band-profiles.mjs`
2. `gosaki-about-content.mjs`
3. `gosaki-home-youtube-embed.mjs`
4. `gosaki-contact-hubspot-embed.mjs`
5. `gosaki-schedule-data-pages.mjs`
6. `gosaki-staging-read-only-admin.mjs`
7. `gosaki-footer-social.mjs`

Plus Gosaki-named APIs in `supabase-discography-read.mjs` (`patchGosakiDiscographySupabaseFields`).

---

## Candidate evaluation

| Candidate | Pure? | Reduces gosaki-* imports? | HTML risk | Verdict |
| --- | --- | --- | --- | --- |
| Extract `toCanonicalScheduleMonthPage` | yes | **no** | low | skip (no reverse-dep win) |
| Move `createGosakiPianoHookMethods` → adapter | no (site adapter) | yes | **high** (footer/About/YT/Schedule/Admin/Disco) | defer (not pure helper; needs dedicated phase + HTML fixtures) |
| Split DEFAULT hooks only | yes | **no** | none | skip |

**Selected for this phase:** none extracted — audit-only.

**Recommended next phase (separate approval):** `gosaki-site-generator-hooks-adapter` move of `createGosakiPianoHookMethods` with HTML deep-equality fixtures per surface.

---

## Verify

```bash
npm run verify:cms-core-v2-safety-suite
git diff --check
```
