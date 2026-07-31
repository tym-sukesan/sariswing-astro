# CMS Core v2 — External form HubSpot generalization planning

- **Phase:** `cms-core-v2-external-form-provider-hubspot-generalization-planning`
- **Date:** 2026-07-31
- **Scope:** read-only investigation + architecture docs only
- **Not in this phase:** runtime · HubSpot ID/config change · network · deploy · package · commit/push

---

## 1. Current Gosaki HubSpot path (as-is)

### 1.1 Config SoT

| Item | Value |
| --- | --- |
| File | `config/sites/gosaki-piano-contact-hubspot.json` |
| Load | Implicit from `toolRoot` via `loadGosakiContactHubspotConfig` (not `formConfigBundle`) |
| Copy into Astro | `src/data/gosaki-contact-hubspot.json` on apply |
| Gate | `registry` `cmsFeatures.contact === true` (gosaki-piano) |

Current JSON fields: `siteSlug`, `page`, `version`, `enabled`, `provider`, `region`, `portalId`, `formId`, `scriptSrc`.

**No** `environment` key today. Staging vs production package profiles do not swap Contact HubSpot JSON in convert (same file for Gosaki Contact).

### 1.2 Locked IDs (exact allowlist — not merely format)

`GOSAKI_CONTACT_HUBSPOT_ALLOWLIST` in `gosaki-contact-hubspot-embed.mjs`:

| Field | Locked value |
| --- | --- |
| provider | `hubspot` |
| portalId | `21392032` |
| formId | `57909d0c-9b9f-470a-8a18-e176d1d1a459` |
| region | `na1` |
| scriptSrc | `https://js.hsforms.net/forms/embed/21392032.js` |
| siteSlug | `gosaki-piano` |
| page | `contact` |
| enabled | must be `true` |

Validation is **exact equality** to this allowlist (site-locked production Contact), not “any valid portal/form”.

### 1.3 Loader + insertion

1. `gosaki-site-generator-hooks-adapter` `applyPostGenerate`
2. If `isCmsFeatureEnabled(siteKey, "contact")` → `applyGosakiContactHubspotEmbed(outDir, toolRoot)`
3. `buildGosakiContactHubspotEmbedHtml` emits **exact** markup (baseline fixture):

```html
<script is:inline src="https://js.hsforms.net/forms/embed/21392032.js" defer></script>
<div class="hs-form-frame" data-region="na1" data-form-id="57909d0c-9b9f-470a-8a18-e176d1d1a459" data-portal-id="21392032"></div>
```

4. `replaceContactFormWithHubspotEmbed`:
   - Removes prior `js.hsforms.net/forms/embed/` scripts, `.hs-form-frame`, and `<!--GOSAKI_CONTACT_HUBSPOT_SLOT-->` (double-loader prevention)
   - Replaces Wix wrapper `#comp-jqbwo704` with:

```html
<div id="gosaki-contact-hubspot-embed" class="gosaki-contact-hubspot-embed">{embed}</div>
```

5. Failures: config missing/invalid → `{ applied: false, reason }` (no throw in apply); missing `#comp-jqbwo704` → throw inside inject path.

### 1.4 Fallback / Save / noindex

| Concern | Behavior |
| --- | --- |
| Config fail | Skip apply; Wix/scaffold Contact form may remain |
| Admin Save | **Unrelated** — Contact HubSpot is convert-time static embed, not Supabase Save / Edge |
| noindex | Staging BaseLayout / package SEO gates; not owned by HubSpot helper |
| Free HubSpot branding | Observed in historical E2E docs; Kit does not strip branding |
| Tracking cookies | Set by HubSpot loader in browser; Kit does not inject extra tracking pixels |

### 1.5 As-is import / data flow

```txt
config/sites/gosaki-piano-contact-hubspot.json
  → validateGosakiContactHubspotConfig (exact allowlist)
  → buildGosakiContactHubspotEmbedHtml (script + hs-form-frame)
  → inject into contact/index.astro (#comp-jqbwo704)
  → copy JSON → src/data/gosaki-contact-hubspot.json
```

Triggered only from Gosaki adapter when `cmsFeatures.contact`.

HTML baseline: `fixtures/.../contact-hubspot-embed.html` deep-eq + contact page wrapper checks (`verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline`).

