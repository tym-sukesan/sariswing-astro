# G-22g1c — Gosaki Schedule UX improvement: save preview / target confirmation panel

**Phase:** `G-22g1c-gosaki-schedule-save-preview-target-confirmation`  
**Status:** **complete** — UI display only; **no DB write**  
**Date:** 2026-07-07  
**Base commit:** `9c6d514`  
**Prior:** [gosaki-schedule-dev-mock-section-isolation.md](./gosaki-schedule-dev-mock-section-isolation.md) (G-22g1b)

| Check | Status |
| --- | --- |
| Pre-save confirmation panel strengthened | **yes** |
| Save-button target identity visible | **yes** |
| Save result labels distinguish before/after | **yes** |
| G-22f5 confusion addressed | **yes** |
| Save / DB write / FTP | **no** |

---

## Gates

```txt
gosakiScheduleSavePreviewTargetConfirmationComplete: true
phase: G-22g1c-gosaki-schedule-save-preview-target-confirmation
readyForG22g2OperatorProcedureHints: true
readyForScheduleP0UxQa: true
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
writeArmedDevServerStarted: false
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

G-22f5 exposed operator confusion about **which row** is being edited and **which button** to press. G-22g1c strengthens the pre-save confirmation panel and save-button context so operators always see target identity, operation kind, safety flags, and workflow step before Save.

---

## 2. 保存前確認パネルの改善（Pre-save confirmation panel）

All four dry-run preview paths now render a unified confirmation block:

| Operation | Label | Preview title |
| --- | --- | --- |
| Existing UPDATE | 既存公演を更新 | 確認結果（保存前 preview） |
| Duplicate INSERT | 複製して新規下書きを作成 | 複製案の確認結果（保存前 preview） |
| New event INSERT | 新規公演を追加 | 新規追加案の確認結果（保存前 preview） |
| Unpublish UPDATE | 公演を非公開にする | 非公開化案の確認結果（保存前 preview） |

Each preview shows:

- `operation` (kind code + Japanese label)
- `target legacy_id` / `target id` / `date` / `title`
- `published before` / `published after` (when applicable)
- `updated_at` / `expectedBeforeUpdatedAt` (when available)
- `actualWrite=false` badge —「保存前 preview — actualWrite=false」
- `wouldUpdate` / `wouldInsert` / `wouldDelete` / `physicalDelete`
- `saveAllowed` / `saveEnabled` / `approvalId`
-「行は削除しません（physical DELETE ではありません）」when not physical DELETE

Helpers in `gosaki-staging-schedule-operator-ui.ts`:

- `renderPreviewBadge()` / `renderSaveResultBadge()`
- `renderOperationKindHeader()` / `renderOperationSpecificNote()`
- `renderTargetIdentitySection()` / `renderPreviewSafetySection()`
- `renderWorkflowStepIndicator()` / `resolveWorkflowStep()`

---

## 3. Save-button target identity (near Save)

`#gosaki-schedule-save-target-panel` (Astro) is populated by `updateSaveTargetPanel()` on init, row select, draft mode change, and dry-run result render.

| Mode | Panel content |
| --- | --- |
| Existing UPDATE | legacy_id · id · date · title · published · workflow steps |
| Duplicate | source legacy_id ·「元の公演は変更しません」note in preview |
| New event | draft legacy label · date · title · unpublished note |
| Unpublish | legacy_id ·「この公演を非公開にします」·「データベースからは削除しません」 |

Panel sits between `#gosaki-schedule-edit-save-result` and `.gosaki-schedule-admin-edit-actions`.

---

## 4. Save result label improvements

G-22f5: `expectedBeforeUpdatedAt` appeared similar to `updated_at_after`, causing optimistic-lock confusion.

**Display-only change** — save logic unchanged:

| Old (ambiguous) | New label |
| --- | --- |
| `updated_at` (before) | **保存前 updated_at（before updated_at）** |
| `updated_at` (after) | **保存後 updated_at（saved updated_at）** |
| `expectedBeforeUpdatedAt` | **optimistic lock 基準（expectedBeforeUpdatedAt）** |

`renderOptimisticLockExplanation()` adds a note that before and after `updated_at` normally differ after Save.

Save result screens use `renderSaveResultBadge()` —「保存結果 — DB への反映結果です（保存前 preview ではありません）」.

---

## 5. G-22f UX lessons addressed

| G-22f lesson | G-22g1c response |
| --- | --- |
| Which row am I editing? | legacy_id + id + date + title in list summary, save panel, and preview |
| Which button to press? | Workflow step indicator (e.g. 非公開化案を作成 → 変更を確認 → 非公開化を保存) |
| Mock vs operator UI | G-22g1b isolation (unchanged) |
| Preview vs save result | Distinct badges and section titles |
| expectedBeforeUpdatedAt confusion | Renamed labels + optimistic lock explanation |

---

## 6. Workflow steps (per operation)

| Operation | Step 1 | Step 2 | Step 3 |
| --- | --- | --- | --- |
| Unpublish | 非公開化案を作成 | 変更を確認 | 非公開化を保存 |
| Duplicate | 複製案を作成 | 変更を確認 | 複製を保存 |
| New event | 新規案を作成 | 変更を確認 | 新規を保存 |
| Existing UPDATE | 行を選択 | 変更を確認 | 更新を保存 |

Current step highlighted via `.gosaki-schedule-workflow-steps__item--current`.

---

## 7. Files changed

| File | Change |
| --- | --- |
| `src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts` | Preview/save helpers, dry-run + save result renderers, `updateSaveTargetPanel()` |
| `tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro` | `#gosaki-schedule-save-target-panel` |
| `tools/static-to-astro/templates/admin-cms/styles/admin.css` | Confirmation panel, workflow steps, badges |
| `tools/static-to-astro/docs/gosaki-schedule-save-preview-target-confirmation.md` | This doc |
| `tools/static-to-astro/scripts/verify-g22g1c-gosaki-schedule-save-preview-target-confirmation.mjs` | Local verifier |
| AI context files | Updated |

**Unchanged (verifier asserts):** save modules, `staging-write-approval-ids.ts`, `schedule-write-adapter.ts`.

---

## 8. Safety confirmation

| Item | Status |
| --- | --- |
| Save clicked by Cursor | **no** |
| DB write | **no** |
| SQL INSERT / UPDATE / DELETE / UPSERT | **no** |
| Rollback SQL | **no** |
| GRANT / REVOKE | **no** |
| Package regen | **no** |
| FTP / upload / workflow_dispatch | **no** |
| Write-armed dev server | **not started** |
| Sariswing production ref | **not used** |

---

## 9. Verification

```bash
node tools/static-to-astro/scripts/verify-g22g1c-gosaki-schedule-save-preview-target-confirmation.mjs
```

---

## 10. Next

- **G-22g2** — operator procedure hints (step-by-step copy in UI or doc)
- **Schedule P0 UX QA** — operator spot-check with dry-run dev (`PUBLIC_ADMIN_WRITE_DRY_RUN=true`, all arms off)
