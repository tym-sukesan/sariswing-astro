# CMS Core v2 — External form provider contract planning

- **Phase:** `cms-core-v2-external-form-provider-contract-planning`
- **Date:** 2026-07-31
- **Scope:** investigation + contract design + docs only
- **Not in this phase:** runtime · registry/fixture changes · Contact implementation · live form URLs/IDs · network · Supabase · Admin · package · FTP · commit/push

---

## 1. Recommended Contact end-state

**Contact is never a free-form HTML/JS surface.**
Kit Contact is completed by connecting **one allowlisted external form provider** per site (and per environment), with Kit-owned rendering and **fail-closed** validation.

| Principle | Rule |
| --- | --- |
| No arbitrary HTML | Operators never paste `<iframe>`, `<script>`, or form markup |
| No arbitrary JS | Operators never paste HubSpot / Forms snippets; Kit emits fixed loaders |
| Allowlist only | Unknown `provider` → treat as invalid → fail-closed (same as disabled + safe notice) |
| Site isolation | Config is per `siteKey` / `siteSlug`; Gosaki ≠ Mio |
| Env isolation | Staging vs production configs are separate objects + separate approval gates |
| Kit owns embed | Validated IDs/URLs in → Kit generates markup out |

**Initial providers:** `disabled` · `external-link` · `google-forms` · `hubspot`
**Out of scope initially:** generic iframe · arbitrary embed HTML · Typeform / formrun / etc. (extension via new provider enum + validator, not free paste)

Existing Gosaki Contact HubSpot (`gosaki-piano-contact-hubspot.json` + `gosaki-contact-hubspot-embed.mjs`) is the **compatibility reference** for `hubspot`: exact IDs + Kit-built script/`hs-form-frame`. Generalization must preserve that behavior behind the new contract.

Mio fixture Contact today: non-submitting placeholder + empty iframe slot (`fixtures/mio-kisaragi-jazz/contact.html`). First Mio pilot should prefer **`external-link`** or **`google-forms`** with **fixture-only / example.invalid hosts** in offline tests — never register real customer form URLs in this planning phase.

---

## 2. Provider enum

```ts
type ExternalFormProvider =
  | "disabled"
  | "external-link"
  | "google-forms"
  | "hubspot";
```

- Case-sensitive exact string match.
- Missing / null / unknown → **invalid** (not silently disabled unless `provider: "disabled"` is explicit).
- Optional future additions (e.g. `typeform`) require a new enum value + dedicated validator + renderer; never “generic iframe”.

---

## 3. Shared envelope (all providers)

