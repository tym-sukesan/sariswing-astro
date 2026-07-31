# CMS Core v2 — Mio read-only proof completion

- **Phase:** `cms-core-v2-mio-read-only-proof-completion`
- **Date:** 2026-07-31
- **Site:** `mio-kisaragi-jazz` (fictional second musician fixture)
- **Verdict:** **COMPLETE / PASS** — CMS Core v2 **read-only** multi-site conversion proof
- **Scope of this phase:** audit + docs only (no runtime / fixture / package / network)

---

## 1. Final judgment

**Mio read-only proof: COMPLETE / PASS.**

The Kit can convert a second, hand-authored static site (not Gosaki / not Wix crawl copy) through the shared convert path, resolve it from the site registry, lazy-load a Mio adapter, and render Schedule / Discography / Videos / About / footer from **explicitly injected** read-only bundles — with fail-closed unpublished / invalid handling, PC/SP visual baseline PASS, zero Gosaki leakage in Mio output, and stable offline Safety Suite — **without** DB write, Save, package, FTP, or production.

Contact remains **PARTIAL for Mio live CRM**, but Kit Contact providers are in place:

- **external-link** · **google-forms** (offline pilot) for Mio via `formConfigBundle`
- **hubspot** Core path for Gosaki (**COMPLETE WITH NON-BLOCKING**; see `cms-core-v2-external-form-provider-hubspot-completion-audit.md`)

Admin / live Forms submit / Mio HubSpot onboarding remain open.

---

## 2. Capability scorecard

| # | Capability | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Independent static fixture | **PASS** | `fixtures/mio-kisaragi-jazz/` hand-authored HTML/CSS/SVG |
| 2 | Registry + shared convert | **PASS** | `registry.json` `mio-kisaragi-jazz` · `--site` convert |
| 3 | Gosaki-independent noop convert | **PASS** | registry noop pilot · Gosaki factory unloaded during Mio convert |
| 4 | Mio lazy adapter | **PASS** | `generatorHooksAdapter` → `mio-site-generator-hooks-adapter.mjs` |
| 5 | Schedule read-only render | **PASS** | public 14 · Aug7 / Sep6 · Jul hub-only · draft/pending hidden |
| 6 | Discography read-only render | **PASS** | public 4 · unpublished excluded |
| 7 | Videos read-only render | **PASS** | published 3 nocookie · shorts/invalid fail-closed |
| 8 | About read-only render | **PASS** | JA short/long · EN · collab ×3 · base-aware images |
| 9 | Footer SNS | **PASS** | Instagram + YouTube · no X · Mio markup |
| 10 | PC / SP browser baseline | **PASS** | operator visual PASS after fix (dual-nav · wrap · assets · event-card CSS) |
| 11 | Isolation vs Gosaki / generic / pilot | **PASS** | `/gosaki/i` 0 in Mio output · pilot zero mio markers |
| 12 | Offline verifiers + Safety Suite | **PASS** | dedicated Mio verifiers in suite · baseline 80 · ALL PASS |
| 13 | Contact | **PARTIAL (Mio)** · Kit providers advanced | Mio: link + Forms offline; Gosaki HubSpot Core **COMPLETE_WITH_NON_BLOCKING**; Admin / live Forms / Mio HubSpot open |
| 14 | Supabase live read | **PREFLIGHT STOP (Branch B)** | staging anon SELECT: Mio rows **0** · seed write gate required · see `cms-core-v2-mio-supabase-live-select-only-preflight.md` |
| 15 | Admin UI | **NOT_STARTED** | staging shell / Mio admin not wired |
| 16 | Save / DB write | **NOT_STARTED** | out of read-only proof |
| 17 | Package / staging deploy | **NOT_STARTED** | profiles exist; generate/FTP not executed |
| 18 | Production readiness | **NOT_STARTED** | STOP · `readyForAnyFutureFtpApply: false` |

---

## 3. Proven abilities (summary)

- Hand-written second-site HTML through **shared** `generateAstroProject` / convert CLI
- Registry resolution (`siteKey`, fixtureDir, deploy profiles, adapter path)
- Lazy site adapter load; Core remains free of Mio presentation selectors
- Explicit bundle inject: `scheduleBundle` · `discographyBundle` · `embedsBundle` · `aboutBundle`
- Fail-closed: draft/pending schedules · unpublished disco/videos · invalid YouTube · unsafe image URLs
- Site-neutral Core fixes used by Mio: preserve dual-nav · `mainClass` · site-neutral bundle keys
- Operator PC/SP baseline PASS; Gosaki HTML baseline unchanged (80 PASS)
- Offline Safety Suite includes Mio steps; import-cycle includes Mio helpers

---

## 4. Not proven / not started

| Area | Note |
| --- | --- |
| External Contact form | Kit: external-link / google-forms / hubspot Core done; Mio HubSpot onboarding · Forms live · Admin still open |
| Mio Supabase live SELECT | Preflight **Branch B** (no rows) · next = seed write gate → then Branch A pilot |
| Generic read-only Admin for Mio | Feature registry; Save stays disabled |
| Any Save / Edge / RLS / Secrets | Separate high-risk gates |
| Mio package + staging FTP | Separate approval; FTP `--apply` still suspended |
| Production cutover | STOP |

