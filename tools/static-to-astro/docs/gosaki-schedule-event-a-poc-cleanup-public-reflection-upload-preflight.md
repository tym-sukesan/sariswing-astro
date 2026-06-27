# G-13e — Gosaki Event A PoC cleanup public reflection upload preflight

**Phase:** `G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight`  
**Status:** preflight complete — **operator manual FTP upload pending**  
**Date:** 2026-06-27  
**Base commit:** `cd0fb77`  
**Operator:** 戸山（manual upload ×1 — execution phase only）  
**Prior:** [gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen.md](./gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen.md)

## Summary

Read-only preflight before operator manual overwrite upload of **one HTML file** to Gosaki CMS Kit staging. Local package already contains Event A cleanup; live staging March page still shows G-9k6 PoC text.

**No FTP / upload / deploy / workflow_dispatch / Save / DB write in this phase.**

---

## 1. Upload scope decision

| Option | Files | Decision |
| --- | --- | --- |
| **Minimal (recommended)** | **1** — `schedule/2026-03/index.html` | **Use this** |
| Full package | 27 files under `public-dist/` | **Defer** — unnecessary risk |
| `_astro/*` | 2 files | **Not needed** — CSS hash unchanged (`index.YcHrHZH4.css`) |
| `admin/` | — | **Out of scope** |

**Rationale:** Event A text change is isolated to March month HTML. CSS / JS references unchanged vs live staging.

---

## 2. Local source (verified)

| Item | Value |
| --- | --- |
| **Local file** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-03/index.html` |
| **File size** | ~15 KB (15213 bytes at preflight) |
| **Package verify** | G-13e local regen — `safeForStaticFtp: true`, `verify:manual-upload: PASS` |
| **Zip backup (optional)** | `output/manual-upload/gosaki-piano/gosaki-piano-manual-upload.zip` |

### Local file content checks

| Check | Result |
| --- | --- |
| `scheduleDataSource=supabase` | **yes** |
| Event A `2026.03.15` — `15:00` / `15:30` | **yes** |
| `G-9k6` | **absent** |
| `G-9k4` | **absent** |
| `管理画面保存テスト` | **absent** |
| `UI保存テスト` | **absent** |

---

## 3. Remote destination (staging only)

| Item | Value |
| --- | --- |
| **Host** | `yskcreate.weblike.jp` (Lolipop FTP — operator credentials, not in repo) |
| **FTP remote directory** | `/cms-kit-staging/gosaki-piano/` |
| **Remote file** | `/cms-kit-staging/gosaki-piano/schedule/2026-03/index.html` |
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/` |

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

## 4. Pre-upload live state (read-only HTTP)

**Verified ~2026-06-27:** live March page **still stale**.

| Check | Live staging (before upload) |
| --- | --- |
| HTTP | **200** |
| `scheduleDataSource=supabase` | **yes** |
| Event A `2026.03.15` | **G-9k6 PoC text present** |
| Times on Event A card | `18:00` / `19:00` (wrong) |
| `G-9k4` / `管理画面保存テスト` | **present** |

**Expected after upload:** Event A card matches section 5 (clean text).

---

## 5. Operator manual upload procedure (G-13e execution — not this phase)

**Tool:** FileZilla or Lolipop FTP クライアント（GUI 手動のみ）

### Preflight checklist (operator)

- [ ] Local file exists: `…/public-dist/schedule/2026-03/index.html`
- [ ] FTP login succeeds; remote pane shows **`/cms-kit-staging/gosaki-piano/`** — **not** `/` or account root
- [ ] Remote path exists: `schedule/2026-03/` (create folder only if missing — do not touch siblings)
- [ ] Upload mode: **overwrite single file** only
- [ ] **No** mirror / sync / bulk delete / “sync missing files” with delete
- [ ] **No** upload of full `public-dist/` (27 files) unless minimal fails HTTP verify

### Steps

1. Open FTP client; connect to Lolipop (`yskcreate.weblike.jp`).
2. **Remote:** navigate to `/cms-kit-staging/gosaki-piano/schedule/2026-03/`.
   - Confirm path in status bar — must contain `cms-kit-staging/gosaki-piano`.
   - **Abort** if remote pane is `/` or unrelated site folder.
3. **Local:** open  
   `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-03/`
