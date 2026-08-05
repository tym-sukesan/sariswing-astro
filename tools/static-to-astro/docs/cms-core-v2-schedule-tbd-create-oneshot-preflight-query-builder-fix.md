# CMS Core v2 — Schedule TBD CREATE oneshot preflight query-builder fix

- **Phase:** `cms-core-v2-schedule-tbd-create-oneshot-preflight-query-builder-fix`
- **Prior diagnosis:** `cms-core-v2-schedule-tbd-create-oneshot-preflight-unknown-diagnosis`
- **Date:** 2026-08-05
- **HEAD at fix start:** `96d9b5c9381a391593bcbc216158cff7a19550c3`
- **Status:** **COMPLETE (offline code + verifier)** · process not started · arms OFF · no Save · no SQL · no DB write · no commit/push

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_PREFLIGHT_QUERY_BUILDER_FIX_COMPLETE: true
ROOT_CAUSE_CONFIRMED: true
IMPLEMENTATION_READY: true
COMMIT_READY: true
READY_FOR_RETRY: false
ACTUAL_WRITE_READY: false
ACTUAL_WRITE_EXECUTED: false
ARMS_OFF: true
ENV_CHANGED: false
ENV_FILE_UNCHANGED: true
DB_WRITE_EXECUTED: false
SAVE_EXECUTED: false
CLEANUP_NEEDED: false
CLEANUP_EXECUTED: false
EDGE_CHANGED: false
PACKAGE_REGENERATED: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
FIXED_LEGACY_ID_UNCHANGED: true
FIXED_APPROVAL_UNCHANGED: true
FIXED_PAYLOAD_UNCHANGED: true
```

**Staging only:** `kmjqppxjdnwwrtaeqjta`

**Production STOP:** `vsbvndwuajjhnzpohghh`

---

## 1. Failure record (human one-shot click)

| Item | Value |
| --- | --- |
| Action | one-shot CREATE を **1回** クリック |
| UI stop | 「結果が不明です…」+「Preflight SELECT 結果が不明です」 |
| Runtime | preflight で停止（INSERT 未到達） |
| Root cause | `countTargetLegacyId` が中間 `.eq()` を `await` → response に対し二度目の `.eq()` → `TypeError` → 広い catch が `preflight_ambiguous` |
| INSERT | **未到達** |
| Cleanup | **不要** |
| Retry | **禁止**（本 fix 反映 + 新 arm-gate / 明示承認まで `READY_FOR_RETRY=false`） |

### Exact SELECT (post-click)

| Metric | Value |
| --- | --- |
| outcome | `NOT_INSERTED` |
| schedules_total | 79 |
| published | 74 |
| gosaki | 79 |
| mio | 0 |
| tbd | 0 |
| target (`schedule-2026-11-001`) | 0 |
| contract violations | 0 |

Baseline 不変 · INSERT 0 · cleanup 不要。

### Fixed contract (unchanged)

| Field | Value |
| --- | --- |
| site_slug | `gosaki-piano` |
| legacy_id | `schedule-2026-11-001` |
| title | `【CMS Kit staging】TBD create oneshot PoC` |
| approval | `cms-core-v2-schedule-tbd-create-non-dry-run-oneshot` |

---

## 2. Code fix

### 2.1 PostgREST filter chain

`defaultPreflightClient.countTargetLegacyId` — filter chain 完成後に **1回だけ** await:

```ts
const { count, error } = await client
  .from("schedules")
  .select("id", { count: "exact", head: true })
  .eq("site_slug", STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG)
  .eq("legacy_id", TBD_CREATE_ONESHOT_LEGACY_ID);
```

禁止（修正済み）: 中間 `.eq()` の await / response への追加 `.eq()`。

### 2.2 failed vs ambiguous

| Phase | `insertAttempted` | terminal | errorCode (example) |
| --- | --- | --- | --- |
| Preflight / auth / guards（INSERT request 前） | false | `failed` | `preflight_client_failed` · message includes `INSERTは実行されていません` |
| INSERT request 発行後で結果不明 | true | `ambiguous` | `insert_ambiguous` · exact SELECT |

Both `failed` and `ambiguous` leave terminal ≠ `idle` → 同一セッション再クリック不可。INSERT 最大 1 回維持。

同種の中間-builder await は `src/lib/admin/staging-write` 内で **本関数のみ**（他経路は変更なし）。

---

## 3. Offline verification

- `verify:cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation` — thenable chain · baseline · target error → failed · TypeError → failed · INSERT timeout → ambiguous · target count>0 fail-closed · static no intermediate await
- final-preflight / write-stack / Safety Suite — see commit staging notes
- No live Supabase · INSERT mock only · DB write 0

---

## 4. Next

1. Commit when operator requests (`fix(cms): chain TBD oneshot preflight filters before await`).
2. **Do not** re-click CREATE until new arm-gate + explicit approval (`READY_FOR_RETRY=false`).
3. Next Primary remains execution-arm-gate after this fix is committed and process packet re-validated.