---

## 5. Remaining work (classified)

### A — Next major development candidates (read-only extension)

1. **External form integration** — allowlisted providers only (external-link / Google Forms / HubSpot ID/URL); no arbitrary HTML/JS
2. **Supabase live read pilot** — staging SELECT-only · `site_slug` · published filter · build-read fallback
3. **Generic read-only Admin** — Mio surfaces via feature registry · Save disabled

### B — Write / high-risk (separate phases + safety gates)

- Save · optimistic lock · Edge · DB migration / RLS · Secrets / env
- Package generation · FTP / staging deploy · production cutover

### C — Non-blocking polish

- Home `evening set` hero placeholder design
- Placeholder image / copy quality
- Contact page final design
- Shorts URL support
- TBD-date event UX
- July archive presentation
- Extra a11y / SEO audits

---

## 6. Next-path comparison (recommended order)

| Rank | Candidate phase | Purpose | Benefit | Risk | Size | Priority now |
| --- | --- | --- | --- | --- | --- | --- |
| **1** | `cms-core-v2-external-form-provider-contract-planning` | Define allowlisted Contact providers + URL/ID contract | Unblocks real-world Contact without write stack; fits “external service only” policy | Low if docs/planning first | S–M | **DONE (planning)** |
| **2** | `cms-core-v2-mio-supabase-live-read-pilot` (name TBD) | Fixture inject → staging SELECT for Mio | Proves multi-site data path beyond fixtures | Medium (staging gate, slug isolation) | M | After form validator / link provider or parallel if needed |
| **3** | `cms-core-v2-generic-readonly-admin-planning` | Site-agnostic admin chrome for Mio | Enables operator preview of CMS fields | Medium (must not touch `/admin` without gate) | M | After read surfaces stabilize |

**Recommendation (updated):** planning complete — next Kit implement **`cms-core-v2-external-form-provider-contract-validator`**, then `external-link` provider. See `cms-core-v2-external-form-provider-contract-planning.md`.
No residual Core→Mio hardcode blocker was found that would outrank Contact; Contact remains the only PARTIAL public-surface item until runtime providers land.

Ops parallel (unchanged): Gosaki **client staging share** (`CLIENT_SHARE_READY: true`).

---

## 7. Project progress re-evaluation

| Lens | Estimate | Rationale |
| --- | --- | --- |
| **Multi-site read-only convert proof** (this arc) | **~95%** | Criteria met; Contact form = remaining PARTIAL |
| **Reusable Musician CMS Kit MVP** (convert + CMS read/write + staging package) | **~50–55%** | Gosaki deep; Mio read-only proven; live read / admin / save / package for 2nd site open |
| **Production-ready multi-tenant product** | **~25–30%** | Production STOP; FTP apply suspended; hosting not ready |

---

## 8. Verification (this completion phase)

| Check | Result |
| --- | --- |
| `verify:cms-core-v2-mio-*` (registry / data / thin / schedule / disco / about) | PASS |
| Gosaki HTML baseline | **80 PASS** |
| `verify:cms-core-v2-safety-suite` | **ALL PASS** |
| import-cycle | PASS (25 modules) |
| `git diff --check` | empty (before docs write) |
| Network / Supabase / browser re-run | **not required** (uses recorded browser baseline PASS) |

HEAD at start: `244cefdff484492349f94e7668e763d910e0d19e` (= `origin/main`, clean).

---

## 9. Gates

```txt
phase: cms-core-v2-mio-read-only-proof-completion
CMS_CORE_V2_MIO_READ_ONLY_PROOF_COMPLETE: true
CMS_CORE_V2_MIO_READ_ONLY_PROOF_PASS: true
CMS_CORE_V2_MIO_READ_RENDER_BROWSER_BASELINE_PASS: true
CONTACT_EXTERNAL_FORM: PLANNING_COMPLETE
CONTACT_EXTERNAL_FORM_DOC: cms-core-v2-external-form-provider-contract-planning.md
CONTACT_EXTERNAL_LINK_PROVIDER: COMPLETE
CONTACT_GOOGLE_FORMS_PROVIDER: COMPLETE
CONTACT_HUBSPOT_GENERALIZATION: NOT_STARTED
SUPABASE_LIVE_READ_MIO: NOT_STARTED
MIO_ADMIN_UI: NOT_STARTED
SAVE_DB_WRITE: NOT_STARTED
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
NEXT_RECOMMENDED: cms-core-v2-external-form-provider-hubspot-generalization-planning
```

Follow-up: external-link + **google-forms** offline pilots (synthetic docs.google.com URL). HubSpot generalization / Admin still open.

---

## 10. Explicit non-goals of this phase

- No runtime / fixture / registry / verifier-relaxation changes
- No Contact / Supabase / Admin / Save / package / FTP / DB / Edge / env / production
- No commit / push
