# G-23f — Static-to-Astro CMS preset registry result

**Phase:** `G-23f-static-to-astro-cms-preset-registry`  
**Status:** **complete** — registry + inspect CLI; **no crawl / DB / package / FTP / orchestrator impl**  
**Date:** 2026-07-08  
**Base commit:** `e32ab31`  
**Prior:** [static-to-astro-onboarding-orchestrator-planning.md](./static-to-astro-onboarding-orchestrator-planning.md) (G-23e)

| Artifact | Path |
| --- | --- |
| Registry | `scripts/lib/cms-preset-registry.mjs` |
| Inspect CLI | `scripts/inspect-cms-preset-registry.mjs` |
| Verifier | `scripts/verify-g23f-static-to-astro-cms-preset-registry.mjs` |

| Check | Status |
| --- | --- |
| Registry implemented | **yes** |
| 3 presets defined | **yes** |
| Gosaki config PASS | **yes** |
| DB / network / crawl | **not used** |

---

## Gates

```txt
staticToAstroCmsPresetRegistryComplete: true
phase: G-23f-static-to-astro-cms-preset-registry
readyForG23gSeedExtractorStandardization: true
readyForG23hOrchestratorSkeletonImplementation: true
liveCrawlExecuted: false
networkAccess: false
dbConnectionAttempted: false
dbWriteExecuted: false
packageBuildExecuted: false
ftpUploadExecuted: false
deployExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
serviceRoleUsed: false
```

---

## 1. Purpose

Implement a **read-only CMS preset registry** so the 30-minute onboarding flow can resolve preset → modules → routes → tables → seed policies in code, without DB or network.

---

## 2. Registry role

| Consumer | Usage |
| --- | --- |
| **G-23c validator** | Future: optional preset module check after schema validation |
| **G-23e orchestrator Step 4** | CMS module planner — enabled vs preset, missing pages WARN |
| **G-23g seed extractor** | Per-module extraction strategy + seed policy |
| **Onboarding config authoring** | Defaults for `cms.modules[]` generation |

Registry is **metadata only** — no side effects.

---

## 3. Defined presets

| ID | Label | siteType | Default modules |
| --- | --- | --- | --- |
| `musician-basic` | Musician Basic | `musician-basic` | schedule |
| `lesson-studio-basic` | Lesson Studio Basic | `lesson-studio-basic` | schedule, contact |
| `shop-basic` | Shop Basic | `shop-basic` | news, contact |

---

## 4. musician-basic modules

| ID | enabledByDefault | table | publicRoute | risk |
| --- | --- | --- | --- | --- |
| schedule | **true** | `public.schedules` | `/schedule/` | medium |
| news | false | — | `/news/` | low |
| profile | false | — | `/about/` | low |
| discography | false | `public.discography` | `/discography/` | medium |
| video | false | — | `/` | low |
| contact | false | — | `/contact/` | low |

---

## 5. lesson-studio-basic modules

| ID | enabledByDefault | publicRoute |
| --- | --- | --- |
| schedule | true | `/schedule/` |
| classes | false | `/classes/` |
| instructors | false | `/instructors/` |
| news | false | `/news/` |
| pricing | false | `/pricing/` |
| contact | true | `/contact/` |

---

## 6. shop-basic modules

| ID | enabledByDefault | publicRoute | Notes |
| --- | --- | --- | --- |
| news | true | `/news/` | |
| menu | false | `/menu/` | Menu **and services** (G-23a Menu / Service) |
| access | false | `/access/` | |
| gallery | false | `/gallery/` | |
| contact | true | `/contact/` | |

---

## 7. Exported functions

| Export | Description |
| --- | --- |
| `CMS_PRESET_REGISTRY` | Full preset map |
| `getCmsPreset(id)` | Single preset or null |
| `listCmsPresets()` | All presets |
| `listPresetModules(presetId)` | Module defs for preset |
| `getPresetModule(presetId, moduleId)` | Single module def |
| `validateCmsPresetConfig(config)` | Preset-aware config check |

### validateCmsPresetConfig rules

- `cmsPreset` must exist in registry
- `siteType` must match preset `siteType`
- Each `cms.modules[].id` must exist in preset
- **Unknown module → FAIL**
- **Disabled module → PASS** (planned modules may stay off)
- **Enabled module** — `table`, `publishField`, `publicRoute` must match registry

---

## 8. Gosaki example config connection

`config/onboarding.gosaki-piano.example.json`:

- `cmsPreset`: `musician-basic`
- `siteType`: `musician-basic`
- `schedule` enabled — matches registry defaults
- Other modules disabled — **PASS**

```bash
node tools/static-to-astro/scripts/inspect-cms-preset-registry.mjs
# → Gosaki validateCmsPresetConfig: PASS
```

---

## 9. Relationship to validator / orchestrator / seed extractor

| Layer | G-23f role |
| --- | --- |
| **G-23c** | Schema + safety gates (unchanged); preset check is additive in future |
| **G-23e Step 4** | Registry supplies canonical module list + routes |
| **G-23g** | `sourceExtractionStrategy` + `seedPolicy` per module from registry |

---

## 10. Operations NOT executed

| Item | Status |
| --- | --- |
| Live crawl / network | **no** |
| DB connection / write | **no** |
| Package regen | **no** |
| FTP / deploy | **no** |
| Orchestrator implementation | **no** |
| `service_role` | **not used** |

---

## 11. Inspect commands

```bash
# Human output + Gosaki validation
node tools/static-to-astro/scripts/inspect-cms-preset-registry.mjs

# JSON
node tools/static-to-astro/scripts/inspect-cms-preset-registry.mjs --json

# Custom config
node tools/static-to-astro/scripts/inspect-cms-preset-registry.mjs \
  --config tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json

# Verifier
node tools/static-to-astro/scripts/verify-g23f-static-to-astro-cms-preset-registry.mjs
```

---

## 12. Recommended next phases

| Phase | Scope |
| --- | --- |
| **G-23g** | Seed extractor standardization (registry-driven) |
| **G-23h** | Orchestrator skeleton implementation |
| **G-23i** | Fixture mode orchestrator integration |

---

## 13. Verifier

```bash
node tools/static-to-astro/scripts/verify-g23f-static-to-astro-cms-preset-registry.mjs
```