---

## 2. Diff vs CMS Core v2 external-form contract

### 2.1 Already in Core validator (`external-form-provider-contract.mjs`)

Flat hubspot ok shape:

- `provider`, `siteSlug`, `environment`, `portalId`, `formId`, `region`
- `loader.{host,path,scriptSrc}` **derived** via `deriveHubspotLoaderScriptSrc(portalId)`
- **Rejects** operator `scriptSrc` input (`SCRIPT_SRC_FORBIDDEN`)
- portalId digits · formId UUID · region ∈ `{na1,eu1,ap1}`

### 2.2 Gaps / mismatches

| Topic | Gosaki today | Core contract | Gap |
| --- | --- | --- | --- |
| Config transport | Implicit file read | Prefer explicit `formConfigBundle` (Mio pattern) | Need adapter bridge + optional file→bundle loader |
| `scriptSrc` in JSON | Required exact field | Forbidden input; derived only | Map: verify equality then drop before Core validate |
| `enabled` / `page` / `version` | Required / present | Not in hubspot allow-keys | Strip or preflight outside Core; Core stays strict |
| `environment` | Absent | Required `staging`\|`production` | Inject from package profile / explicit expectedEnvironment |
| ID policy | Exact Gosaki IDs only | Any format-valid IDs | Keep **site-locked exact gate** for Gosaki production Contact during transition |
| Renderer | Gosaki-only HTML | `renderExternalFormProviderHtml` → hubspot = **notice only** today | Add `renderHubspotConfigHtml` (site-neutral inner markup) |
| Wrapper / selector | `#comp-jqbwo704`, `#gosaki-contact-hubspot-embed` | Must stay site-specific | Gosaki helper retains insertion |
| Astro script attr | `is:inline` + `defer` | Not yet standardized in Core renderer | Lock identical string for deep-eq |
| Multi-form | Single Contact form | Contract principle: **1 site · 1 provider · 1 form** (v1) | Do not expand |

### 2.3 Mapping: existing Gosaki JSON → normalized Core config

| Gosaki field | Core flat field | Rule |
| --- | --- | --- |
| `provider: "hubspot"` | `provider` | exact |
| `siteSlug: "gosaki-piano"` | `siteSlug` | exact; `expectedSiteSlug` must match |
| *(derived)* | `environment` | From convert/package context (`staging` for routine STG; production only behind separate gate) |
| `portalId` | `portalId` | pass-through after format + Gosaki exact gate |
| `formId` | `formId` | same |
| `region` | `region` | same |
| `scriptSrc` | — | Must equal `deriveHubspotLoaderScriptSrc(portalId)`; then **omit** before Core validate |
| `enabled` | — | Preflight: `true` required for apply; `false` → fail-closed / skip |
| `page` | — | Preflight: must be `contact` |
| `version` | — | Ignored by Core (optional metadata) |

Normalized Core ok `config` (illustrative — real IDs only as existing SoT reference):

```json
{
  "provider": "hubspot",
  "siteSlug": "gosaki-piano",
  "environment": "staging",
  "portalId": "21392032",
  "formId": "57909d0c-9b9f-470a-8a18-e176d1d1a459",
  "region": "na1",
  "loader": {
    "host": "js.hsforms.net",
    "path": "/forms/embed/21392032.js",
    "scriptSrc": "https://js.hsforms.net/forms/embed/21392032.js"
  }
}
```

### 2.4 What must not move into Core

- Wix selector `#comp-jqbwo704`
- Wrapper ids/classes `gosaki-contact-hubspot-embed`
- Cheerio DOM replace specifics / slot comment
- Exact Gosaki portal/form allowlist (site policy layer, not Core format validator)
- Implicit path `config/sites/gosaki-piano-contact-hubspot.json` hardcode (may become convention helper under Gosaki adapter)
- CSS overrides for `.gosaki-contact-hubspot-embed` (site-specific overrides)

---

## 3. Target architecture

```txt
structured config (JSON or formConfigBundle)
  → [optional] Gosaki preflight / exact-ID gate / scriptSrc strip
  → getExternalFormProviderResult (Core validator)
  → renderHubspotConfigHtml (site-neutral: script + hs-form-frame ONLY)
  → Gosaki Contact helper (selector, wrapper, double-loader strip, page write)
  → generated contact/index.astro
```

