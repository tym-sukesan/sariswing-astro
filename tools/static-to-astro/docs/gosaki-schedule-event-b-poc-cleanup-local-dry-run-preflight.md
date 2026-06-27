# G-13c2d2 — Gosaki Event B PoC cleanup local dry-run Preview preflight

**Phase:** `G-13c2d2-gosaki-schedule-event-b-poc-cleanup-local-dry-run-preflight`  
**Status:** preflight complete — **no Preview / Save / DB write in this phase**  
**Base commit:** `9d64379`  
**Prior:** G-13c2d1 slice implementation (`gosaki-schedule-event-b-poc-cleanup-slice-implementation.md`)  
**Type:** operator procedure — local dry-run Preview only

## Summary

G-13c2d1 で実装済みの **G-13c2 Event B cleanup** パネルについて、operator（戸山）が local dev で **dry-run Preview のみ** を実行する前の確認事項と手順を整理します。

**Save compile gate は OFF のまま**（routine dev 安全）。Preview 成功時の `saveReadiness` は原則 `ready_but_save_disabled` を期待します。

**No Preview / Save / DB write / SQL / FTP / package regen / commit in this phase.**

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: 9d64379
origin/main: 9d64379
branch: main...origin/main
```

---

## 2. Implementation state (G-13c2d1 — confirmed)

| Check | Status |
|-------|--------|
| G-13c2d1 slice implementation | **complete** (`9d64379`) |
| G-13c2d1 verifier | **75/75 PASS** |
| Event B modules | config / guards / dry-run / save / page-config / target-resolve / UI |
| Astro G-13c2 panel | `AdminGosakiStagingScheduleOperatorPage.astro` |
| Event A (`f687ebf3…`) | **unchanged** |
| March staging HTML | **not touched** |
| `src/pages/admin` | **no diff** |

---

## 3. Staging project confirmation

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/admin/schedule/
UI section: G-13c2 Event B PoC cleanup panel
/admin (Sariswing production): not used
service_role: not used
schedule_months: read-only / derived (not touched)
```

Abort if project is not `static-to-astro-cms-staging` or production admin is open.

---

## 4. Target row (Event B)

| Item | Value |
|------|-------|
| **id** | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| **legacy_id** | `schedule-2026-07-010` |
| **date** | `2026-07-19` |
| **site_slug** | `gosaki-piano` |
| **month** | `2026-07` |
| **public route** | `/schedule/2026-07/` |

**Event A (`f687ebf3…`) — not in scope.**

### Reference beforeSnapshot (preflight — reconfirm via live SELECT optional)

| Field | Reference value (G-9g PoC text) |
|-------|--------------------------------|
| `title` | `[CMS Kit staging] G-9g2 title PoC` |
| `venue` | `[CMS Kit staging] G-9g3b venue PoC` |
| `open_time` | `[CMS Kit staging] G-9g3c open PoC` |
| `start_time` | `[CMS Kit staging] G-9g3c start PoC` |
| `price` | `[CMS Kit staging] G-9g3d general edit price PoC` |
| `description` | `出演： [G-9g3b venue+description PoC]` |
| `updated_at` (lock baseline) | `2026-06-18T01:04:51.312817+00:00` |

Optional read-only SELECT (operator — staging only; Cursor does not execute):

```sql
-- G-13c2d2 reference SELECT — staging only; not required for Preview-only
select id, legacy_id, site_slug, date, title, venue, open_time, start_time, price, description, updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and legacy_id = 'schedule-2026-07-010'
  and site_slug = 'gosaki-piano';
```

Row count must be **1** if run. Abort Preview planning if live row id/legacy_id/site_slug/date mismatch.

---

## 5. Cleanup expected values (Preview after / payload)

Source: G-13c2 preflight (3 sources agree) + `gosaki-schedule-event-b-poc-cleanup-config.ts`

| Field | Expected after cleanup |
|-------|------------------------|
| `title` | `<>` (string) |
| `venue` | **DB null** |
| `open_time` | **DB null** |
| `start_time` | **DB null** |
| `price` | **DB null** |
| `description` | `出演：` (string) |

**changedFields (expected):** `title`, `venue`, `open_time`, `start_time`, `price`, `description` (6 fields)

