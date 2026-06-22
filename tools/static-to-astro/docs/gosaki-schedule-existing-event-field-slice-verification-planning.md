# Gosaki schedule existing event field slice verification planning (G-9k6a)

**Phase:** `G-9k6a-gosaki-schedule-existing-event-field-slice-verification-planning`  
**Status:** **planning complete** — field slice matrix + operator checklist; **no DB write / Save / non-dry-run in this phase**  
**Date:** 2026-06-22  
**Prior:** G-9k5 arc closed (commit `60820c4`); G-9k4b UI manual Save succeeded (`description` only)

| Check | Status |
| --- | --- |
| Field slice matrix documented | **yes** |
| Operator execution checklist documented | **yes** |
| DB write / Save in this phase | **no** |
| `service_role` used | **no** |
| sari-site / Sariswing production touched | **no** |

Prior docs:

- [gosaki-schedule-existing-event-save-button-success-finalization.md](./gosaki-schedule-existing-event-save-button-success-finalization.md) (G-9k5)
- [gosaki-schedule-existing-event-ui-manual-save-success-and-result-fix.md](./gosaki-schedule-existing-event-ui-manual-save-success-and-result-fix.md) (G-9k4b)
- [gosaki-schedule-existing-event-price-field-slice-save-success-finalization.md](./gosaki-schedule-existing-event-price-field-slice-save-success-finalization.md) (G-9k6b)
- [gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization.md](./gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization.md) (G-9k6c)
- [gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization.md](./gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization.md) (G-9k6d)
- [gosaki-schedule-existing-event-venue-field-slice-save-success-finalization.md](./gosaki-schedule-existing-event-venue-field-slice-save-success-finalization.md) (G-9k6e)
- [gosaki-schedule-existing-event-title-field-slice-save-success-finalization.md](./gosaki-schedule-existing-event-title-field-slice-save-success-finalization.md) (G-9k6f)
- [gosaki-schedule-existing-event-field-slice-closure.md](./gosaki-schedule-existing-event-field-slice-closure.md) (G-9k6g)

---

## Gates

```txt
gosakiScheduleExistingEventFieldSliceVerificationPlanningComplete: true
gosakiScheduleExistingEventFieldSliceManualSaveAllComplete: true
gosakiScheduleExistingEventFieldSliceClosureComplete: true
phase: G-9k6a
readyForG9k6bPriceFieldSliceManualSave: false
readyForG9k6cOpenTimeFieldSliceManualSave: false
readyForG9k6dStartTimeFieldSliceManualSave: false
readyForG9k6eVenueFieldSliceManualSave: false
readyForG9k6fTitleFieldSliceManualSave: false
readyForG9k6gFieldSliceClosure: false
readyForG9k6SliceReExecution: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedRun: false
rollbackExecutedInThisPhase: false
```

**G-9k6a is planning only.** Manual Save execution begins in **G-9k6b+** per-slice phases (operator-driven, one field per Save).

**Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; `G9K_SAVE_BUTTON_SAVE_ENABLED=false`.

---

## 1. Purpose and speed policy

G-9k4b proved the operator UI Save path on **`description` only**. G-9k6 verifies the remaining **safe text fields** one at a time, reusing the same G-9k safety stack.

| Policy | Detail |
| --- | --- |
| **1 Save = 1 field** | Never multi-field Save in G-9k6 |
| **Plan together, execute separately** | This doc covers all slices; each slice is one operator session + one Save click |
| **Same safety as G-9k4b** | approvalId, env arm, auth gate, project allowlist, dry-run, optimistic lock, `rowsAffected === 1` |
| **Record per slice** | before / after / `updated_at` / dry-run gates / post-save UI — separate result doc per execution phase |
| **No multi-field batch** | Do not combine price + open_time etc. in one Save |

---

## 2. Target row (fixed for G-9k6)

Reconfirm **id**, **site_slug**, and **updated_at** via UI or read-only SELECT immediately before each slice Save.

| Field | Value |
| --- | --- |
| **id** | `f687ebf3-407c-49d0-9ab8-58040c499b8e` |
| **legacy_id** | `schedule-2026-03-007` |
| **site_slug** | `gosaki-piano` |
| **title** | `<Duo> [G-9k6 title UI保存テスト]` (post-G-9k6f baseline) |
| **date** | `2026-03-15` (read-only — **not** in G-9k payload) |
| **venue** | `川崎 ぴあにしも [G-9k6 venue UI保存テスト]` (post-G-9k6e baseline) |
| **post-G-9k6f updated_at** | `2026-06-22T15:01:47.671778+00:00` |
| **post-G-9k6d start_time** | `19:00` |
| **post-G-9k6c open_time** | `18:00` |
| **post-G-9k6b price** | `3,000円（G-9k6 price UI保存テスト）` |

