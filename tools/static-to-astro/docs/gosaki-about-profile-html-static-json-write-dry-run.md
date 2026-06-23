# Gosaki About profile HTML static JSON write dry-run (G-10h4a)

**Phase:** `G-10h4a-gosaki-about-profile-html-static-json-write-dry-run`  
**Status:** **complete** — profile block dry-run API + UI; **no actual JSON write / no Save**  
**Date:** 2026-06-23  
**Prior:** G-10h3 admin read-only preview (commit `e9137bb`)

| Check | Status |
| --- | --- |
| Dry-run API | **yes** |
| Dry-run UI (profile) | **yes** |
| Actual JSON write | **no** |
| non-dry-run Save | **rejected** |
| `about-bands-html` write | **out of scope** |
| FTP / deploy | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-about-html-content-admin-readonly-preview.md](./gosaki-about-html-content-admin-readonly-preview.md) (G-10h3)
- [gosaki-about-html-content-cms-implementation-preflight.md](./gosaki-about-html-content-cms-implementation-preflight.md) (G-10h1)

---

## Gates

```txt
gosakiAboutProfileHtmlStaticJsonWriteDryRunComplete: true
phase: G-10h4a
readyForG10h4bGosakiAboutProfileHtmlStaticJsonWriteExecution: true
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
```

---

## 1. Scope

| Item | Value |
| --- | --- |
| Config path | `tools/static-to-astro/config/sites/gosaki-piano-about-content.json` |
| Block | `about-profile-html` only |
| Field | `html` only |
| approvalId | `G-10h4a-about-profile-html-static-json-write-dry-run` |
| module | `about-html-content` |
| provider | `static-json` |
| blocksAffected | `1` |

**Out of scope:** `about-bands-html`, `enabled`, `label`, `id`, page meta fields.

---

## 2. Modules

| File | Role |
| --- | --- |
| `gosaki-about-profile-html-static-json-write-types.ts` | constants / types |
| `gosaki-about-profile-html-static-json-write-guards.ts` | allowlists + HTML safety |
| `gosaki-about-profile-html-static-json-write-config.ts` | Save env gate |
| `gosaki-about-profile-html-static-json-write-page-config.ts` | DOM bridge |
| `gosaki-about-profile-html-static-json-write-dry-run.ts` | server dry-run |
| `gosaki-about-profile-html-static-json-write-api.ts` | API path + parse |
| `api/about-profile-html-static-json-write.json.ts` | POST handler |

---

## 3. API

**Path:** `/__admin-staging-shell/musician-basic/api/about-profile-html-static-json-write.json`

**Payload (dry-run):**

```json
{
  "approvalId": "G-10h4a-about-profile-html-static-json-write-dry-run",
  "siteSlug": "gosaki-piano",
  "blockId": "about-profile-html",
  "html": "...",
  "dryRun": true
}
```

| `dryRun` | Behavior |
| --- | --- |
| `true` | Execute dry-run — **no file write**; `wouldWrite: false` |
| `false` | **403** — `G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED=false` (default) |

**Env:** `G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED` — default **false** / unset → Save不可.

---

## 4. HTML safety (profile)

| Pattern | Policy |
| --- | --- |
| `<script` | **reject** |
| `<iframe` | **reject** |
| `on*` attributes | **reject** |
| `javascript:` | **reject** |
| `style="..."` | **allow** |
| `<style>` block | **warning** |

**Limits:** profile `html` ≤ 100,000 chars; total all blocks ≤ 200,000 chars.

---

## 5. UI (`/admin/about/`)

### about-profile-html

- textarea **editable**
- live preview on input
- **dry-run 確認** button → POST API
- dry-run result panel (approvalId, lengths, changedFields, html safety, blocksAffected, wouldWrite)
- Save button **disabled**: `保存する（未実装 / env disabled）`

### about-bands-html

- **read-only** — 「Bands / Projects は今回の保存対象外です。」

---

## 6. Dry-run verification

Unit + verifier:

- Append `<!-- G-10h4a dry-run test -->` → dry-run OK, `changedFields: ["html"]`, `blocksAffected: 1`
- `about-bands-html` as blockId → rejected
- `<script>` in html → rejected

**No actual JSON file mutation.**

---

## 7. Not executed (G-10h4a)

- non-dry-run Save
- Actual JSON file write
- `about-bands-html` write
- DB / Supabase update
- Image file mutation
- FTP / deploy / manual upload
- `src/pages/admin` changes

---

## 8. Next phase

| Phase | Scope |
| --- | --- |
| **G-10h4b** | Profile block actual Save (env arm + one manual Save) |
| **G-10h4c** | Bands block dry-run + Save slices |
| **G-10h5** | Package + operator re-upload |

---

## 9. Changed files (G-10h4a)

| File | Change |
| --- | --- |
| `src/lib/admin/staging-write/gosaki-about-profile-html-static-json-write-*.ts` | **new** |
| `src/pages/.../api/about-profile-html-static-json-write.json.ts` | **new** |
| `AdminGosakiStagingAboutOperatorPage.astro` | profile dry-run UI |
| `gosaki-staging-about-content-admin-ui.ts` | dry-run client |
| `astro.config.mjs` | dev injectRoute API |
| `scripts/verify-g10h4a-*.mjs` | **new** |
| `docs/gosaki-about-profile-html-static-json-write-dry-run.md` | **new** |
| `docs/ai/*` | updated |
