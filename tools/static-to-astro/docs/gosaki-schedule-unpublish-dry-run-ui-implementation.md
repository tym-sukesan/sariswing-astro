# G-22f — Gosaki Schedule unpublish dry-run UI implementation

**Phase:** `G-22f-gosaki-schedule-unpublish-dry-run-ui-implementation`  
**Status:** **complete** — unpublish draft mode + dry-run preview wired; **no Save / DB write**  
**Date:** 2026-07-05  
**Base commit:** `215f638`  
**Prior:** [gosaki-schedule-new-event-insert-chain-closure.md](./gosaki-schedule-new-event-insert-chain-closure.md) (G-22e7)

| Check | Status |
| --- | --- |
| Unpublish dry-run module | **yes** |
| Unpublish draft UI wired | **yes** |
| Save / UPDATE enabled | **no** |
| Physical DELETE | **not implemented** (disabled) |
| DB write / SQL mutation | **no** |
| GRANT / REVOKE | **no** |
| package regen / FTP | **no** |

---

## Gates

```txt
gosakiScheduleUnpublishDryRunUiImplementationComplete: true
phase: G-22f-gosaki-schedule-unpublish-dry-run-ui-implementation
readyForG22f1ScheduleUnpublishDryRunLocalQa: true
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
grantRevokeExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
physicalDeleteImplemented: false
```

**Supabase:** `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`) only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Why unpublish before physical DELETE

| Reason | Detail |
| --- | --- |
| Safety | `published=false` removes public visibility without row loss |
| Permissions | `authenticated DELETE` grant not confirmed; unpublish reuses existing UPDATE path (future slice) |
| Staging test rows | `schedule-2026-03-014` / `schedule-2026-09-001` already `published=false` — safe from accidental unpublish |
| Pattern | Same single-slice approach as G-9k UPDATE / G-22d INSERT / G-22e INSERT |

Physical DELETE deferred to a **separate future phase** after unpublish slice is proven.

---

## 2. Implementation summary

| Item | Location |
| --- | --- |
| Dry-run module | `src/lib/admin/staging-write/gosaki-schedule-unpublish-dry-run.ts` |
| Adapter | `buildScheduleUnpublishDryRunResult()` in `schedule-dry-run-adapter.ts` |
| Operation type | `ScheduleDryRunOperation` += `"unpublish"` |
| Draft mode type | `GosakiScheduleEditDraftMode` += `"unpublish"` |
| Operator UI | `gosaki-staging-schedule-operator-ui.ts` |
| Template | `AdminGosakiStagingScheduleOperatorPage.astro` |
| Styles | `admin.css` (unpublish banner + dry-run accent) |

### UI controls

| Control | Behavior |
| --- | --- |
| **非公開化案を作成** | Creates unpublish draft from selected `published=true` row |
| **削除（準備中）** | Physical DELETE — **disabled** |
| **変更を確認** | Runs `executeG22fScheduleUnpublishDryRun()` in unpublish mode |
| **更新する / 保存** | **disabled** in unpublish mode |

---

## 3. Unpublish draft mode

```txt
editDraftMode: "unpublish"
unpublishDraftState: { targetId, targetLegacyId, source }
unpublishTargetSnapshot: ScheduleRecord (read-only source)
```

- Form fields **read-only** (`setEditFormFieldsReadOnly(true)`)
- Banner: **非公開化案** / まだ保存されていません / 公開サイトから外す予定 / データベースからは削除しません / 保存は現在無効
- Mutually exclusive with `new` / `duplicate` / `existing` edit flows (confirm on switch)

---

## 4. Target eligibility

| Condition | Result |
| --- | --- |
| No selected row | Button disabled — 「先に一覧から公演を選んでください」 |
| `published !== true` | Button disabled — 「このイベントはすでに非公開です」 |
| `site_slug !== gosaki-piano` | Dry-run error |
| Missing `id` or `legacy_id` | Dry-run error |
| `published === true` | Unpublish draft + dry-run allowed |

**Test rows (non-target for unpublish dry-run):**
- `schedule-2026-03-014` — `published=false`
- `schedule-2026-09-001` — `published=false`

---

## 5. Dry-run preview specification

```txt
operation: unpublish
dryRun: true
actualWrite: false
wouldUpdate: true (when validation ok)
wouldDelete: false
saveAllowed: false
physicalDelete: false
before.published: true
after.published: false
site_slug: gosaki-piano
payload: { published: false }
```

approvalId (dry-run): `G-22f-gosaki-schedule-unpublish-dry-run`

---

## 6. Save / DB write — not implemented

- `runEditSave()` unpublish branch: alert only — **no write**
- No unpublish UPDATE adapter / env arm / approval ID for non-dry-run
- No Supabase `.update()` / `.delete()` in G-22f code path

---

## 7. Physical DELETE — not implemented

- `#gosaki-schedule-delete-btn` remains **disabled** with label「削除（準備中）」
- `physicalDelete: false` in dry-run result safety
- No DELETE grant work in G-22f

---

## 8. Regression — existing modes preserved

| Mode | Status |
| --- | --- |
| G-9k existing UPDATE dry-run / Save gate | **unchanged** |
| G-22d duplicate dry-run / INSERT gate | **unchanged** |
| G-22e new event dry-run / INSERT gate | **unchanged** |
| Closed test rows | **not modified** (no write code paths) |

---

## 9. Next phases

| Phase | Scope |
| --- | --- |
| **G-22f1** | Local QA (dry-run safe env) |
| **G-22f2** | Unpublish UPDATE planning |
| **G-22f3** | Implementation only (Save path, disabled by default) |
| **G-22f4** | Final preflight |
| **G-22f5** | Operator single unpublish execution |
| **G-22f6** | Result record |
| **G-22f7** | Unpublish chain closure |
| **Future** | Physical DELETE — separate phase after unpublish proven |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22f-gosaki-schedule-unpublish-dry-run-ui-implementation.mjs
```

---

## 11. Fix required?

**No.** G-22f dry-run UI implementation complete. Proceed to G-22f1 local QA when ready.
