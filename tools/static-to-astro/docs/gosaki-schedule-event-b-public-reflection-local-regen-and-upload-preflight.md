# G-13c2e — Gosaki Event B PoC cleanup public reflection local regen and upload preflight

**Phase:** `G-13c2e-gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight`  
**Status:** **complete** — local package regen **succeeded**; July Event B cleanup verified in generated HTML; minimal 1-file upload plan ready; **operator manual FTP upload pending**  
**Date:** 2026-06-28  
**Base commit:** `15bf558`  
**Prior:** [gosaki-schedule-event-b-poc-cleanup-execution-result.md](./gosaki-schedule-event-b-poc-cleanup-execution-result.md)  
**Standard:** [gosaki-public-reflection-operation-standardization.md](./gosaki-public-reflection-operation-standardization.md) (G-14c §12.3)

| Check | Status |
| --- | --- |
| G-13c2 Event B DB cleanup | **complete** (G-13c2 execution result) |
| Local package regen | **yes** — `build-gosaki-staging-admin-package.mjs` PASS |
| July HTML Event B cleanup | **PASS** |
| PoC markers absent in local package | **PASS** (G-9g2 / G-9g3b / G-9g3c / G-9g3d) |
| `scheduleDataSource=supabase` | **PASS** |
| CSS / JS hash vs live staging | **unchanged** — minimal 1-file upload |
| Live staging July page | **stale** — PoC text still present (pre-upload HTTP) |
| Post-upload HTTP verify | **not executed** (execution phase) |
| FTP / deploy / workflow_dispatch | **not executed** |
| Cursor Save / DB write | **no** |

---

## Gates

```txt
gosakiScheduleEventBPocCleanupPublicReflectionLocalRegenComplete: true
gosakiScheduleEventBPocCleanupPublicReflectionUploadPreflightComplete: true
phase: G-13c2e-gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight
readyForG13c2ePublicReflectionUploadExecution: true
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
marchReuploadTriggered: false
```

**Live staging July page still stale** until operator manual upload (separate execution phase).

---

## 1. Target row (Event B)

| Field | Value |
| --- | --- |
| **id** | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| **site_slug** | `gosaki-piano` |
| **legacy_id** | `schedule-2026-07-010` |
| **date** | `2026-07-19` |
| **route** | `/schedule/2026-07/` |

### DB after cleanup (G-13c2 execution — reference)

| Field | Value |
| --- | --- |
| **title** | `<>` |
| **venue** | **null** |
| **open_time** | **null** |
| **start_time** | **null** |
| **price** | **null** |
| **description** | `出演：` |
| **updated_at** | `2026-06-27T10:17:42.60691+00:00` |

**Event A (`f687ebf3…`) / March `schedule/2026-03/` — not touched.**

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

| Metric | Value |
| --- | --- |
| **File count** | **27** |
| **deployBase** | `/cms-kit-staging/gosaki-piano/` |
| **stagingUrl** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| **safeForStaticFtp** | **true** |
| **static-public verify** | **PASS** |
| **manual-upload verify** | **PASS** |

### CSS / JS hash (vs live staging)

| Asset | Hash | Changed? |
| --- | --- | --- |
| CSS | `index.YcHrHZH4.css` | **no** |
| JS | `index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` | **no** |

**Decision:** minimal upload = **1 HTML file only** — do **not** upload `_astro/` or full `public-dist/`.

---

## 4. July HTML — Event B reflection (local package)

**File:** `output/manual-upload/gosaki-piano/public-dist/schedule/2026-07/index.html`  
**Size:** 14721 bytes (2026-06-28 regen)

### Event B card (`2026.07.19 (Sun)`)

```html
2026.07.19 (Sun) </h1> <div class="gosaki-schedule-event-body wixui-rich-text"> <p>&lt;&gt;</p>    <p>出演：</p> </div> </article>
```

| Check | Result |
| --- | --- |
| `scheduleDataSource=supabase` | **PASS** |
| Event card `2026.07.19 (Sun)` | **present** |
| Title | `<>` (HTML: `&lt;&gt;`) |
| Venue line | **absent** (null → no `会場：` paragraph) |
| Time line | **absent** (null → no `開場` / `開演`) |
| Price line | **absent** (null → no `料金：`) |
| Description | `出演：` only |

### PoC markers — must be absent (local)

| Marker | Result |
| --- | --- |
| `[CMS Kit staging] G-9g2 title PoC` | **absent** |
| `[CMS Kit staging] G-9g3b venue PoC` | **absent** |
| `[CMS Kit staging] G-9g3c open PoC` | **absent** |
| `[CMS Kit staging] G-9g3c start PoC` | **absent** |
| `[CMS Kit staging] G-9g3d general edit price PoC` | **absent** |
| `[G-9g3b venue+description PoC]` | **absent** |

