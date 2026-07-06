# G-22g2a — Gosaki Schedule P0 UX read-only QA

**Phase:** `G-22g2a-gosaki-schedule-p0-ux-readonly-qa`  
**Status:** **complete** — local dry-run QA / record only; **no Save / DB / deploy**  
**Date:** 2026-07-07  
**Base commit:** `8e83348`  
**Prior:** G-22g1a (legacy_id) · G-22g1b (dev/mock isolation) · G-22g1c (save preview / target) · G-22g1f (authenticated admin read) · G-22g2 (operator procedure hints)

| Check | Status |
| --- | --- |
| Read-only / dry-run QA executed | **yes** |
| HTTP 200 + HTML markers | **PASS** (27/27 automated checks) |
| G-22g2 procedure hints | **PASS** |
| G-22g1 chain regression | **PASS** |
| Preview module smoke | **PASS** |
| Live browser login re-smoke | **deferred** — regression **PASS** via G-22g1f2c |
| Save / 保存 clicked | **no** |
| DB write | **no** |

---

## Gates

```txt
gosakiScheduleP0UxReadonlyQaComplete: true
phase: G-22g2a-gosaki-schedule-p0-ux-readonly-qa
qaBlockingIssuesFound: false
saveExecuted: false
updateButtonClicked: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
packageRegenExecuted: false
ftpUploadExecuted: false
writeArmedDevServerUsed: false
writeArmedDevServerStopped: true
port4321ListenAfterQa: false
readyForScheduleP0UxSummary: true
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.  
**Credentials:** not recorded.

---

## 1. Purpose

Verify on a live dry-run dev page that G-22g1a〜G-22g2 Schedule operator UX improvements (legacy_id visibility, dev/mock isolation, save preview / target confirmation, authenticated admin read wiring, operator procedure hints) render without regression. **Read-only QA only — no Save, no DB write.**

---

## 2. Read-only QA scope

| Area | Source phase |
| --- | --- |
| legacy_id list / keyword / selected summary | G-22g1a |
| Operator guide / dev/mock isolation | G-22g1b |
| Save target panel / preview badges | G-22g1c |
| Authenticated admin read wiring | G-22g1f |
| Operation procedure hints / safety copy | G-22g2 |

**Out of scope:** Save execution, physical DELETE, package regen, FTP, write-armed dev, browser auto-click Save.

---

## 3. Dry-run / read-only dev environment

### Dev command (started for QA, then stopped)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=false \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED=false \
npm run dev -- --port 4321 --host 127.0.0.1
```

| Item | Value |
| --- | --- |
| Route | `http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/` |
| HTTP status | **200** |
| Transform error | **none** |
| `ENABLE_ADMIN_STAGING_WRITE` | **false** |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | **true** |
| `data-read-source` | **supabase** |
| `data-g9k-staging-write-enabled` | **false** |
| G-22d/e/f non-dry-run arms | **all false** |
| QA method | HTTP fetch + HTML marker analysis + preview module smoke |
| Save / 保存 | **not clicked** |
| Dev server after QA | **stopped** — port **4321 LISTEN none** |

---

## 4. HTTP / page shell — **PASS**

| # | Check | Result |
| --- | --- | --- |
| 1 | HTTP 200 | **PASS** |
| 2 | No Transform error | **PASS** |
| 3 | Operator guide | **PASS** — `.gosaki-schedule-operator-guide` /「通常の Schedule 操作はこちら」 |
| 4 | G-22g2 procedure hints section | **PASS** — `.gosaki-schedule-operator-procedure-hints` |
| 5 | Four operation cards | **PASS** — existing-update / duplicate / new-event / unpublish |
| 6 | DB unchanged copy | **PASS** — `DBは変わりません` |
| 7 | Until-save copy | **PASS** — `保存ボタンを押すまでDBは変更されません` |
| 8 | Save once / no double-click | **PASS** — `1回だけ` + `連打禁止` |
| 9 | Dev/mock isolation | **PASS** — `gosaki-schedule-dev-mock-zone` + 開発者向け詳細 |
| 10 | Save button disabled | **PASS** — `#gosaki-schedule-update-btn` disabled |
| 11 | Delete preparing | **PASS** — `削除（準備中）` disabled |

---

## 5. G-22g2 operator procedure hints — **PASS**

| Check | Result |
| --- | --- |
| Section title「操作手順のヒント」| **PASS** |
| 通常更新 / 複製 / 新規追加 / 非公開化 cards | **PASS** |
| Step 1→2→3 copy | **PASS** |
|「変更を確認」= 保存前プレビュー| **PASS** |
| 非公開化 ≠ 物理削除 note | **PASS** |
| Admin read hint shell (`#gosaki-schedule-admin-read-procedure-hint`) | **PASS** (hidden until login) |
| Save note「書き込み許可がオフのときは保存は無効」| **PASS** (source + live HTML) |

---

## 6. legacy_id visibility (G-22g1a) — **PASS**

| Check | Result |
| --- | --- |
| Table column | **PASS** — `<th scope="col">legacy_id</th>` + `gosaki-schedule-legacy-id-code` in SSR rows |
| Keyword placeholder | **PASS** — `legacy_id・タイトル・会場で検索` |
| Selected summary shell | **PASS** — `#gosaki-schedule-operator-selected-summary` |
| Form legacy_id / id fields | **PASS** — `#gosaki-edit-legacy-id`, row id display |
| SSR row count | **58** |
| SSR all `published=true` | **yes** (58/58) — bootstrap published-only |