**Principle:** do not delete Gosaki-dedicated module in one step. Shadow-compare old vs new embed HTML until deep equality on baseline fixture, then switch adapter call, then audit deletion.

### 3.1 Responsibility split

| Layer | Owns |
| --- | --- |
| **Core validator** | Format, HTTPS loader host derivation, region set, fail-closed reasonCodes, no scriptSrc input |
| **Core renderer (new)** | Exact inner markup: `<script is:inline … defer>` + `<div class="hs-form-frame" data-*>` from normalized config only |
| **Gosaki preflight** | Exact portal/form allowlist (while live STG depends on it); `enabled`/`page`; map file→bundle; environment injection |
| **Gosaki helper** | `#comp-jqbwo704` replace; wrapper; strip duplicates; write `src/data/…`; CSS class hooks |
| **Mio / other sites** | Later: own selectors + optionally same Core renderer; no Gosaki IDs |

### 3.2 Target data flow (after cutover)

```txt
formConfigBundle (explicit) OR Gosaki file→bundle adapter
  → Core validate/normalize
  → Core renderHubspotConfigHtml → innerHtml
  → wrap + inject (site adapter)
```

Implicit file read may remain as **Gosaki-only convenience** wrapping the same pipeline (not Core).

---

## 4. HTML compatibility conditions (must hold)

Deep equality / locked checks (Gosaki):

1. Inner embed string ≡ current `contact-hubspot-embed.html` for current SoT IDs
2. Exactly **one** `js.hsforms.net/forms/embed/{portalId}.js` script
3. Exactly **one** `.hs-form-frame`
4. Attribute order may be normalized only if baseline fixture updated in a dedicated phase — **prefer byte-stable order** matching today: `data-region`, `data-form-id`, `data-portal-id`
5. Script attributes: `is:inline`, `src=…`, `defer` (same as today)
6. Wrapper `#gosaki-contact-hubspot-embed.gosaki-contact-hubspot-embed` retained
7. No second HubSpot loader after re-apply
8. `#comp-jqbwo704` absent after successful apply
9. Gosaki HTML baseline verifier remains **80 PASS** without loosening

**v1 policy:** one Contact provider / one HubSpot form per site. No multi-form page.

---

## 5. Security & privacy conditions

| Rule | Detail |
| --- | --- |
| No operator scriptSrc | Core rejects; Gosaki file may still contain field for legacy read but must match derived |
| Loader host | Exact `js.hsforms.net` via `deriveHubspotLoaderScriptSrc` only |
| IDs | Digits portalId · UUID formId · closed region set |
| No arbitrary HTML/JS | Kit emits fixed tags only |
| siteSlug / environment | Must match expected convert context |
| Staging vs production | Separate config objects / gates; do not silently reuse staging IDs for production cutover |
| Fail-closed | Invalid → no script, no hs-form-frame |
| CSP | Allowlist `js.hsforms.net` (+ HubSpot form frames as needed by HS); no `unsafe-inline` for Contact body scripts beyond Astro `is:inline` **src** pattern already used |
| Cookies / privacy | HubSpot sets third-party cookies; document for operators; optional privacy notice; **do not** make marketing tracking a Kit prerequisite for form render |
| Plan independence | Implementation must not assume paid HubSpot features; free branding may remain; workflow/CRM automation stays HubSpot-side |
| Spec change resilience | Site adapter + thin Core renderer; region/host changes isolated to derive helper + site gate |

---

## 6. Verifier plan (future implementation phases)

| Suite | Purpose |
| --- | --- |
| Pure HubSpot renderer | Synthetic portal/form (non-customer) · exact markup · no Gosaki selectors in Core · scriptSrc forbidden · fail-closed |
| Shadow compare | `buildGosakiContactHubspotEmbedHtml` vs `renderHubspotConfigHtml` + wrapper for same mapped config → deep-eq to baseline fixture |
| Adapter switch | Full convert / HTML baseline still PASS |
| Regression | Mio external-link + google-forms unchanged; Safety Suite |
| Isolation | Pilot/Mio never emit Gosaki portalId / hsforms with gosaki IDs unless configured |
| Offline | No network / no HubSpot API / no form submit |