### Intermediate JSON (`schedule-2026-07-010`)

```json
{
  "legacy_id": "schedule-2026-07-010",
  "date": "2026-07-19",
  "title": "<>",
  "venue": null,
  "open_time": null,
  "start_time": null,
  "price": null,
  "description": "出演："
}
```

### March spot-check (Event A — out of upload scope)

**File:** `schedule/2026-03/index.html` — Event A clean (`<Duo>`, no G-9k6); **not** included in this upload.

---

## 5. Upload scope decision

| Option | Files | Decision |
| --- | --- | --- |
| **Minimal (recommended)** | **1** — `schedule/2026-07/index.html` | **Use this** |
| Full package | 27 files under `public-dist/` | **Defer** — unnecessary risk |
| `_astro/*` | 2 files | **Not needed** — CSS/JS hash unchanged |
| `admin/` | — | **Out of scope** |
| March `schedule/2026-03/` | — | **Out of scope** (G-13e already uploaded) |

**Rationale:** Event B text change is isolated to July month HTML. CSS / JS references unchanged vs live staging.

---

## 6. Local source (verified)

| Item | Value |
| --- | --- |
| **Local file** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-07/index.html` |
| **File size** | 14721 bytes |
| **Package verify** | G-13c2e local regen — `safeForStaticFtp: true`, `verify:manual-upload: PASS` |
| **Zip backup (optional)** | `output/manual-upload/gosaki-piano/gosaki-piano-manual-upload.zip` |

---

## 7. Remote destination (staging only)

| Item | Value |
| --- | --- |
| **Host** | `yskcreate.weblike.jp` (Lolipop FTP — operator credentials, not in repo) |
| **FTP remote directory** | `/cms-kit-staging/gosaki-piano/` |
| **Remote file** | `/cms-kit-staging/gosaki-piano/schedule/2026-07/index.html` |
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/` |

### Blocked targets

| Target | Status |
| --- | --- |
| Account FTP root `/` | **blocked** (G-7f incident) |
| Sariswing production | **blocked** |
| gosaki-piano.com production | **blocked** |
| TLHA / other site folders | **blocked** |
| `mirror --delete` / `sync --delete` / remote `rm` | **forbidden** (G-7f1) |
| `deploy-public-dist-ftp.mjs --apply` | **suspended** (`readyForAnyFutureFtpApply: false`) |

---

## 8. Pre-upload live state (read-only HTTP — gap documented)

**Verified ~2026-06-28:** live July page **still stale** (PoC text present).

| Check | Live staging (before upload) |
| --- | --- |
| HTTP | **200** |
| `scheduleDataSource=supabase` | **yes** |
| Event B `2026.07.19` | **G-9g PoC text present** |
| Title on Event B card | `[CMS Kit staging] G-9g2 title PoC` |
| Venue / times / price | G-9g3b / G-9g3c / G-9g3d PoC strings |

**Expected after upload:** Event B card matches section 4 (clean text).

**Post-upload HTTP verify:** **not executed in this phase** — execution phase only.

---

## 9. Operator manual upload procedure (G-13c2e execution — not this phase)

**Tool:** FileZilla or Lolipop FTP クライアント（GUI 手動のみ）

### Preflight checklist (operator)

- [ ] Local file exists: `…/public-dist/schedule/2026-07/index.html`
- [ ] FTP login succeeds; remote pane shows **`/cms-kit-staging/gosaki-piano/`** — **not** `/` or account root
- [ ] Remote path exists: `schedule/2026-07/` (create folder only if missing — do not touch siblings)
- [ ] Upload mode: **overwrite single file** only
- [ ] **No** mirror / sync / bulk delete / “sync missing files” with delete
- [ ] **No** upload of full `public-dist/` (27 files) unless minimal fails HTTP verify
- [ ] **No** March `schedule/2026-03/index.html` re-upload

### Steps

1. Open FTP client; connect to Lolipop (`yskcreate.weblike.jp`).
2. **Remote:** navigate to `/cms-kit-staging/gosaki-piano/schedule/2026-07/`.
   - Confirm path in status bar — must contain `cms-kit-staging/gosaki-piano`.
   - **Abort** if remote pane is `/` or unrelated site folder.
3. **Local:** open  
   `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-07/`
4. Select **`index.html` only** (1 file).
5. Upload with **overwrite** — no delete/sync options enabled.
6. Confirm remote `index.html` timestamp / size updated.
7. Proceed to HTTP verification (section 10).

### Explicit approval (execution phase only)

```txt
承認します。この手動アップロードを1回だけ実行してください。
```

