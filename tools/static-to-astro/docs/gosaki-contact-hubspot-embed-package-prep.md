# Gosaki Contact HubSpot embed package prep (G-10g1)

**Phase:** `G-10g1-gosaki-contact-hubspot-embed-implementation-and-package-prep`  
**Status:** **complete** — Contact HubSpot embed + manual-upload package regenerated; **no FTP / upload**  
**Date:** 2026-06-24  
**Prior:** G-10h5-2 upload preflight (commit `c1b2bc3`); G-10h5-1 About package prep (`f427f9c`)

| Check | Status |
| --- | --- |
| Contact-only HubSpot config JSON | **yes** |
| Convert hook + allowlist | **yes** |
| Wix contact form replaced | **yes** (`#comp-jqbwo704`) |
| HubSpot script in contact astro | **1** |
| `hs-form-frame` in contact astro | **1** |
| HubSpot in `public-dist/contact/` | **yes** |
| About JSON unchanged | **yes** |
| `safeForStaticFtp: true` | **yes** |
| Manual-upload package regenerated | **yes** |
| FTP / FileZilla / upload | **no** |

Prior docs:

- [gosaki-about-html-staging-manual-upload-preflight.md](./gosaki-about-html-staging-manual-upload-preflight.md) (G-10h5-2)
- [gosaki-about-html-content-public-reflection-package-prep.md](./gosaki-about-html-content-public-reflection-package-prep.md) (G-10h5-1)

**HubSpot is Contact-only — not in About HTML CMS** (`<script>` blocked by About safety rules).

---

## Gates

```txt
gosakiContactHubspotEmbedPackagePrepComplete: true
phase: G-10g1
readyForG10h5_2GosakiAboutHtmlStagingManualUploadByOperator: true
cursorFtpUploadExecuted: false
cursorDeployExecuted: false
cursorDbWriteExecuted: false
cursorImageFileOpsExecuted: false
workflowDispatchExecuted: false
doNotReRunG10h4bRunScript: true
doNotReRunG10h4dRunScript: true
```

---

## 1. Contact page investigation

| Item | Finding |
| --- | --- |
| Target route | `/contact/` — **correct** |
| Source fixture | `fixtures/gosaki-piano/contact.html` |
| Generated page | `output/gosaki-piano-astro/src/pages/contact/index.astro` |
| Wix form wrapper | `#comp-jqbwo704` (form `#comp-kei80g91`) |
| Stale success msg | `#comp-kei80gar` (hidden via G-8f CSS — remains hidden) |
| Insertion strategy | **Replace** Wix form wrapper with HubSpot embed |

No other page used — Contact is the correct target.

---

## 2. Config JSON

**File:** `tools/static-to-astro/config/sites/gosaki-piano-contact-hubspot.json`

```json
{
  "siteSlug": "gosaki-piano",
  "page": "contact",
  "version": 1,
  "enabled": true,
  "provider": "hubspot",
  "region": "na1",
  "portalId": "21392032",
  "formId": "57909d0c-9b9f-470a-8a18-e176d1d1a459",
  "scriptSrc": "https://js.hsforms.net/forms/embed/21392032.js"
}
```

Copied to generated tree: `src/data/gosaki-contact-hubspot.json`

---

## 3. Convert hook

**File:** `scripts/lib/gosaki-contact-hubspot-embed.mjs`

- `validateGosakiContactHubspotConfig` — strict allowlist
- `buildGosakiContactHubspotEmbedHtml` — outputs HubSpot snippet (`is:inline` on script for Astro static build)
- `replaceContactFormWithHubspotEmbed` — replaces `#comp-jqbwo704`
- `applyGosakiContactHubspotEmbed` — wired from `astro-generator.mjs` (gosaki-piano fixture only)

---

## 4. HubSpot allowlist (exact — no arbitrary script/iframe)

| Field | Allowed value |
| --- | --- |
| `provider` | `hubspot` |
| `scriptSrc` | `https://js.hsforms.net/forms/embed/21392032.js` |
| `portalId` | `21392032` |
| `formId` | `57909d0c-9b9f-470a-8a18-e176d1d1a459` |
| `region` | `na1` |
| `enabled` | `true` |
| `siteSlug` | `gosaki-piano` |
| `page` | `contact` |

Any other provider / script / portal / form → config validation **fails**.

---

## 5. Generated output embed HTML

```html
<script is:inline src="https://js.hsforms.net/forms/embed/21392032.js" defer></script>
<div class="hs-form-frame" data-region="na1" data-form-id="57909d0c-9b9f-470a-8a18-e176d1d1a459" data-portal-id="21392032"></div>
```

(`is:inline` required for Astro static build — public-dist contains working external script URL.)

---

## 6. Local commands (executed)

```bash
cd tools/static-to-astro
rm -rf output/gosaki-piano-astro
node scripts/convert-static-to-astro.mjs \
  fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ \
  --site-profile musician \
  --verify-build

node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md

npm run manual-upload:package
npm run verify:manual-upload
```

Verifier:

```bash
node tools/static-to-astro/scripts/verify-g10g1-gosaki-contact-hubspot-embed-package-prep.mjs
```

---

## 7. Verification results

| Check | Astro | public-dist | manual-upload |
| --- | --- | --- | --- |
| HubSpot script (`21392032.js`) | **1** | **1** | **1** |
| `hs-form-frame` | **1** | **1** | **1** |
| Wix form `#comp-kei80g91` | **removed** | **removed** | **removed** |
| `noindex` | n/a | **yes** | **yes** |
| `deployBase` | yes | **yes** | **yes** |
| `safeForStaticFtp` | — | **true** | **true** |

About page markers / content from G-10h4b/G-10h4d **unchanged** in this convert.

---

## 8. Manual-upload package

| Path | Status |
| --- | --- |
| `output/manual-upload/gosaki-piano/public-dist/contact/index.html` | **updated** |
| `README-UPLOAD.md` | **regenerated** |
| `CHECKLIST.md` | **regenerated** |
| `MANIFEST.json` | **regenerated** |
| `gosaki-piano-manual-upload.zip` | **regenerated** |
| `verify:manual-upload` | **PASS** (20 files) |

**Upload source:** `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` (contents only)  
**Upload target:** `/cms-kit-staging/gosaki-piano/`

---

## 9. Not executed (G-10g1)

- FTP / FileZilla / staging upload
- `workflow_dispatch`
- DB / Supabase write
- About JSON re-Save
- G-10h4b / G-10h4d run script re-execution
- Image file ops
- `.env` edit
- commit / push (deferred)

---

## 10. Next

| Phase | Goal |
| --- | --- |
| **G-10h5-2a** (or refreshed preflight) | Operator manual upload — About + Contact HubSpot to staging |

Post-upload Contact QA:

- `/contact/` HTTP 200
- HubSpot form renders (not Wix form)
- `noindex` maintained

---

## 11. Changed files (G-10g1 — uncommitted)

- `config/sites/gosaki-piano-contact-hubspot.json` (new)
- `scripts/lib/gosaki-contact-hubspot-embed.mjs` (new)
- `scripts/lib/astro-generator.mjs` (wire hook)
- `scripts/verify-g10g1-gosaki-contact-hubspot-embed-package-prep.mjs` (new)
- AI context docs
- Local output (gitignored): `output/gosaki-piano-astro/`, `output/static-public/`, `output/manual-upload/`
