# Gosaki schedule existing event save button enablement planning (G-9k)

**Phase:** `G-9k-gosaki-schedule-existing-event-save-button-enablement-planning`  
**Status:** **complete** (planning only — no Save enablement, no DB write, no implementation)  
**Date:** 2026-06-21  
**Prior:** G-9j5c success finalization — [gosaki-schedule-existing-event-update-success-finalization.md](./gosaki-schedule-existing-event-update-success-finalization.md)  
**Type:** planning / readiness only

| Check | Status |
| --- | --- |
| Save button enabled (operator UI) | **no** |
| Save UI implementation changed | **no** |
| DB write executed (this phase) | **no** |
| G-9j5 runner re-executed | **no** |
| SQL / migration executed | **no** |
| `/admin` modified | **no** |
| `service_role` used | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |

Prior docs:

- [gosaki-schedule-existing-event-save-enablement-planning.md](./gosaki-schedule-existing-event-save-enablement-planning.md) (G-9j)
- [gosaki-supabase-project-identity-safety-preflight.md](./gosaki-supabase-project-identity-safety-preflight.md) (G-9j4.5)

**Do not re-run G-9j5 runner.** **Do not reuse G-9j5 approval ID or env arm for G-9k.**

---

## Gates

```txt
gosakiScheduleExistingEventSaveButtonEnablementPlanningComplete: true
readyForG9k1SaveButtonGuardConfigImplementation: true
readyForG9k2OperatorUiWiringSaveDisabled: false
readyForG9k3ManualDryRunAuthGateVerification: false
readyForG9k4OneManualSaveFromUi: false
readyForG9k5SuccessFinalization: false
readyForAnyDbWrite: false
saveEnabledOnOperatorUi: false
cursorClickedSave: false
cursorClickedPreview: false
```

**Recommended next:** `G-9k1-gosaki-schedule-existing-event-save-button-guard-config-implementation`

---

## 1. Purpose

Enable the Gosaki **operator-facing** existing event edit form **「更新する」** button on:

`/__admin-staging-shell/musician-basic/admin/schedule/`

Scope: **existing row UPDATE only** — operator selects one event from the list, edits up to **six safe text fields**, dry-run confirms, then Save (when later phases arm and enable).

G-9j5 proved the write path (runner, fixed row, `description` only). G-9k generalizes to **operator UI** with the **same G-9j guard field set** — not “save anything.”

---

## 2. G-9j5 vs G-9k

| Item | G-9j5 (complete) | G-9k (planned) |
| --- | --- | --- |
| Entry | CLI runner `run-g9j5-…mjs` | Operator UI 「更新する」 |
| Row selection | Fixed `f687ebf3…` | Operator picks from list |
| Fields | `description` only | Up to 6 safe fields |
| Approval ID | `G-9j-gosaki-schedule-existing-event-update-non-dry-run` | **New** `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |
| Env arm | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED` | **New** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED` |
| Dry-run | G-9j2 「変更を確認」 | Same UI — required before Save |
| Auth | G-9j5b gate + session | Same — required |
| Write mechanics | `executeG9j5…` / locked UPDATE | Reuse `buildScheduleLockedWriteRequest` + `updateScheduleWrite` via G-9k save executor |

---

## 3. Save enablement — minimum unit

| Policy | Value |
| --- | --- |
| Operation | **UPDATE only** — 1 row per Save |
| `targetTable` | `public.schedules` |
| `site_slug` | `gosaki-piano` **required** |
| Allowed payload keys | `title`, `venue`, `open_time`, `start_time`, `price`, `description` only |
| `changedFields` | Subset of allowed keys only — must match payload keys exactly |
| No changes | Save **disabled** — dry-run shows “変更なし” |
| Empty `title` | Save **blocked** (guard + UI) |
| Optimistic lock | **Required** — `expectedBeforeUpdatedAt` from dry-run / before snapshot |
| `rowsAffected` | Must be **exactly 1**; 0 or >1 → **STOP** |
| Project | `static-to-astro-cms-staging` / ref `kmjqppxjdnwwrtaeqjta` only |
| Blocked ref | `vsbvndwuajjhnzpohghh` (`sari-site`) |
| Auth | Staging admin session (anon + `signInWithPassword`) — **required** |
| `service_role` | **Prohibited** |
| SQL Editor manual UPDATE | **Prohibited** for operators |

### Excluded (separate future phases)

```txt
INSERT (新規追加)
DELETE
DUPLICATE save
date / year / month mutation
published / show_on_home / home_order / sort_order
source_route / source_file
schedule_months writes
image upload
public rebuild / deploy / FTP
```

**`date` / `month` / `published` / `schedule_months` are explicitly out of G-9k** — even if visible in the edit form as read-only context.

---

## 4. Recommended UI flow

```txt
[Auth gate] operator logged in
↓
既存公演を一覧から選択（1件）
↓
6フィールドを編集（date は表示のみ・変更不可）
↓
「変更を確認」→ dry-run（DB変更なし）
↓
dry-run OK（changedFields ≥ 1, guards pass, lock baseline captured）
↓
「更新する」ボタンのみ有効化（G-9k2+; still off in G-9k planning）
↓
ユーザーが「更新する」を1回押す（G-9k4 manual phase only）
↓
直前再確認: auth session / project ref allowlist / live row / updated_at / site_slug
↓
1行 UPDATE（changedFields-only payload）
↓
post-save SELECT で before/after / updated_at 検証
↓
一覧・編集フォームを更新；dry-run 状態リセット
↓
「更新する」を再度 disabled（成功後は再クリック防止）
```

UI surface: `gosaki-staging-schedule-operator-ui.ts` + `AdminGosakiStagingScheduleOperatorPage.astro` behind `AdminGosakiStagingAuthGate`.

---

## 5. Approval ID / env arm (G-9k dedicated)

```txt
approvalId: G-9k-gosaki-schedule-existing-event-save-button-non-dry-run
envArm: PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED
```

Register in `schedule-write-types.ts` (implementation phase G-9k1).

**Single-arm policy:** when G-9k arm is ON, all other schedule non-dry-run arms (G-9j5, G-9g3g, G-6-g*, registry slices) must be **OFF**.

G-9k4 manual Save stack (document only — **do not arm in G-9k planning**):

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_AUTH=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9k-gosaki-schedule-existing-event-save-button-non-dry-run
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED=false
# all other schedule non-dry-run arms OFF
```

