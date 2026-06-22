# Gosaki completion inventory and next module selection (G-10a)

**Phase:** `G-10a-gosaki-completion-inventory-and-next-module-selection`  
**Status:** **complete** — investigation / inventory / module selection only  
**Date:** 2026-06-22  
**Prior:** G-9k6g field slice closure; G-9k7 / G-9k7b UI fixes (commit `ff0c33f`)

| Check | Status |
| --- | --- |
| Inventory documented | **yes** |
| Next non-Schedule module selected | **yes** |
| Cursor / AI Save / DB write | **no** |
| FTP / deploy / workflow_dispatch | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-cms-scope-and-schedule-youtube-planning.md](./gosaki-cms-scope-and-schedule-youtube-planning.md) (G-9a)
- [gosaki-schedule-cms-practicalization-planning.md](./gosaki-schedule-cms-practicalization-planning.md) (G-9h)
- [gosaki-schedule-existing-event-field-slice-closure.md](./gosaki-schedule-existing-event-field-slice-closure.md) (G-9k6g)
- [gosaki-schedule-save-ui-copy-and-editor-scroll-fix.md](./gosaki-schedule-save-ui-copy-and-editor-scroll-fix.md) (G-9k7 / G-9k7b)
- [gosaki-youtube-and-discography-practicalization.md](./gosaki-youtube-and-discography-practicalization.md) (G-9j)
- [gosaki-client-preview-feedback-closure.md](./gosaki-client-preview-feedback-closure.md) (G-9h1 checklist — feedback pending)

---

## Gates

```txt
gosakiCompletionInventoryAndNextModuleSelectionComplete: true
phase: G-10a
readyForG10bYoutubeEmbedReadAndWritePlanning: true
readyForG9h1ClientPreviewFeedbackCollection: true
readyForAnyDbWrite: false
cursorClickedSave: false
```

**Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; `G9K_SAVE_BUTTON_SAVE_ENABLED=false`.

---

## 1. Investigation scope

| Area | Sources reviewed |
| --- | --- |
| Staging admin shell | `AdminGosakiStagingOperatorHome.astro`, Schedule / YouTube / Discography operator pages |
| Public Gosaki site | G-7j / G-9d2 / G-9d3 QA docs; convert hooks (`gosaki-home-youtube-embed.mjs`, `gosaki-schedule-data-pages.mjs`) |
| CMS planning | G-9a MVP scope, G-9h practicalization sequence, G-9h1 client checklist |
| Schedule write arc | G-9k4b–G-9k6g closure docs |
| Staging data bindings | `gosaki-youtube-embed-admin-binding.ts`, `gosaki-discography-admin-binding.ts`, schedule site_slug read |
| Config | `gosaki-piano-youtube-embed.json`, `gosaki-piano-discography.json`, `gosaki-piano-band-profiles.json` |

