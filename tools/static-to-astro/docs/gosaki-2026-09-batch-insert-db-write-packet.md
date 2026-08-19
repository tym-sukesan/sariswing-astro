# Gosaki 2026-09 batch INSERT — DB write packet

**Phase:** `gosaki-2026-09-batch-insert-db-write-packet`
**Status:** **CLOSED / PASS (operator one-shot SUCCESS · do not re-run)**
**Date:** 2026-08-19
**HEAD:** `14ab858e46252a91503f9bfb12f58498481304bf`
**Prior:** `gosaki-2026-09-and-home-schedule-content-remediation-planning`
**approvalId:** `gosaki-2026-09-batch-insert-non-dry-run`

| Check | Status |
| --- | --- |
| Exact 17-row review | **yes** |
| Fail-closed preconditions in SQL | **yes** (PL/pgSQL `DO` + `RAISE EXCEPTION`) |
| Forward SQL packet | **yes** |
| Post-write verification SELECT | **yes** (operator result recorded) |
| Rollback SQL packet | **yes** (separate file · **not executed**) |
| SQL / INSERT executed | **yes — operator once on staging** |
| Cursor SQL execute | **no** |
| Re-run / rollback | **forbidden** |
| Source / Home / package / FTP in this packet phase | **no** (Home Option D is a later phase) |
| commit / push | **no** |

### Operator execution result (CLOSED / PASS)

Staging `kmjqppxjdnwwrtaeqjta` only. Cursor did not run SQL.

```txt
OPERATOR_DB_WRITE_RESULT: SUCCESS
SQL_REEXECUTE_FORBIDDEN: true
ROLLBACK_EXECUTED: false
CURSOR_DB_WRITE_EXECUTED: false
published_total = 91
published_september = 17
published_pre_september = 74
ids_002_018 = 17
test_001_unpublished = 1
sort_80_96 = 17
existing74_max_updated_at = 2026-07-21 15:02:48.475629+00
all_ok = true
```

Do not re-run the forward packet. Do not run rollback. `001` remains unpublished test.

---

## Gates

```txt
DB_WRITE_PACKET_RESULT: CLOSED
OPERATOR_DB_WRITE_RESULT: SUCCESS
READY_FOR_OPERATOR_DB_WRITE: false
SQL_EXECUTED: true
SQL_REEXECUTE_FORBIDDEN: true
ROLLBACK_EXECUTED: false
CURSOR_DB_WRITE_EXECUTED: false
INITIAL_PUBLIC_CUTOVER_HOME_SCHEDULE: Option D
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-home-stale-this-week-hide-for-initial-cutover
```

Historical packet was ready for a **human** one-shot. That one-shot **succeeded**. Do not paste again. Timeout / ambiguous on any future attempt: stop, do not retry, do not cleanup.

---

## Exact target

| Item | Value |
| --- | --- |
| Project | `static-to-astro-cms-staging` |
| Ref | **`kmjqppxjdnwwrtaeqjta` only** |
| Forbidden | `vsbvndwuajjhnzpohghh` (Sariswing production) |
| Table | `public.schedules` |
| `site_slug` | `gosaki-piano` |
| Operation | INSERT 17 rows |
| `legacy_id` | `schedule-2026-09-002` … `schedule-2026-09-018` |
| Skip | `schedule-2026-09-001` (G-22e test — no INSERT/UPDATE/DELETE/publish) |
| `sort_order` | 80 … 96 |
| `published` | `true` |
| `show_on_home` | `false` |
| `date_status` | `confirmed` (Wix calendar dates; CHECK requires non-null `date`) |
| `source_file` | `schedule-2026-09.html` |
| `source_route` | `/schedule/2026-09/` |
| `id` / `created_at` / `updated_at` | omit — UUID / timestamps default |
| `schedule_months` | not touched |

SQL-level project gate: G-22e row must exist as `id = 18b48259-9a9a-4b00-b136-6c0c4ff3b2f3`. That UUID is staging-only. Operator must still confirm the dashboard URL contains `kmjqppxjdnwwrtaeqjta`.

---

## Mapping reconfirm (17/17)

Source: live Wix `/2026-09` → extractor JSON `output/gosaki-source-captures/2026-09/extracted.json` (gitignored) → remap skip `001`. **No invented fields.**

