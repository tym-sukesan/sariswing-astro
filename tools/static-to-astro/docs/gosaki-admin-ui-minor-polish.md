# G-20ui3 — Gosaki admin UI minor polish implementation

**Phase:** `G-20ui3-gosaki-admin-ui-minor-polish`  
**Status:** **complete** — copy / title polish only; **no Save / DB / deploy**  
**Date:** 2026-07-01  
**Base commit:** `8b4cf83`  
**Prior:** [gosaki-admin-ui-polish-local-visual-qa.md](./gosaki-admin-ui-polish-local-visual-qa.md) (G-20ui2-QA)

| Check | Status |
| --- | --- |
| Minor UI polish | **yes** |
| Save logic unchanged | **yes** |
| Save / DB write / package regen / FTP | **no** |

---

## Gates

```txt
gosakiAdminUiMinorPolishComplete: true
phase: G-20ui3-gosaki-admin-ui-minor-polish
saveBehaviorChanged: false
saveExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
cursorDbWriteExecuted: false
contactStubDeferred: true
discographyFieldLabelsDeferred: true
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state

| Item | Value |
| --- | --- |
| `HEAD` | `8b4cf83` |

---

## 2. Scope (from G-20ui2-QA non-blocking items)

| Item | Action |
| --- | --- |
| Shell `<title>` English mix | **fixed** — Japanese titles |
| About HTML 安全メモ 「dry-run」 | **fixed** → 「変更確認」 |
| Schedule/YouTube 「保存は準備中です」 notes | **fixed** — operator-friendly copy |
| Discography English field labels | **deferred** |
| Contact admin stub | **deferred** |
| Save button `更新する（準備中）` label | **unchanged** — enable logic unchanged; notes carry context |

---

## 3. Implementation

### Page titles (`AdminGosakiStagingShellLayout`)

| Before | After |
| --- | --- |
| `Schedule管理` | `スケジュール管理` |
| `Discography管理` | `ディスコグラフィー管理` |
| `About HTML` | `プロフィール管理` |

### aria-label (operator sections)

| Page | aria-label |
| --- | --- |
| Schedule | `スケジュール管理` |
| Discography | `ディスコグラフィー管理` |
| About | `プロフィール管理` |

### About — HTML 安全メモ

- `dry-run では` → `変更確認では`

### Schedule — save notes

- 新規追加: 「直接保存はまだ無効です。必要な場合は戸山が確認して反映します。」
- 複製・削除: 「現在利用できません。必要な場合は戸山にお知らせください。」

### YouTube — save notes

- 追加: 「動画の追加保存は現在戸山が確認して反映します（直接保存はまだ無効です）。」
- 並び順・削除: 「現在利用できません。必要な場合は戸山にお知らせください。」

### Home — dev details (collapsed)

- `dry-run JSON` → `変更確認の詳細 JSON`

---

## 4. Save behavior unchanged

- No changes to `staging-write/*` save adapters
- No changes to `updateSaveButtonState` / env arm / auth gates
- Button `disabled` attributes and `data-gosaki-save-allowed` unchanged
- Only Astro template copy and shell titles

---

## 5. Deferred

| Item | Phase |
| --- | --- |
| Discography form field labels (`legacy_id`, etc.) | future |
| Contact admin stub page | future |
| Read-only admin full Japanese pass | future |

---

## 6. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Save / DB write | **no** |
| Package regen / production build | **no** |
| FTP / upload | **no** |
| commit / push | **no** |

---

## 7. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20ui3-gosaki-admin-ui-minor-polish.mjs
```
