# CMS Core v2 — HubSpot legacy cleanup audit

**Phase:** `cms-core-v2-external-form-provider-hubspot-legacy-cleanup-audit`<br>
**Date:** 2026-08-01<br>
**Scope:** read-only inventory · classification · verifier · docs<br>
**Not in scope:** legacy deletion · runtime edits · HubSpot ID/config changes · package/FTP · commit/push

---

## 1. Verdict

| Item | Value |
| --- | --- |
| Runtime apply path | **Core only** (`buildGosakiContactHubspotEmbedHtmlViaCore`) |
| Legacy builder in runtime | **unused** (no apply / adapter call) |
| Delete legacy builder now? | **No** |
| Classification of legacy builder | **KEEP_AS_TEST_ORACLE** |
| Exact ID gate / loader / wrapper / selector | **KEEP** (not cleanup candidates) |
| Next recommended | **B** `cms-core-v2-external-form-provider-hubspot-completion-audit` |

Retention decision is locked in this audit (oracle keep). A separate `legacy-retention-decision` phase is **not required** unless the operator later wants an explicit gate to **retire** the oracle.

---

## 2. Current runtime path

```txt
config/sites/gosaki-piano-contact-hubspot.json
  → loadGosakiContactHubspotConfig
  → validateGosakiContactHubspotConfig (exact ID + scriptSrc allowlist)
  → mapGosakiContactHubspotConfigToCore (strip scriptSrc; environment: staging)
  → getExternalFormProviderResult
  → renderHubspotConfigHtml
  → injectHubspotEmbedIntoContactPage
       (#comp-jqbwo704 → #gosaki-contact-hubspot-embed; strip duplicate loaders)
```

Entry: `gosaki-site-generator-hooks-adapter.mjs` → `applyGosakiContactHubspotEmbed` only when `cmsFeatures.contact`.

`applyGosakiContactHubspotEmbed` calls **only** `buildGosakiContactHubspotEmbedHtmlViaCore` (confirmed by source + adapter-switch verifier).

---

## 3. Legacy builder reference inventory

### 3.1 `buildGosakiContactHubspotEmbedHtml`

| Location | Kind | Role |
| --- | --- | --- |
| `scripts/lib/gosaki-contact-hubspot-embed.mjs` | **definition** | Frozen allowlist string-concat builder |
| `verify-…-hubspot-shadow-compare.mjs` | **test oracle** | legacy HTML vs Core / fixture |
| `verify-…-hubspot-adapter-switch.mjs` | **test oracle** | ViaCore === legacy; export still present; apply must not call it |
| `verify-…-gosaki-site-generator-hooks-html-baseline.mjs` | **test oracle** | ViaCore === legacy (dual equality) |
| Docs / AI context | **docs** | Historical + “retained for audit” notes |
| `docs/cms-core-v2-gosaki-site-generator-hooks-html-baseline.md` | **docs drift** | Still names legacy as Contact SoT path (outdated vs ViaCore) |
| `docs/gosaki-contact-hubspot-embed-package-prep.md` | **historical** | G-10g1 package prep |

**Not found:** dynamic `import()` of the legacy symbol · string-eval · adapter/runtime call sites outside the definition.

### 3.2 Related elements (not “legacy builder”)

| Element | Runtime? | Notes |
| --- | --- | --- |
| `validateGosakiContactHubspotConfig` / `GOSAKI_CONTACT_HUBSPOT_ALLOWLIST` | **yes** | Exact ID gate — keep |
| `loadGosakiContactHubspotConfig` | **yes** | Keep |
| `mapGosakiContactHubspotConfigToCore` | **yes** | Bridge — keep |
| `buildGosakiContactHubspotEmbedHtmlViaCore` | **yes** | Active generation — keep |
| `replaceContactFormWithHubspotEmbed` / `injectHubspotEmbed…` | **yes** | Selector/wrapper — keep |
| `CONTACT_FORM_WRAPPER_SELECTOR` / wrapper id/class | **yes** | Site-specific — keep |
| Site CSS `.gosaki-contact-hubspot-embed` | **yes** | Keep |
| Fixture `contact-hubspot-embed.html` / `contact-page.astro` | offline oracle | Keep (byte SoT) |

---

## 4. Classification

