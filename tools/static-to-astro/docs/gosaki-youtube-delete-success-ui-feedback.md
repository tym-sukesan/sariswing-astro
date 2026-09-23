# Gosaki YouTube delete success UI feedback

- **Phase:** `gosaki-youtube-delete-success-ui-feedback`
- **Date:** 2026-09-24
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **Status:** **LOCAL PASS** · no DB write · no Edge/RLS/arm change · no package rebuild · no commit

Operator premise: Edge DELETE already succeeded in production; the row leaves the list immediately; 「削除しました」 was not visible.

---

## 0. Gates

```txt
YOUTUBE_DELETE_SUCCESS_UI_FEEDBACK_RESULT: PASS
DELETE_LOGIC_CHANGED: false
RLS_CHANGED: false
EDGE_CHANGED: false
SAVE_ARM_CHANGED: false
OTHER_MODULES_CHANGED: false
DB_WRITE: false
DEPLOY: false
FTP: false
COMMIT: false
PACKAGE_REBUILD_REQUIRED_FOR_CUSTOMER_UI: true
PACKAGE_REBUILT_THIS_PHASE: false
```

---

## 1. Root cause

Save success sets `saveSuccessSticky` and paints both:

- header `[data-gosaki-youtube-status]`
- save-card `[data-gosaki-youtube-multi-save-reason]` via `applySaveButtonUi`

Delete previously wrote 「削除しました」 on the header only, then `applyDeletedItemLocally` + `refreshSaveGate` + live-read `ready` overwrote it with 「変更がありません」 / 「動画の確認と編集ができます」.

---

## 2. Implementation

Reuse the Save success display (same nodes, same `applySaveButtonUi`):

| Piece | Behavior |
| --- | --- |
| Const | `GOSAKI_DELETE_SUCCESS_USER_MESSAGE = "削除しました"` in `gosaki-staging-one-click-save.ts` |
| Latch | `deleteSuccessSticky` in YouTube multi UI only |
| Edge `ok && didWrite` | header + save-card both 「削除しました」 |
| `refreshSaveGate` when clean | keep delete (or save) sticky; do not fall back to 「変更がありません」 |
| live-read `ready` | do not overwrite header while sticky |
| Edit / dry-run invalidate | clear sticky |
| Failure | existing 「削除に失敗しました」 / not-armed / timeout copy unchanged |
| Local-only unsaved add cancel | still 「未保存の追加を取り消しました」 (not Edge) |

Delete POST body, Edge handler, RLS, Save arm, Schedule / Discography / About: **unchanged**.

---

## 3. Customer visibility

Admin JS is baked into the production package. This source change is **not** live until a later production generate + FileZilla of `/admin/`.

---

## 4. Not done this phase

- package rebuild
- FileZilla / FTP `--apply`
- Edge deploy / Secret / RLS
- DB write
- commit / push
