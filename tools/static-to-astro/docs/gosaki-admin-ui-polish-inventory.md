# G-20ui1 — Gosaki admin UI polish inventory / planning

**Phase:** `G-20ui1-gosaki-admin-ui-polish-inventory`  
**Status:** **complete** — read-only inventory + planning only; **no UI implementation**  
**Date:** 2026-07-01  
**Base commit:** `4a91061`  
**Prior:** [gosaki-production-package-admin-exclusion-result.md](./gosaki-production-package-admin-exclusion-result.md) (G-20i3)

| Check | Status |
| --- | --- |
| Admin UI inventory | **yes** |
| must / should / defer classification | **yes** |
| Low-risk implementation plan | **yes** (G-20ui2) |
| UI implementation | **no** |
| Save / DB write / package regen / FTP | **no** |

---

## Gates

```txt
gosakiAdminUiPolishInventoryComplete: true
phase: G-20ui1-gosaki-admin-ui-polish-inventory
readyForG20ui2AdminUiPolishImplementation: true
adminUiImplementationExecuted: false
saveExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
cursorDbWriteExecuted: false
hostedAdminDeferPolicy: true
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state (verified)

| Item | Value |
| --- | --- |
| `HEAD` | `4a91061` |
| `origin/main` | `4a91061` |

---

## 2. Admin UI surfaces (inventory)

### 2.1 Local staging shell (operator primary today)

| Item | Value |
| --- | --- |
| Dev gate | `ENABLE_ADMIN_STAGING_SHELL=true` + `npm run dev` |
| Base URL | `http://localhost:4321/__admin-staging-shell/musician-basic/admin/` |
| Layout | `AdminGosakiStagingShellLayout.astro` |
| Auth | Supabase Auth via `AdminGosakiStagingAuthGate.astro` |
| Home | `AdminGosakiStagingOperatorHome.astro` |

**Routes**

| Route | Page / component |
| --- | --- |
| `/admin/` | `GosakiStagingAdminHomePage.astro` → operator home |
| `/admin/schedule/` | `AdminGosakiStagingScheduleOperatorPage.astro` + dev `<details>` stack |
| `/admin/discography/` | `AdminGosakiStagingDiscographyOperatorPage.astro` |
| `/admin/youtube/` | `AdminGosakiStagingYoutubeOperatorPage.astro` |
| `/admin/about/` | `AdminGosakiStagingAboutOperatorPage.astro` |
| `/admin/contact/` | **なし** (Contact admin UI 未実装) |

### 2.2 Online read-only admin (staging package only)

