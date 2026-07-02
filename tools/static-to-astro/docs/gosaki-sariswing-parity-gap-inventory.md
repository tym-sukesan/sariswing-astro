# G-22a — Sariswing parity gap inventory for Gosaki CMS

**Phase:** `G-22a-gosaki-sariswing-parity-gap-inventory`  
**Status:** **complete** — read-only survey + implementation roadmap (no implementation)  
**Date:** 2026-07-02  
**Base commit:** `d404ce3`  
**Prior:** [gosaki-admin-ui-minor-polish-local-qa.md](./gosaki-admin-ui-minor-polish-local-qa.md) (G-20ui3-QA)

| Check | Status |
| --- | --- |
| Sariswing admin inventory | **yes** (local code only) |
| Gosaki CMS inventory | **yes** |
| Parity gap table | **yes** |
| Schedule CRUD deep-dive | **yes** |
| Implementation roadmap G-22b+ | **yes** |
| Implementation / Save / DB write | **no** |

---

## Gates

```txt
gosakiSariswingParityGapInventoryComplete: true
phase: G-22a-gosaki-sariswing-parity-gap-inventory
readyForG22bScheduleDuplicateImplementation: true
saveBehaviorChanged: false
saveExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
cursorDbWriteExecuted: false
sariswingProductionRefUsed: false
```

