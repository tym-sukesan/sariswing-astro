# CMS Core v2 — Gosaki site-generator-hooks HTML baseline

- **Phase:** `cms-core-v2-gosaki-site-generator-hooks-html-baseline`
- **Date:** 2026-07-30
- **Status:** **COMPLETE (baseline locked; factory later moved in adapter phase)**
- **Package generate / FTP:** **not executed**

---

## Gates

```txt
phase: cms-core-v2-gosaki-site-generator-hooks-html-baseline
CMS_CORE_V2_GOSAKI_SITE_GENERATOR_HOOKS_HTML_BASELINE_COMPLETE: true
FACTORY_MOVED: true (follow-up: cms-core-v2-gosaki-site-generator-hooks-adapter)
IMPORT_GRAPH_CHANGED: true (adapter phase only — baseline fixtures unchanged)
HTML_GENERATION_CHANGED: false
RUNTIME_BEHAVIOR_CHANGED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## Purpose

Lock deterministic hook / inject outputs **before** moving `createGosakiPianoHookMethods` into a site adapter, so HTML / return shapes cannot silently drift.

---

## Surface ↔ hook map

| Surface | Hook / path | Baseline |
| --- | --- | --- |
| Schedule route transform | `transformAnalysisPages` | deep-equal page + SEO |
| Footer SNS | `generateFooter` | exact HTML |
| Schedule usage / skip | `resolveScheduleDataUsage` / `shouldSkipScheduleMonthPage` | routes + booleans |
| Schedule index / month | `applyScheduleDataPages` | exact `.astro` fixtures |
| Home YouTube | `injectYouTubeEmbedIntoHomePage` (postGenerate path) | exact Astro |
| About | `applyAboutContentToPage` (postGenerate path) | exact Astro + flags |
| Contact HubSpot | `buildGosakiContactHubspotEmbedHtmlViaCore` + inject (legacy builder kept as test oracle) | exact HTML/Astro |
| Discography | `patchDiscographyPageMainHtml` | exact HTML + summary |
| Legacy month stub | `applyLegacyMonthStubs` | orchestration + injected stub HTML |
| Admin / postGenerate | `applyPostGenerate` | return keys, applied flags, portal stub, dashboard safety |

---

## Intentionally unfixed

| Surface | Reason |
| --- | --- |
| Full multi-route Admin page HTML bodies | Large templates; lock return shape + portal stub + safety flags instead |
| `GosakiScheduleList.astro` full component | Large shared template written by schedule apply; hub/month markers locked |
| Real `generateScheduleLegacyMonthStubPage` body | Not exported from `astro-generator`; orchestration locked; substring coverage in url-to-staging verifier |

---

## Verify

```bash
npm run verify:cms-core-v2-gosaki-site-generator-hooks-html-baseline
npm run verify:cms-core-v2-safety-suite
git diff --check
```

---

## Next

Factory move complete: `cms-core-v2-gosaki-site-generator-hooks-adapter`. Keep this baseline green on every further Core/adapter change.
