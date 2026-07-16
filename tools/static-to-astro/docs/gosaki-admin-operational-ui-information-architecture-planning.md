# G-20u39b2 — Gosaki admin operational UI information architecture planning

**Phase:** `G-20u39b2-gosaki-admin-operational-ui-information-architecture-planning`
**Status:** **complete** — planning / IA only · **no implementation**
**Date:** 2026-07-16
**Planning HEAD:** `0c27c16` (= `origin/main`)
**Prior:** [G-20u39b admin mobile polish](./gosaki-staging-p1-admin-mobile-left-align-polish.md) · [G-20ui1 admin UI polish inventory](./gosaki-admin-ui-polish-inventory.md)

| Check | Status |
| --- | --- |
| Planning / IA | **yes** |
| Implementation | **no** |
| build / package / FTP | **no** |
| Save enablement | **no** |
| service_role used | **not used** |

---

## Gates

```txt
gosakiAdminOperationalUiInformationArchitecturePlanned: true
phase: G-20u39b2-gosaki-admin-operational-ui-information-architecture-planning
planningHead: 0c27c16

ADMIN_OPERATIONAL_UI_IA_PLANNED: true
ADMIN_PORTAL_ROUTE_PLANNED: true
INDIVIDUAL_CONTENT_ADMIN_ROUTES_PLANNED: true
IMPLEMENTATION_EXECUTED: false

P1-CON1: resolved
P1-ADM-MOB1: resolved
PUBLIC_READY: CONDITIONAL
PRODUCTION_UPLOAD_READY: false
HOSTING_READY: false
GO_LIVE_READY: false

implementationExecuted: false
cssModificationExecuted: false
srcPagesAdminModified: false
saveEnabled: false
packageGenerationExecuted: false
ftpUploadExecuted: false
sqlExecuted: false
dbWriteExecuted: false
edgeDeployExecuted: false
productionChanged: false
wixProductionChanged: false
serviceRoleUsed: false

recommendedNextPhase: G-20u39b3-gosaki-admin-portal-and-content-routes-local-implementation
alternateNextPhase: G-20u39c-gosaki-staging-public-mobile-visual-p1-review
```

---

## 1. Purpose

Gosaki staging admin を「開発確認用の長い1ページ」から、**実運用に近い管理ポータル + 個別コンテンツ画面**へ整理するための情報設計を固定する。

- `/admin/` = 入口・ダッシュボードのみ
- 各コンテンツは個別 route
- 共通ナビ + 「管理トップへ戻る」
- 開発者情報は折りたたみ / 非表示可能
- 安全性（staging · 閲覧のみ · Save不可の明示）は維持しつつ、上部の巨大警告ブロックを減らす

**This phase does not implement routes, CSS, Save, package, or FTP.**

---

## 2. Current admin structure (as-is)

Gosaki には **2つの admin 面**がある。

### 2.1 Staging package online admin (client / STG URL)

