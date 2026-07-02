# G-20ui2-QA — Gosaki admin UI polish local visual QA

**Phase:** `G-20ui2qa-gosaki-admin-ui-polish-local-visual-qa`  
**Status:** **complete** — local dev HTML QA only; **no Save / DB / deploy**  
**Date:** 2026-07-01  
**Base commit:** `afcbdcf`  
**Prior:** [gosaki-admin-ui-polish-implementation.md](./gosaki-admin-ui-polish-implementation.md) (G-20ui2)

| Check | Status |
| --- | --- |
| Local dev QA executed | **yes** |
| Save clicked | **no** |
| DB write / package regen / FTP | **no** |
| Blocking UI issues | **none** |

---

## Gates

```txt
gosakiAdminUiPolishLocalVisualQaComplete: true
phase: G-20ui2qa-gosaki-admin-ui-polish-local-visual-qa
qaBlockingIssuesFound: false
readyForG20ui3OptionalPolish: true
saveExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
cursorDbWriteExecuted: false
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state

| Item | Value |
| --- | --- |
| `HEAD` | `afcbdcf` |
| `origin/main` | `afcbdcf` |

---

## 2. Local dev / QA execution

### Dev command (started for QA)

```bash
cd /Users/toyamayusuke/sariswing-astro
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=false \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED=false \
npm run dev -- --port 4321 --host 127.0.0.1
```

| Item | Value |
| --- | --- |
| Base URL | `http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/` |
| QA method | HTTP 200 fetch + visible-text analysis (default `<details>` collapsed) |
| Save buttons | **not clicked** |
| Dry-run buttons | **not clicked** |

### Pages fetched (all HTTP 200)

| Route | Size | Notes |
| --- | --- | --- |
| `/admin/` | ~170 KB | Home |
| `/admin/schedule/` | ~1.0 MB | Large HTML (schedule rows embedded); dev stack in `<details>` |
| `/admin/discography/` | ~230 KB | |
| `/admin/about/` | ~212 KB | |
| `/admin/youtube/` | ~173 KB | |

### Read-only admin

| Item | Value |
| --- | --- |
| Local dev shell | **not routed** (staging package only) |
| QA method | **Static template review** of `GosakiStagingReadOnlyAdminPage.astro` |
| Staging URL (reference) | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/` — **not fetched in this phase** |

---

## 3. Screen-by-screen QA results

### Home — **PASS**

| Check | Result |
| --- | --- |
| 「ご利用の流れ」 | **visible** — natural 4-step flow |
| 「いまできること」 / 「戸山が代行すること」 | **visible** — above menu |
| Old 「保存は準備中です」 (global) | **absent** |
| Menu labels | スケジュール / ディスコグラフィ / プロフィール・バンド |
| 「変更を確認」 mention in flow | **yes** |
| approvalId / env in default view | **absent** (dev `<details>` only) |
| Layout | No structural break observed in HTML |

### Schedule — **PASS** (minor notes)

| Check | Result |
| --- | --- |
| Old 「保存機能は準備中です」 | **absent** |
| 「変更を確認」 button | **present** |
| Save disabled reason | **present** — operator note + dynamic note via `#gosaki-schedule-update-btn-note` |
| 「更新する（準備中）」 | **expected** when Save gated off |
| G-13 PoC panels | **inside `<details>`** |
| G-6 dev CMS Kit stack | **inside `<details class="admin-gosaki-dev-tools--schedule">`** |
| approvalId in default view | **absent** |
| Operator note | 「現在、公開サイトへの反映は戸山が確認して行います。」 |

**Minor notes (non-blocking):**

- Browser `<title>` still `Schedule管理` (page wrapper — h1 is スケジュール)
- `aria-label="Schedule管理"` on operator section
- Add card note: 「※ 新規追加の保存は準備中です…」 — contextual, not the old global contradiction

### Discography — **PASS** (minor notes)

| Check | Result |
| --- | --- |
| Client status bar (Japanese) | **present** |
| English diagnostics panel | **inside `<details>`** only |
| approvalId / saveReadiness | **inside `<details>`** only |
| 「変更を確認」 | **present** |
| Operator notes | **present** |
| 「更新する（準備中）」 | **expected** |

**Minor notes (non-blocking):**

- Shell `<title>` still `Discography管理`
- Form legends still mix English field names (`legacy_id`, `Supabase`) — pre-existing, defer G-20ui3

### About — **PASS** (minor notes)

| Check | Result |
| --- | --- |
| Japanese status bar | **present** |
| 「変更を確認」 (profile + bands) | **2 buttons** |
| 「保存する（現在は無効）」 | **present** |
| approvalId / phase config | **inside `<details>`** only |
| Operator notes | **present** |

**Minor notes (non-blocking):**

- Shell `<title>` still `About HTML`
- HTML 安全メモ uses 「dry-run では」 — acceptable technical note; optional G-20ui3 reword
- Preview HTML may contain legacy `G-10h4b` comments from stored Wix HTML — not admin chrome

### YouTube — **PASS** (minor notes)

| Check | Result |
| --- | --- |
| Status bar + operator note | **present** |
| 「変更を確認」 | **present** |
| G-10c item id / config path | **inside `<details>`** |
| 「更新する（準備中）」 | **expected** |

**Minor notes (non-blocking):**

- Add section: 「※ 追加の保存は準備中です」 — feature-specific, OK

### Read-only admin (template review) — **PASS**

| Check | Result |
| --- | --- |
| Banner | 「読み取り専用管理画面」 (Japanese) |
| G-11c6a in visible title | **removed** |
| G-11c6a detail | **inside `<details>`** |

---

## 4. UI issues found

| Severity | Issue | Fix needed now? |
| --- | --- | --- |
| **None blocking** | — | — |
| Low | Shell `<title>` / some `aria-label` still English (`Schedule管理`, `Discography管理`, `About HTML`) | **defer** G-20ui3 |
| Low | About HTML 安全メモ uses 「dry-run」 | **defer** G-20ui3 |
| Low | Discography form field labels English-heavy | **defer** G-20ui3 |
| Low | Feature notes contain 「保存は準備中」 in add/duplicate contexts | **optional** reword in G-20ui3 |

---

## 5. Fix required?

**No immediate fix required.** G-20ui2 goals are met:

- Global contradictory 「保存は準備中です」 removed from Home
- Operator/client explainer cards visible
- Dev diagnostics collapsed
- 「変更を確認」 standardized on operator pages
- Save disabled reasons visible

Optional follow-up: **G-20ui3** — shell titles, About safety copy, Discography field labels, Contact stub.

---

## 6. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Save / dry-run click | **no** |
| DB write / SQL | **no** |
| Package regen / production build | **no** |
| FTP / upload | **no** |
| commit / push | **no** |

---

## 7. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20ui2qa-gosaki-admin-ui-polish-local-visual-qa.mjs
```
