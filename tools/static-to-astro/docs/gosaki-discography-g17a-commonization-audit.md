# G-17a — Gosaki Discography CMS commonization audit / acceleration plan

**Phase:** `G-17a-gosaki-discography-commonization-audit`  
**Status:** **complete** — read-only audit + design; no refactor implementation  
**Date:** 2026-06-29  
**Base commit:** `de2a388`  
**Prior:** G-16b-f closure (`gosaki-discography-g16b-artist-public-reflection-closure.md`)

| Check | Status |
| --- | --- |
| G-15/G-16 Save chains inventoried | **yes** |
| Duplication classified A/B/C | **yes** |
| G-17b minimal implementation scoped | **yes** |
| Ideal per-field work volume estimated | **yes** |
| Cursor Save / DB write / FTP | **no** |

---

## Gates

```txt
gosakiDiscographyG17aCommonizationAuditComplete: true
phase: G-17a-gosaki-discography-commonization-audit
readyForG17bDiscographyScalarSliceRegistry: true
readyForNextDiscographyFieldSaveWithoutRegistry: false
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
cursorDbWriteExecuted: false
cursorFtpExecuted: false
cursorSaveExecuted: false
```

**Supabase staging target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh` (Sariswing production).

---

## 1. Executive conclusions (required)

### 1. 今の開発方法が非効率になり始めているか

**はい。** G-15b（`purchase_url`）→ G-15d（`artist`）→ G-16a（`artist` 2例目）で **同型の TS ファイル群が3セット**（計 ~2,850行 `gosaki-discography*.ts`）と **docs 27 + verifiers 24** に膨張。Schedule 側は既に `staging-schedule-single-text-field-operational-registry` があるのに、Discography は slice ごとにコピペ増殖している。

### 2. どこが重複しているか

| Layer | Duplication pattern | Est. redundant lines |
| --- | --- | --- |
| **Save config** | `purchase-url-save-config`, `artist-save-config`, `g16a-artist-save-config` — 同一 arm gate ロジック | ~400 |
| **Save executor** | `existing-release-save`, `existing-release-artist-save`, `g16a-existing-release-artist-save` | ~370 |
| **Dry-run** | `existing-release-dry-run`, `artist-dry-run` ×2 + guards ×2 | ~750 |
| **Write guards** | `assertG15b*`, `assertG15d*`, `assertG16a*` — field/legacy_id 以外同一 | ~120 |
| **next-field-types** | G15d / G16a 定数ファイル | ~40 |
| **save-page-config** | G15b / G15d / G16a DOM env 注入 | ~180 |
| **Docs + verifiers** | 1 chain ≈ 5–6 docs + 5–6 verifiers ×3 chains | ~15k lines doc/verify |
| **Public reflection** | `patchGosakiDiscographySupabaseFields` は既に統合済みだが field 追加は if 分岐 | 小 |

### 3. 何を共通化すれば効果が大きいか

1. **Scalar field slice registry**（Schedule の `SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY` 相当）
2. **Generic Save config** — 1関数 + registry entry（approvalId, envArm, targetLegacyId, field, phase）
3. **Generic Save / dry-run executor** — `executeDiscographyScalarSliceSave(entry, …)`
4. **Parameterized guards** — `assertDiscographyScalarPayloadOnly(field, payload)` + `assertDiscographyWritableRow(legacyId)`
5. **Public patch registry** — `DISCOGRAPHY_PUBLIC_PATCH_HANDLERS[field]` in `supabase-discography-read.mjs`
6. **Doc / verifier templates** — 1 chain doc テンプレ + 1 scaffold verifier（phase 名差し替え）

### 4. 何を共通化しすぎると危険か

- **approval ID の再利用** — クローズ済み slice の ID を別 row/field に流用
- **single-arm env の緩和** — 複数 slice 同時 armed
- **FTP / deploy 自動化** — G-7f incident 後は別設計必須
- **published / sort_order** — public HTML patch 不要かもだが影響範囲未整理
- **streaming_url** — DB null 多数、public 側リンク構造未監査
- **tracks / personnel / price** — schema / Wix HTML 乖離
- **クローズ済み3 chain のコード削除** — 監査証跡・再現性を損なう

### 5. G-17bでやるべき最小実装

**コード変更は registry + generic 層の追加のみ。既存3 slice の挙動は変えない。**

| # | Deliverable | Risk |
| --- | --- | --- |
| 1 | `discography-scalar-field-slice-registry.ts` — 3 closed entries を登録 | low |
| 2 | `getDiscographyScalarSliceSaveConfig(entry)` — 3 config ファイルの後継（旧は re-export） | low |
| 3 | `assertDiscographyScalarSliceGuards(entry, payload, row)` — guards 集約 | low |
| 4 | `DISCOGRAPHY_PUBLIC_PATCH_REGISTRY` in `supabase-discography-read.mjs` — 既存 patch を登録化 | low |
| 5 | `docs/templates/discography-scalar-slice-chain-template.md` | none |
| 6 | `verify-discography-scalar-slice-registry.mjs` — registry 整合テスト | none |

**G-17b でやらない:** 既存 executor の削除、新フィールド Save、DB/FTP、admin UI の大改修。

### 6. G-17c以降で次フィールドSaveに戻るべきか

**はい — G-17b 完了後。** 最初の実戦 slice は **未クローズ行 `discography-004` / Ja-Jaaaaan!** の scalar 1フィールド（推奨: `title` または `year`）。registry 経由で追加し、旧コピペパターンは使わない。

### 7. 次フィールド追加時の理想作業量

| Phase | 現状 (G-15/G-16) | 目標 (G-17b 後) |
| --- | --- | --- |
| **Cursor 実装** | ~8–12 TS ファイル + UI 分岐 + adapter if/else | **1 registry entry** + optional patch handler + adapter lookup |
| **Docs** | 5–6 個 × 手書き | **1 テンプレ doc**（phase 名・before/after 差し替え） |
| **Verifiers** | 5–6 個 × ~200行 | **1 scaffold** + chain-specific アサーション ~30行 |
| **Operator** | 変更なし（Preview → Save 1回 → upload 1 file） | 同左 |
| **合計 dev 工数** | ~2–3 日/slice | **~0.5 日/slice**（public patch 新規時 +0.5 日） |

---

## 2. Proven chains (reference)

| Chain | Row | Field | Closure |
| --- | --- | --- | --- |
| G-15b→G-15c-f | `discography-002` SKYLARK | `purchase_url` | `gosaki-discography-public-reflection-closure.md` |
| G-15d→G-15e-f | `discography-003` About Us!! | `artist` | `gosaki-discography-artist-public-reflection-closure.md` |
| G-16a→G-16b-f | `discography-001` Continuous | `artist` | `gosaki-discography-g16b-artist-public-reflection-closure.md` |

**共通パターン（実証済み）:** planning → dry-run → Save preflight → operator Save ×1 → result → reflection preflight → local regen → 1-file upload → HTTP verify → closure.  
**Playbook:** `cms-kit-save-reflection-playbook.md`

---

## 3. Inventory — staging-write (26 files)

### 3.1 Already shared (keep)

| File | Role |
| --- | --- |
| `discography-write-adapter.ts` | Generic UPDATE + optimistic lock |
| `discography-write-types.ts` | Approval ID union + payload types |
| `discography-write-guards.ts` | Slice guards (to be parameterized) |
| `staging-discography-read.ts` | SELECT columns |
| `staging-discography-optimistic-lock-stale-check.ts` | Stale check |
| `gosaki-discography-optimistic-lock-config.ts` | Lock env |
| `gosaki-staging-discography-admin-ui.ts` | UI routing by `legacy_id` |

### 3.2 Per-slice duplication (3系統)

| Concern | G-15b purchase_url | G-15d artist | G-16a artist |
| --- | --- | --- | --- |
| Target | `discography-002` | `discography-003` | `discography-001` |
| next-field-types | `dry-run-types` | `next-field-types` | `g16a-next-field-types` |
| dry-run guards | `dry-run-guards` | `artist-dry-run-guards` | `g16a-artist-dry-run-guards` |
| dry-run executor | `existing-release-dry-run` | `existing-release-artist-dry-run` | `g16a-existing-release-artist-dry-run` |
| save-page-config | `save-page-config` | `artist-save-page-config` | `g16a-artist-save-page-config` |
| save-config | `purchase-url-save-config` | `artist-save-config` | `g16a-artist-save-config` |
| save executor | `existing-release-save` | `existing-release-artist-save` | `g16a-existing-release-artist-save` |
| write guards | `assertG15b*` | `assertG15d*` | `assertG16a*` |

### 3.3 Docs / verifiers (G-15/G-16 Save-related)

- **Docs:** 27 `gosaki-discography*.md`（うち Save+reflection chain 各 ~5–6）
- **Verifiers:** 24 `verify-g15*` / `verify-g16*` discography scripts

---

## 4. Already commonized (do not regress)

| Component | Location | Notes |
| --- | --- | --- |
| Write adapter | `discography-write-adapter.ts` | Single `updateDiscographyWrite()` |
| Optimistic lock | adapter + `staging-discography-optimistic-lock-stale-check.ts` | Reused from Schedule utils |
| `updated_at` trigger | DB `discography_set_updated_at` | Live proof ×2 (G-15d, G-16a) |
| Public reflection hub | `patchGosakiDiscographySupabaseFields` | `purchase_url` + `artist` in one pass |
| Repeater bounds | `findDiscographyRepeaterItemBounds` | zwsp / `item1` fixes (G-16b) |
| Manual 1-file upload | playbook + 3 closures | `discography/index.html` only; CSS hash 不変 |
| Admin UI slice router | `resolveDiscographyWriteSlice(legacyId)` | Maps legacy_id → g15a2/g15d/g16a |
| Playbook | `cms-kit-save-reflection-playbook.md` | Save + reflection standard |

### Schedule precedent (mirror target)

`staging-schedule-single-text-field-operational-registry.ts` + `executeSingleTextFieldOperationalNonDryRunSave(fieldName)` — **Discography should adopt this pattern in G-17b.**

---

## 5. Classification A / B / C

### A — すぐ共通化すべき

| Item | Rationale |
| --- | --- |
| Scalar slice registry | Eliminates 3× save-config / save-executor / dry-run copies |
| Generic `getDiscographyScalarSliceSaveConfig` | ~660 lines → ~120 lines + registry |
| Parameterized payload/row guards | `assertG15d*` ≈ `assertG16a*` (field=`artist` only diff) |
| Adapter approvalId → registry lookup | Replace if/else chain in `updateDiscographyWrite` |
| Public patch registry | Add `title`/`year` without growing monolithic if |
| Doc + verifier templates | Largest doc/verifier duplication |
| beforeSnapshot inventory checklist | G-16a `purchase_url` misrecord lesson — playbook appendix |

### B — まだ個別sliceでよい

| Item | Rationale |
| --- | --- |
| Per-slice **approval ID** (frozen when closed) | Audit trail; one-time operator Save |
| Per-slice **env arm** name | Single-arm mutual exclusion |
| Per-chain **result / closure docs** | Operator evidence; do not merge chains |
| Per-slice **target legacy_id** in registry | Row scope safety |
| `gosaki-staging-discography-admin-ui.ts` slice switch | Until registry drives UI labels |
| Closed chain **re-Save forbidden** gates | Per closure doc |

### C — 今は触らない

| Item | Rationale |
| --- | --- |
| `published` / `sort_order` | Public patch impact unclear |
| `streaming_url` | DB null inventory incomplete |
| tracks / personnel / price | Schema / Wix HTML gap |
| FTP / deploy automation | `readyForAnyFutureFtpApply: false` |
| GRANT / RLS / trigger changes | Infra already applied |
| Delete legacy G-15/G-16 files | After G-17c proves registry path |
| `/admin` production path | Staging shell only |

---

## 6. Target architecture (ideal)

```txt
discography-scalar-field-slice-registry.ts
  └─ entry: { sliceId, phase, field, targetLegacyId, approvalId, dryRunApprovalId,
              envArm, saveEnabledEnv, closed, publicPatchKey }

