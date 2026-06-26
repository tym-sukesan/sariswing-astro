# G-13c — Gosaki schedule PoC visible text cleanup implementation prep

**Phase:** `G-13c-gosaki-schedule-poc-visible-text-cleanup-implementation-prep`  
**Status:** implementation prep / safety gate setup complete — **no DB write / Save in this phase**  
**Base commit:** `99f339c`  
**Prior:** G-13b preflight (`gosaki-schedule-poc-visible-text-cleanup-preflight.md`)  
**Type:** implementation prep only — guards, approval IDs, operator procedure separation; **no code registration yet**

## Summary

G-13b で特定した **2件** の公開 PoC / test 文言について、非 dry-run Save に進む前の実装準備と安全ゲートを整理しました。既存 Schedule CMS save 経路の適合性を評価し、**新規 approval_id**（行ごとに分割）と **実装フェーズ（G-13d）** の要件を定義しました。

**No DB write / Save / SQL / FTP / deploy / workflow_dispatch / secrets / commit in this phase.**

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: 99f339c
origin/main: 99f339c
branch: main...origin/main
```

---

## 2. Target events (reconfirmed from G-13b)

### Event A — G-9k6 UI save test markers (March)

| Item | Value |
|------|-------|
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/` |
| **Display date** | `2026.03.15 (Sun)` |
| **Card index** | 7 of 13 |
| **DB id** | `f687ebf3-407c-49d0-9ab8-58040c499b8e` |
| **legacy_id** | `schedule-2026-03-007` |
| **site_slug** | `gosaki-piano` |
| **PoC origin** | G-9k4b / G-9k6b–G-9k6f field slice Saves |
| **Picker status** | **Selectable** — no `[CMS Kit staging]` marker; not `G9G1_TARGET_ROW_ID` |

**Current public text (abridged):**

```txt
<Duo> [G-9k6 title UI保存テスト]
会場：川崎 ぴあにしも [G-9k6 venue UI保存テスト]
時間：開場 18:00 / 開演 19:00
料金：3,000円（G-9k6 price UI保存テスト）
出演：… （管理画面保存テスト / G-9k4 UI保存テスト）
```

### Event B — G-9g site_slug PoC markers (July pilot row)