---

## 6. Safety guards (must hold for G-9k implementation)

| Guard | Mechanism |
| --- | --- |
| Staging project only | `evaluateStagingProjectAllowlist` + `assertStaticToAstroCmsStagingSupabaseProject` |
| Block sari-site | ref `vsbvndwuajjhnzpohghh` hard block |
| `site_slug` | `gosaki-piano` on before snapshot + UPDATE filter |
| Auth session | G-9j5b auth gate + `getStagingAuthSessionDetails` before Save |
| Explicit admin identity | Runner path: keep G-9j5 email guard pattern if CLI used; UI path: session email only |
| Payload | `assertG9jExistingEventUpdatePayloadOnly` + `assertG9jExistingEventUpdateChangedFieldsOnly` |
| Writable row | `assertG9jExistingEventUpdateWritableRow` (no PoC audit row) |
| Optimistic lock | `buildScheduleLockedWriteRequest` + stale check |
| changedFields-only | Payload keys === changedFields exactly |
| 1 row | `updateScheduleWrite` + post-save verify `rowsAffected === 1` |
| No service_role | anon client + authenticated session only |
| No SQL Editor | operator procedure — documented only |
| Post-save deploy | **Out of scope** — separate phase |

Reuse modules (implementation):

- `gosaki-schedule-existing-event-update-config.ts` — extend or fork for G-9k config
- `gosaki-schedule-existing-event-update-dry-run.ts`
- `gosaki-schedule-existing-event-update-save.ts` — **new G-9k executor** (not G-9j5 fixed-row save)
- `schedule-write-guards.ts` / `schedule-write-types.ts`

---

## 7. Failure handling

| Condition | UI / executor behavior |
| --- | --- |
| Auth session missing | Block Save; show login prompt via auth gate; no UPDATE |
| Project ref mismatch | STOP before UPDATE; show host/allowlist error |
| `updated_at` stale | dry-run or Save shows stale lock message; Save disabled until re-dry-run |
| No changedFields | dry-run “変更なし”; Save stays disabled |
| Guard error (forbidden key) | dry-run / Save error panel; no UPDATE |
| Supabase update error | Show safe error message; no partial UI success state |
| `rowsAffected === 0` | Treat as failure; do not mark success; suggest re-dry-run |
| `rowsAffected > 1` | **STOP** — incident; no retry without human review |
| Post-save verify fail | Show failure; retain before snapshot for rollback doc; do not enable re-Save without new dry-run |

---

## 8. Rollback policy (planning only — no execution)

G-9k allows multi-field UPDATE; rollback planning:

1. **Before snapshot** — capture full safe-field state + `updated_at` + `id` / `legacy_id` at dry-run OK and immediately before Save.
2. **After snapshot** — post-save SELECT; display before / after / `updated_at` in result panel.
3. **Rollback SQL** — document per Save in finalization doc (G-9k5); **not** auto-executed.
4. **Rollback UI** — defer to post-G-9k5 phase if needed; first priority is auditable before/after record.
5. **No automatic rollback** in G-9k4 first manual Save.

---

## 9. Phase breakdown (recommended)

| Phase | Scope | DB write |
| --- | --- | --- |
| **G-9k** | This planning doc + verifier | **no** |
| **G-9k1** | G-9k approval ID, env arm, config, guards extension, save executor skeleton; Save **disabled** | **no** |
| **G-9k2** | Wire operator UI: dry-run → enable Save button only when OK; Save still **disabled** by config flag | **no** |
| **G-9k3** | Operator manual dry-run + auth-gate verification on staging | **no** |
| **G-9k4** | One manual Save from UI — 1 row, allowed fields only; operator clicks once | **yes** (once) |
| **G-9k5** | Success finalization doc + verifier | **no** |

Optional insert **G-9k3.5** one-row preflight doc (live row reconfirm) before G-9k4 if operator wants G-9j4-style checklist.

---

## 10. Routine dev (until G-9k4 approval)

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=false
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED=false
saveEnabledOnOperatorUi: false
readyForAnyDbWrite: false
```

---

## 11. Completion statement

- G-9k save button enablement **planning complete**
- Operator UI 「更新する」 path designed on top of G-9j guards + G-9j5 proven write stack
- **No** Save enablement, implementation, DB write, or G-9j5 re-run in this phase
- **Next:** G-9k1 guard / config / verifier implementation
