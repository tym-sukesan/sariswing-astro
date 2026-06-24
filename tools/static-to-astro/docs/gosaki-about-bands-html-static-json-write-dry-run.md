# Gosaki About bands HTML static JSON write dry-run (G-10h4c)

**Phase:** `G-10h4c-gosaki-about-bands-html-static-json-write-dry-run`  
**Status:** **complete** — bands block dry-run API + UI; **no actual JSON write / no Save**  
**Date:** 2026-06-23  
**Prior:** G-10h4b profile Save (commit `e2d378a`)

| Check | Status |
| --- | --- |
| Dry-run API | **yes** |
| Dry-run UI (bands) | **yes** |
| Actual JSON write | **no** |
| non-dry-run Save | **rejected** |
| `about-profile-html` write | **out of scope** |
| G-10h4b profile marker | **preserved** |
| FTP / deploy | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-about-profile-html-static-json-write-execution.md](./gosaki-about-profile-html-static-json-write-execution.md) (G-10h4b)
- [gosaki-about-profile-html-static-json-write-dry-run.md](./gosaki-about-profile-html-static-json-write-dry-run.md) (G-10h4a)

---

## Gates

```txt
gosakiAboutBandsHtmlStaticJsonWriteDryRunComplete: true
phase: G-10h4c
readyForG10h4dGosakiAboutBandsHtmlStaticJsonWriteExecution: true
dryRunApiImplemented: true
dryRunUiImplemented: true
actualJsonWriteExecuted: false
nonDryRunSaveExecuted: false
writeApiNonDryRunImplemented: false
cursorJsonWriteExecuted: false
cursorDbWriteExecuted: false
cursorImageFileMutationExecuted: false
cursorFtpUploadExecuted: false
cursorDeployExecuted: false
workflowDispatchExecuted: false
doNotReClickG10h4bProfileSave: true
```

---

## 1. Scope

| Item | Value |
| --- | --- |
| Config path | `tools/static-to-astro/config/sites/gosaki-piano-about-content.json` |
| Block | `about-bands-html` only |
| Field | `html` only |
| approvalId | `G-10h4c-about-bands-html-static-json-write-dry-run` |
| module | `about-html-content` |
| provider | `static-json` |
| blocksAffected | `1` |

**Out of scope:** `about-profile-html`, `enabled`, `label`, `id`, page meta fields.

---

## 2. Modules

| File | Role |
| --- | --- |
| `gosaki-about-bands-html-static-json-write-types.ts` | constants / types |
| `gosaki-about-bands-html-static-json-write-guards.ts` | allowlists + HTML safety |
| `gosaki-about-bands-html-static-json-write-config.ts` | Save env gate |
| `gosaki-about-bands-html-static-json-write-page-config.ts` | DOM bridge |
| `gosaki-about-bands-html-static-json-write-dry-run.ts` | server dry-run |
| `gosaki-about-bands-html-static-json-write-api.ts` | API path + parse |
| `api/about-bands-html-static-json-write.json.ts` | POST handler |

---

## 3. API

**Path:** `/__admin-staging-shell/musician-basic/api/about-bands-html-static-json-write.json`

**Payload (dry-run):**

```json
{
  "approvalId": "G-10h4c-about-bands-html-static-json-write-dry-run",
  "siteSlug": "gosaki-piano",
  "blockId": "about-bands-html",
  "html": "...",
  "dryRun": true
}
```

| `dryRun` | Behavior |
| --- | --- |
| `true` | Execute dry-run — **no file write**; `wouldWrite: false` |
| `false` | **403** — `G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED=false` (default) |

**Env:** `G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED` — default **false** / unset → Save不可.

---

## 4. HTML safety (bands)

| Rule | bands block |
| --- | --- |
| `<script>` | reject |
| `<iframe>` | reject |
| `on*=` | reject |
| `javascript:` | reject |
| `style=""` | allow |
| `<style>` | allow (warning) |

Limits: html max **100,000** chars; total JSON html max **200,000** chars.

---

## 5. UI

Route: `/__admin-staging-shell/musician-basic/admin/about/`

| Block | UI |
| --- | --- |
| `about-profile-html` | unchanged from G-10h4b (marker preserved; no re-Save) |
| `about-bands-html` | editable textarea + live preview + dry-run + Save **disabled** |

---

## 6. Dry-run test (no JSON write)

Test comment appended in UI / verifier only:

```html
<!-- G-10h4c bands dry-run test -->
```

| Field | Result |
| --- | --- |
| `ok` | `true` |
| `dryRun` | `true` |
| `wouldWrite` | `false` |
| `changedFields` | `["html"]` |
| `blocksAffected` | `1` |
| `htmlSafety.ok` | `true` (`<style>` → warning only) |
| `saveAllowed` | `false` |
| JSON file changed | **no** |

---

## 7. Not executed

- non-dry-run Save / JSON write
- G-10h4b profile re-Save / run script
- DB / Supabase / FTP / deploy
- `.env` changes
- commit / push (deferred to operator)

---

## 8. Next

| Phase | Goal |
| --- | --- |
| **G-10h4d** | `about-bands-html` non-dry-run Save execution (one-time) |
| **G-10h5** | convert / build / manual-upload + operator re-upload |
