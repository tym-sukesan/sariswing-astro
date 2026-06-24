# Gosaki About bands HTML static JSON write execution (G-10h4d / G-10h4d-1 prep)

**Phase (prep):** `G-10h4d-1-gosaki-about-bands-html-static-json-write-execution-prep`  
**Phase (execution):** `G-10h4d-gosaki-about-bands-html-static-json-write-execution`  
**Status (prep):** **complete** — executor + client Save + run script ready; **no actual JSON write**  
**Date:** 2026-06-23  
**Prior:** G-10h4c dry-run slice (commit `8cabd19`)

| Check | Prep (G-10h4d-1) | Execution (G-10h4d) |
| --- | --- | --- |
| non-dry-run Save implementation | **yes** | pending operator |
| One-time JSON write | **no** | pending |
| Target block | `about-bands-html` only | same |
| Target field | `html` only | same |
| `about-profile-html` unchanged | **yes** | required |
| G-10h4b profile marker once | **yes** | required |
| DB / Supabase write | **no** | **no** |
| FTP / deploy | **no** | **no** |
| `src/pages/admin` changed | **no** | **no** |
| `.env` / `.env.local` changed | **no** | **no** |

Prior docs:

- [gosaki-about-bands-html-static-json-write-dry-run.md](./gosaki-about-bands-html-static-json-write-dry-run.md) (G-10h4c)
- [gosaki-about-profile-html-static-json-write-execution.md](./gosaki-about-profile-html-static-json-write-execution.md) (G-10h4b)

---

## Gates

```txt
gosakiAboutBandsHtmlStaticJsonWriteExecutionPrepComplete: true
phase: G-10h4d-1
readyForG10h4dGosakiAboutBandsHtmlStaticJsonWriteExecution: true
actualJsonWriteExecuted: false
nonDryRunSaveExecuted: false
oneTimeSaveOnly: true
cursorDbWriteExecuted: false
cursorFtpUploadExecuted: false
cursorDeployExecuted: false
workflowDispatchExecuted: false
doNotReClickG10h4bSave: true
doNotExecuteG10h4dSaveInPrepPhase: true
routineDevSaveEnv: G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED=false
```

---

## 1. Exact target

| Item | Value |
| --- | --- |
| Config path | `tools/static-to-astro/config/sites/gosaki-piano-about-content.json` |
| Block | `about-bands-html` |
| Field | `html` |
| approvalId | `G-10h4c-about-bands-html-static-json-write-dry-run` (reused from G-10h4c) |
| Save env | `G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED=true` (session-only arm — execution phase only) |

**Out of scope:** `about-profile-html`, `enabled`, `label`, `id`, `siteSlug`, `page`, `version`, `previewPath`.

---

## 2. Exact change (one-time Save — not executed in prep)

Appended once to bands `html` tail:

```html
<!-- G-10h4d bands save test -->
```

- HTML comment — no visible layout change
- Expected `bandsMarkerCount: 1` after Save
- Re-run without rollback → `既存のため変更なし` (`already_present`)

---

## 3. Implementation added (G-10h4d-1)

| File | Role |
| --- | --- |
| `gosaki-about-bands-html-static-json-write-executor.ts` | atomic JSON write + dry-run re-check |
| `gosaki-about-bands-html-static-json-write-client-save.ts` | client Save → API |
| `api/about-bands-html-static-json-write.json.ts` | `dryRun: false` → executor when env armed |
| `gosaki-staging-about-content-admin-ui.ts` | bands Save path (env-gated) |
| `run-g10h4d-gosaki-about-bands-html-static-json-write-execution.mjs` | one-time local execution script |
| `verify-g10h4d-gosaki-about-bands-html-static-json-write-execution-prep.mjs` | prep verifier |

---

## 4. Dry-run reconfirmation (prep)

Input: current `about-bands-html.html` + `<!-- G-10h4d bands save test -->` (append once).

Expected:

```txt
ok: true
dryRun: true
wouldWrite: false
changedFields: ["html"]
blocksAffected: 1
htmlSafety.ok: true
saveAllowed: false (env disabled)
```

---

## 5. One-time execution command (G-10h4d — operator only)

**Do not run in G-10h4d-1 prep phase.**

```bash
G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED=true node tools/static-to-astro/scripts/run-g10h4d-gosaki-about-bands-html-static-json-write-execution.mjs
```

Alternative: staging shell UI Save with same env armed + dry-run success.

After execution:

- Restart routine dev with `G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED=false`
- Do not re-click G-10h4d Save
- Do not re-click G-10h4b profile Save

---

## 6. Run script safety guards

- `G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED=true` required for write
- `approvalId` exact match
- `siteSlug === gosaki-piano`
- `blockId === about-bands-html`
- Config path allowlist: `gosaki-piano-about-content.json` only
- Dry-run re-validation before write
- `already_present` / duplicate prevention
- G-10h4b profile marker count === 1
- `about-profile-html` unchanged
- Atomic write (`*.g10h4d.tmp.*` → rename)
- Re-run does not double-append

---

## 7. Verification

```bash
node tools/static-to-astro/scripts/verify-g10h4d-gosaki-about-bands-html-static-json-write-execution-prep.mjs
```

---

## 8. Rollback

N/A — static JSON only (no DB).

Rollback (staging JSON — execution phase only, not executed in prep):

```bash
git checkout -- tools/static-to-astro/config/sites/gosaki-piano-about-content.json
```

Or manual removal of `<!-- G-10h4d bands save test -->` from `about-bands-html` block html.