**Unchanged:** `id`, `legacy_id`, `site_slug`, `date`, `published`, `show_on_home`, `sort_order`, `schedule_months`, etc.

---

## 6. Local dev startup env (Preview-only — Save gate OFF)

**Principle:** Preview は `executeG13c2EventBPocCleanupDryRun`（純粋 dry-run、`actualWrite: false`）。**G-13c2 env arm / Save compile gate は不要**（OFF のまま）。

`.env.local` の `PUBLIC_SUPABASE_*` は **既存のまま使用** — このフェーズで変更しない。

### Recommended dev command (inline env only)

```bash
# repo root (sariswing-astro)
# .env.local に staging PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY がある前提

ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
npm run dev
```

### Required for Preview

| Env | Preview value | Why |
|-----|---------------|-----|
| `ENABLE_ADMIN_STAGING_SHELL` | `true` | staging shell route gate |
| `ENABLE_ADMIN_STAGING_AUTH` | `true` | staging admin sign-in |
| `ENABLE_ADMIN_STAGING_DATA_READ` | `true` | fixed target row SELECT |
| `PUBLIC_ADMIN_DATA_PROVIDER` | `supabase` | `getReadOnlyDataConfig()` |
| `PUBLIC_SUPABASE_URL` | staging URL | row read + host gate |
| `PUBLIC_SUPABASE_ANON_KEY` | staging anon | row read |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` | dry-run module stack（UPDATE はしない） |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `true` | routine safety |

### Must stay OFF (Preview-only phase)

| Env | Value |
|-----|-------|
| `PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED` | **unset / false** |
| `PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED` | **unset / false** |
| `PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED` | **unset / false** |
| `PUBLIC_ADMIN_G13C1_EVENT_A_POC_CLEANUP_SAVE_ENABLED` | **unset / false** |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | **`true`** (not `false`) |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | **unset** (or not G-13c2 approval) |
| All other schedule `*_NON_DRY_RUN_ARMED` | **off** (G-9k, G-9g*, G-6-g*, single-text-field registry) |

**Single-arm:** G-13c1 と G-13c2 の arm は同時に ON にしない（今回は両方 OFF）。

---

## 7. Save gate handling (this phase)

| Gate | Preview-only expectation |
|------|--------------------------|
| `getG13c2EventBPocCleanupConfig().armed` | **false** |
| `getG13c2EventBPocCleanupConfig().saveEnabled` | **false** |
| Save button label | `Event B cleanup 保存（無効）` |
| Save button `disabled` | **true** |
| `saveReadiness` after Preview | **`ready_but_save_disabled`** (primary) |

### If `saveReadiness` is `ready_to_save`

This means Save compile gate + full arm stack are accidentally ON. **Still do not click Save in G-13c2d2.**

1. Stop dev server
2. Remove G-13c2 arm / `PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED`
3. Restart with section 6 env (Save gate OFF)
4. Re-run Preview only

`ready_to_save` is valid for **G-13c2 final preflight / execution** phase only — not this phase.

---

## 8. Operator dry-run Preview procedure (next step — operator manual)

1. Confirm git clean + G-13c2d1 committed (`9d64379` or later).
2. Start dev with section 6 env (inline — do not edit `.env.local`).
3. Open:

   ```txt
   http://localhost:4321/__admin-staging-shell/musician-basic/admin/schedule/
   ```

4. Sign in as staging admin (required — unsigned → `guard_error`).
5. Scroll to **「G-13c2 — Event B PoC 文言クリーンアップ」**.
6. Confirm target hint: `schedule-2026-07-010`（2026-07-19）.
7. Click **「G-13c2 変更を確認（dry-run）」** — **once**.
8. Verify Preview panel (section 9).
9. Confirm Save button remains **disabled**.
10. Stop dev; restore routine work (`PUBLIC_ADMIN_WRITE_DRY_RUN=true`, all arms off).

**Do not click Save.** **Do not click G-13c1 Save.** **Do not click G-9k「更新する」.**

---

## 9. Expected Preview result

### Header line

```txt
dryRun: true
actualWrite: false
saveReadiness: ready_but_save_disabled
```

(`ready_to_save` only if arm accidentally ON — see section 7.)

### changedFields chips

```txt
title
venue
open_time
start_time
price
description
```

(6 chips — order in UI may differ.)

### approvalId

```txt
G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run
```

### Field snapshot table (before / after / payload)

| field | before (approx) | after (UI display) | payload |
|-------|-----------------|--------------------|---------|
| `title` | `[CMS Kit staging] G-9g2 title PoC` | `<>` | `<>` |
| `venue` | PoC venue text | **`null`** | **`null`** |
| `open_time` | PoC open text | **`null`** | **`null`** |
| `start_time` | PoC start text | **`null`** | **`null`** |
| `price` | PoC price text | **`null`** | **`null`** |
| `description` | `出演： [G-9g3b …]` | `出演：` | `出演：` |

### Save gate note (expected with gate OFF)

Preview may show:

```txt
Save gate: <arm failure reasons>; PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED=true (compile gate off)
```

This is **expected** — confirms Save path is blocked.

### Abort Preview result if

```txt
- guardErrors non-empty (except auth if not signed in)
- changedFields count ≠ 6
- after/payload shows "" instead of null for venue/open_time/start_time/price
- title after ≠ <>
- description after ≠ 出演：
- target id / legacy_id mismatch in error
- dryRun ≠ true or actualWrite ≠ false
```

---

## 10. Null field handling (UI vs payload)

| Layer | venue / open_time / start_time / price |
|-------|----------------------------------------|
| **Form internal** | empty string `""` (`G13C2_EVENT_B_POC_CLEANUP_NULL_FIELD_FORM_VALUE`) |
| **UI after column** | displays **`null`** (not blank, not `""`) |
| **payload** | **DB null** via `normalizeG9G3dGeneralEditFieldValue` |
| **guards** | rejects `""` where null expected |

**Operator check:** In Preview table, **payload** column for the four nullable fields must read `null`, not empty.

---

## 11. Do NOT click / do NOT run (this phase and after Preview)

| Action | Reason |
|--------|--------|
| **Event B cleanup Save** | G-13c2d2 is Preview-only; execution is separate phase |
| **G-13c1 Event A cleanup Save** | Event A already cleaned (G-13d1); do not re-click |
| **G-9k「更新する」** | unrelated write path |
| Hidden PoC Run buttons (G-6-e5, G-6-f6, G-9g*) | frozen / disarmed |
| Supabase SQL UPDATE | no DB write until execution approval |
| `manual-upload:package` / FTP upload | public reflection is G-13c2e (after DB cleanup) |
| `workflow_dispatch` | not in scope |

---

## 12. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiScheduleEventBPocCleanupLocalDryRunPreflightComplete` | **true** |
| `readyForG13c2d2OperatorLocalDryRunPreview` | **true** |
| `readyForG13c2FinalPreflight` | **true** (after operator Preview PASS) |
| `readyForAnyDbWrite` | **false** |
| `cursorPreviewButtonClicked` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `packageRegenExecuted` | **false** |
| `ftpUploadExecuted` | **false** |
| `eventATouched` | **false** |
| `marchReuploadTriggered` | **false** |