```json
{
  "schemaVersion": 1,
  "siteSlug": "<must match site registry supabaseSiteSlug or siteKey policy>",
  "page": "contact",
  "environment": "staging",
  "enabled": true,
  "provider": "disabled",
  "locale": "ja",
  "privacyNotice": {
    "show": true,
    "textKey": "contact.privacy.default"
  }
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `schemaVersion` | yes | Start at `1` |
| `siteSlug` | yes | Must match intended site; cross-site config rejected |
| `page` | yes | Exactly `"contact"` for v1 |
| `environment` | yes | `"staging"` \| `"production"` — production needs separate gate |
| `enabled` | yes | `false` forces fail-closed notice path even if provider fields present |
| `provider` | yes | Enum above |
| `locale` | optional | Copy for notices / button labels |
| `privacyNotice` | optional | Kit-owned copy keys only — **no HTML** |

Provider-specific objects live under a single key matching the provider name (discriminated union). **Foreign provider keys must be rejected** (e.g. `hubspot` block present when `provider: "external-link"`).

---

## 4. Per-provider contracts

### 4.1 `disabled`

**Purpose:** Form not shown; safe status copy only.

| Field | Required | Validation |
| --- | --- | --- |
| *(none beyond envelope)* | — | Extra keys under other providers → reject |

**Render:** Kit notice only (e.g. “現在フォームは公開していません”). No `<form>`, no iframe, no script, no outbound button unless separately configured SNS (out of Contact form contract).

**Fail-closed display:** Same notice family as validation failure (calm, no stack traces, no raw config dump).

---

### 4.2 `external-link`

**Purpose:** Button/link opens an allowlisted HTTPS URL in a new browsing context; form lives on the external site.

| Field | Required | Validation |
| --- | --- | --- |
| `externalLink.url` | yes | Absolute HTTPS URL; see §5 |
| `externalLink.label` | yes | Plain text 1–80 chars; no HTML entities injection via raw HTML (escape on render) |
| `externalLink.allowedHosts` | optional | If set, hostname must be in this exact list (lowercase). If unset, still apply global URL safety (§5) + optional Kit global denylist |
| `externalLink.openInNewTab` | optional | Default `true` |

**Render:** `<a href="…" rel="noopener noreferrer" target="_blank">` (when new tab) — **no** user HTML.

**Attributes:** `rel="noopener noreferrer"` required when `target="_blank"`.

---

### 4.3 `google-forms`

**Purpose:** Embed Google Forms via iframe with **strict URL + host** checks.

| Field | Required | Validation |
| --- | --- | --- |
| `googleForms.embedUrl` | yes | Must match allowlisted Google Forms embed URL pattern (§5.2) |
| `googleForms.title` | optional | iframe `title` plain text (a11y); default Kit string |
| `googleForms.height` | optional | Integer px in closed range (e.g. 400–2400); default Kit constant |

**Render:** Kit builds `<iframe>` only — never operator-supplied iframe tag.

**iframe safety attributes (required):**

- `src` = validated URL only
- `title` = escaped plain text
- `loading="lazy"`
- `referrerpolicy="no-referrer"` (or `strict-origin-when-cross-origin` if Forms requires; prefer stricter that still works — decide in implementation with offline fixture + documented choice)
- **sandbox:** start with `sandbox="allow-scripts allow-forms allow-same-origin allow-popups"` only if Forms requires scripts; never omit sandbox without a documented exception. No `allow-top-navigation` unless proven necessary.
- No `srcdoc`, no `src="javascript:…"`, no operator `allow` attribute free-text beyond Kit constant

---

### 4.4 `hubspot`

**Purpose:** Portal/Form IDs only; **Kit generates** HubSpot embed loader (generalize Gosaki G-10g1).

| Field | Required | Validation |
| --- | --- | --- |
| `hubspot.portalId` | yes | Digits only, length 1–12 (tune in impl); no URL |
| `hubspot.formId` | yes | UUID v4 lowercase hex with hyphens (Gosaki shape) or documented HubSpot form GUID pattern |
| `hubspot.region` | yes | Exact allowlist: e.g. `na1`, `eu1`, `ap1` (closed set in code) |
| `hubspot.scriptSrc` | **no (derived)** | Kit **must** derive: `https://js.hsforms.net/forms/embed/{portalId}.js`. If present in config, must **exactly equal** derived value or reject |
| `hubspot.targetSelector` | optional | Site adapter slot; Gosaki legacy `#comp-jqbwo704` — not free CSS injection (`#` + safe id pattern only) |

**Render (Kit-fixed, Gosaki-compatible):**

```html
<script is:inline src="https://js.hsforms.net/forms/embed/{portalId}.js" defer></script>
<div class="hs-form-frame" data-region="{region}" data-form-id="{formId}" data-portal-id="{portalId}"></div>
```

Operators never paste the above. No alternate CDN hosts. No inline event handlers.

**Gosaki compatibility:** Existing `validateGosakiContactHubspotConfig` exact allowlist can become a **site-locked production/staging profile** that still satisfies the generic shape (provider + IDs + derived scriptSrc). Migration path: wrap current JSON under envelope + `hubspot` object without changing live IDs in this planning phase.

---

## 5. URL / ID validation & fail-closed rules

### 5.1 Global URL rules (external-link + any URL field)

Reject if any of:

| Rule | Reject examples |
| --- | --- |
| Not absolute URL | `/forms`, `forms.google.com/...` |
| Protocol ≠ `https:` | `http:`, `javascript:`, `data:`, `file:`, `blob:`, `about:` |
| Credentials in URL | `https://user:pass@host/` |
| Non-default port | `https://host:8443/` (unless explicitly allowlisted later — default **deny**) |
| Backslash / weird encoding tricks | Host spoofing via `%00`, embedded credentials, etc. |
| Whitespace / control chars | Trim then re-check; raw whitespace → reject |
| HTML / script in URL string | `<`, `>`, `"`, `'`, `` ` `` in URL → reject |
| `javascript:` after normalize | Any scheme other than https after `new URL()` |

Hostname checks: use WHATWG URL `hostname` (lowercase); reject IP literals unless explicitly allowed later (default **deny** for v1).

### 5.2 Google Forms host / path allowlist (exact)

**Allowed hosts (exact):**

- `docs.google.com`

**Allowed path patterns (examples — lock in pure validator tests):**

- `/forms/d/e/{formId}/viewform` (and optional query `?embedded=true` only — strip/forbid unknown query keys in v1 if possible)
- `/forms/d/{formId}/viewform` if still needed for legacy — prefer `/d/e/` embed form only for iframe

**Reject:**

- `forms.gle` short links (resolve ambiguity / open redirect) — use **external-link** if short link needed, or require expanded docs URL
- `google.com`, `www.google.com`, `drive.google.com`, attacker `docs.google.com.evil.example`
- Userinfo, non-https, odd ports
- Paths outside `/forms/...`

### 5.3 HubSpot ID rules

- `portalId`: `/^[0-9]{1,12}$/`
- `formId`: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/`
- `region`: membership in frozen set
- Derived `scriptSrc` host exactly `js.hsforms.net`, path exactly `/forms/embed/{portalId}.js`

### 5.4 Cross-field / cross-provider pollution

Reject when:

- `provider` is `A` but object `B` is present
- Extra unknown top-level keys (strict JSON schema in validator)
- `enabled: false` but renderer still tries embed (renderer must short-circuit to disabled notice)
- `siteSlug` ≠ convert/registry site
- `environment: "production"` without production gate flag (build-time / package-time check in later phase)

### 5.5 Fail-closed display

On any validation failure or unknown provider:

1. Do **not** emit iframe / script / outbound form button from invalid fields
2. Show Kit-owned status region (plain text / escaped)
3. Log structured reason for offline verifier / convert diagnostics (no secrets)
4. Prefer **build fail** for convert when Contact feature is enabled and config invalid; for optional Contact-off sites, skip inject

---

## 6. Security & privacy notes

| Topic | Guidance |
| --- | --- |
| **CSP** | Allowlist `script-src` / `frame-src` only for chosen provider hosts (`js.hsforms.net`, `forms.hsforms.com` as needed, `docs.google.com`). Do not add `unsafe-inline` for Contact. Gosaki today uses `is:inline` script **src** (external) — keep external src only |
| **Cookies / third-party** | HubSpot & Google Forms set third-party cookies / storage; document for operators; privacy notice recommended when `enabled` |
| **PII** | Data lands in provider tenant, not Kit DB (v1). No Kit-side form POST |
| **Admin UI** | Dropdown for provider + typed fields for URL/IDs only — **never** a “custom embed code” textarea |
| **Preview** | Admin preview runs same pure validator before Save (Save itself is a later gated phase) |
| **Production** | Separate config object + explicit approval; staging IDs must not silently publish |

---

## 7. Config storage recommendation

| Horizon | Location | Rationale |
| --- | --- | --- |
| **Near-term (recommended first)** | Static per-site JSON under `config/sites/` (pattern: `{siteKey}-contact-form.json`) + optional pointer from registry `cmsFeatures.contact` | Matches Gosaki HubSpot today; offline verifiable; no DB/Secrets |
| **Later** | Supabase staging table e.g. `site_contact_form_config` (SELECT for build-read; writes gated) | Operator Admin without repo edit; still store **structured fields only**, never raw HTML |
| **Never** | Free-text embed in `site_page_fields` HTML CMS | Conflicts with About HTML safety / script bans |

Registry: keep boolean `cmsFeatures.contact`; **do not** embed full form secrets in `registry.json`. Point to config file path via convention or later `contactFormConfig` relative path (implementation phase).

Staging vs production: two files or two keys under `environments.staging` / `environments.production` inside one file — production arm requires separate gate (same bar as other destructive ops).

---

## 8. Gosaki / Mio application plan

| Site | Near-term | Notes |
| --- | --- | --- |
| **Gosaki** | Map existing HubSpot JSON → `provider: "hubspot"` envelope without changing portal/form IDs in planning | Keep `gosaki-contact-hubspot-embed.mjs` behavior until HubSpot generalization phase; then swap to shared validator + renderer |
| **Mio** | Keep fixture non-submitting until pilot; first pilot **`external-link`** (simple) or **`google-forms`** (iframe path) with **offline fake URLs that fail validation** + **synthetic valid fixtures under `example.invalid` / test doubles** — no real customer forms in repo during planning | Registry `cmsFeatures.contact: false` until implementation enables |
| **Pilot / generic** | Stay `disabled` / contact feature off | |

