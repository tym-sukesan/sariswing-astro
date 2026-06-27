# G-14a — Gosaki CMS completion roadmap and gap inventory

**Phase:** `G-14a-gosaki-cms-completion-roadmap-gap-inventory`  
**Status:** **complete** — read-only survey + roadmap / gap inventory (doc-only)  
**Date:** 2026-06-27  
**Base commit:** `e0a9656`  
**Prior:** G-13d1→G-13e Event A PoC cleanup chain closed (`gosaki-schedule-event-a-poc-cleanup-public-reflection-closure.md`)

| Check | Status |
| --- | --- |
| Completion inventory documented | **yes** |
| Gap classification (now vs later) | **yes** |
| High / low risk split | **yes** |
| Next phase candidates evaluated | **yes** |
| Client preview / Gosaki本人共有 | **excluded from dev tasks** |
| Cursor FTP / Save / DB write | **no** |

---

## Gates

```txt
gosakiCmsCompletionRoadmapGapInventoryComplete: true
phase: G-14a-gosaki-cms-completion-roadmap-gap-inventory
readyForG14bScheduleCmsPracticalEditingFlowDefinition: true
readyForG14cPublicReflectionOperationStandardization: true
readyForG13c2EventBCleanup: false
readyForG14dGosakiAdminPracticalUiHardening: false
readyForG14eGenericMusicianCmsKitSeparation: false
readyForG14fProductionStagingDeploySafetyDesign: false
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
clientPreviewExcludedFromDevTasks: true
cursorFtpExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
```

**Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; all non-dry-run arms off.

**Client preview / Gosakiさん本人への共有・日程調整は開発タスクに含めない。** 必要なら operator / ビジネス側の別トラック。本ロードマップは **CMS とシステム完成** のみを対象とする。

---

## 1. Investigation scope

| Area | Sources reviewed (read-only) |
| --- | --- |
| AI context | `docs/ai/00-current-state.md`, `03-next-actions.md`, `handoff-to-chatgpt.md` |
| Phase boundary | `gosaki-schedule-cms-phase-boundary-planning.md` (G-12d) |
| Prior inventory | `gosaki-completion-inventory-and-next-module-selection.md` (G-10a) |
| CMS scope | `gosaki-cms-scope-and-schedule-youtube-planning.md` (G-9a) |
| Online admin arch | `gosaki-staging-online-cms-architecture-planning.md` (G-11a) |
| Schedule practicalization | `gosaki-schedule-cms-practicalization-planning.md` (G-9h) |
| Event A chain | G-13b→G-13e closure docs |
| YouTube chain | G-11c8→G-11c15 docs |
| Staging admin templates | `tools/static-to-astro/templates/admin-cms/gosaki/**` |
| Admin lib | `src/lib/admin/staging-write/*`, `staging-data/*` |
| Build / package | `build-gosaki-staging-admin-package.mjs`, `manual-upload` verifiers |

**Staging public URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`  
**Staging online admin:** `/cms-kit-staging/gosaki-piano/admin/` (G-11b)  
**Local staging shell:** `/__admin-staging-shell/musician-basic/admin/` (dev origin)

---

## 2. Current completion snapshot

### 2.1 Overall maturity (2026-06-27)

| Layer | Maturity | Evidence |
| --- | --- | --- |
| **Static site migration** | **High** | G-7→G-8g Wix convert; staging browser QA PASS |
| **Public schedule read** | **High** | G-12b `scheduleDataSource=supabase`; month counts verified |
| **Schedule DB write (slice PoC)** | **Medium** | G-9k6 6-field slices; G-13d1 cleanup — all gated, frozen |
| **DB → public HTML loop** | **Medium** | G-13e **once proven** (regen + 1-file upload + HTTP verify) |
| **YouTube CMS** | **Medium–High** | G-11c workflow save + staging public verify; re-save frozen |
| **Online staging admin** | **Medium** | G-11b read-only shell live; YouTube Edge save path |
| **Practical operator UX** | **Low–Medium** | Per-slice arms, env stacks, manual FileZilla |
| **Event create/delete** | **Low** | UI scaffolding; INSERT/DELETE disabled |
| **Kit generalization** | **Low–Medium** | Wix baseline split (G-8c); Gosaki admin still site-specific |
| **Production cutover** | **None** | `gosaki-piano.com` untouched; FTP auto-apply suspended |

### 2.2 Proven end-to-end chain (G-13)

```txt
staging shell Save (G-13d1)
  → Supabase schedules row updated
  → build-gosaki-staging-admin-package.mjs (local regen)
  → manual-upload package (schedule/YYYY-MM/index.html)
  → operator FileZilla overwrite (G-13e)
  → live staging HTTP verify
  → closure doc + commit