| # | `legacy_id` | `date` | `title` | `open_time` | `start_time` | `price` | `sort_order` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `…-002` | 2026-09-01 | `<Duo>` | **NULL** | 19:30 | 2,000円 | 80 |
| 2 | `…-003` | 2026-09-04 | `<Duo>` | 18:30 | 19:00 | 3,000円 | 81 |
| 3 | `…-004` | 2026-09-05 | `<Jive at FIVE>` | 13:40 | 14:00 | 前売りチケット 1,200円 | 82 |
| 4 | `…-005` | 2026-09-06 | `<Good Swing Jazz Band & Orchestra>` | 14:00 | 14:30 | (Wix full string) | 83 |
| 5 | `…-006` | 2026-09-07 | `<ごさきりかこTrio>` | 19:00 | 19:30 | 3,500円 | 84 |
| 6 | `…-007` | 2026-09-08 | `<Trio PEPINO>` | 19:00 | 19:30 | **NULL** | 85 |
| 7 | `…-008` | 2026-09-11 | `<Set Sail>` | 19:00 | 19:30 | 3,000円 | 86 |
| 8 | `…-009` | 2026-09-12 | `<宮崎幸子trio>` | 12:00 | 13:00 | 3,500円 | 87 |
| 9 | `…-010` | 2026-09-16 | `<Duo>` | 18:30 | 19:30 | チップ制 | 88 |
| 10 | `…-011` | 2026-09-19 | `<新谷健介オノマトペ>` | 18:00 | 19:00 | 2,200円 | 89 |
| 11 | `…-012` | 2026-09-23 | `<宮益屋本店>` | 17:00 | 18:00 | 2,750円 | 90 |
| 12 | `…-013` | 2026-09-24 | `<Duo>` | 18:00 | 20:00 | 2,000円 | 91 |
| 13 | `…-014` | 2026-09-25 | `<Golden PODs>` | 18:30 | 19:30 | 予約 4,000円 / 当日 4,500円 | 92 |
| 14 | `…-015` | 2026-09-26 | `<丸山朝光ニューアルバム"Sing Trads!"発売記念ライブ>` | 18:00 | 19:00 | 3,300円 | 93 |
| 15 | `…-016` | 2026-09-27 | `<YOKOHAMA SWINGIN REVIEW>` | 12:00 | **NULL** | 予約 4,500円 / 当日 4,800円 / 中学生以下入場無料 | 94 |
| 16 | `…-017` | 2026-09-28 | `<3 clarinet>` | 18:00 | 19:00 | 4,500円 + 2drinks & 1 order | 95 |
| 17 | `…-018` | 2026-09-30 | `<Duo>` | 18:00 | 19:00 | チップ制 | 96 |

Shared: `published=true`, `show_on_home=false`, `home_order=NULL`, `image_url=NULL`, `date_status=confirmed`, `year=2026`, `month=2026-09`. Descriptions are verbatim extractor strings inside the SQL file.

#8 date `2026-09-12` overlaps G-22e `001` (unpublished test). Different `legacy_id` / title. Allowed.

Contract vs live August row `schedule-2026-08-001`: same columns, `<>` titles, `source_file=schedule-YYYY-MM.html`, NULL times/price when Wix omitted.

---

## Preconditions (fail-closed, inside forward `DO`)

Any miss **RAISE EXCEPTION PRECONDITION_FAIL** — INSERT does not commit:

1. Dashboard / ref **`kmjqppxjdnwwrtaeqjta`** (operator visual) + SQL fingerprint `001.id = 18b48259-9a9a-4b00-b136-6c0c4ff3b2f3`
2. `site_slug='gosaki-piano'` published count **= 74**
3. published `date < 2026-09-01` **= 74**
4. `max(sort_order)` for `gosaki-piano` **= 79**
5. published `max(updated_at)` **= `2026-07-21 15:02:48.475629+00`**
6. `schedule-2026-09-001`: count 1, that UUID, `site_slug=gosaki-piano`, `published=false`, title `【G-22eテスト】新規追加テストイベント`, date `2026-09-12`
7. `002`–`018` count **= 0** (`site_slug=gosaki-piano`)
8. published September **= 0**

## Post-write gates (fail-closed, inside same forward `DO`)