| Item | Value |
| --- | --- |
| Template | `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro` |
| Staging URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/` |
| Production | **excluded** (G-20i3) |
| Badge | `READ-ONLY — 保存不可` |
| Language mix | 日本語バナー + 英語セクションラベル + phase ID 多数 |

### 2.3 Current operator workflow (today)

```txt
local admin shell → edit/preview/dry-run → operator local regen → manual FTP upload
```

Hosted admin on production: **defer**. Client self-service: **future**.

---

## 3. Module-by-module UI inventory

### 3.1 Shell / global

| Element | Current copy / behavior | Issue |
| --- | --- | --- |
| Global status (layout) | 「現在は確認用です。保存・本番反映はまだ開放していません。」 | OK for prep phase; needs operator vs client split later |
| Staging label | 「Gosaki 管理画面（確認用）」 | OK |
| Home status bar | 「保存は準備中です」 | **Contradicts** env-armed Save on some modules |
| Home supplement | 「いまできること / まだできないこと」 | Good pattern — should be promoted above fold |
| Secondary menu | 「本番反映 — 未開放」 | OK |
| Dev tools (home) | `<details>開発者向け詳細</details>` | OK if collapsed; verify not opened by default |

### 3.2 Schedule

| Element | Current | Issue |
| --- | --- | --- |
| Status | 「保存機能は準備中です。」 | Static; TS can enable Save when armed |
| Save button default | 「更新する（準備中）」 | No reason when dry-run OK but Save disabled |
| Dry-run | 「変更を確認」 | Good operator label |
| Disabled actions | 追加・複製・削除「準備中」 | OK — explain in client copy |
| Dev `<details>` | G-6/G-13 POC sections, English dry-run labels | **Developer-only** — keep collapsed |
| Dynamic states | 「更新する（保存無効）」「保存準備OK」 | English/ja mix in TS alerts |

### 3.3 Discography

| Element | Current | Issue |
| --- | --- | --- |
| Save default | 「更新する（準備中）」 | Same as schedule |
| Status panel | English: `approvalId`, `saveReadiness`, `hostGatePassed`, `expectedBeforeUpdatedAt` | **Must hide** from client view |
| Dry-run | 「変更を確認」 | OK |
| Track hints | `G-18f: discography-002 / SKYLARK のみ編集可` | Developer jargon |
| Sort/delete | 「並び替え保存は次フェーズ」 | OK with friendlier copy |

### 3.4 YouTube

| Element | Current | Issue |
| --- | --- | --- |
| Save default | 「更新する（準備中）」 | Same pattern |
| Metadata | `対象 item: gosaki-youtube-top-embed`, `G-10c` | Developer-only |
| Add/list | 「追加の保存は準備中」「並び順・削除は準備中」 | OK |

### 3.5 About

| Element | Current | Issue |
| --- | --- | --- |
| Status bar | English phase IDs (`G10H4A_...`, `G-10h4d-1 prep`) | **Must hide** from client |
| Save buttons | 「保存する（env disabled）」 | **Not client-friendly** |
| Dry-run | 「dry-run 確認」 (English) | Should be 「変更を確認」 |
| Profile block | 「G-10h4b Save 済み — 再Save禁止」 | Operator/dev history — not for client |
| Bands block | 「G-10h4c dry-run 対象」 | Same |
| HTML safety | Japanese bullets OK | Keep |

### 3.6 Contact

| Element | Current | Issue |
| --- | --- | --- |
| Staging shell | **No admin page** | Gap for client preview story |
| Read-only admin | HubSpot `portalId` / `formId` English display | OK for operator; defer client UI |

### 3.7 Read-only admin (staging package)

| Element | Current | Issue |
| --- | --- | --- |
| Banner | `G-11c6a Save path — UI disabled` | English + phase ID |
| Auth section | 「Staging Auth（dry-run 用）」 | OK for staging |
| All Save buttons | `Save（無効）` | OK for read-only |
| Footer | `G-11c4b-fix Auth UI` | Developer-only |
| data-* attrs | approval IDs, Supabase URLs on `<body>` | Required for wiring; not visible if no dev panel |

---

## 4. Classification (client / operator perspective)

### 4.1 Must before client preview

| # | Item | Rationale |
| --- | --- | --- |
| M1 | Unify top-level Save messaging | Home says 「保存不可」 globally but modules differ — confusing |
| M2 | Add 「戸山が代行更新する項目」 vs 「ご本人操作（将来）」 explainer on home | Sets expectations before showing shell |
| M3 | Hide English dev diagnostics from default view (Discography status panel, About phase bar) | Client-facing if previewed |
| M4 | Replace 「env disabled」「dry-run」「approvalId」 in **visible** operator UI with Japanese | About + Discography worst offenders |
| M5 | Standardize dry-run button label → 「変更を確認」 everywhere | YouTube/About still mixed |
| M6 | Disabled Save: show **reason** inline (not only button label) | e.g. 「保存は戸山が代行します（公開準備中）」 |

### 4.2 Should before public launch

| # | Item | Rationale |
| --- | --- | --- |
| S1 | Rename menu labels to Japanese consistently | `Schedule管理` → `スケジュール`; `About HTML` → `プロフィール・バンド` |
| S2 | Contact admin placeholder page (read-only HubSpot summary) | Complete menu story |
| S3 | Read-only staging admin: Japanese-first copy pass | If re-enabled on staging for client demo |
| S4 | Collapse all dev `<details>` under single 「開発者向け詳細（開かないでください）」 with warning | Schedule page has large dev stack |
| S5 | Progressive Save UX: after dry-run success, explain next step (operator upload) | Bridges CMS → public site |
| S6 | Remove or relocate G-13 Event A/B POC cleanup UI from default schedule dev block | Legacy PoC noise |

### 4.3 Can defer

| # | Item | Rationale |
| --- | --- | --- |
| D1 | Enable add/delete/duplicate schedule | Feature not scoped |
| D2 | Discography sort/cover image edit | Next phase |
| D3 | YouTube add/reorder/delete in UI | Next phase |
| D4 | Hosted admin on production | G-20i2 defer |
| D5 | Client self-service Save without operator | Requires auth + policy + training |
| D6 | Full Contact form editor | HubSpot remains external |

### 4.4 Developer-only (keep, but collapsed)

| Item | Location |
| --- | --- |
| `approvalId`, `operationId`, phase IDs (G-6, G-10, G-13, G-19) | hidden config divs, dev panels |
| Schedule CMS Kit dev sections | `GosakiStagingAdminSchedulePage.astro` `<details>` |
| Dry-run JSON result panels (full payload) | move inside dev `<details>` |
| Env arm / write provider attrs | DOM data attributes (not rendered as text) |
| Read-only admin body `data-g11c*` attrs | package wiring |

---

## 5. Low-risk implementation proposals (G-20ui2)

**Scope:** copy / layout / visibility only — **no Save logic / DB / deploy changes**.

| Priority | Change | Files (estimate) |
| --- | --- | --- |
| P1 | Home: add operator/client role explainer card | `AdminGosakiStagingOperatorHome.astro` |
| P1 | Home: refine status bar — 「公開サイトへの反映は戸山が代行」 | same |
| P1 | About: replace English status bar with Japanese; move phase IDs to `<details>` | `AdminGosakiStagingAboutOperatorPage.astro` |
| P1 | Discography: hide status panel behind `<details class="admin-gosaki-dev-tools">` | `AdminGosakiStagingDiscographyOperatorPage.astro` |
| P2 | Standardize dry-run label 「変更を確認」 on About | same |
| P2 | Replace 「保存する（env disabled）」 → 「保存する（現在は無効）」 + reason `<p role="note">` | About, YouTube, Schedule |
| P2 | Menu Japanese labels | `AdminGosakiStagingOperatorHome.astro` |
| P3 | Read-only admin: Japanese banner (drop G-11c6a from visible title) | `GosakiStagingReadOnlyAdminPage.astro` |
| P3 | Contact read-only stub page in shell (HubSpot summary, no edit) | new template + route |
| P3 | CSS: `admin-gosaki-dev-tools` default closed + warning icon | `admin.css` |

**Recommended G-20ui2 slice order:** P1 → P2 → P3 (each slice: local dev verify only, no package regen unless operator requests).

---

## 6. High-risk / separate phases (do NOT mix into G-20ui2)

| Item | Why separate |
| --- | --- |
| Save enablement / env arm defaults | DB write path — requires approval IDs |
| Auth model changes | Security |
| Hosted admin on production | G-20j / DNS / SSL |
| FTP auto-deploy | G-7f1 suspended |
| Removing dry-run requirement | Write safety regression |
| Optimistic lock / approvalId UI removal from code | Breaks operator debug |
| Sariswing `/admin` changes | AGENTS.md forbidden |
| Production Supabase `vsbvndwuajjhnzpohghh` | STOP |

---

## 7. Operator vs client mode (design proposal)

```txt
Default (client preview mode):
  - Japanese copy only in visible UI
  - No approvalId / phase ID / env names
  - Save buttons show friendly disabled reason
  - Dev details collapsed

