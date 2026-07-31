# CMS Core v2 — External form HubSpot completion audit

**Phase:** `cms-core-v2-external-form-provider-hubspot-completion-audit`<br>
**Date:** 2026-08-01<br>
**Scope:** read-only evidence audit · provider scorecard · next Primary recommendation<br>
**Not in scope:** runtime edits · legacy delete · form submit · HubSpot/Google Forms config changes · package/FTP · Admin · DB · commit/push

---

## 1. HubSpot provider verdict

| Item | Value |
| --- | --- |
| Verdict | **COMPLETE WITH NON-BLOCKING ITEMS** |
| Core generalization (validator · renderer · shadow · adapter · oracle) | **COMPLETE / PASS** |
| Genuine blockers for Kit HubSpot provider core | **none** |
| Next Kit Primary (project-wide) | **A** `cms-core-v2-mio-supabase-live-select-only-pilot` (recommended) |

HubSpot as a **site-neutral Contact provider** (validate → derive loader → render fixed HTML → Gosaki adapter on Core path with byte-stable markup) is done. Remaining items are submit-E2E recheck / onboarding / production cutover / optional cleanup / staging release — not Core blockers.

---

## 2. Completion checklist (evidence)

| Criterion | Status | Evidence |
| --- | --- | --- |
| Structured config validation | **PASS** | `external-form-provider-contract.mjs` hubspot normalize + fail reasonCodes |
| User `scriptSrc` forbidden | **PASS** | `SCRIPT_SRC_FORBIDDEN`; Gosaki exact gate still checks legacy field then strips before Core |
| Kit loader derivation | **PASS** | `deriveHubspotLoaderScriptSrc` → `js.hsforms.net/forms/embed/{portalId}.js` |
| Site-neutral renderer | **PASS** | `renderHubspotConfigHtml`; Core has no Gosaki selectors / customer IDs |
| script 1 / frame 1 | **PASS** | renderer + adapter-switch + shadow verifiers |
| Fail-closed | **PASS** | invalid / disabled / other providers → no script/frame |
| Gosaki exact ID gate | **PASS** | `validateGosakiContactHubspotConfig` + allowlist; not weakened |
| legacy / Core / fixture byte equality | **PASS** | shadow-compare + legacy-cleanup-audit triple equality |
| Gosaki adapter on Core path | **PASS** | `applyGosakiContactHubspotEmbed` → `buildGosakiContactHubspotEmbedHtmlViaCore` only |
| Wrapper / selector / CSS retained | **PASS** | `#comp-jqbwo704` → `#gosaki-contact-hubspot-embed`; site overrides CSS |
| PC / 375px browser baseline | **COMPLETE / PASS** | Operator confirmed after Core switch: HubSpot form displays; wrapper 1 · frame 1 · loader 1; Header/Footer OK; no switch-caused Console errors; **input/submit not performed** · preview `output/_cms-core-v2-hubspot-adapter-switch-browser/` |
| Isolation (non-Gosaki) | **PASS** | Mio / pilot verifiers: no Gosaki portalId / wrapper |
| Safety Suite wired | **PASS** | hubspot renderer · shadow · adapter-switch · legacy-audit (+ this completion audit) |
| Rollback / test oracle | **PASS** | legacy builder **KEEP_AS_TEST_ORACLE**; apply can be re-pointed in one edit if needed |

**Locked SoT fingerprints (must not change in this phase):**

| File | sha256 |
| --- | --- |
| `config/sites/gosaki-piano-contact-hubspot.json` | `0e952ad169e8ee2aa6c7c422b958e52ab9c9fee4d3e26f992e9a51139ff37c9a` |
| `fixtures/.../contact-hubspot-embed.html` | `8fae75c8d447d9380211e159e2840b4bd9ad5759c3f07c2e371fa7a5c69030e9` |
| `fixtures/.../contact-page.astro` | `d77bc79dc1a20a71db34c62da08913e9a8396f072f66b00a46e0eb7ecb4475f2` |

---

## 3. Incomplete items (not HubSpot Core blockers)

| Item | Classification |
| --- | --- |
| Core切替後の HubSpot submit E2E 再実施 | **provider core完了後の運用タスク** (NON-BLOCKING only) |
| New client HubSpot portal/form IDs | **新規site onboardingタスク** |
| New-site live browser check | **新規site onboardingタスク** |
| Production HubSpot / production env gate | **production cutover条件** |
| Privacy / cookie notice | **production cutover条件** |
| CSP allowlist tuning per host | **production cutover条件** |
| Admin UI for provider select | **optional** (separate Admin phase) |
| Legacy oracle deletion | **optional cleanup** (`…-legacy-oracle-retirement`) |
| Package regen / FTP for Contact-bearing staging release | **staging deployment / release task** (after provider core; **not** part of this completion verdict; FTP `--apply` still suspended) |