Visible trailing SELECT is **not** the safety boundary. Any miss **RAISE EXCEPTION POST_WRITE_FAIL** and the `DO` aborts (no rows left):

1. `ROW_COUNT` **= 17**
2. published gosaki total **= 91**
3. published pre-September **= 74**
4. published September **= 17**
5. published `002`–`018` **= 17** (`site_slug=gosaki-piano`)
6. those 17 have `sort_order` 80–96
7. no duplicate `legacy_id` among `002`–`018`
8. `001` unpublished, same title, `site_slug=gosaki-piano`
9. existing published pre-September `max(updated_at)` unchanged
10. `001` not published

All `001` / `002`–`018` SELECTs in both packets are scoped with `site_slug='gosaki-piano'`.

---

## Why one `DO` block (not naïve BEGIN/17 INSERT/COMMIT)

Supabase SQL Editor may auto-commit statement-by-statement. A multi-statement `BEGIN`…`COMMIT` can leave a partial INSERT if a later statement never runs.

This packet uses a **single PL/pgSQL `DO`**: preconditions → 17-row `INSERT` → post-checks. `RAISE EXCEPTION` aborts the whole `DO` (no rows left behind). Trailing `SELECT` is a visible grid after success.

**Do not retry** the `DO` if it already succeeded (`002`–`018` exist → precondition fails).

---

## Forward packet

File: `tools/static-to-astro/scripts/supabase/gosaki-schedule-2026-09-batch-insert.packet.sql`

Operator: staging SQL Editor → one paste → run **once**.

Post-write SELECT (same file) expects **one row** `all_ok=true`:

| Column | Expected |
| --- | --- |
| `published_total` | 91 |
| `published_september` | 17 |
| `published_pre_september` | 74 |
| `ids_002_018` | 17 |
| `test_001_unpublished` | 1 |
| `sort_80_96` | 17 |
| `existing74_max_updated_at` | `2026-07-21 15:02:48.475629+00` |
| `all_ok` | **true** |

---

## Rollback packet (separate)

File: `tools/static-to-astro/scripts/supabase/gosaki-schedule-2026-09-batch-insert.rollback.sql`

Fail-closed **before DELETE** (`ROLLBACK_PRECONDITION_FAIL` → no DELETE):

1. `002`–`018` count **= 17** (`site_slug=gosaki-piano`)
2. All 17 match INSERT fingerprint: `site_slug='gosaki-piano'` · `month='2026-09'` · `source_file='schedule-2026-09.html'` · `source_route='/schedule/2026-09/'` · `sort_order` 80–96
3. No extra **published** September rows besides `002`–`018`
4. `001` present, that UUID, `site_slug=gosaki-piano`, unpublished

DELETE lists **only** `002`–`018` + `site_slug='gosaki-piano'`. **Never** `001`.

After success SELECT: `published_total=74`, `published_september=0`, `ids_002_018_remaining=0`, `test_001_unpublished=1`, `rollback_ok=true`.

Do **not** auto-rollback.

---

## Timeout / ambiguous STOP

```txt
stop immediately
do not retry
do not cleanup
do not run alternative commands
do not run the rollback packet unless a later SELECT proves the 17 rows exist and operator separately approves
record incident
ask human
```

If `DO` returns `PRECONDITION_FAIL`: nothing inserted. Fix the mismatch; do not blindly re-paste.

If `DO` returns `POST_WRITE_FAIL`: transaction aborted; expect **0** of `002`–`018`. Confirm with SELECT before any next step.

If timeout / empty / editor disconnect: **SELECT only** (counts of `002`–`018` and `001`). Do not re-run INSERT.

---

## Home Option D (product record)

```txt
INITIAL_PUBLIC_CUTOVER_HOME_SCHEDULE:
Option D

Home "THIS WEEK" section is temporarily hidden for initial launch.

Reason:
stale March/July content must not be shown.
Do not delay public cutover for full Home Schedule generalization.
Follow-on candidate:
published upcoming-N schedule integration.
```

Home source was **not** changed in the packet phase. Option D hide is implemented in `gosaki-home-stale-this-week-hide-for-initial-cutover`.

---

## After operator INSERT

Operator SUCCESS is recorded above. Next was Home Option D (this follow-on phase). Package regen is still later. No FTP auto-apply (`readyForAnyFutureFtpApply: false`). Do not re-run SQL.