---

## 13. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13c2d2-gosaki-schedule-event-b-poc-cleanup-local-dry-run-preflight.mjs
```

---

## 14. Next phases

1. **G-13c2d2 operator verify** — 戸山が section 8 手順で Preview 1回 → 結果を記録（別 doc 可）
2. **G-13c2 final preflight** — beforeSnapshot / rollback SQL / Save env stack
3. **G-13c2 execution** — operator Preview → Save once（explicit approval）
4. **G-13c2e reflection** — regen → `schedule/2026-07/index.html` upload → HTTP verify

---

## 15. References

- [gosaki-schedule-event-b-poc-cleanup-slice-implementation.md](./gosaki-schedule-event-b-poc-cleanup-slice-implementation.md) (G-13c2d1)
- [gosaki-schedule-event-b-poc-cleanup-preflight.md](./gosaki-schedule-event-b-poc-cleanup-preflight.md) (G-13c2)
- [gosaki-schedule-event-a-poc-cleanup-admin-reflection-preflight.md](./gosaki-schedule-event-a-poc-cleanup-admin-reflection-preflight.md) (G-13d2 pattern)
- `src/lib/admin/staging-write/gosaki-schedule-event-b-poc-cleanup-config.ts`
- `src/lib/admin/staging-data/gosaki-schedule-event-b-poc-cleanup-ui.ts`