### Project (staging only)

```txt
project name: static-to-astro-cms-staging
project ref: kmjqppxjdnwwrtaeqjta
blocked sari-site ref: vsbvndwuajjhnzpohghh — must not be active
```

### approvalId / env arm (reuse G-9k — do not use G-9j5)

```txt
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9k-gosaki-schedule-existing-event-save-button-non-dry-run
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=true
```

---

## 3. Field slice status overview

| Order | Field | G-9k6 slice phase (planned) | Status |
| --- | --- | --- | --- |
| — | `description` | G-9k4b (done) | **succeeded** — do not re-Save unless restore phase |
| 1 | `price` | G-9k6b | **succeeded** — do not re-Save unless restore phase |
| 2 | `open_time` | G-9k6c | **succeeded** — do not re-Save unless restore phase |
| 3 | `start_time` | G-9k6d | **succeeded** — do not re-Save unless restore phase |
| 4 | `venue` | G-9k6e | **succeeded** — do not re-Save unless restore phase |
| 5 | `title` | G-9k6f | **succeeded** — do not re-Save unless restore phase |

---

## 4. Field slice matrix

**Before values** below are planning baselines (seed + G-9k4b). **Operator must reconfirm** current value in edit form or read-only SELECT before each slice Save. After each successful slice, the **after value** becomes the **before value** for the next slice.

### 4.1 `description` — already succeeded (G-9k4b)

| Item | Value |
| --- | --- |
| **field** | `description` |
| **before value (at G-9k4b)** | seed text ending with `会場website: http://pubhpp.com/` |
| **test after value (recorded)** | `出演：長谷川薫vo 後藤沙紀pf` + newline + `会場website: http://pubhpp.com/` + newline + `（管理画面保存テスト / G-9k4 UI保存テスト）` |
| **expected changedFields** | `["description"]` |
| **expected payload keys** | `["description"]` |
| **risk** | low — body text; staging only |
| **rollback / restore** | record before/after + `updated_at`; restore in separate phase if needed |
| **manual confirmation** | G-9k4b post-save UI + SQL read-only — **done** |
| **status** | **complete** — skip in G-9k6 execution |

### 4.2 `price` — slice 1 (G-9k6b) — **succeeded**

| Item | Value |
| --- | --- |
| **field** | `price` |
| **before value (at G-9k6b)** | `3,000円` |
| **before updated_at** | `2026-06-22T02:20:07.217037+00:00` |
| **recorded after value** | `3,000円（G-9k6 price UI保存テスト）` |
| **post-save updated_at** | `2026-06-22T06:53:39.857434+00:00` |
| **recorded changedFields** | `["price"]` |
| **recorded payload keys** | `["price"]` |
| **rowsAffected** | `1` |
| **risk** | low — staging label append; easy to restore |
| **rollback / restore** | restore to `3,000円`; match `updated_at` in WHERE clause |
| **manual confirmation** | dry-run chips; post-save result panel **保存成功**; UI confirmed |
| **status** | **complete** — skip re-Save; doc: `gosaki-schedule-existing-event-price-field-slice-save-success-finalization.md` |

**Edit rule:** change **price input only**; leave title, venue, times, description untouched.

### 4.3 `open_time` — slice 2 (G-9k6c) — **succeeded**

| Item | Value |
| --- | --- |
| **field** | `open_time` |
| **before value (at G-9k6c)** | `15:00` |
| **before updated_at** | `2026-06-22T06:53:39.857434+00:00` |
| **recorded after value** | `18:00` |
| **post-save updated_at** | `2026-06-22T07:30:35.391238+00:00` |
| **recorded changedFields** | `["open_time"]` |
| **recorded payload keys** | `["open_time"]` |
| **rowsAffected** | `1` |
| **risk** | low–medium — schedule display time changes on staging preview |
| **rollback / restore** | restore to `15:00`; match `updated_at` in WHERE clause |
| **manual confirmation** | dry-run 開場 row; diff `15:00` → `18:00`; post-save **保存成功** panel |
| **status** | **complete** — skip re-Save; doc: `gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization.md` |

**Edit rule:** change **open_time input only**.

### 4.4 `start_time` — slice 3 (G-9k6d) — **succeeded**