discography-scalar-slice-save-config.ts
  └─ getDiscographyScalarSliceSaveConfig(entry)  // generic arm gates + single-arm

discography-scalar-slice-save.ts
  └─ executeDiscographyScalarSliceSave(entry, …)  // one executor

discography-write-guards.ts
  └─ assertDiscographyScalarSliceGuards(entry, payload, row)

discography-write-adapter.ts
  └─ lookup entry by approvalId → guards

supabase-discography-read.mjs
  └─ DISCOGRAPHY_PUBLIC_PATCH_REGISTRY[field]
      purchase_url → patchDiscographyItemPurchaseUrl
      artist       → patchDiscographyItemArtist
      title        → (G-17c+)

docs/templates/discography-scalar-slice-chain-template.md
scripts/verify-discography-scalar-slice-chain.mjs  // parameterized
```

**New field workflow (post G-17b):**

1. Add registry entry (not new TS file per concern)
2. Add public patch handler if new field type
3. Fill template doc; run scaffold verifier
4. Operator: Preview → Save ×1 → regen → upload `discography/index.html` ×1

---

## 7. G-17b → G-17c shortest route

| Phase | Scope |
| --- | --- |
| **G-17b** | Registry + generic config/guards + patch registry + templates + verifier (no new Save) |
| **G-17c** | First registry-native slice: `discography-004` / `title` or `year` — planning + preflight only |
| **G-17c-d2/d3** | Dry-run + Save final preflight |
| **G-17d** | Operator Save ×1 + result doc |
| **G-17e** | Public reflection preflight → upload → closure |

**Defer:** tracks CMS, image upload (G-10f), full DB-driven discography page.

---

## 8. Forbidden (this phase)

| Operation | Executed? |
| --- | --- |
| Save / DB write | **no** |
| FTP / upload / deploy | **no** |
| Production / Sariswing | **no** |
| `service_role` | **no** |
| Large refactor | **no** |

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g17a-gosaki-discography-commonization-audit.mjs
```