---

## 9. Example contracts (JSON)

### 9.1 disabled

```json
{
  "schemaVersion": 1,
  "siteSlug": "mio-kisaragi-jazz",
  "page": "contact",
  "environment": "staging",
  "enabled": true,
  "provider": "disabled",
  "privacyNotice": { "show": true, "textKey": "contact.privacy.default" }
}
```

### 9.2 external-link

```json
{
  "schemaVersion": 1,
  "siteSlug": "mio-kisaragi-jazz",
  "page": "contact",
  "environment": "staging",
  "enabled": true,
  "provider": "external-link",
  "externalLink": {
    "url": "https://forms.example.invalid/mio-booking",
    "label": "予約フォームを開く",
    "openInNewTab": true,
    "allowedHosts": ["forms.example.invalid"]
  }
}
```

*(Illustrative host only — not a live registration.)*

### 9.3 google-forms

```json
{
  "schemaVersion": 1,
  "siteSlug": "mio-kisaragi-jazz",
  "page": "contact",
  "environment": "staging",
  "enabled": true,
  "provider": "google-forms",
  "googleForms": {
    "embedUrl": "https://docs.google.com/forms/d/e/FAKE_FORM_ID_FOR_CONTRACT_ONLY/viewform?embedded=true",
    "title": "お問い合わせフォーム",
    "height": 720
  }
}
```

*(Fake id for contract shape — offline validator will use dedicated test fixtures, not customer forms.)*

### 9.4 hubspot (Gosaki-shaped; IDs shown only as existing repo SoT reference)

```json
{
  "schemaVersion": 1,
  "siteSlug": "gosaki-piano",
  "page": "contact",
  "environment": "staging",
  "enabled": true,
  "provider": "hubspot",
  "hubspot": {
    "portalId": "21392032",
    "formId": "57909d0c-9b9f-470a-8a18-e176d1d1a459",
    "region": "na1"
  }
}
```

Derived `scriptSrc`: `https://js.hsforms.net/forms/embed/21392032.js` (must match current Gosaki allowlist).

### 9.5 Invalid examples → expected fail-closed

| Case | Config sketch | Expected |
| --- | --- | --- |
| Unknown provider | `"provider": "typeform"` | Reject; notice only / convert fail |
| Protocol | `externalLink.url: "javascript:alert(1)"` | Reject |
| Host spoof | `https://docs.google.com.evil.example/forms/...` | Reject |
| HTTP | `http://docs.google.com/forms/...` | Reject |
| Credentials | `https://u:p@docs.google.com/...` | Reject |
| Port | `https://docs.google.com:8443/forms/...` | Reject |
| HTML in label | `label: "Click <script>"` | Reject **or** escape-only policy: prefer **reject** in validator for `<`/`>` |
| Script paste field | any `customHtml` / `embedCode` | Schema reject |
| Wrong object | `provider: "hubspot"` + `externalLink` present | Reject |
| Bad portalId | `"portalId": "21392032/../x"` | Reject |
| Bad formId | `"not-a-uuid"` | Reject |
| scriptSrc mismatch | operator sets other host | Reject |
| Missing config | Contact feature on, file absent | Fail-closed / convert fail |
| siteSlug mismatch | Mio convert + gosaki slug in config | Reject |

---

## 10. Verification plan (offline-first)

Pure module (future): e.g. `scripts/lib/external-form-provider-contract.mjs` + `verify-cms-core-v2-external-form-provider-contract.mjs` (names TBD).

| Suite | Cases |
| --- | --- |
| Allowlist | Only four providers accepted |
| Happy path | One fixture per provider |
| Boundary | Max label length, height min/max, UUID case |
| Host spoof | subdomain / suffix attacks |
| Protocol spoof | javascript/data/file/blob/http |
| HTML/script injection | label, title, unknown keys |
| Invalid IDs | portal/form/region |
| Provider field mix | foreign keys |
| Missing / enabled false | |
| Gosaki HubSpot compat | Map current JSON → validate + derive scriptSrc equals today |
| Mio pilot fixtures | Synthetic external-link + google-forms **test doubles** |
| Network | **Not required** for contract verifier |