| Item | Value |
| --- | --- |
| URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/` |
| Template | `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro` |
| Styles | `gosaki-staging-read-only-admin.css` |
| Shape | **単一ページ**にダッシュボード + 全セクション縦積み |
| Production | `/admin/` **excluded** from production package |

**On-page stack today:** header badges → 大きな安全バナー → ダッシュボード cards → Discography editor prototype → サイト概要 → Auth → YouTube → About → Contact HubSpot → Schedule snapshot → 無効 Save/Publish/Deploy/FTP → phase ID footer.

### 2.2 Local operator shell (dev)

| Item | Value |
| --- | --- |
| Gate | `ENABLE_ADMIN_STAGING_SHELL=true` + `npm run dev` |
| Base | `/__admin-staging-shell/musician-basic/admin/` |
| Layout | `AdminGosakiStagingShellLayout.astro` + `admin.css` |
| Paths | `templates/admin-cms/gosaki/gosaki-staging-admin-paths.ts` |

| Route | Exists | Role today |
| --- | --- | --- |
| `…/admin/` | **yes** | Operator portal home (`AdminGosakiStagingOperatorHome`) |
| `…/admin/schedule/` | **yes** | Schedule edit + dry-run · Save env-gated · PoC in `<details>` |
| `…/admin/discography/` | **yes** | Discography edit + dry-run · field Saves env-gated |
| `…/admin/youtube/` | **yes** | Top embed edit + dry-run · Save env-gated |
| `…/admin/about/` | **yes** | Profile / bands HTML + dry-run · Save often off |
| `…/admin/contact/` | **no** | Missing |
| `…/admin/link/` | **no** | Missing |
| Settings | **no** | Missing |

**Pattern already present (Sariswing-inspired):** portal menu · `← 管理画面トップへ` · staging badge · logout · 「準備中」secondary items · developer `<details>`.

### 2.3 Gap summary

| Gap | Detail |
| --- | --- |
| Dual surfaces | STG `/admin/` is monolithic; local shell already has portal + content routes |
| IA drift | Online STG does not match operator-shell route model |
| Contact | HubSpot summary only on STG page · no dedicated admin route |
| Dev noise | Phase IDs · siteSlug · FTP/production STOP copy · English prototype titles on STG page |

---

## 3. Feature maturity classification

| Feature | Class | Rationale |
| --- | --- | --- |
| **Schedule** | **1. Ready for individual admin now** | Full shell operator page · dry-run · gated Save |
| **Discography** | **1. Ready for individual admin now** | Full shell page · dry-run · gated field Saves |
| **YouTube** | **1. Ready for individual admin now** | Full shell page · dry-run · gated Save |
| **About** | **1. Ready for individual admin now** | Full shell page · dry-run primary |
| **Contact** | **2. Read-only screen can split · 3. CMS incomplete** | HubSpot embed/config is external · admin = status + open HubSpot / public Contact · **no form-field CMS** |
| **Home (site content)** | **4. Admin not needed as content CMS** | Portal home ≠ homepage content editor · public Home is crawl/static |
| **Link** | **3. Defer / 4. often not needed** | STG: static · CMS 未接続 · no shell page |
| **Settings** | **3. Defer** | No settings surface today · future auth/site prefs only |

---

## 4. Target route map (to-be)

Target environment: **Gosaki staging admin** (online package path `/admin/…` under deployBase). Local shell paths mirror the same relative structure under `__admin-staging-shell/…`.

| Route | Role | Content body? |
| --- | --- | --- |
| `/admin/` | **Portal / dashboard only** | No lists · no long forms |
| `/admin/schedule/` | Schedule management | Yes |
| `/admin/discography/` | Discography management | Yes |
| `/admin/youtube/` | YouTube embed management | Yes |
| `/admin/about/` | Profile / bands management | Yes |
| `/admin/contact/` | Contact HubSpot status (read-only) | Status + links only |
| `/admin/link/` | Optional later | Defer |
| Settings | Optional later | Defer |

**Auth routes** (forgot / reset) remain separate under staging auth paths — not portal cards.

**Public preview:** each page (and portal) links to STG public site (`…/cms-kit-staging/gosaki-piano/`).

---

## 5. Portal (`/admin/`) responsibilities

**Include:**

- Site name (Gosaki Piano)
- Compact staging / 閲覧のみ indicators
- Cards or menu links to each content admin
- Per-feature status: `編集可能` · `閲覧のみ` · `準備中`
- 「公開サイトを確認」link
- Short operator guidance (1 short block max)

**Exclude:**

- Full Schedule / Discography / YouTube / About editors
- Data tables of all events/albums
- FTP / package / sourceCommit walls
- Phase ID footers

---

## 6. Individual content admin roles

| Page | Operator job | Safety |
| --- | --- | --- |
| Schedule | List / select / edit fields · 「変更を確認」 · gated Save when armed | Dry-run default · PoCs stay in developer details |
| Discography | Album fields / tracks dry-run · gated Saves | Same |
| YouTube | Top embed URL normalize · dry-run · gated Save | Same |
| About | Profile / bands HTML · dry-run | Save often disabled until armed |
| Contact | Show HubSpot portal/form identity · link to public Contact · note that form fields live in HubSpot | No CMS field Save |

Each page: **common nav** + **「管理トップへ戻る」** + compact safety chip · not a second full-page warning banner.

---

## 7. Common navigation

| Element | Spec |
| --- | --- |
| Header brand | Links to `/admin/` |
| Staging chip | 「テスト環境」 |
| Mode chip | 「閲覧のみ」 and/or 「保存は準備中」 when Save disabled |
| Primary nav | Schedule · Discography · YouTube · About · Contact (Contact may be muted if read-only) |
| Back link | On every content page: `← 管理トップへ` |
| Logout | When auth session present |
| Preview | 「公開サイト」 external link |

Reuse existing shell patterns (`AdminGosakiStagingShellLayout`, `admin-gosaki-back-link`, menu buttons) rather than inventing a second design system.

---

## 8. Developer-facing content — classify A / B / C

### A. Client / operator facing — **retain** (compact)

| Item | Placement |
| --- | --- |
| テスト環境 / STAGING | Header chip |
| 閲覧のみ / Save disabled | Header chip or one-line status |
| 「変更を確認」does not write DB | Short note near dry-run actions |
| 公開サイトへの反映は別手順（戸山代行） | Portal short guide — not FTP tech steps |

### B. Move to **開発者情報** (`<details>` / collapsible · default closed)

| Item |
| --- |
| siteSlug |
| build snapshot / event counts source labels |
| sourceCommit / package identity |
| phase IDs · approvalId · operationId |
| dry-run JSON dumps |
| CMS Kit PoC / G-6 / G-13 / G-11 stacks |
| HubSpot portalId / formId (optional: show shortened in Contact page body; full IDs in developer details) |
| Auth adapter / env probe panels |

### C. **Remove from normal UI** (keep in docs / developer details only if still needed)

| Item |
| --- |
| FTP手順 · mirror/sync warnings as main banner |
| Production package exclusion essays on every screen |
| Historical phase STOP banners (G-20j etc.) as hero copy |
| English-only prototype section titles as primary headings |
| Disabled Save/Publish/Deploy/FTP button rows that only restate policy |

**Staging safety remains:** chips + dry-run default + Save disabled unless env-armed · **no** service_role · production still excludes `/admin/`.

---

## 9. Migration approach (do not break existing features)

| Principle | Detail |
| --- | --- |
| Prefer shell model | Local operator shell already matches target IA — use it as the product shape for online STG |
| Incremental | First: portal + route shells for Schedule/Discography/YouTube/About without changing Save gates |
| STG single-page | Replace monolith gradually: portal page + thin content pages · move prototype sections into developer details or dedicated routes |
| No Save expansion | IA phase must not enable new non-dry-run writes |
| Dual-path until cutover | Keep inject hook for staging package admin; do not touch `src/pages/admin` production Sariswing tree |
| Contact last among content | Read-only Contact page after core four routes stable |
| Link / Settings | Explicitly out of G-20u39b3 scope |

---

## 10. Implementation order

| Step | Phase (recommended) | Scope |
| --- | --- | --- |
| 1 | **G-20u39b3** | Local: portal home cleanup · shared nav · content routes already present · move B/C noise into developer details · no package |
| 2 | G-20u39b4 (future) | Align staging-package `/admin/` with portal + content routes (or equivalent multi-page inject) · local verify |
| 3 | G-20u39b5 (future) | Package regen + operator manual FTP · STG browser QA |
| 4 | Later | Contact read-only page · optional Link · Settings |

**Immediate next:** `G-20u39b3-gosaki-admin-portal-and-content-routes-local-implementation`

**Alternate (non-admin track):** `G-20u39c-gosaki-staging-public-mobile-visual-p1-review`

---

## 11. What was NOT done

| Item | Status |
| --- | --- |
| Implementation / CSS / Astro route changes | **no** |
| `src/pages/admin` (production) changes | **no** |
| Save enablement | **no** |
| build / package / FTP | **no** |
| SQL / DB write / Edge | **no** |
| Browser / STG upload | **no** |

---

## Summary

Target IA: **portal at `/admin/` + individual Schedule / Discography / YouTube / About (+ Contact read-only)**. Local shell already approximates this; STG online admin is still a monolith and should converge. Developer noise moves to collapsible details; compact staging/read-only chips stay. **IMPLEMENTATION_EXECUTED: false.** Next: **G-20u39b3** local portal/routes implementation.