| Item | Value |
|------|-------|
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/` |
| **Display date** | `2026.07.19 (Sun)` |
| **Card index** | 10 of 14 |
| **DB id** | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| **legacy_id** | `schedule-2026-07-010` |
| **site_slug** | `gosaki-piano` |
| **PoC origin** | G-9g2 / G-9g3b–G-9g3d / G-9g3g operational Saves |
| **Picker status** | **Excluded** — `G9G1_TARGET_ROW_ID` + `[CMS Kit staging]` marker |

**Current public text:**

```txt
[CMS Kit staging] G-9g2 title PoC
会場：[CMS Kit staging] G-9g3b venue PoC
時間：開場 [CMS Kit staging] G-9g3c open PoC / 開演 [CMS Kit staging] G-9g3c start PoC
料金：[CMS Kit staging] G-9g3d general edit price PoC
出演： [G-9g3b venue+description PoC]
```

---

## 3. Cleanup fields and expected values

### Event A (`f687ebf3…`) — Wix seed baseline

Source: `tools/static-to-astro/scripts/supabase/gosaki-schedules-seed.template.sql` (`schedule-2026-03-007`)

| Field | Cleanup action | Target value (proposed) |
|-------|----------------|-------------------------|
| `title` | Remove G-9k6 suffix | `<Duo>` |
| `venue` | Remove G-9k6 suffix | `川崎 ぴあにしも` |
| `open_time` | Restore Wix time | `15:00` |
| `start_time` | Restore Wix time | `15:30` |
| `price` | Remove test paren | `3,000円` |
| `description` | Remove test footer; restore Wix body | See below |

**description (seed exact):**

```txt
出演：長谷川薫vo 後藤沙紀pf
会場website: http://pubhpp.com/
```

**changedFields (expected bundle):** `title`, `venue`, `open_time`, `start_time`, `price`, `description` (6 fields)

### Event B (`aa440e29…`) — seed template baseline

Source: `gosaki-schedules-seed.template.sql` + `gosaki-schedule-2026-07-010-restore.template.sql`

| Field | Cleanup action | Target value (proposed) |
|-------|----------------|-------------------------|
| `title` | Remove PoC markers | `<>` |
| `venue` | Clear PoC string | `null` |
| `open_time` | Clear PoC string | `null` |
| `start_time` | Clear PoC string | `null` |
| `price` | Clear PoC string | `null` |
| `description` | Clear PoC marker | `出演：` |

**Client override:** G-12c-result feedback may replace Event B targets — defer Event B execution until confirmed if needed.

**changedFields (expected bundle):** all six safe text fields (nulls allowed except `title` non-empty)

---

## 4. Existing save path feasibility

### Code references

| Module | Relevance |
|--------|-----------|
| `gosaki-staging-schedule-operator-ui.ts` | G-9k existing-event UI — Preview + Save |
| `gosaki-schedule-existing-event-save-button-dry-run.ts` | Multi-field `changedFields` detection |
| `gosaki-schedule-existing-event-save-button-save.ts` | G-9k non-dry-run Save executor |
| `schedule-write-guards.ts` → `assertOperationalNotPocAuditRow` | **Blocks Event B** on G-9j/G-9k paths |
| `staging-schedule-site-slug-row-picker-utils.ts` | Picker excludes Event B |
| `staging-schedule-site-slug-operational-general-edit-*` | G-9g3g multi-field — picker path only |
| `staging-schedule-single-text-field-operational-*` | G-9g4a2 — 1 field per Save; Event B blocked |

### Path matrix

| Path | Event A | Event B | Notes |
|------|---------|---------|-------|
| **G-9k existing-event UI** | **Feasible** (after G-13d) | **Blocked** | Guards reject `aa440e29…` and `[CMS Kit staging]` rows |
| **G-9g3g operational general edit** | Technically selectable | **Blocked** | Frozen PoC approval — do not reuse `G-9g3g-…` |
| **G-9g4a2 single-text-field** | 6× sequential Saves possible | **Blocked** | Inefficient; frozen per-field approvals |
| **G-9g3g5 restore** | N/A | **Not applicable** | `description`-only restore; wrong marker contract |
| **Operator SQL** | Fallback only | Fallback only | `gosaki-schedule-2026-07-010-restore.template.sql` exists for Event B — **separate approval**, not Cursor execution |

### Conclusion

| Event | Execute via existing path today? | Recommended G-13d approach |
|-------|----------------------------------|----------------------------|
| **A** | **Dry-run Preview only** on G-9k UI (routine dev). **Non-dry-run Save requires G-13d** — cannot reuse `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` per G-9k6 closure | **G-13c1** slice: new approval + fixed-row guard (`f687ebf3…`) + 6-field bundle; wire to G-9k save executor pattern |
| **B** | **No** — operational guards block write | **G-13c2** slice: new approval + PoC audit row exception (fixed id `aa440e29…`) + 6-field cleanup guard; dedicated UI section or fixed-row panel |

**Single-arm policy (proposed):** `G13C1` and `G13C2` env arms must not both be `true`.

---

## 5. Approval ID / operation_id proposal

G-13b umbrella ID `G-13b-gosaki-schedule-poc-visible-text-cleanup` remains the **parent operation label**. Execution registers **per-row child IDs** in G-13d:

| Item | Proposed value |
|------|----------------|
| **operation_id (parent)** | `gosaki-schedule-poc-visible-text-cleanup` |
| **Event A approval_id** | `G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run` |
| **Event B approval_id** | `G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run` |
| **Event A env arm** | `PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED` |
| **Event B env arm** | `PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_ARMED` |
| **UI route** | `/__admin-staging-shell/musician-basic/#schedule` only |
| **Do not reuse** | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run`, G-9k6 slice IDs, G-9g2–G-9g3d, G-9g3g, G-6-g1/g2 frozen Saves |

### Non-dry-run approval phrase (per cleanup session)

```txt
承認します。このSchedule CMS非dry-run操作を1回だけ実行してください。
```

### Manual upload (after public rebuild — separate phase)

```txt
承認します。この手動アップロードを1回だけ実行してください。
```

---

## 6. Dry-run Preview checklist (operator — future)

**Routine dev (now):** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; all `*_NON_DRY_RUN_ARMED` off; `saveEnabled: false`.

### Event A — G-9k existing-event UI (pre-G-13d exploratory Preview)

Operator may use current G-9k panel **Preview only** to validate form → `changedFields` (no Save):

1. Open staging shell Schedule section; sign in to staging admin.
2. Select / load row `schedule-2026-03-007` (`2026-03-15`).
3. Enter cleanup target values (section 3 table).
4. Click **変更を確認** (Preview) — **not** 更新する.
5. Verify dry-run panel:
   - `dryRun: true`, `actualWrite: false`, `safety.supabaseWriteCalled: false`
   - `changedFields` = all 6 fields (or subset if partial form test)
   - `expectedBeforeUpdatedAt` present; `optimisticLockStale: false`
   - `saveReadiness` = `ready_but_save_disabled` (routine dev)
6. Confirm `before` / `after` snapshots match section 3 targets.
7. **Do not click Save** until G-13d implementation + final preflight + explicit approval.

### Event B — blocked until G-13c2 implementation

- G-9k Preview will fail guard: `PoC audit row is not writable`
- Operator must wait for G-13c2 dedicated panel / fixed-row exception

### Post-G-13d Preview (both events)

Same checklist on **G-13c1 / G-13c2** panels with armed env stack; still Preview before Save.

---

## 7. Operator non-dry-run procedure (separated — not this phase)

### Phase sequence (future)

```txt
G-13d-implementation     → register approval IDs, guards, UI, env arms
G-13d-final-preflight    → beforeSnapshot SELECT + rollback SQL per row
G-13d-execution-event-a  → operator Preview → gates → Save once (Event A)
G-13d-execution-event-b  → operator Preview → gates → Save once (Event B) OR defer
G-13e-public-reflection  → convert + manual-upload:package + operator FTP + HTTP verify
```

### G-13d-execution-event-a (operator only — document only)

1. Confirm Supabase project `static-to-astro-cms-staging` / host `kmjqppxjdnwwrtaeqjta`.
2. Run beforeSnapshot SELECT for `f687ebf3-407c-49d0-9ab8-58040c499b8e`; record `updated_at`.
3. Arm dev stack (inline env — **not** `.env` commit):
   - `ENABLE_ADMIN_STAGING_SHELL=true`
   - `ENABLE_ADMIN_STAGING_WRITE=true`
   - `PUBLIC_ADMIN_WRITE_DRY_RUN=false`
   - `PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED=true`
   - `PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_ARMED=false`
   - All other schedule `*_NON_DRY_RUN_ARMED` off
   - `PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run`
4. Restart dev; open `#schedule` G-13c1 panel.
5. Load Event A; enter section 3 target values.
6. **Preview** → verify `changedFields` (6) + optimistic lock baseline.
7. Post explicit approval phrase in chat/ticket.
8. **Save once** — operator manual click only.
9. Run afterVerification SELECT; compare to section 3.
10. Disarm: restore `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; all arms off.

### G-13d-execution-event-b (operator only — document only)

Same pattern with `G-13c2` approval / env arm / panel. **Defer** if G-12c client feedback pending.

### Post-cleanup public reflection (separate upload approval)

```bash
cd tools/static-to-astro
npm run convert -- --site gosaki-piano   # operator when ready
npm run build
npm run manual-upload:package
# Operator manual FTP to /cms-kit-staging/gosaki-piano/ — separate approval
```

Verify: March card 7 and July card 10 show no `G-9k6` / `CMS Kit staging` markers (G-12b HTTP pattern).

---

## 8. Rollback (documented — not executed)

Rollback SQL templates belong in **G-13d-final-preflight** per row. G-13c records G-13b public text as beforeSnapshot reference only.

Event B SQL fallback reference (operator-only, not CMS path): `scripts/supabase/gosaki-schedule-2026-07-010-restore.template.sql`

---

## 9. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiSchedulePocVisibleTextCleanupImplementationPrepComplete` | **true** |
| `gosakiSchedulePocVisibleTextCleanupPreflightComplete` | **true** (G-13b) |
| `readyForG13dPocCleanupImplementation` | **true** |
| `readyForAnyDbWrite` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorPreviewButtonClicked` | **false** |
| `cursorSqlExecuted` | **false** |
| `ftpUploadExecuted` | **false** |
| `workflowDispatchExecuted` | **false** |
| `productionTouched` | **false** |
| `commitExecutedInThisPhase` | **false** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13c-gosaki-schedule-poc-visible-text-cleanup-implementation-prep.mjs
```

---

## 11. Next

`G-13d-gosaki-schedule-poc-visible-text-cleanup-implementation` — register `G-13c1` / `G-13c2` approval IDs in `schedule-write-types.ts`, guards, env arms, UI sections; **no Save execution in implementation phase**.

---

## 12. References

- [gosaki-schedule-poc-visible-text-cleanup-preflight.md](./gosaki-schedule-poc-visible-text-cleanup-preflight.md) (G-13b)
- [gosaki-schedule-existing-event-field-slice-closure.md](./gosaki-schedule-existing-event-field-slice-closure.md) (Event A origin)
- [staging-shell-schedule-site-slug-general-edit-non-dry-run-execution-result.md](./staging-shell-schedule-site-slug-general-edit-non-dry-run-execution-result.md) (Event B origin)
- `src/lib/admin/staging-write/schedule-write-guards.ts` — `assertOperationalNotPocAuditRow`
- `scripts/supabase/gosaki-schedules-seed.template.sql` — target values