---

## 7. Phased implementation (recommended)

| # | Phase id (candidate) | Deliverable | Risk | STOP if |
| --- | --- | --- | --- | --- |
| **1** | `cms-core-v2-external-form-provider-hubspot-renderer` | `renderHubspotConfigHtml` + offline verifier (synthetic IDs) | Low | Markup drifts from Gosaki inner baseline pattern; Core gains Gosaki selectors |
| **2** | `cms-core-v2-external-form-hubspot-gosaki-shadow-compare` | Map Gosaki JSON→Core; deep-eq old vs new inner HTML | Medium | Any inequality vs `contact-hubspot-embed.html`; temptation to change live IDs |
| **3** | `cms-core-v2-external-form-hubspot-gosaki-adapter-switch` | Adapter calls Core renderer + keep Gosaki insert helper | Medium | HTML baseline fail; double loader; missing wrapper |
| **4** | `cms-core-v2-external-form-hubspot-browser-baseline` | Operator PC/SP Contact check on staging package or local preview | Medium | Visual/layout regression; package/FTP without approval |
| **5** | `cms-core-v2-external-form-hubspot-legacy-deletion-audit` | Decide keep/thin/delete `validateGosakiContactHubspotConfig` vs thin wrapper | Low–Med | Deleting before shadow+switch PASS |
| **6** | `cms-core-v2-external-form-provider-hubspot-completion-audit` | Docs/gates; provider completion scorecard | Low | Claiming COMPLETE while Gosaki still on dual path |

**First implementation phase after this planning:** **Phase 1 (pure HubSpot renderer + offline verifier)** — no adapter switch, no config ID edits.

### 7.1 Minimal files for Phase 1 (candidate)

- `scripts/lib/external-form-provider-renderer.mjs` (add hubspot render)
- `scripts/verify-cms-core-v2-external-form-provider-hubspot-renderer.mjs` (new)
- `package.json` / `run-cms-core-v2-safety-suite.mjs` (wire)
- Docs / AI context only as needed
**Do not touch in Phase 1:** `gosaki-piano-contact-hubspot.json`, Gosaki adapter apply path, fixtures expected HTML (except read-only compare).

### 7.2 Rollback

- Keep old `buildGosakiContactHubspotEmbedHtml` until Phase 5 audit
- Feature switch: adapter flag or call-site revert to old builder (one commit)
- Never change live portal/form IDs as “fix”
- If outcome unclear after switch: stop, no retry cleanup, ask human (project destructive-op culture)

---

## 8. Risks (summary)

| Risk | Mitigation |
| --- | --- |
| Byte-level HTML drift breaks baseline | Shadow compare before switch; freeze attribute order |
| Weakening Gosaki exact allowlist too early | Keep site-locked gate until explicit product decision |
| Dual loaders | Retain strip logic in Gosaki helper |
| Moving selectors into Core | Forbidden — STOP |
| Confusing Save/Admin with Contact embed | Document convert-time only |
| Assuming paid HubSpot | No paid API features in Kit path |
| Production env leak | Separate environment gate; no silent production write |

---

## 9. Explicit non-goals (this planning phase)

- No runtime / registry / fixture expected changes
- No HubSpot portal/form/region/scriptSrc edits
- No external communication / form submit
- No package / FTP / production
- No Admin UI / Supabase / Secrets
- No commit / push in-phase (operator may commit docs later)

---

## 10. Gates

```txt
phase: cms-core-v2-external-form-provider-hubspot-generalization-planning
CMS_CORE_V2_EXTERNAL_FORM_HUBSPOT_GENERALIZATION_PLANNING_COMPLETE: true
CONTACT_HUBSPOT_GENERALIZATION: PLANNING_COMPLETE
CONTACT_HUBSPOT_RENDERER: NOT_STARTED
CONTACT_HUBSPOT_GOSAKI_SHADOW_COMPARE: NOT_STARTED
CONTACT_HUBSPOT_GOSAKI_ADAPTER_SWITCH: NOT_STARTED
NEXT_RECOMMENDED: cms-core-v2-external-form-provider-hubspot-renderer
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
DB_WRITE_EXECUTED: false
HUBSPOT_CONFIG_UNCHANGED: true
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```
