# G-14b1e — Gosaki Schedule CMS routine edit public reflection local regen and upload preflight

**Phase:** `G-14b1e-gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight`  
**Status:** **complete** — local package regen **succeeded**; April price update verified in generated HTML; minimal 1-file upload plan ready; **operator manual FTP upload pending**  
**Date:** 2026-06-28  
**Base commit:** `83cc049`  
**Prior:** [gosaki-schedule-routine-edit-save-execution-result.md](./gosaki-schedule-routine-edit-save-execution-result.md)  
**Standard:** [gosaki-public-reflection-operation-standardization.md](./gosaki-public-reflection-operation-standardization.md) (G-14c §12.1)

| Check | Status |
| --- | --- |
| G-14b1d routine edit Save | **complete** |
| Local package regen | **yes** — `build-gosaki-staging-admin-package.mjs` PASS |
| April HTML price reflection | **PASS** |
| Old price absent (Trio card) | **PASS** |
| PoC / audit markers absent | **PASS** |
| `scheduleDataSource=supabase` | **PASS** |
| CSS / JS hash vs prior package | **unchanged** — minimal 1-file upload |
| Live staging April page | **stale** — `3,300円(tax in)` still present (pre-upload HTTP) |
| Post-upload HTTP verify | **not executed** (execution phase) |
| FTP / deploy / workflow_dispatch | **not executed** |
| Cursor Save / DB write | **no** |

---

## Gates

```txt
gosakiScheduleRoutineEditPublicReflectionLocalRegenComplete: true
gosakiScheduleRoutineEditPublicReflectionUploadPreflightComplete: true
phase: G-14b1e-gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight
readyForG14b1ePublicReflectionUploadExecution: true
readyForG14b1RoutineEditReflectionClosure: false
packageRegenExecuted: true
minimalUploadScopeConfirmed: true
cssJsHashChanged: false
ftpUploadExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
postUploadHttpVerifyExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
eventATouched: false
eventBTouched: false
marchReuploadTriggered: false
julyReuploadTriggered: false
```

**Live staging April page still stale** until operator manual upload (separate execution phase).

**Output artifacts:** under `tools/static-to-astro/output/` — **gitignored** (`tools/static-to-astro/.gitignore` → `output/*`). Not committed.

---

## 1. Target row (routine edit)

| Field | Value |
| --- | --- |
| **id** | `14230329-dde5-40d6-b9b3-75aefe140daf` |
| **site_slug** | `gosaki-piano` |
| **legacy_id** | `schedule-2026-04-005` |
| **date** | `2026-04-12` |
| **route** | `/schedule/2026-04/` |
| **title** | `<Trio>` |
| **venue** | `吉祥寺 Strings` |

### DB after Save (G-14b1d — reference)

| Field | Value |
| --- | --- |
| **price** | `3,300円（税込）` |
| **updated_at** | `2026-06-27T17:18:54.986868+00:00` |
| **show_on_home** | `false` |
| **published** | `true` |

**Event A / Event B / March / July — not touched.**

---

## 2. Local regen command

```bash
cd tools/static-to-astro
node scripts/build-gosaki-staging-admin-package.mjs
```

**Env source:** existing repo `.env` / `.env.local` (read-only — not modified).

**Pipeline executed:**

```txt
1. convert-static-to-astro.mjs  fixtures/gosaki-piano → output/gosaki-piano-astro
2. verify-static-public-artifact.mjs  → PASS (safeForStaticFtp: true)
3. npm run manual-upload:package
4. npm run verify:manual-upload  → PASS
```

**Overall:** `G-11c4b package build: PASS`

**Schedule data:** `scheduleDataSource=supabase` — **60 events** read from staging anon.

---

## 3. Generation output

| Artifact | Path |
| --- | --- |
| Astro project | `tools/static-to-astro/output/gosaki-piano-astro/` |
| Schedule JSON (intermediate) | `output/gosaki-piano-astro/src/data/gosaki-schedules.json` |
| Static public report | `output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md` |
| Manual upload package | `output/manual-upload/gosaki-piano/` |
| Public dist (upload source) | `output/manual-upload/gosaki-piano/public-dist/` |
| Zip (optional) | `output/manual-upload/gosaki-piano/gosaki-piano-manual-upload.zip` |