```

**This chain is the reference model** for Schedule public reflection. It is **not yet productized** into a repeatable operator playbook with minimal-scope upload rules for all edit types.

### 2.3 Module completion matrix

| Module | Read (public) | Write (admin) | Public reflection | Practical for client |
| --- | --- | --- | --- | --- |
| **Schedule** | ✅ Supabase + fallback | ⚠️ slice PoC only | ⚠️ manual (proven once) | **No** |
| **YouTube (home)** | ✅ | ✅ workflow JSON patch | ✅ manual upload | **Partial** |
| **About profile** | ✅ static JSON | ⚠️ local dev API only | ⚠️ manual package | **No** |
| **About bands** | ✅ static JSON | ⚠️ G-10h4d one-shot | ⚠️ manual | **No** |
| **Discography** | ✅ static JSON | ❌ read-only admin | static only | **No** |
| **Contact** | ✅ HubSpot embed | ❌ static convert hook | manual | **No** |

---

## A. Practical CMS completion criteria

Gosaki-piano CMS を「完成」とみなすための条件（開発観点）:

| # | Criterion | Status | Gap |
| --- | --- | --- | --- |
| A1 | Schedule を **安全に** 編集できる（dry-run → gates → Save） | ⚠️ Partial | Slice/env-arm 依存；実用フロー未定義 |
| A2 | 編集後に **public HTML へ反映**できる | ⚠️ Partial | G-13e 実証済み；標準手順・最小 upload 判定が未整備 |
| A3 | 反映結果を **検証**できる | ✅ Pattern exists | HTTP verify + verifiers；運用テンプレ化が G-14c |
| A4 | 失敗時に **停止**できる | ✅ | Optimistic lock, allowlist, dry-run, single-arm |
| A5 | **PoC 文言が残っていない** | ⚠️ Partial | Event A clean；**Event B July 残存** |
| A6 | 管理 UI が **実用に耐える** | ⚠️ Partial | G-9k7 UI fixes；routine dev では Save disabled |
| A7 | Gosaki固有 / 汎用 Kit が **分離**されている | ⚠️ Partial | Overrides split；admin templates ほぼ gosaki 専用 |
| A8 | INSERT/DELETE（新規・取消） | ❌ | Phase 3+；forms disabled |
| A9 | Production cutover 安全設計 | ❌ | G-7f FTP 停止中；別フェーズ |

---

## 3. Gap inventory by theme

### 3.1 Gosaki-piano 固有 CMS として完成に必要なもの

| ID | Gap | Priority | Risk |
| --- | --- | --- | --- |
| G-P1 | **実用 Schedule 編集フロー**（picker → multi-field → Save → reflect） | **P0** | Low (plan) / Med (write) |
| G-P2 | **Public reflection 標準手順**（どのファイルを upload するか） | **P0** | Low |
| G-P3 | **Event B PoC cleanup**（July 公開カード） | **P1** | Med (write+upload) |
| G-P4 | **Online admin と local shell の役割・導線**の一本化 doc | **P1** | Low |
| G-P5 | YouTube 再編集の routine 手順（workflow + upload） | **P2** | Med |
| G-P6 | About bands/profile の online save 経路 | **P3** | Med–High |
| G-P7 | Discography CMS | **P4** | High (deferred G-9a) |
| G-P8 | Production `gosaki-piano.com` cutover | **P5** | **High** |

### 3.2 Schedule CMS 実用編集フローの残課題

| ID | Gap | Notes |
| --- | --- | --- |
| S1 | **Bundled safe-text Save**（1 Save = 複数 safe field） | G-9g3g pattern；新 approval ID |
| S2 | **Routine dev で Save 可能な compile gate** | 現状 `ready_but_save_disabled` が default |
| S3 | **Per-slice env arm 撤廃**への設計 | G-9g4a2 framework 活用；G-14b で定義 |
| S4 | **Row picker 運用**（任意行選択 → 編集） | G-9k Save button path；frozen PoC rows 混在 |
| S5 | **INSERT 新規イベント** | RLS / approval / month routing — defer |
| S6 | **DELETE / 非公開** | `published` flag — defer |
| S7 | **G-6-g3 price slice**（staging shell G-6 PoC row） | Sariswing track；Gosaki 実用とは別 |

**Frozen — do not re-click:** G-9k6, G-6-g1/g2, G-9g4a1, G-9g4a2a, G-13c1.

### 3.3 DB 更新後の public reflection 運用の残課題

| ID | Gap | Notes |
| --- | --- | --- |
| R1 | **最小 upload スコープ判定** | G-13e: schedule month HTML only；YouTube: `index.html` |
| R2 | **Regen コマンド標準化** | `build-gosaki-staging-admin-package.mjs` |
| R3 | **Post-Save checklist** | Preview → regen → diff → upload preflight → upload → HTTP verify |
| R4 | **CSS / `_astro/` 再 upload 条件** | schedule-only change → HTML only（G-13e 実績） |
| R5 | **FTP auto-apply 禁止の継続** | G-7f1；manual overwrite only |
| R6 | **workflow_dispatch 連携** | YouTube は Actions 済み；Schedule は **未連携**（意図的） |

### 3.4 Local staging shell と online admin の役割整理

| Surface | URL / origin | Role today | Write capability |
| --- | --- | --- | --- |
| **Local staging shell** | `localhost` + `/__admin-staging-shell/musician-basic/` | **Primary dev / operator test** | Schedule Edge Save；JSON modules via **dev-only** API routes |
| **Online staging admin** | `/cms-kit-staging/gosaki-piano/admin/` | **Browser-on-staging** (G-11b) | Auth + read UI；YouTube dry-run/save via Edge；Schedule write **same Edge** |
| **Production `/admin`** | Sariswing prod | **Out of scope** | Do not modify |

**Gap:** Operators must know **which surface to use**. Local shell has richer dev APIs; online admin is closer to client future but JSON writes need Edge/workflow (not local filesystem). **G-14d** should document UX parity and recommended default: **online admin for YouTube**; **either for Schedule** (both hit `admin-schedule` Edge).

### 3.5 Event B など残 PoC 文言の扱い

| Item | Value |
| --- | --- |
| Row | `aa440e29-5be8-402e-9190-0d81c48434c0` / `schedule-2026-07-010` |
| Public | `/schedule/2026-07/` — G-9g / `CMS Kit staging` markers visible |
| Track | **`G-13c2-gosaki-schedule-event-b-poc-cleanup-*`** (mirror G-13c1→G-13e) |
| Risk | Medium — proven pattern; separate approval ID |
| Blocker | None technical — chain template exists |

Event A March: **closed** — no re-upload.

### 3.6 YouTube URL CMS の完成度

| Item | Status |
| --- | --- |
| Staging public embed | ✅ `I-eY9YMq9GI` (G-11c15) |
| Save path | ✅ Edge dry-run + workflow JSON patch (G-11c10c) |
| Online admin wiring | ✅ G-11c6d |
| Re-save | **Frozen** — do not re-dispatch without new approval |
| **Remaining** | Operator routine doc；エラー時の停止手順；Schedule との reflection 手順の共通化 (G-14c) |
| DB `site_embeds` migration | **Deferred** (G-9a) — JSON-in-repo hybrid continues |

**Assessment:** YouTube is the **most complete non-Schedule module** for staging. Gap is **operational standardization**, not core save technology.

### 3.7 Schedule 以外の CMS 対象候補

| Module | MVP (G-9a) | Current | Recommendation |
| --- | --- | --- | --- |
| About Bands/Projects | Phase 3 defer | Static JSON + G-10h4d one-shot | Keep static until Schedule practical loop done |
| Discography | Later | Read-only admin | G-14+ or post-MVP |
| Contact / HubSpot | Later | Static convert hook | No CMS until form strategy fixed |
| News | Out of MVP | N/A | Skip |
| Link page | Low | Static | Skip |

### 3.8 汎用 Musician CMS Kit 一般化の残課題

| ID | Gap | Notes |
| --- | --- | --- |
| K1 | `templates/admin-cms/gosaki/` → `musician-basic/` 抽出 | G-14e |
| K2 | `site-specific-overrides/{slug}-overrides.mjs` パターン拡張 | G-8c baseline exists |
| K3 | `config/sites/{slug}.*.json` スキーマ統一 | YouTube / bands / discography |
| K4 | Per-site `site_slug` schedule seed tooling | G-9b pattern |
| K5 | Sariswing G-6 staging shell vs Gosaki operator UI 統合 | Long-term |
| K6 | Second customer onboarding (gosaki 以外) | Post-G-14e |

### 3.9 本番化・安全ゲート・手動/自動公開の整理

| Topic | Current | Target direction |
| --- | --- | --- |
| Staging FTP | Manual FileZilla only | Stay manual until G-7f1 re-approval + hardened preflight |
| Staging workflow | YouTube JSON workflow **exists** | Separate from prod `deploy.yml` |
| Prod `deploy.yml` | Sariswing production FTP | **Never** reuse for Gosaki staging |
| `readyForAnyFutureFtpApply` | **false** | G-14f design doc |
| `service_role` | Edge only | Never browser |
| Approval phrases | Per-slice documented | G-14c consolidates upload phrase |
| Production cutover | Not started | DNS + path + rollback — G-14f |

---

## 4. High-risk vs low-risk classification

### 4.1 Low-risk — proceed actively

| Work | Examples |
| --- | --- |
| Planning / docs | **G-14b**, **G-14c**, **G-14f** (design only) |
| Verifiers | Closure / preflight / HTTP read-only scripts |
| UI copy / layout (no Save) | G-14d dry-run UX, help text |
| Static analysis / grep audits | PoC marker scans |
| Local dry-run Preview | Operator manual; no DB write |
| Kit separation **planning** | G-14e inventory |

### 4.2 High-risk — explicit approval each time

| Work | Examples |
| --- | --- |
| DB write / Save | G-13c2 Event B, bundled Schedule Save |
| FTP / upload | Any `--apply`, mirror, remote delete |
| workflow_dispatch | Prod or staging deploy Actions |
| secrets / `.env` | `ADMIN_EMAILS`, FTP tokens |
| Production | `gosaki-piano.com`, Sariswing prod Supabase |
| RLS / GRANT changes | Out of slice scope |
| INSERT / DELETE | New schedule rows |

**Policy:** Low-risk work **does not block** on client feedback. High-risk work keeps per-slice preflight + operator approval form.

---

## 5. Next phase candidates — evaluation

| Phase | Purpose | Risk | Depends on | Recommend order |
| --- | --- | --- | --- | --- |
| **G-14b** | Schedule CMS **practical editing flow** definition (operator journey, gates, bundled save policy) | **Low** | G-13e lessons | **1 — next** |
| **G-14c** | **Public reflection** operation standardization (regen → minimal upload → verify playbook) | **Low** | G-13e, G-11c upload docs | **2** |
| **G-13c2** | **Event B** PoC cleanup (DB + July HTML upload) | **Medium** | G-14c playbook optional | **3** |
| **G-14d** | Gosaki admin **practical UI** hardening (online vs shell, help, dry-run clarity) | **Low–Med** | G-14b | **4** |
| **G-14e** | **Generic Kit** separation (template / config extraction) | **Low** (plan) | G-14b stable field set | **5** |
| **G-14f** | **Production / staging deploy** safety design | **Low** (plan) | G-14c | **6** (parallel ok) |

### 5.1 Explicitly NOT next dev phases

| Item | Reason |
| --- | --- |
| Client preview share / feedback collection | **Excluded** — business/operator track |
| G-12c-result client sign-off | Blocks nothing in CMS engineering |
| Production cutover execution | Requires G-14f + explicit approvals |
| FTP auto-apply resume | G-7f1 suspension |
| G-9k6 / G-13c1 re-Save | Frozen |

---

## 6. Recommended implementation sequence

```txt
Phase 1 (now — low risk, speed)
  G-14b  practical Schedule editing flow definition
  G-14c  public reflection operation standardization