| Element | Class | Rationale |
| --- | --- | --- |
| `buildGosakiContactHubspotEmbedHtml` | **KEEP_AS_TEST_ORACLE** | Independent of Core; allowlist concat proves Core output without circular fixture→Core regen. Used by three verifiers. Deleting now collapses oracle quality. |
| Exact ID gate + allowlist + config loader | **KEEP** | Site-locked safety; not a leftover of pre-Core render. |
| Map + ViaCore + Core validator/renderer | **KEEP** | Active production path. |
| Wrapper / selector / strip-duplicate / inject | **KEEP** | Site adapter surface; Core must not own these. |
| Historical package-prep docs naming legacy builder | **RETAIN_TEMPORARILY** | Historical accuracy; optional doc polish later — not blocking. |
| `html-baseline.md` Contact row still naming only legacy builder | **REPLACE_THEN_REMOVE** (docs only) | Should say ViaCore (+ legacy oracle compare). Doc fix may land in completion audit; **no runtime change**. |
| Legacy builder source function body | **REPLACE_THEN_REMOVE** (future) | After: (1) operator browser QA stability, (2) shadow-compare rewritten to fixture-only with dual checks that do not self-regen fixture from Core, (3) adapter-switch/baseline drop legacy equality — then delete in a dedicated retirement phase. **Not now.** |

**REMOVE_NOW:** none (code).

---

## 5. Deletion impact analysis

| If deleted now | Impact |
| --- | --- |
| Shadow-compare | Must rewrite to fixture-only; loses independent allowlist oracle → risk of **self-comparison** if fixture later regenerated from Core |
| Adapter-switch | Loses ViaCore===legacy cross-check; source “legacy still exported” assert fails |
| HTML baseline | Dual-eq assert fails |
| Rollback of apply path | Still possible by re-pointing apply to legacy **if function remains**; deletion removes one-line rollback |
| Runtime HTML | Unchanged (already Core) |

**Fixture-only replacement is viable later** if:

1. Fixture remains manually frozen (never regenerated from Core in the same PR that deletes legacy).
2. Shadow-compare asserts Core === fixture **and** fixture bytes match a checked-in hash / known allowlist-derived constants without calling Core to write the fixture.
3. Adapter-switch / baseline drop legacy equality only after that rewrite.

Until then: **keep legacy as oracle**.

---

## 6. Verifier / oracle policy (locked)

**Current (required):**

| Oracle | Purpose |
| --- | --- |
| Static fixture `contact-hubspot-embed.html` | Frozen public byte SoT |
| Legacy builder | Independent allowlist concat |
| Core `renderHubspotConfigHtml` / ViaCore | Active path under test |

Required equalities: **legacy === Core === fixture** (embed); inject page === `contact-page.astro`.

**Do not:**

- Delete legacy while shadow-compare still imports it
- Regenerate fixture from Core in the same change that removes legacy
- Move Gosaki selectors / exact IDs into Core

---

## 7. Recommended next phases

| Priority | Phase id | Why |
| --- | --- | --- |
| **Next (B)** | `cms-core-v2-external-form-provider-hubspot-completion-audit` | Scorecard: provider COMPLETE vs remaining (Admin UI, package regen, browser ops). Retention already decided here. |
| Later (optional) | `cms-core-v2-external-form-provider-hubspot-legacy-oracle-retirement` | Explicit gate to retire legacy oracle after fixture-only verifier rewrite + operator stability. Subsumes old “A. legacy-retention-decision” for **deletion**. |

**Not chosen as immediate next:** A `legacy-retention-decision` — this audit already decides **KEEP_AS_TEST_ORACLE**.

---

## 8. Gates

```txt
phase: cms-core-v2-external-form-provider-hubspot-legacy-cleanup-audit
CMS_CORE_V2_EXTERNAL_FORM_HUBSPOT_LEGACY_CLEANUP_AUDIT_COMPLETE: true
CONTACT_HUBSPOT_LEGACY_CLEANUP_AUDIT: COMPLETE
LEGACY_BUILDER_RUNTIME_USED: false
LEGACY_BUILDER_CLASSIFICATION: KEEP_AS_TEST_ORACLE
LEGACY_BUILDER_DELETE_NOW: false
EXACT_ID_GATE_KEEP: true
WRAPPER_SELECTOR_KEEP: true
NEXT_RECOMMENDED: cms-core-v2-external-form-provider-hubspot-completion-audit
RUNTIME_CHANGED: false
HUBSPOT_CONFIG_UNCHANGED: true
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
DB_WRITE_EXECUTED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## 9. Explicit non-goals (this phase)

- No deletion of `buildGosakiContactHubspotEmbedHtml`
- No runtime / apply path edits
- No HubSpot ID / config / fixture expected changes
- No package / FTP / production / Admin / DB
- No commit / push in-phase (operator may commit docs/verifier later)