Operator mode (local dev only):
  - Toggle via ENABLE_ADMIN_STAGING_OPERATOR_DIAGNOSTICS=true (new env, G-20ui2+)
  - Shows current English diagnostics + dry-run JSON
  - Does not change Save behavior
```

---

## 8. Key source files (reference)

| Area | Path |
| --- | --- |
| Shell layout | `templates/admin-cms/gosaki/components/AdminGosakiStagingShellLayout.astro` |
| Operator home | `templates/admin-cms/gosaki/components/AdminGosakiStagingOperatorHome.astro` |
| Schedule UI | `templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro` |
| Discography UI | `templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro` |
| YouTube UI | `templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeOperatorPage.astro` |
| About UI | `templates/admin-cms/gosaki/components/AdminGosakiStagingAboutOperatorPage.astro` |
| Read-only admin | `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro` |
| Shared CSS | `templates/admin-cms/styles/admin.css` |
| Routes | `src/pages/__admin-staging-shell/musician-basic/admin/*/index.astro` |

---

## 9. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| UI implementation | **no** |
| Save / DB write | **no** |
| Package regen / production build | **no** |
| FTP / upload | **no** |
| DNS / SSL | **no** |
| commit / push | **no** |

---

## 10. Next phases

| Phase | Scope |
| --- | --- |
| **G-20ui2** | Low-risk UI polish implementation (P1 copy + dev panel collapse) |
| **Operator** | Remote path checklist (G-20i2) — parallel |
| **G-20j** | Manual production FTP — **STOP** until server contract |
| **Future** | Hosted admin + client Save policy |

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20ui1-gosaki-admin-ui-polish-inventory.mjs
```