Phase 2 (first gated writes after playbooks)
  G-13c2 Event B cleanup (reuse G-13 template)
  G-14b-impl  bundled safe-text Save slice (new approval ID)

Phase 3 (UX + kit)
  G-14d  admin practical UI hardening
  G-14e  generic Kit separation planning + incremental extract

Phase 4 (deploy / prod)
  G-14f  production/staging deploy safety design
  (later) production cutover execution — separate approval stack
```

**Rationale:** G-13 proved the technical chain but not the **product workflow**. Defining G-14b + G-14c first maximizes velocity on doc/verifier work while reducing risk on the next Save/upload. Event B cleanup (G-13c2) is the highest-value **visible** fix and reuses a proven template — schedule it after playbooks so upload scope is unambiguous.

---

## 7. Completion percentage (engineering estimate)

| Area | ~Complete | Notes |
| --- | --- | --- |
| Static Gosaki site | **90%** | Residual polish optional |
| Schedule read path | **95%** | G-12b verified |
| Schedule write + reflect loop | **55%** | PoC slices + one full loop |
| YouTube CMS | **80%** | Save frozen; ops doc gap |
| Online admin | **60%** | Read + YouTube; Schedule UX immature |
| Non-schedule CMS | **25%** | Static JSON dominant |
| Kit generalization | **35%** | Wix baseline only |
| Production readiness | **10%** | Design only |

**Gosaki CMS MVP (Schedule + YouTube practical): ~65%** toward operator-ready staging CMS.

---

## 8. Prohibited operations — not performed (this phase)

| Operation | Executed |
| --- | --- |
| FTP / upload | **no** |
| deploy / workflow_dispatch | **no** |
| Save / DB write / SQL | **no** |
| package regen | **no** |
| production | **no** |
| commit / push | **no** |

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g14a-gosaki-cms-completion-roadmap-gap-inventory.mjs
```

---

## 10. Reference index

| Topic | Doc |
| --- | --- |
| Event A closure | `gosaki-schedule-event-a-poc-cleanup-public-reflection-closure.md` |
| Phase 1/2 boundary | `gosaki-schedule-cms-phase-boundary-planning.md` |
| Prior inventory | `gosaki-completion-inventory-and-next-module-selection.md` |
| Online admin arch | `gosaki-staging-online-cms-architecture-planning.md` |
| CMS MVP scope | `gosaki-cms-scope-and-schedule-youtube-planning.md` |
| FTP safety | `ftp-deploy-root-delete-incident-and-safety-hardening.md` |