**Staging preview URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`  
**Staging admin:** `/__admin-staging-shell/musician-basic/admin/` (Schedule / YouTube / Discography)

---

## 2. Schedule — completed vs remaining

### 2.1 Completed (staging shell + verification)

| Item | Phase / status |
| --- | --- |
| 60-row seed + `site_slug=gosaki-piano` on staging DB | G-9c2c |
| Public schedule Supabase read + static fallback | G-9d |
| Hub `/schedule/` + canonical `/schedule/YYYY-MM/` + legacy stubs | G-9c0a/b, G-8g3/4 |
| Staging shell schedule read binding | G-9f |
| Operator existing-event Save (6 safe fields, 1 Save = 1 field) | G-9k4b + G-9k6b–G-9k6f |
| Save UI copy + list/editor scroll + 編集する visibility | G-9k7 / G-9k7b |
| G-9k6 field slice arc closed | G-9k6g |

### 2.2 Schedule — remaining (not blocking G-10a module switch)

| # | Task | Priority | Risk | Notes |
| --- | --- | --- | --- | --- |
| S1 | **Client / operator preview sign-off** (G-9h1) | **最優先** | 低 | Checklist exists; feedback **not collected** |
| S2 | Public schedule read UX + `scheduleDataSource` verify (G-9h2) | 最優先 | 低 | Optional supabase-marker rebuild + manual re-upload |
| S3 | **Edit → rebuild → re-upload** practical loop doc + operator run | 優先 | 中 | DB change does not auto-appear on staging HTML |
| S4 | G-9k6 test markers rollback on PoC row | 後回し | 中 (DB) | Separate restore approval |
| S5 | Schedule **create** (INSERT) / duplicate / delete UI | 後回し | 高 (DB) | Forms exist; buttons disabled |
| S6 | `published` / home featured / image upload | 後回し | 高 | Out of G-9k6 scope |
| S7 | Production cutover (`gosaki-piano.com`) | 後回し | 高 | FTP auto-deploy still suspended |

---

## A. Gosaki完成に必要な残タスク一覧

### Public site / 公開前プレビュー

| ID | Task | Module |
| --- | --- | --- |
| P1 | Client preview feedback closure (G-9h1) | Cross-cutting |
| P2 | Residual visual fixes from client list → manual re-upload | Static / CSS |
| P3 | Contact form replacement or alternate CTA agreement | Contact |
| P4 | Mobile spot-check closure (MENU, schedule months, discography) | Cross-cutting |
| P5 | Production cutover planning (DNS, FTP path, rollback) | Deploy |

### CMS / 管理画面（非Schedule）

| ID | Task | Module |
| --- | --- | --- |
| M1 | **Top YouTube embed — read + write path** | YouTube |
| M2 | YouTube: populate real embed + public home verify | YouTube |
| M3 | Discography: public read from JSON (optional) | Discography |
| M4 | Discography: admin Save path | Discography |
| M5 | About Bands/Projects CMS | About (deferred G-9a) |
| M6 | Contact / HubSpot or mailto-first form | Contact |
| M7 | Link page CMS | Link (low) |
| M8 | News CMS | **Out of Gosaki MVP** (G-9a) |
| M9 | Lesson page as separate CMS | **N/A** — content lives in About (Wix static) |

### Schedule practicalization（一区切り後の残り）

| ID | Task | Module |
| --- | --- | --- |
| S1–S7 | See §2.2 | Schedule |

### Musician CMS Kit 一般化

| ID | Task | Kit |
| --- | --- | --- |
| K1 | `site_slug` + route profile config per customer | Schedule read |
| K2 | `site_embeds` / embed CMS pattern (YouTube first) | Media |
| K3 | Staging shell operator home status copy sync (Save readiness) | Admin shell |
| K4 | Manual-upload + scoped deploy checklist template | Deploy |
| K5 | Per-field write slice + approval ID pattern (proven G-9k6) | Write governance |

---

## B. 優先度

| Tier | Tasks |
| --- | --- |
| **最優先** | P1 (G-9h1), P2 (must-fix from feedback), M1–M2 (YouTube), S2–S3 (schedule public loop), K2 |
| **優先** | P3–P4, M3 (discography public JSON if client cares), K1, K4 |
| **後回し** | M4–M7, S4–S7, M5, fine UI polish, test marker rollback, INSERT/delete |

---

## C. リスク分類

| Risk | Tasks | Gate |
| --- | --- | --- |
| **低** — docs / read-only / static JSON / operator checklist | P1, P2 planning, M2 read verify, S2, G-10 planning | No DB write |
| **中** — manual re-upload, file-based config Save, staging rebuild | P2 CSS fixes, S3 re-upload, JSON-backed YouTube Save (if chosen) | Operator manual; no FTP auto |
| **高** — DB write, INSERT/DELETE, migration, production | M1 Supabase `site_embeds`, S5 create/delete, S4 rollback, S7 cutover, M4 discography Save | Explicit approval ID; staging only |

---

## D. 次に着手すべき最有力モジュール（非Schedule）

**YouTube embed CMS（トップページ）**

Phase id: **`G-10b-gosaki-youtube-embed-read-and-write-planning`** (recommended)

---

## E. その理由

| Factor | YouTube | Discography | Contact | G-9h1 only |
| --- | --- | --- | --- | --- |
| G-9a MVP priority | **#2** | #3 deferred | Future | Cross-cutting |
| Admin UI already exists | **Yes** (G-9j) | Shell only | **No** | N/A |
| Public read path exists | **Yes** (JSON inject on home) | Wix static only | Static broken form | N/A |
| Generalizes to Kit | **`site_embeds` pattern** | Site-specific pages | HubSpot one-off | Process only |
| Client-visible on home | **High** | Subpage | Important but static OK short-term | Blocks scope clarity |
| DB write scope | Plannable slice (1 table / or JSON file MVP) | Larger surface | Third-party integration | None |

Schedule write **verification** is complete; remaining Schedule work is mostly **public reflection + client sign-off**, which can run **in parallel** with YouTube planning.

**G-9h1** should start soon (operator-driven, no code) but is not a substitute for the next **implementation** module.

---

## F. 次フェーズ案

```txt
G-10a  gosaki-completion-inventory-and-next-module-selection     — complete (this doc)
G-9h1  gosaki-client-preview-feedback-closure                     — operator/client (parallel; checklist ready)
G-10b  gosaki-youtube-embed-read-and-write-planning               — next implementation planning
       · verify home YouTube section on staging preview
       · choose JSON-file Save MVP vs site_embeds Supabase (G-9a)
       · reuse G-9k-style approval / dry-run / 1-embed Save slice
G-10c  gosaki-youtube-embed-write-slice-implementation              — after G-10b + approval
G-9h2  gosaki-public-schedule-read-verification-and-reupload      — parallel (schedule public loop)
G-10d  gosaki-discography-public-json-planning                    — after YouTube or if client prioritizes
```

**Not next:**

- Schedule field slice re-Save (G-9k6 closed)
- `start_time` / `price` per-field manual round-trips
- Production cutover / FTP auto-apply
- `/admin` production changes
- Discography full CMS before YouTube MVP #2

---

## 3. Existing staging shell modules (snapshot)

| Route | Module | Read | Write | Save UI |
| --- | --- | --- | --- | --- |
| `/admin/` | Home menu | — | — | — |
| `/admin/schedule/` | Schedule | Supabase (staging) | G-9k path verified | Enabled only with G-9k arm |
| `/admin/youtube/` | YouTube | Static JSON | **No** | Disabled |
| `/admin/discography/` | Discography | Static JSON binding | **No** | Disabled (readonly forms) |
| `/auth/*` | Staging auth | Supabase auth | Password reset flow | N/A |

**Not in Gosaki staging admin:** News, Profile/About editor, Contact editor, Link editor, Lesson.

---

## 4. Public pages snapshot (gosaki-piano staging)

| Page | Data source | CMS gap |
| --- | --- | --- |
| Home | Wix static + YouTube JSON inject | YouTube needs real content + Save |
| About | Wix static + Bands JSON inject | Bands deferred |
| Discography | Wix static | JSON admin not wired to public |
| Contact | Wix static | Form non-functional |
| Link | Wix static | Low priority |
| `/schedule/` hub + months | Supabase read at build (fallback static) | Edit loop needs re-upload |
| `/YYYY-MM/` stubs | Generated redirect/stub | OK |