| Item | Value |
| --- | --- |
| **field** | `start_time` |
| **before value (at G-9k6d)** | `15:30` |
| **before updated_at** | `2026-06-22T07:30:35.391238+00:00` |
| **recorded after value** | `19:00` |
| **post-save updated_at** | `2026-06-22T12:42:32.483922+00:00` |
| **recorded changedFields** | `["start_time"]` |
| **recorded payload keys** | `["start_time"]` |
| **rowsAffected** | `1` |
| **risk** | low–medium — same as open_time |
| **rollback / restore** | restore to `15:30`; match `updated_at` in WHERE clause |
| **manual confirmation** | dry-run 開演 row; diff `15:30` → `19:00`; post-save **保存成功** panel |
| **status** | **complete** — skip re-Save; doc: `gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization.md` |

**Edit rule:** change **start_time input only**.

### 4.5 `venue` — slice 4 (G-9k6e) — **succeeded**

| Item | Value |
| --- | --- |
| **field** | `venue` |
| **before value (at G-9k6e)** | `川崎 ぴあにしも` |
| **before updated_at** | `2026-06-22T12:42:32.483922+00:00` |
| **recorded after value** | `川崎 ぴあにしも [G-9k6 venue UI保存テスト]` |
| **post-save updated_at** | `2026-06-22T13:02:19.63835+00:00` |
| **recorded changedFields** | `["venue"]` |
| **recorded payload keys** | `["venue"]` |
| **rowsAffected** | `1` |
| **risk** | medium — visible on event card |
| **rollback / restore** | restore to `川崎 ぴあにしも`; match `updated_at` in WHERE clause |
| **manual confirmation** | dry-run 会場 row; diff venue only; post-save **保存成功** panel |
| **status** | **complete** — skip re-Save; doc: `gosaki-schedule-existing-event-venue-field-slice-save-success-finalization.md` |

**Edit rule:** change **venue input only**.

### 4.6 `title` — slice 5 (G-9k6f) — **succeeded**

| Item | Value |
| --- | --- |
| **field** | `title` |
| **before value (at G-9k6f)** | `<Duo>` |
| **before updated_at** | `2026-06-22T13:02:19.63835+00:00` |
| **recorded after value** | `<Duo> [G-9k6 title UI保存テスト]` |
| **post-save updated_at** | `2026-06-22T15:01:47.671778+00:00` |
| **recorded changedFields** | `["title"]` |
| **recorded payload keys** | `["title"]` |
| **rowsAffected** | `1` |
| **risk** | **high** — prominent in list, hub, month pages; run last |
| **rollback / restore** | restore to `<Duo>`; match `updated_at` in WHERE clause |
| **manual confirmation** | dry-run タイトル row; diff title only; post-save **保存成功** panel |
| **status** | **complete** — skip re-Save; doc: `gosaki-schedule-existing-event-title-field-slice-save-success-finalization.md` |

**Edit rule:** change **title input only**.

---

## 5. Out of scope (unchanged)

| Item | Status |
| --- | --- |
| `date`, `month`, `year` | not in payload |
| `published`, `show_on_home`, `home_order`, `sort_order` | not in payload |
| `source_route`, `source_file`, `image_url` | not in payload |
| `schedule_months` | read-only / derived — must not write |
| New INSERT / delete / duplicate Save | not in G-9k6 |
| Public site rebuild / FTP / deploy | not in G-9k6 |
| Multi-field Save | **forbidden** in G-9k6 |

---

## 6. Operator execution procedure (per slice)

Use for **each** of G-9k6b → G-9k6f (one field per session).

### 6.1 Pre-flight (before starting dev server)

- [ ] Confirm routine work is committed; this slice is the only armed Save for the session
- [ ] Confirm target row id `f687ebf3-407c-49d0-9ab8-58040c499b8e` in planning doc
- [ ] Confirm staging project ref `kmjqppxjdnwwrtaeqjta` in `.env.local` (do not paste keys in chat)
- [ ] Confirm **not** connected to sari-site ref `vsbvndwuajjhnzpohghh`
- [ ] Read-only SELECT or UI: record **current before value** for target field + `updated_at`