**Permitted once:** overwrite upload of `schedule/2026-07/index.html` → `/cms-kit-staging/gosaki-piano/schedule/2026-07/index.html`

---

## 10. Post-upload HTTP verification (execution phase — not executed)

### Primary URL

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/
```

### Checks (Event B card `2026.07.19`)

| # | Check | Pass criteria |
| --- | --- | --- |
| 1 | HTTP status | **200** |
| 2 | `scheduleDataSource=supabase` | present in HTML comment |
| 3 | Title | `<>` — **no** `G-9g2` |
| 4 | Venue line | **absent** — **no** `G-9g3b` |
| 5 | Time line | **absent** — **no** `G-9g3c` |
| 6 | Price line | **absent** — **no** `G-9g3d` |
| 7 | Description | `出演：` only — **no** `[G-9g3b venue+description PoC]` |
| 8 | PoC absent | no G-9g2 / G-9g3b / G-9g3c / G-9g3d markers on Event B card |

### Optional spot-checks

| URL | Expect |
| --- | --- |
| `/schedule/` | **200** — hub unchanged |
| `/schedule/2026-03/` | **200** — Event A still clean (G-13e — do not re-upload) |

### curl examples (operator — execution phase)

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/"

curl -sS "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/" \
  | rg "G-9g2|G-9g3b|G-9g3c|G-9g3d|2026\.07\.19|&lt;&gt;"
```

After upload: G-9g PoC strings should **not** appear on Event B card; title should show `<>`.

---

## 11. Failure — stop conditions

| Situation | Do | Do **not** |
| --- | --- | --- |
| Remote path is `/` or wrong folder | **Stop immediately** | Upload / retry elsewhere |
| Upload to wrong file path | **Stop** — record path | Mirror-delete cleanup |
| HTTP still shows G-9g2 after upload | **Stop** — verify remote path + cache | Re-upload repeatedly without diagnosis |
| Partial / corrupted upload | **Stop** | Delete remote files |
| FTP error / timeout | **Stop** | Auto-retry scripts / `lftp mirror` |
| Accidental bulk upload | **Stop** — assess damage | Remote `rm` / `--delete` |
| CSS/JS hash changed unexpectedly | **Stop** — expand scope only after human review | Auto-upload `_astro/` without approval |
| Unclear outcome | **Stop** — ask human | Alternative cleanup commands |

**G-7f failure behavior:** stop immediately; do not retry; do not cleanup; record incident; ask human.

### Rollback (documented — not executed)

| Situation | Action |
| --- | --- |
| Wrong content on staging | Re-upload **previous** `index.html` from pre-upload backup (save live HTML before upload) |
| Wrong remote path touched | **Stop** — do not delete; operator assesses |

---

## 12. Scripts — do NOT run without separate approval

| Script / command | Status |
| --- | --- |
| `deploy-public-dist-ftp.mjs --apply` | **suspended** |
| `lftp mirror --delete` | **forbidden** |
| `build-gosaki-staging-admin-package.mjs` | **executed in this phase** — do not re-run unless DB changes again |
| FTP GUI upload | **execution phase only** — operator approval required |

---

## 13. Safety gates (this phase)

| Gate | Value |
| --- | --- |
| `gosakiScheduleEventBPocCleanupPublicReflectionLocalRegenComplete` | **true** |
| `gosakiScheduleEventBPocCleanupPublicReflectionUploadPreflightComplete` | **true** |
| `ftpUploadExecuted` | **false** |
| `deployExecuted` | **false** |
| `workflowDispatchExecuted` | **false** |
| `postUploadHttpVerifyExecuted` | **false** |
| `mirrorDeletePlanned` | **false** |
| `cursorFtpExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `eventATouched` | **false** |
| `marchReuploadTriggered` | **false** |
| `readyForAnyFutureFtpApply` | **false** |
| `commitInPhase` | **false** |

---

## 14. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13c2e-gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight.mjs
```

---

## 15. Next phase

**`G-13c2e-gosaki-schedule-event-b-public-reflection-upload-execution`** — operator (戸山) manual overwrite upload ×1 + HTTP verify → result doc → closure.

---

## 16. References

- [gosaki-schedule-event-b-poc-cleanup-execution-result.md](./gosaki-schedule-event-b-poc-cleanup-execution-result.md)
- [gosaki-public-reflection-operation-standardization.md](./gosaki-public-reflection-operation-standardization.md)
- [gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight.md](./gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight.md) (G-13e template)
- [gosaki-manual-staging-upload-package.md](./gosaki-manual-staging-upload-package.md) (G-7g)
- [ftp-deploy-root-delete-incident-and-safety-hardening.md](./ftp-deploy-root-delete-incident-and-safety-hardening.md) (G-7f1)