**Genuine blocker:** none for declaring HubSpot **provider core** complete.

**Non-blocking ops item retained for HubSpot core:** submit E2E recheck after Core switch only. PC/375 display baseline is **COMPLETE / PASS** (no input/submit).

---

## 4. Contact provider matrix

| Capability | `disabled` | `external-link` | `google-forms` | `hubspot` |
| --- | --- | --- | --- | --- |
| Validation | yes | yes (https host allow) | yes (`docs.google.com` path) | yes (portal/form/region; no input scriptSrc) |
| Rendering | notice only | Kit anchor | Kit iframe (fixed sandbox/height) | Kit script + `.hs-form-frame` |
| Offline pilot | yes | Mio inject | Mio inject (fake form id) | Gosaki Core path + synthetic renderer tests |
| Live display evidence | n/a | link only | **not verified** (offline pilot; sandbox may fail live) | **PC/375 PASS** after Core switch (form visible; wrapper/frame/loader 1; **no submit this arc**) |
| CRM | none | none | Google Sheets/email (Forms-side) | HubSpot CRM (provider-side) |
| External script / iframe | no | no | iframe yes | script + HS frames yes |
| Recommended use | unset / off | simple CTA / fallback | lightweight intake | CRM-oriented default candidate |
| Maturity | COMPLETE | COMPLETE | COMPLETE (offline) · live PARTIAL | **COMPLETE WITH NON-BLOCKING** |
| Open work | — | Admin UI optional | live Forms + sandbox product decision | submit E2E recheck · onboarding · Admin · oracle retirement |

Notes:

- **Google Forms:** offline iframe pilot only. Real form load/submit and sandbox compatibility are **unverified**.
- **HubSpot:** PC/375 browser display **PASS** after Core switch; **input/submit not performed** in this completion arc.

---

## 5. Kit recommended provider policy

Do **not** hard-force one provider. Site config selects:

| Preference | Provider | When |
| --- | --- | --- |
| CRM-oriented standard candidate | `hubspot` | Musician / school wanting CRM + Kit-fixed embed |
| Lightweight intake | `google-forms` | No HubSpot; accept iframe limits |
| Embed-free / generic fallback | `external-link` | Booking URL, mailto replacement, Forms fallback |
| Unconfigured | `disabled` | Default fail-closed notice |

Always: no arbitrary HTML/JS; fail-closed; staging vs production gates for live IDs.

---

## 6. Next Primary recommendation

Project goal: **prove CMS Kit generalization on a second site (Mio)**.

| Option | Fit to goal | Risk | Recommend |
| --- | --- | --- | --- |
| **A. Mio Supabase live SELECT-only pilot** | Highest — second site leaves fixture-inject and proves shared staging read path | Medium (staging-only · site_slug · published filters) | **Primary** |
| B. Generic read-only Admin shell | Important Kit surface; less “second site CMS data” proof | Medium (Admin scope) | Secondary |
| C. External form site onboarding contract | Useful after Contact providers exist | Low | Secondary / later |
| D. Google Forms live pilot | Narrow; does not prove CMS data layer | Medium (sandbox/product) | Later |

**Primary:** `cms-core-v2-mio-supabase-live-select-only-pilot` (SELECT-only · staging · no Save · no service_role).

**Secondary / later:** Admin read-only shell · form onboarding contract · Google Forms live · HubSpot oracle retirement.

---

## 7. Gates

```txt
phase: cms-core-v2-external-form-provider-hubspot-completion-audit
CMS_CORE_V2_EXTERNAL_FORM_HUBSPOT_COMPLETION_AUDIT_COMPLETE: true
CONTACT_HUBSPOT_PROVIDER_CORE: COMPLETE_WITH_NON_BLOCKING
CONTACT_HUBSPOT_GENUINE_BLOCKER: none
CONTACT_HUBSPOT_PC375_BROWSER_BASELINE: PASS
CONTACT_HUBSPOT_NON_BLOCKING_OPS: submit-e2e-recheck-after-core-switch
CONTACT_EXTERNAL_LINK: COMPLETE
CONTACT_GOOGLE_FORMS: COMPLETE_OFFLINE_PARTIAL_LIVE
CONTACT_DISABLED: COMPLETE
LEGACY_BUILDER_CLASSIFICATION: KEEP_AS_TEST_ORACLE
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-mio-supabase-live-select-only-pilot
RUNTIME_CHANGED: false
HUBSPOT_CONFIG_UNCHANGED: true
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
DB_WRITE_EXECUTED: false
FORM_SUBMIT_EXECUTED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## 8. Explicit non-goals (this phase)

- No runtime / HubSpot JSON / fixture expected changes
- No legacy builder deletion
- No form submit · no HubSpot portal edits
- No package / FTP / production / Admin / DB
- No commit / push in-phase (operator may commit docs/verifier later)