### 6.2 Start dev server (full G-9k4b stack)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ENABLE_ADMIN_STAGING_AUTH=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
G9K_SAVE_BUTTON_SAVE_ENABLED=true \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=true \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9k-gosaki-schedule-existing-event-save-button-non-dry-run \
npm run dev -- --port 4322
```

Open: `/__admin-staging-shell/musician-basic/admin/schedule/`

### 6.3 Per-slice steps

1. Sign in via staging auth gate if prompted
2. Select target row (`schedule-2026-03-007` / `<Duo>` / 2026-03-15)
3. Verify form **updated_at** matches expected baseline for this slice
4. Edit **one field only** (per matrix §4)
5. Click 「変更を確認」
6. Confirm dry-run **OK**; **guard errors: none**
7. Confirm `changedFields` = **target field only** (single chip)
8. Confirm `payload keys` = **target field only**
9. Confirm `approvalId` = `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run`
10. Confirm Save readiness → 「保存準備OK。更新できます」
11. Click 「更新する」 **once** (no double-click)
12. Confirm post-save result panel visible: **保存成功**
13. Confirm `rowsAffected` = **1**
14. Confirm `post-save updated_at` **newer** than before Save
15. Confirm **post-save field value** matches planned after value
16. Confirm dry-run area shows **保存済み**; Save button disabled
17. Optional: read-only SELECT in SQL Editor — field + `updated_at` only changed
18. Record results in slice execution doc (G-9k6b, G-9k6c, …)
19. **Ctrl+C** stop armed dev server before next slice or routine dev

### 6.4 Stop conditions (abort immediately)

Do **not** click Save if any check fails:

| Condition | Action |
| --- | --- |
| `changedFields` ≠ single target field | **stop** — fix edit; re-dry-run |
| `payload keys` ≠ single target field | **stop** |
| `date` / `month` / `published` / `schedule_months` in payload | **stop** |
| Wrong target id | **stop** |
| `site_slug` ≠ `gosaki-piano` | **stop** |
| Project ref ≠ `kmjqppxjdnwwrtaeqjta` | **stop** |
| sari-site ref detected | **stop** |
| Guard errors on dry-run | **stop** |
| Optimistic lock stale | **stop** — re-select row; re-dry-run |
| `rowsAffected` ≠ 1 after Save | **stop** — record incident; do not retry blindly |
| Post-save result panel missing | **stop** — do not assume success |
| Accidental double Save click | **stop** — verify DB state before continuing |

---

## 7. Safety rules (summary)

```txt
1 Save = 1 field
changedFields / payload keys must be exactly one target field
Forbidden in payload: date, month, published, schedule_months
Target id: f687ebf3-407c-49d0-9ab8-58040c499b8e only
site_slug: gosaki-piano only
project ref: kmjqppxjdnwwrtaeqjta only
sari-site ref vsbvndwuajjhnzpohghh — block
rowsAffected must be 1
post-save result panel must appear (保存成功)
No double-click on 更新する
Confirm updated_at advanced before next slice
Stop armed dev server (Ctrl+C) after each slice session
service_role — never
production / sari-site — never
```

---

## 8. Rollback / restore policy

**G-9k6a does not execute rollback.**

| Policy | Detail |
| --- | --- |
| Per-slice record | before value, after value, before `updated_at`, post-save `updated_at`, `rowsAffected` |
| Restore timing | separate phase (e.g. G-9k6-restore or end-of-G-9k6 closure) with operator approval |
| SQL template (planning only — not run in G-9k6a) | `UPDATE public.schedules SET <field> = '<before>', ... WHERE id = '...' AND updated_at = '<post-save updated_at>'` — operator-only, staging-only |
| description | G-9k4b after value is current baseline; restore only if explicitly approved |
| title last | if title slice runs, plan client preview communication before restore |

---

## 9. Read-only verification SELECT (operator — execution phases only)

```sql
select id, legacy_id, site_slug, title, venue, open_time, start_time, price, description, updated_at
from public.schedules
where id = 'f687ebf3-407c-49d0-9ab8-58040c499b8e';
```

Compare only the target field + `updated_at` vs before snapshot. **SELECT only** — no UPDATE in verification phases unless separate restore approval.

---

## 10. Recommended execution order

```txt
1. price      (G-9k6b) — succeeded
2. open_time  (G-9k6c) — succeeded
3. start_time (G-9k6d) — succeeded
4. venue      (G-9k6e) — succeeded
5. title      (G-9k6f) — succeeded
```

`description` — **succeeded** (G-9k4b).

**All G-9k6 field slice manual Saves complete** (`description`, `price`, `open_time`, `start_time`, `venue`, `title`). **G-9k6g closure complete** — doc: `gosaki-schedule-existing-event-field-slice-closure.md`. Next: operator-selected phase (UI copy, generalization, next feature, Gosaki CMS Kit, or rollback).

---

## 11. Next phases

| Phase | Scope |
| --- | --- |
| **G-9k6b** | `price` manual Save once + result doc — **complete** |
| **G-9k6c** | `open_time` manual Save once + result doc — **complete** |
| **G-9k6d** | `start_time` manual Save once + result doc — **complete** |
| **G-9k6e** | `venue` manual Save once + result doc — **complete** |
| **G-9k6f** | `title` manual Save once + result doc — **complete** |
| **G-9k6g** | field-slice verification closure (all slices recorded) — **complete** |
| Later | UI copy fix, staging shell Save generalization, next edit feature, Gosaki CMS Kit (`G-9h1` etc.), rollback — operator choice |