4. Select **`index.html` only** (1 file).
5. Upload with **overwrite** — no delete/sync options enabled.
6. Confirm remote `index.html` timestamp / size updated.
7. Proceed to HTTP verification (section 6).

### Explicit approval (execution phase only)

```txt
承認します。この手動アップロードを1回だけ実行してください。
```

**Permitted once:** overwrite upload of `schedule/2026-03/index.html` → `/cms-kit-staging/gosaki-piano/schedule/2026-03/index.html`

---

## 6. Post-upload HTTP verification

### Primary URL

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/
```

### Checks (Event A card `2026.03.15`)

| # | Check | Pass criteria |
| --- | --- | --- |
| 1 | HTTP status | **200** |
| 2 | `scheduleDataSource=supabase` | present in HTML comment |
| 3 | Title | `<Duo>` — **no** `G-9k6` |
| 4 | Venue | `川崎 ぴあにしも` — **no** test suffix |
| 5 | Times | `開場 15:00 / 開演 15:30` |
| 6 | Price | `3,000円` — **no** `G-9k6 price` |
| 7 | Description | Wix seed lines only |
| 8 | PoC absent | no `G-9k6`, `G-9k4`, `管理画面保存テスト`, `UI保存テスト` on Event A card |

### Optional spot-checks

| URL | Expect |
| --- | --- |
| `/schedule/` | **200** — hub unchanged |
| `/schedule/2026-07/` | **200** — Event B PoC **may still show** (out of scope) |

### curl examples (operator)

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/"

curl -sS "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/" \
  | rg "G-9k6|G-9k4|2026\.03\.15|15:00|18:00"
```

After upload: `G-9k6` / `G-9k4` should **not** appear on Event A card; `15:00` should appear.

---

## 7. Failure — stop conditions

| Situation | Do | Do **not** |
| --- | --- | --- |
| Remote path is `/` or wrong folder | **Stop immediately** | Upload / retry elsewhere |
| Upload to wrong file path | **Stop** — record path | Mirror-delete cleanup |
| HTTP still shows G-9k6 after upload | **Stop** — verify remote path + cache | Re-upload repeatedly without diagnosis |
| Partial / corrupted upload | **Stop** | Delete remote files |
| FTP error / timeout | **Stop** | Auto-retry scripts / `lftp mirror` |
| Accidental bulk upload | **Stop** — assess damage | Remote `rm` / `--delete` |
| Unclear outcome | **Stop** — ask human | Alternative cleanup commands |

**G-7f failure behavior:** stop immediately; do not retry; do not cleanup; record incident; ask human.

### Rollback (documented — not executed in preflight)

| Situation | Action |
| --- | --- |
| Wrong content on staging | Re-upload **previous** `index.html` from pre-upload backup (save live HTML before upload) or from older zip |
| Wrong remote path touched | **Stop** — do not delete; operator assesses |

---

## 8. Scripts — do NOT run without separate approval

| Script / command | Status |
| --- | --- |
| `deploy-public-dist-ftp.mjs --apply` | **suspended** |
| `lftp mirror --delete` | **forbidden** |
| `npm run manual-upload:package` | only if regenerating package |
| `build-gosaki-staging-admin-package.mjs` | only if regen needed |

---

## 9. Safety gates (this phase)

| Gate | Value |
| --- | --- |
| `gosakiScheduleEventAPocCleanupPublicReflectionUploadPreflightComplete` | **true** |
| `ftpUploadExecuted` | **false** |
| `deployExecuted` | **false** |
| `workflowDispatchExecuted` | **false** |
| `mirrorDeletePlanned` | **false** |
| `cursorFtpExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `eventBTouched` | **false** |
| `readyForAnyFutureFtpApply` | **false** |
| `commitInPhase` | **false** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight.mjs
```

---

## 11. Next phase

**`G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-execution`** — operator (戸山) manual overwrite upload ×1 + HTTP verify → result doc.

---

## 12. References

- [gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen.md](./gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen.md)
- [gosaki-manual-staging-upload-package.md](./gosaki-manual-staging-upload-package.md) (G-7g)
- [ftp-deploy-root-delete-incident-and-safety-hardening.md](./ftp-deploy-root-delete-incident-and-safety-hardening.md) (G-7f1)
- [gosaki-youtube-url-save-staging-upload-preflight.md](./gosaki-youtube-url-save-staging-upload-preflight.md) (G-11c13 pattern)
