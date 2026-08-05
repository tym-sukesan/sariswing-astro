# CMS Core v2 — Schedule TBD CREATE oneshot auth-before-preflight fix

- **Phase:** `cms-core-v2-schedule-tbd-create-oneshot-auth-before-preflight-fix`
- **Prior:** `cms-core-v2-schedule-tbd-create-oneshot-preflight-auth-visibility-diagnosis`
- **Date:** 2026-08-05
- **HEAD at fix start:** `050789d12a995d4f4e6d056bddf2660e9f6d129c`
- **Status:** **COMPLETE (offline code + verifier)** · process not started · arms OFF · no Save · no SQL · no DB write · no commit/push

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_AUTH_BEFORE_PREFLIGHT_FIX_COMPLETE: true
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
EXPECTED_TOTAL_UNCHANGED_79: true
```

**Staging only:** `kmjqppxjdnwwrtaeqjta`

**Production STOP:** `vsbvndwuajjhnzpohghh`

---

## 1. Failure record (second single-click)

| Item | Value |
| --- | --- |
| Action | one-shot CREATE を **2回目**（query-builder fix 後）クリック |
| UI stop | runtime preflight **failed** |
| Message | `total schedules drift (expected 79, got 74)` |
| 74 meaning | **published** count · matches `schedules_public_select` (anon/public visibility) |
| Root cause | auth/session（owner `is_admin`）確定 **前** に preflight count を実行 |
| INSERT | **未実行** |
| Exact SELECT | `NOT_INSERTED` |
| DB baseline | total **79** · published **74** · TBD **0** · target **0** |
| Cleanup | **不要** |
| Retry | **READY_FOR_RETRY: false** until this fix committed + new arm-gate |

---

## 2. Call order (after fix)

```txt
guards / fingerprint
→ staging host/ref + fixed payload
→ getAuth / session
→ signed-in required
→ rpc('is_admin') on shared getStagingSupabaseClient
→ preflight counts (same shared client)
→ INSERT max 1 (same shared client)
```

Auth / non-admin failure → `terminal=failed` · message includes `INSERTは実行されていません` · preflight query **not sent**.

Ambiguous only after INSERT request issued.

Expected total remains **79** (never lower to 74).

---

## 3. Owner/admin check

- Existing DB path: `client.rpc('is_admin')` (same as schedule Edge dry-run / admin_users)
- No service_role · no RLS bypass · no Edge/schema/migration change
- Confirmed Save / admin read paths **unchanged**

---

## 4. Next

1. Commit when operator requests (`fix(cms): authenticate TBD oneshot before preflight`).
2. Do not re-click CREATE until new arm-gate + explicit approval.