**Supabase interim SoT (Gosaki):** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh` (read or write).

**Sariswing reference:** local repo code under `src/pages/admin`, `src/scripts/admin`, `supabase/functions/admin-*` — **not** production DB.

---

## 1. Git state

| Item | Value |
| --- | --- |
| `HEAD` | `d404ce3` |
| `origin/main` | `d404ce3` |

---

## 2. Sariswing admin — feature inventory (local code)

Production admin: `/admin/*` (not Gosaki staging shell).

| Feature | Status | Key paths |
| --- | --- | --- |
| **NEWS CRUD** | ✅ Full | `src/pages/admin/news/`, `scripts/admin/news.ts`, `supabase/functions/admin-news/` |
| **Schedule CRUD** | ✅ Full | `src/pages/admin/schedule/`, `scripts/admin/schedule.ts`, `supabase/functions/admin-schedule/` |
| **Schedule add** | ✅ INSERT via Edge | `action: "create"` |
| **Schedule duplicate** | ✅ INSERT copy | `action: "duplicate"` — title `"{original} のコピー"` |
| **Schedule delete** | ✅ Soft delete | `deleted_at` set; restore from deleted list |
| **Schedule venue** | ✅ Select + free text | `venues` table + `venue_name` |
| **Schedule upcoming/past** | ✅ Client split | `date >= today` vs past in `<details>` |
| **Schedule images** | ✅ Multi-image upload | `schedule-image-fields.ts`, Storage |
| **About edit** | ✅ HTML + revisions | `admin/about/`, `admin-site-page` Edge |
| **Instagram reorder** | ✅ D&D + batch save | `admin/instagram/`, `update_sort_orders` |
| **Sitemap** | ⚠️ Build-time only | `astro.config.mjs` — **no admin UI** |
| **Publish / site update** | ✅ Deploy bar | `AdminDeployBar.astro` → GitHub `workflow_dispatch` |
| **Image upload** | ✅ News + Schedule | `image-upload.ts` → Supabase Storage |
| **Auth / roles** | ✅ Session + allowlist | `require-admin-session.ts`, `_shared/admin-auth.ts` (`role=admin` or `ADMIN_EMAILS`) |

**Sariswing schedule schema (production):** `venue_name`, `note`, `is_published`, `time_type`, `members`, `image_urls`, `deleted_at` — differs from Gosaki staging Kit schema.

**Write pattern:** Browser → Edge Function (JWT + admin check) → `service_role` INSERT/UPDATE — **no** dry-run / approvalId / env-arm gates in production admin.

---

## 3. Gosaki CMS — current state

### 3.1 Surfaces

| Surface | URL / access | Notes |
| --- | --- | --- |
| **Local staging shell** | `/__admin-staging-shell/musician-basic/admin/` | Primary operator UI; `DEV` + `ENABLE_ADMIN_STAGING_SHELL` |
| **Staging read-only admin** | `.../cms-kit-staging/gosaki-piano/admin/` | Package-only; Save disabled |
| **Production admin** | **Excluded** | G-20i3 — `includeGosakiReadOnlyAdmin: false` |
| **Hosted admin on production** | **Defer** | Operator local shell + manual upload |

### 3.2 Module matrix

| Module | Read | Dry-run preview | Non-dry-run Save | Add / dup / delete | Public reflection |
| --- | --- | --- | --- | --- | --- |
| **Schedule** | ✅ Supabase | ✅ G-9k (6 fields) | ⚠️ G-9k UPDATE when armed | ❌ UI disabled; **no INSERT/DELETE code** | ⚠️ Manual regen + FTP (proven G-13/G-14) |
| **Discography** | ✅ Supabase | ✅ Scalar + tracklist | ⚠️ Per-slice (G-15b–G-19b1) when armed | ❌ Add/delete/sort disabled | ⚠️ Manual (G-19 chain proven) |
| **YouTube** | ✅ Static JSON | ✅ G-10c | ⚠️ G-10c when armed | ❌ Legacy list disabled | ⚠️ Manual |
| **About** | ✅ Static JSON | ✅ Profile + bands | ⚠️ G-10h4 when armed | N/A | ⚠️ Manual |
| **Contact** | ✅ HubSpot embed | ❌ | ❌ | ❌ No admin page | Static convert |
| **NEWS** | N/A on site | ❌ | ❌ | ❌ | N/A |
| **Instagram** | Footer links only | ❌ | ❌ | ❌ | Static |
| **Sitemap** | Build-time | N/A | N/A | N/A | Rebuild on upload |
| **Publish button** | ❌ | N/A | N/A | N/A | Operator manual FTP |
| **Image upload** | ❌ in admin | N/A | N/A | N/A | Static URLs |

### 3.3 Production package & upload

| Item | Value |
| --- | --- |
| Production `public-dist` | **26 files**, no `admin/` (G-20i3) |
| G-20j manual production upload | **STOP** — server contract / DNS / SSL / MX pending |
| FTP auto-apply | **Suspended** (G-7f1) |
| Reflection playbook | `gosaki-public-reflection-operation-standardization.md` |

### 3.4 UI polish

G-20ui1 → G-20ui3-QA complete — Japanese operator copy, dev panels collapsed. **Functional gaps remain** (this doc).

---

## 4. Parity gap table

| 機能 | Sariswing 状態 | Gosaki 状態 | 不足内容 | 難度 | リスク | 優先 | 最速実装方針 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Schedule 既存行 UPDATE** | ✅ 全フィールド | ⚠️ 6フィールドのみ (G-9k) | `date`/`published` 等は不可 | M | Med | **P0** | G-9k routine arm 常時化は別判断；フィールド拡張は G-22h 以降 |
| **Schedule 新規追加** | ✅ INSERT | ❌ ボタン disabled、adapter なし | INSERT path + legacy_id 採番 + UI wire | M | **High** (DB INSERT) | **P0** | G-22e: Kit dry-run adapter 流用 + Gosaki guard + approval slice |
| **Schedule 複製** | ✅ duplicate action | ❌ ボタン disabled；add-form prefill のみ | INSERT from source row + UI wire | M | **High** | **P0** | **G-22b→d** — `schedule-dry-run-adapter` duplicate 既存 |
| **Schedule 削除** | ✅ soft delete | ❌ ボタン disabled | `deleted_at` or `published=false` 方針 + adapter | M | **High** | **P0** | G-22f: soft-delete via `published` 先行可；`deleted_at` は schema 確認 |
| **Schedule venue 自由入力** | ✅ | ✅ テキスト `venue` | 実質同等（venue master なし） | L | Low | P1 | 現状で足りる |
| **Schedule upcoming/past** | ✅ 2リスト | ⚠️ 月フィルタのみ | 未来/過去 UX | L | Low | P1 | クライアント分割は UI のみ |
| **Schedule 画像** | ✅ Storage upload | ❌ | image_url 編集 + upload | H | Med | P2 | Discography cover 後 |
| **NEWS CRUD** | ✅ | ❌ モジュールなし | Gosaki サイトに NEWS ページなし | H | Low | **P2** | クライアント要件次第でスキップ可 |
| **About 編集** | ✅ DB HTML | ⚠️ static JSON + gated Save | 常時 Save / オンライン admin | M | Med | P1 | G-10h4 常時化 or hosted admin 後 |
| **Instagram 並び替え** | ✅ | ❌ | Gosaki は SNS リンクのみ | H | Low | **P2** | 不要の可能性大 |
| **Sitemap** | Build のみ | Build のみ | 同等（admin UI なし） | — | — | — | 変更不要 |
| **公開サイト更新** | ✅ GHA deploy | ❌ 手動 FTP | ワンクリック deploy（Gosaki は defer） | H | **High** | P1 | G-20j 後；FTP 自動化は G-7f1 再承認後 |
| **画像アップロード** | ✅ | ❌ | Storage + admin widget | M | Med | P2 | Schedule/Discography 後 |
| **認証 / role** | ✅ prod allowlist | ⚠️ staging auth のみ | Hosted admin + client role | M | Med | P1 | G-20j 後 |
| **Discography CRUD** | N/A (prod に無し) | ⚠️ slice Save のみ | add/delete/sort/cover | M | Med | P1 | G-22h+ |
| **YouTube 複数管理** | N/A | ⚠️ top embed のみ | add/reorder/delete UI | L | Low | P1 | G-10c 拡張 |
| **Contact admin** | N/A | ❌ | HubSpot 読取 stub | L | Low | P2 | G-20ui defer 継続 |
| **Hosted admin** | ✅ `/admin` | ❌ excluded from prod | production `/admin` | H | **High** | P1 | G-20j + DNS 後 |

---

## 5. P0 不足機能（最速で Sariswing Schedule 同等へ）

| # | Feature | Why P0 |
| --- | --- | --- |
| 1 | **Schedule 複製** | 運用で最頻；UI あるが無効；adapter の dry-run 土台あり |
| 2 | **Schedule 新規追加** | 新公演登録不可；フォームはある |
| 3 | **Schedule 削除 / 非公開** | 誤登録の巻き戻し不可 |
| 4 | **G-9k UPDATE の routine 運用化** | 既存実装はあるが env-arm 必須；実用フロー定義（G-14 系の延長） |

**Not P0 for Gosaki pianist:** NEWS, Instagram admin, Sitemap admin, Sariswing-style GHA deploy（FTP 手動で代替中）。

---

## 6. Schedule CRUD — deep dive

### 6.1 Why duplicate / add / delete buttons are disabled

| Layer | Evidence |
| --- | --- |
| **Markup** | `AdminGosakiStagingScheduleOperatorPage.astro` — `#gosaki-schedule-add-btn`, `#gosaki-schedule-duplicate-btn`, `#gosaki-schedule-delete-btn` have `disabled` + `data-gosaki-schedule-action-disabled` |
| **Runtime** | `gosaki-staging-schedule-operator-ui.ts` → `wireDisabledActions()` forces all `[data-gosaki-schedule-action-disabled]` except `#gosaki-schedule-update-btn` |
| **No handlers** | `initGosakiStagingScheduleOperatorUi()` — no click listeners for add/duplicate/delete |
| **Policy** | `gosaki-schedule-existing-event-save-button-guard-config.md` — INSERT, DELETE, duplicate save **explicitly excluded** from G-9k |
| **No backend** | No `gosaki-schedule-*-insert*.ts` or `*-delete*.ts` under `staging-write/` |

**Add-form duplicate dropdown** (`#gosaki-add-duplicate-source`) only prefills the add form — not an INSERT.

### 6.2 Existing duplicate / dry-run infrastructure (reusable)

| Asset | Path | Reuse for G-22b |
| --- | --- | --- |
| Duplicate dry-run adapter | `src/lib/admin/staging-write/schedule-dry-run-adapter.ts` | `buildScheduleDuplicateDryRun()` — payload, validation, rollback hint |
| Dev UI duplicate button | `staging-schedule-dry-run-ui.ts` | Pattern for operator wire |
| Type `ScheduleDryRunOperation` | `schedule-dry-run-types.ts` | includes `"duplicate"` |
| Sariswing Edge duplicate | `supabase/functions/admin-schedule/index.ts` `action: "duplicate"` | **Logic reference only** — Gosaki uses anon client + RLS, not Edge |

### 6.3 Gosaki staging `schedules` schema (vs Sariswing)

| Field | Gosaki Kit (staging) | Sariswing prod | G-22 impact |
| --- | --- | --- | --- |
| `site_slug` | ✅ `gosaki-piano` | ❌ (single site) | INSERT must set |
| `legacy_id` | ✅ required pattern | different | INSERT must generate `schedule-YYYY-MM-NNN` |
| `venue` | text | `venue_name` | OK — free text |
| `description` | text | `note` | OK |
| `published` | boolean | `is_published` | duplicate default `false` |
| `deleted_at` | **unclear / may be absent** | ✅ soft delete | G-22f: prefer `published=false` first or migration |
| `updated_at` | ✅ trigger (G-6-f8) | varies | optimistic lock on UPDATE |
| `time_type`, `members`, `image_urls` | ❌ or unused | ✅ Sariswing | P2 — not needed for Gosaki parity MVP |

**`schedule_months`:** read-only / derived — **do not write** (G-6 policy).

### 6.4 Optimistic lock / `updated_at`

- G-9k UPDATE: `expectedBeforeUpdatedAt` required (`assertG9kOptimisticLockBaseline`)
- Trigger `schedules_set_updated_at` active on staging (G-6-f8)
- INSERT (duplicate/add): no lock on source; new row gets new `id` + `updated_at`
- DELETE: lock on target row before soft-delete UPDATE

### 6.5 Public reflection impact

Per event change:

```txt
Save (INSERT/UPDATE/DELETE on schedules)
  → afterVerification SELECT
  → npm run build:gosaki-staging-admin-package (or production)
  → verify static-public / manual-upload
  → operator FTP upload (month page + schedule hub if needed)
  → HTTP verify
```

- **Duplicate/add:** may need **new month page** if date crosses month boundary
- **Delete:** remove from month HTML on regen (published=false or deleted filter at build)
- **Rollback:** documented SQL template per slice; re-regen + re-upload

### 6.6 Sariswing duplicate — can we port?

| Aspect | Portability |
| --- | --- |
| UX (confirm → duplicate) | ✅ Copy pattern from `schedule.ts` |
| Server INSERT logic | ⚠️ **Not direct port** — Sariswing uses Edge + service_role; Gosaki uses staging-write adapters + anon + approvalId |
| Title suffix `のコピー` | ✅ Adopt in Gosaki payload |
| Field mapping | ⚠️ Map `venue`/`description`/`published`; omit Sariswing-only fields |

**Recommended:** New Gosaki slice `G-22b` — `buildGosakiScheduleDuplicateDryRun` wrapping existing adapter + Gosaki-specific guards (`site_slug`, `legacy_id` generation).

---

## 7. Fastest implementation roadmap (G-22b+)

### Phase sequence (recommended)

| Phase | Scope | Risk | Depends on |
| --- | --- | --- | --- |
| **G-22b** | Schedule **duplicate** — dry-run adapter + operator UI wire (no Save) | Low | G-22a |
| **G-22c** | Schedule duplicate **dry-run QA** (local dev) | Low | G-22b |
| **G-22d** | Schedule duplicate **non-dry-run single-slice** (INSERT, approvalId, env arm) | **High** | G-22c + operator approval |
| **G-22e** | Schedule **new event** — dry-run + INSERT slice | **High** | G-22d patterns |
| **G-22f** | Schedule **delete / soft-unpublish** — dry-run + UPDATE slice | **High** | G-22d patterns |
| **G-22g** | Schedule **full CRUD closure** — routine arm doc + operator playbook | Med | G-22d–f |
| **G-22h** | Discography personnel / price / sort (per G-14a backlog) | Med | G-22g |
| **G-22i** | Hosted admin + production deploy path | **High** | G-20j operator checklist |

### G-22b implementation sketch (duplicate — no Save yet)

1. `gosaki-schedule-duplicate-dry-run.ts` — wrap `buildScheduleDuplicateDryRun` with `site_slug= gosaki-piano`
2. Wire `#gosaki-schedule-duplicate-btn` → dry-run only (remove from `wireDisabledActions` exclusion pattern carefully)
3. New approvalId: `G-22b-gosaki-schedule-duplicate-dry-run` (planning)
4. Verifier + doc; **no INSERT**

### G-22d implementation sketch (duplicate Save)

1. `assertG22dDuplicatePayloadOnly` — INSERT fields only; no UPDATE of source
2. `legacy_id` generator — next `schedule-YYYY-MM-NNN` for target month
3. `executeGosakiScheduleDuplicateSave` — anon INSERT + rowsAffected check
4. Env: `PUBLIC_ADMIN_SCHEDULE_G22D_DUPLICATE_NON_DRY_RUN_ARMED`
5. Single-arm mutual exclusion with G-9k / G-14b1a

---

## 8. Risk classification

### Low risk (G-22b/c and planning)

- Local code implementation (dry-run only)
- Verifier / doc
- UI button wire for preview only
- read-only SELECT for inventory
- Copy/label adjustments

### High risk (G-22d+ — separate approval each)

- DB INSERT / UPDATE / DELETE
- Save execution
- Production reflection / FTP upload
- Hosted admin on production
- `schedule_months` write
- Sariswing production Supabase / deploy
- FTP auto-apply (G-7f1 suspended)

---

## 9. Deferred (explicit)

| Item | Reason |
| --- | --- |
| Contact admin stub | G-20ui3 defer — low client impact |
| Discography English field labels | Cosmetic |
| NEWS / Instagram modules | Not on Gosaki Wix MVP scope |
| `date` / `published` in G-9k UPDATE | Separate slice after CRUD closure |
| Sariswing `/admin` changes | AGENTS.md forbidden |

---

## 10. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Implementation | **no** |
| Save / DB write | **no** |
| Package regen / FTP | **no** |
| Sariswing production ref | **no** |
| commit / push | **no** |

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22a-gosaki-sariswing-parity-gap-inventory.mjs
```