---

## 7. dev/mock isolation (G-22g1b) — **PASS**

| Check | Result |
| --- | --- |
| Dev-tools `<details>` | **PASS** — default closed |
| Mock zone wrapper | **PASS** — `gosaki-schedule-dev-mock-zone` |
| Operator primary UI above dev section | **PASS** |
| Guide warns dev section not for routine ops | **PASS** |

---

## 8. save preview / target confirmation (G-22g1c) — **PASS**

### Static shell (live HTML)

| Check | Result |
| --- | --- |
| `#gosaki-schedule-save-target-panel` | **PASS** |
| `#gosaki-schedule-edit-dry-run-btn`（変更を確認）| **PASS** |
| Dry-run hint copy | **PASS** — 保存前プレビュー / DBは変わりません |

### Preview module smoke (no DB)

| Operation | Result |
| --- | --- |
| 複製 | **PASS** — `dryRun=true`, `actualWrite=false`, `saveAllowed=false` |
| 新規追加 | **PASS** — `dryRun=true`, `actualWrite=false`, `saveAllowed=false` |
| 非公開化 | **PASS** — `dryRun=true`, `actualWrite=false`, `physicalDelete=false`, `saveAllowed=false` |

**Interactive「変更を確認」click:** allowed by scope but **not auto-clicked** (project safety — no Playwright Save/preview automation). Save not clicked.

---

## 9. authenticated admin read (G-22g1f) — **PASS (bootstrap) / regression via G-22g1f2c (live login)**

### Login前 / SSR bootstrap — **PASS**

| Check | Result |
| --- | --- |
| SSR rows | **58** published-only |
| `schedule-2026-07-008` in SSR JSON | **NOT FOUND** — expected before login |
| Auth gate present | **yes** |

### Login後 live re-smoke — **deferred (regression PASS)**

| Item | Status |
| --- | --- |
| Browser login in this QA session | **not executed** (no credentials recorded) |
| Prior operator smoke G-22g1f2c | **PASS** — banner authenticated 60件 / 非公開2件 |
| `schedule-2026-07-008` after login | **PASS in G-22g1f2c** — 非公開のみ + keyword |
| Selected summary fields | **PASS in G-22g1f2c** — id / legacy_id / published=false / updated_at |

**Conclusion:** G-22g1f chain not regressed at SSR/bootstrap level; live authenticated behavior unchanged vs G-22g1f2c closure.

---

## 10. `schedule-2026-07-008` visibility — **expected before login / PASS after login (G-22g1f2c)**

| Context | Result |
| --- | --- |
| SSR bootstrap (this QA) | **absent** — expected |
| After login (G-22g1f2c regression) | **visible** — 非公開のみ + `schedule-2026-07-008` keyword → 1件 |

Target id (reference only): `3e572f02-4f35-460e-80a1-3a7d15ca3fd9`

---

## 11. Selected summary — **PASS (shell + G-22g1f2c regression)**

Live HTML includes summary container and form identity fields. Field population after row select verified in G-22g1f2c operator smoke (Save not clicked).

---

## 12. Safety confirmation

| Item | Status |
| --- | --- |
| Save executed | **false** |
| DB write | **false** |
| SQL mutation | **false** |
| rollback SQL | **false** |
| GRANT / REVOKE | **false** |
| RLS policy change | **false** |
| service_role | **not used** |
| package regen | **false** |
| FTP / upload | **false** |

---

## 13. Residual issues / non-blocking

| Issue | Severity | Notes |
| --- | --- | --- |
| Transient「スケジュールを読み込めませんでした」on SSR | **non-blocking** | Alert visible on initial page load despite 58 bootstrap rows loading. Same class as G-22g1f2c residual. Does not block operator list / edit. |
| Interactive preview panel click QA | **deferred** | No auto-click per safety rules. Module smoke + HTML markers used. |
| Live login re-smoke in G-22g2a session | **deferred** | Regression covered by G-22g1f2c PASS. Optional operator re-check. |

**Fix required?** **No** for G-22g2a gate.

---

## 14. Next phase candidates

- **Schedule P0 UX まとめ**
- republish planning（deferred）
- physical DELETE planning（deferred — 後回し）

---

## 15. Artifacts

### Read-only live QA runner (re-runnable)

`tools/static-to-astro/scripts/run-g22g2a-schedule-p0-ux-readonly-qa.mjs`

- **Purpose:** dry-run dev 起動中に schedule ルートへ HTTP GET し、G-22g1a〜G-22g2 の HTML マーカー（27 項目）と SSR bootstrap JSON を自動確認する。
- **When to use:** UX 変更後の read-only 再確認、commit 前の live smoke。
- **Requires:** dev server on `127.0.0.1:4321` with `ENABLE_ADMIN_STAGING_WRITE=false` and `PUBLIC_ADMIN_WRITE_DRY_RUN=true`.
- **Does not:** Save クリック、DB write、SQL mutation。

```bash
node tools/static-to-astro/scripts/run-g22g2a-schedule-p0-ux-readonly-qa.mjs
```

### Verifier

- `tools/static-to-astro/scripts/verify-g22g2a-gosaki-schedule-p0-ux-readonly-qa.mjs` — doc / AI context / save-path unchanged / preview module smoke。

**Save modules / write adapter / approvalId registry:** unchanged in this phase.