| Metric | Before regen | After regen |
| --- | --- | --- |
| **File count** | **27** | **27** |
| **deployBase** | `/cms-kit-staging/gosaki-piano/` | (unchanged) |
| **stagingUrl** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` | (unchanged) |
| **safeForStaticFtp** | `true` | **true** |
| **static-public verify** | — | **PASS** |
| **manual-upload verify** | — | **PASS** |

### CSS / JS hash (before vs after regen)

| Asset | Hash | Changed? |
| --- | --- | --- |
| CSS | `index.YcHrHZH4.css` | **no** |
| JS | `index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` | **no** |

**Decision:** minimal upload = **1 HTML file only** — do **not** upload `_astro/` or full `public-dist/`.

### Regenerated file diff (scope note)

| File | Changed? | Note |
| --- | --- | --- |
| `public-dist/schedule/2026-04/index.html` | **yes** — price text updated | **upload target** |
| Other 26 files in `public-dist/` | regenerated but content-equivalent for this change | **out of upload scope** |
| `_astro/*` | unchanged hash | **not needed** |

---

## 4. April HTML — routine edit reflection (local package)

**File:** `output/manual-upload/gosaki-piano/public-dist/schedule/2026-04/index.html`  
**Size:** 13519 bytes (2026-06-28 regen; was stale with old price before regen)

### Target card (`2026.04.12 (Sun)` / `<Trio>` / 吉祥寺 Strings)

```html
2026.04.12 (Sun) </h1> <div class="gosaki-schedule-event-body wixui-rich-text"> <p>&lt;Trio&gt;</p> <p>会場：吉祥寺 Strings</p> <p>時間：開場 12:00 / 開演 13:00</p> <p>料金：3,300円（税込）</p> <p>出演：宮崎幸子vo 後藤沙紀pf 寺尾陽介b</p>
```

| Check | Result |
| --- | --- |
| `scheduleDataSource=supabase` | **PASS** |
| Event card `2026.04.12 (Sun)` | **present** |
| Title | `<Trio>` |
| Venue | `吉祥寺 Strings` |
| Times | `開場 12:00 / 開演 13:00` |
| **Price** | **`料金：3,300円（税込）`** |
| Old price `3,300円(tax in)` on Trio card | **absent** |
| Description | unchanged |

### PoC / audit markers — must be absent (local)

| Marker | Result |
| --- | --- |
| `[CMS Kit staging]` | **absent** |
| `[G-14b1 routine PoC]` | **absent** |
| `G-9g2` / `G-9g3b` / `G-9g3c` / `G-9g3d` PoC strings | **absent** |
| `3,300円(tax in)` (Trio card) | **absent** |

### Intermediate JSON (`schedule-2026-04-005`)

```json
{
  "legacy_id": "schedule-2026-04-005",
  "date": "2026-04-12",
  "title": "<Trio>",
  "venue": "吉祥寺 Strings",
  "price": "3,300円（税込）"
}
```

### March / July spot-check (out of upload scope)

| File | Note |
| --- | --- |
| `schedule/2026-03/index.html` | Event A — G-13e uploaded; **not** in this upload |
| `schedule/2026-07/index.html` | Event B — G-13c2e uploaded; **not** in this upload |

---

## 5. Upload scope decision

| Option | Files | Decision |
| --- | --- | --- |
| **Minimal (recommended)** | **1** — `schedule/2026-04/index.html` | **Use this** |
| Full package | 27 files under `public-dist/` | **Defer** — unnecessary risk |
| `_astro/*` | 2 files | **Not needed** — CSS/JS hash unchanged |
| `admin/` | — | **Out of scope** |
| March / July month pages | — | **Out of scope** |

**Rationale:** Price notation change is isolated to April month HTML. CSS / JS references unchanged vs live staging.

---

## 6. Local source (verified)

| Item | Value |
| --- | --- |
| **Local file** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-04/index.html` |
| **File size** | 13519 bytes |
| **Package verify** | `safeForStaticFtp: true`, `verify:manual-upload: PASS` |
| **Zip backup (optional)** | `output/manual-upload/gosaki-piano/gosaki-piano-manual-upload.zip` |

---

## 7. Remote destination (staging only)

| Item | Value |
| --- | --- |
| **Host** | `yskcreate.weblike.jp` (Lolipop FTP — operator credentials, not in repo) |
| **FTP remote directory** | `/cms-kit-staging/gosaki-piano/` |
| **Remote file** | `/cms-kit-staging/gosaki-piano/schedule/2026-04/index.html` |
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-04/` |

### Blocked targets

| Target | Status |
| --- | --- |
| Account FTP root `/` | **blocked** (G-7f incident) |
| Sariswing production | **blocked** |
| gosaki-piano.com production | **blocked** |
| `mirror --delete` / `sync --delete` / remote `rm` | **forbidden** (G-7f1) |
| `deploy-public-dist-ftp.mjs --apply` | **suspended** (`readyForAnyFutureFtpApply: false`) |

---

## 8. Pre-upload live state (read-only HTTP — gap documented)

**Verified 2026-06-28:** live April page **still stale** (old price present).

| Check | Live staging (before upload) |
| --- | --- |
| HTTP | **200** |
| `scheduleDataSource=supabase` | **yes** |
| Trio card `2026.04.12 (Sun)` | **present** |
| Price on Trio card | `料金：3,300円(tax in)` (**stale**) |

**Expected after upload:** Trio card shows `料金：3,300円（税込）`.

**Post-upload HTTP verify:** **not executed in this phase** — G-14b1e-upload-execution phase only.

---

## 9. Operator manual upload procedure (execution phase — not this phase)

**Approval phrase:**

```txt
承認します。この手動アップロードを1回だけ実行してください。
```

| Step | Action |
| --- | --- |
| 1 | Open FileZilla / Lolipop FTP GUI |
| 2 | Connect to `yskcreate.weblike.jp` (operator credentials) |
| 3 | Navigate remote to `/cms-kit-staging/gosaki-piano/schedule/2026-04/` |
| 4 | Upload **one file** — local `schedule/2026-04/index.html` → remote `index.html` (**overwrite**) |
| 5 | **Do not** upload `_astro/`, full `public-dist/`, or other month pages |
| 6 | **Do not** use `mirror --delete` or remote cleanup |
| 7 | Proceed to HTTP verify (execution result doc) |

---

## 10. Post-upload HTTP verify (execution phase — not this phase)

```txt
URL: https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-04/
Expected: 料金：3,300円（税込） on 2026.04.12 Trio card
Must not contain: 3,300円(tax in) on Trio card
HTTP: 200
```

---

## 11. Stop conditions

| Condition | Action |
| --- | --- |
| Wrong file / wrong month uploaded | **Stop** |
| Full `public-dist/` or `_astro/` uploaded without approval | **Stop** |
| `mirror --delete` or remote cleanup | **Stop** — incident |
| Live HTTP still shows old price after upload | **Stop** — no blind retry |
| Production host touched | **Stop immediately** |

---

## 12. Next phases

| Phase | Action |
| --- | --- |
| **G-14b1e-upload** | Operator manual upload once |
| **G-14b1e-result** | HTTP verify + result doc |
| **G-14b1f** | Routine edit reflection closure |

---

## 13. Prohibited operations — not performed

| Operation | Executed |
| --- | --- |
| FTP / upload | **no** |
| Post-upload HTTP verify | **no** |
| Cursor Save / DB write | **no** |
| package commit to git | **no** (output gitignored) |
| commit / push | **no** |

---

## 14. Verifier

```bash
node tools/static-to-astro/scripts/verify-g14b1e-gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight.mjs
```

---

## 15. Reference index

| Topic | Doc |
| --- | --- |
| G-14b1d Save result | `gosaki-schedule-routine-edit-save-execution-result.md` |
| G-14c playbook | `gosaki-public-reflection-operation-standardization.md` |
| G-13c2e template | `gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight.md` |
