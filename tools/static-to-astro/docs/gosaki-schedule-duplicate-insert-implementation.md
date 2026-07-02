# G-22d1 — Gosaki Schedule duplicate INSERT implementation

**Phase:** `G-22d1-gosaki-schedule-duplicate-insert-implementation`  
**Status:** **complete** — adapter / guards / UI gate only; **no Save / DB write**  
**Date:** 2026-07-02  
**Base commit:** `8d0f541`  
**Prior:** [gosaki-schedule-duplicate-insert-planning.md](./gosaki-schedule-duplicate-insert-planning.md) (G-22d)

| Check | Status |
| --- | --- |
| INSERT adapter implemented | **yes** |
| Guards / config implemented | **yes** |
| UI Save gate wired | **yes** |
| Default Save disabled | **yes** |
| Save / INSERT executed | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleDuplicateInsertImplementationComplete: true
phase: G-22d1-gosaki-schedule-duplicate-insert-implementation
readyForG22d2DuplicateInsertFinalPreflight: true
readyForG22d3DuplicateInsertOperatorExecution: false
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**approvalId:** `G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice`  
**env arm:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED` (default **false**)

---

## 1. Implementation summary

G-22b duplicate dry-run UI に、G-22d planning で設計した **non-dry-run INSERT** 経路を追加。UPDATE adapter とは分離。

| Layer | Module |
| --- | --- |
| Config / env arm | `gosaki-schedule-duplicate-insert-config.ts` |
| Guards / payload | `gosaki-schedule-duplicate-insert-guards.ts` |
| INSERT adapter | `schedule-insert-write-adapter.ts` (`insertScheduleWrite`) |
| Save orchestration | `gosaki-schedule-duplicate-insert-save.ts` (`executeG22dScheduleDuplicateInsertSave`) |
| UI gate | `gosaki-staging-schedule-operator-ui.ts` |

G-22b dry-run (`executeG22bScheduleDuplicateDryRun`) は **変更なし**（`actualWrite=false`, `saveAllowed=false`）。

---

## 2. Single-slice target (G-22d3 execution)

| Field | Value |
| --- | --- |
| `sourceId` | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| `sourceLegacyId` | `schedule-2026-03-003` |
| `sourceTitle` | `<Live & Session>` |
| `plannedLegacyId` | `schedule-2026-03-014` |
| `plannedTitle` | `<Live & Session>（コピー）` |
| `sort_order` | `140` |
| `site_slug` | `gosaki-piano` |
| `published` | `false` |

---

## 3. Save enable guards (all required)

1. `editDraftMode === "duplicate"`
2. `ENABLE_ADMIN_STAGING_SHELL=true`
3. `ENABLE_ADMIN_STAGING_WRITE=true`
4. `PUBLIC_ADMIN_WRITE_DRY_RUN=false`
5. `PUBLIC_ADMIN_WRITE_PROVIDER=supabase`
6. `PUBLIC_ADMIN_WRITE_MODULE=schedule`
7. `PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice`
8. `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=true`
9. Other schedule non-dry-run arms **off** (G-9k, G-6-g*, G-13c*, etc.)
10. Staging host allowlist (`kmjqppxjdnwwrtaeqjta`)
11. `sourceId` / `sourceLegacyId` / `site_slug` fixed match
12. Duplicate dry-run preview `ok`
13. Signed-in staging admin session

**Routine dev (default env):** guards FAIL → Save **disabled** → no DB write.

---

## 4. UI behaviour

| Action | Default env |
| --- | --- |
| 複製案を作成 | **enabled** |
| 変更を確認 | **enabled** (G-22b dry-run) |
| 複製案を保存 | **disabled** — label `複製案を保存（現在は無効）` |
| 更新する (existing mode) | unchanged G-9k gates |
| 新規追加 / 削除 | **disabled** |

Developer `<details>` shows: insert `approvalId`, fixed `sourceId`, `plannedLegacyId`, env arm status, `saveEnabled`.

---

## 5. INSERT adapter

- File: `schedule-insert-write-adapter.ts`
- Operation: `duplicate-insert`
- Table: `public.schedules`
- Method: `.insert(payload).select("*").single()`
- Does **not** touch `schedule-write-adapter.ts` (UPDATE-only)
- Payload omits `id`, `created_at`, `updated_at`

---

## 6. Rollback

See [gosaki-schedule-duplicate-insert-planning.md](./gosaki-schedule-duplicate-insert-planning.md) §8.  
`rollbackHint` returned on successful INSERT path references `DELETE BY id`.

---

## 7. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Save click | **no** |
| DB INSERT | **no** |
| package regen / FTP | **no** |
| Sariswing production ref | **no** |

---

## 8. Next phases

| Phase | Scope |
| --- | --- |
| **G-22d2** | final preflight — before SELECT, payload lock, rollback SQL (no execution) |
| **G-22d3** | operator single INSERT execution — manual Save once |
| **G-22h** | public reflection after publish (deferred) |

---

## 9. Fix required?

**No.** Ready for G-22d2 final preflight.