Add step to `verify:cms-core-v2-safety-suite` when implementation lands — **done** in validator phase (`external-form-provider-contract-validator`).

---

## 11. Implementation phase split

| # | Phase (candidate id) | Deliverable | Risk |
| --- | --- | --- | --- |
| **1** | `cms-core-v2-external-form-provider-contract-validator` | Pure schema + URL/ID validators + offline verifier | Low — **COMPLETE** |
| **2** | `cms-core-v2-external-form-provider-external-link` | Contact inject for external-link (Mio-friendly) | Low |
| **3** | `cms-core-v2-external-form-google-forms-provider` | iframe renderer + sandbox attrs | Medium (third-party frame) |
| **4** | `cms-core-v2-external-form-hubspot-generalization` | Shared HubSpot renderer; Gosaki adapter delegates | Medium (preserve Gosaki E2E) |
| **5** | `cms-core-v2-external-form-admin-config-ui` | Staging Admin: provider select + fields; **no** code paste; Save gated separately | Higher (Admin + optional DB) |

**Next after validator:** Phase 2 (`cms-core-v2-external-form-provider-external-link`).

---

## 12. Explicit non-goals (this planning phase)

- No runtime / registry / fixture / expected changes
- No Contact implementation or live provider registration
- No new real form URLs or customer IDs beyond documenting existing Gosaki SoT shape
- No Supabase / Edge / env / Secrets / package / FTP / production
- No commit / push in-phase (operator may commit docs later)

---

## 13. Gates

```txt
phase: cms-core-v2-external-form-provider-contract-planning
CMS_CORE_V2_EXTERNAL_FORM_PROVIDER_CONTRACT_PLANNING_COMPLETE: true
CONTACT_EXTERNAL_FORM: PLANNING_COMPLETE
CONTACT_EXTERNAL_FORM_RUNTIME: EXTERNAL_LINK_COMPLETE
CONTACT_PROVIDER_VALIDATOR: COMPLETE
CONTACT_EXTERNAL_LINK_PROVIDER: COMPLETE
CONTACT_GOOGLE_FORMS_PROVIDER: NOT_STARTED
CONTACT_HUBSPOT_GENERALIZATION: NOT_STARTED
CONTACT_ADMIN_CONFIG_UI: NOT_STARTED
NEXT_RECOMMENDED: cms-core-v2-external-form-provider-google-forms
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
DB_WRITE_EXECUTED: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

---

## 14. Validator implementation (2026-07-31)

- **Phase:** `cms-core-v2-external-form-provider-contract-validator` — **COMPLETE**
- **Module:** `scripts/lib/external-form-provider-contract.mjs`
- **API:** `getExternalFormProviderResult` (= validate / normalize aliases)
- **Shape:** flat fields (`url`/`label`, `formUrl`/`title`, `portalId`/`formId`/`region`) — nested planning JSON maps later at adapter boundary
- **Verifier:** `verify:cms-core-v2-external-form-provider-contract-validator` (Safety Suite step)
- **Policies locked:** HTTPS-only · exact host · fragment allowed only for `external-link` · Google path `/forms/d/e/…/viewform` · `forms.gle` rejected · HubSpot `scriptSrc` input forbidden · loader metadata derived · unknown fields fail-closed · no input mutation · no HTML generation

---

## 15. External-link provider implementation (2026-07-31)

- **Phase:** `cms-core-v2-external-form-provider-external-link` — **COMPLETE**
- **Renderer (site-neutral):** `scripts/lib/external-form-provider-renderer.mjs` — validator result only; HTML-escape; `rel="noopener noreferrer"`; `target="_blank"` iff `openInNewTab`
- **Mio helper:** `scripts/lib/mio-contact-form-page.mjs` — inject `formConfigBundle`; replaces `#mio-contact-form` + iframe placeholder; synthetic URL `https://forms.example.invalid/mio-kisaragi-jazz-booking`
- **Core forward:** `formConfigBundle` / `siteFormConfigBundle` via `site-generator-options` + `astro-generator` (no Mio selectors in Core)
- **Verifier:** `verify:cms-core-v2-external-form-provider-external-link` (Safety Suite)
- **Not done:** Google Forms iframe · HubSpot generalization · Admin · Save · registry real URLs · package/FTP
- **Next:** `cms-core-v2-external-form-provider-google-forms`
