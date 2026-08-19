# Gosaki 2026-09 + Home schedule content remediation planning

**Phase:** `gosaki-2026-09-and-home-schedule-content-remediation-planning`
**Status:** **COMPLETE (planning / read-only)** — follow-on: operator INSERT **SUCCESS** + Home Option D implemented in `gosaki-home-stale-this-week-hide-for-initial-cutover`
**Date:** 2026-08-19
**HEAD:** `14ab858e46252a91503f9bfb12f58498481304bf`
**Prior:** `gosaki-current-wix-to-astro-content-parity-audit`
**Live Wix source:** `https://www.gosaki-piano.com/2026-09` (HTTP 200, captured 2026-08-19)
**Staging Kit:** `kmjqppxjdnwwrtaeqjta` anon SELECT-only
**Production Supabase `vsbvndwuajjhnzpohghh`:** **not queried**
**Extractor:** `scripts/lib/gosaki-wix-schedule-extractor.mjs` (`parseGosakiWixRepeaterItem`) · warnings **[]** · count **17**

| Check | Status |
| --- | --- |
| DB write / INSERT / UPDATE / DELETE | **no** |
| Source / convert / package / FTP / DNS / SSL | **no** |
| commit / push | **no** |
| SQL file authored | **yes** — packet phase `gosaki-2026-09-batch-insert-db-write-packet` (not executed) |
| Authenticated SELECT of unpublished rows | **packet SQL** (operator SQL Editor); this planning phase was anon-only |

---

## Gates

```txt
REMEDIATION_PLANNING_RESULT: COMPLETE
SEPTEMBER_17_MAPPING_COMPLETE: 17/17
WIX_UNSPECIFIED_FIELDS_INVENTED: false
TEST_ROW_REUSED_AS_LIVE: false
RECOMMENDED_IMPORT: operator_sql_batch_insert_skip_001
RECOMMENDED_HOME_SOLUTION: Option D (hide Home schedule section at launch)
INITIAL_PUBLIC_CUTOVER_HOME_SCHEDULE: Option D
PRODUCT_DECISION_REQUIRED: follow-on THIS WEEK vs upcoming-N vs editor pick (not launch)
PUBLIC_CUTOVER_BLOCKER: true (planning-time; both content blockers later CLOSED)
READY_FOR_DB_WRITE_PACKET: true
READY_FOR_HOME_IMPLEMENTATION_AFTER_DB_WRITE: true
READY_FOR_REDIRECT_IMPLEMENTATION: false
SQL_EXECUTED: false (this planning doc; operator INSERT later SUCCESS)
SOURCE_CHANGED: false (this planning doc; Home hide later)
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-2026-09-batch-insert-operator-execution
```

Planning complete. Operator SQL packet authored in `gosaki-2026-09-batch-insert-db-write-packet` (not executed). Home Option D is the recorded launch decision; source hide is a later phase.

---

## 1. September 17-event mapping (Wix → existing Schedule schema)

Capture: live GET `https://www.gosaki-piano.com/2026-09` → gitignored HTML → existing extractor. **No field invented.** Wix-unspecified values stay `NULL`.

### Shared INSERT constants (all 17)

| Field | Value | Basis |
| --- | --- | --- |
| `site_slug` | `gosaki-piano` | existing Gosaki rows |
| `year` | `2026` | Wix date |
| `month` | `2026-09` | Wix date |
| `published` | `true` | live public Wix page |
| `show_on_home` | `false` | do not invent Home flags (`show_on_home` published count is **0**) |
| `home_order` | `NULL` | unused |
| `date_status` | omit column / DB default `'confirmed'` | all 74 published rows are `confirmed`; Wix gives calendar ISO dates; **not** TBD |
| `source_file` | `schedule-2026-09.html` | August live rows use `schedule-YYYY-MM.html` (not crawl basename `2026-09.html`) |
| `source_route` | `/schedule/2026-09/` | extractor + August convention |
| `image_url` | `NULL` | extractor `img[src]` empty on all 17 |
| `source URL` (docs) | `https://www.gosaki-piano.com/2026-09` | no per-event Wix permalink in repeater |

`date_display` is extractor-only (not a DB column). Titles keep Wix `<>` wrapping to match August (`<Duo>`, `<地ビールフェスト2026>`, …).

### `legacy_id` remap (extractor vs planned)

Extractor assigns `schedule-2026-09-001` … `017` in page order. **`001` is reserved** by G-22e unpublished test row (`schedules_legacy_id_key` is **global UNIQUE**). Planned IDs **skip 001**: `002` … `018`.

| Wix # | Planned `legacy_id` | Extractor id (do not INSERT) | `date` | `title` | `venue` | `open_time` | `start_time` | `price` | Planned `sort_order` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `schedule-2026-09-002` | `…-001` | `2026-09-01` | `<Duo>` | 広尾 barおくむら | **NULL** | `19:30` | `2,000円` | 80 |
| 2 | `schedule-2026-09-003` | `…-002` | `2026-09-04` | `<Duo>` | 高田馬場 Gate One | `18:30` | `19:00` | `3,000円` | 81 |
| 3 | `schedule-2026-09-004` | `…-003` | `2026-09-05` | `<Jive at FIVE>` | 我孫子 我孫子市民プラザ 多目的ホール | `13:40` | `14:00` | `前売りチケット 1,200円` | 82 |
| 4 | `schedule-2026-09-005` | `…-004` | `2026-09-06` | `<Good Swing Jazz Band & Orchestra>` | センター南 都筑公会堂 | `14:00` | `14:30` | `一般 5,000円 / 小中高生 1,000円 /つづきジャズ音楽友の会会員 4,000円` | 83 |
| 5 | `schedule-2026-09-006` | `…-005` | `2026-09-07` | `<ごさきりかこTrio>` | 池袋 Apple Jump | `19:00` | `19:30` | `3,500円` | 84 |
| 6 | `schedule-2026-09-007` | `…-006` | `2026-09-08` | `<Trio PEPINO>` | 馬車道 Ben Tenuto | `19:00` | `19:30` | **NULL** | 85 |
| 7 | `schedule-2026-09-008` | `…-007` | `2026-09-11` | `<Set Sail>` | 池袋 Independence | `19:00` | `19:30` | `3,000円` | 86 |
| 8 | `schedule-2026-09-009` | `…-008` | `2026-09-12` | `<宮崎幸子trio>` | 吉祥寺 Strings | `12:00` | `13:00` | `3,500円` | 87 |
| 9 | `schedule-2026-09-010` | `…-009` | `2026-09-16` | `<Duo>` | 新宿 PolkaDots | `18:30` | `19:30` | `チップ制` | 88 |
| 10 | `schedule-2026-09-011` | `…-010` | `2026-09-19` | `<新谷健介オノマトペ>` | 浅草 HUB | `18:00` | `19:00` | `2,200円` | 89 |
| 11 | `schedule-2026-09-012` | `…-011` | `2026-09-23` | `<宮益屋本店>` | 浅草 HUB | `17:00` | `18:00` | `2,750円` | 90 |
| 12 | `schedule-2026-09-013` | `…-012` | `2026-09-24` | `<Duo>` | 横須賀 ケント倶楽部 | `18:00` | `20:00` | `2,000円` | 91 |
| 13 | `schedule-2026-09-014` | `…-013` | `2026-09-25` | `<Golden PODs>` | 桜木町 Dolphy | `18:30` | `19:30` | `予約 4,000円 / 当日 4,500円` | 92 |
| 14 | `schedule-2026-09-015` | `…-014` | `2026-09-26` | `<丸山朝光ニューアルバム"Sing Trads!"発売記念ライブ>` | 用賀 キンのツボ | `18:00` | `19:00` | `3,300円` | 93 |
| 15 | `schedule-2026-09-016` | `…-015` | `2026-09-27` | `<YOKOHAMA SWINGIN REVIEW>` | 関内 グレースバリ横浜関内 3F アロナ | `12:00` | **NULL** | `予約 4,500円 / 当日 4,800円 / 中学生以下入場無料` | 94 |
| 16 | `schedule-2026-09-017` | `…-016` | `2026-09-28` | `<3 clarinet>` | 銀座 Swing | `18:00` | `19:00` | `4,500円 + 2drinks & 1 order` | 95 |
| 17 | `schedule-2026-09-018` | `…-017` | `2026-09-30` | `<Duo>` | 自由が丘 Dana Point | `18:00` | `19:00` | `チップ制` | 96 |

### Descriptions (Wix-stated only)

Exact extractor `description` strings (newlines preserved). Packet must copy these verbatim.

1. `出演：出口優日vo 後藤沙紀pf` + `イベントwebsite：https://hiro-o-kumura.com/section/bar/`
2. `出演：長谷川薫vo 後藤沙紀pf` + `イベントwebsite：https://jazzgateone.com/schedule.html`
3. `出演：『Jive at FIVE』` / members / `会場website: https://www.s-seiun.co.jp/shisetsu/abiko/`
4. `(当日料金はそれぞれプラス1,000円up)` + orchestra credits + `会場website: https://tsuzuki-kokaido.jp/`
5. `出演：『ごさきりかこTrio』` + members + `会場website: https://applejump.net/`
6. `出演：『Trio PEPINO』` + members + `会場website: https://www.bentenuto-music-bar.com/`
7. `出演：『set sail』天野丘gt 後藤沙紀pf` + `会場website: http://jazz-independence.com/`
8. `出演：宮崎幸子vo 後藤沙紀pf 寺尾陽介b` + `会場website: https://www.jazz-strings.com/`
9. `出演：宮崎佳彦cl,sax 河原真彩tp 後藤沙紀pf` + `会場website: https://www.jazz-polkadots.com/`
10. `出演：『新谷健介オノマトペ』…` + `会場website: https://www.pub-hub.com/index.php/shop/detail/6`
11. `出演：『宮益屋本店』…` + same HUB website
12. `出演：宮脇惇cl 後藤沙紀pf` + `会場website: https://tabelog.com/kanagawa/A1406/A140601/14064107/`
13. `出演：坂本愛江vo 工藤精b 後藤沙紀pf 田中涼ds` + `会場website: https://dolphy-jazzspot.com/`
14. `出演：丸山朝光bjo,vo 後藤沙紀pf 寺尾陽介b` + `会場website: https://kinnotsubo.com/`
15. credits + `イベントwebsite：https://www.arcyswingdancestudio.com/yokohamaswinginreview` + `会場website: https://www.grace-bali.com/shop/yokohama_kannai/enkai/`
16. `出演：熊倉未佐子cl 宮崎佳彦cl 宮脇惇cl 後藤沙紀pf 遠藤定b` + `会場website: https://ginzaswing.jp/`
17. `出演：出口優日vo 後藤沙紀pf` + `会場website: https://danapoint-grill.com/`

Full JSON of the extractor output (gitignored): `output/gosaki-source-captures/2026-09/extracted.json`. Packet phase must re-read that file or re-extract; do not retype from memory.

### NULL / incomplete (must stay NULL)

| Planned id | Field | Reason |
| --- | --- | --- |
| `…-002` | `open_time` | Wix time line has start only |
| `…-007` | `price` | Wix has no `料金：` value |
| `…-016` | `start_time` | Wix time line has open `12:00` only |
| all 17 | `image_url` | no extractor `img[src]` |

Do **not** copy open/start from “typical club times”. Do **not** set `show_on_home=true`.

---

## 2. Staging DB state (anon SELECT-only, 2026-08-19)

Host gate: `kmjqppxjdnwwrtaeqjta` only.

| Query | Result |
| --- | --- |
| published `gosaki-piano` | **74** |
| `date_status` on those 74 | all `confirmed` |
| published `month=2026-09` / date in September | **0** |
| published `legacy_id LIKE schedule-2026-09-%` | **0** |
| anon `legacy_id=schedule-2026-09-001` | **0** (RLS hides unpublished) |
| `show_on_home=true` published | **0** |
| `updated_at` null | **0** |
| `sort_order` | min **1** · max **79** · 74 distinct · gaps **7,8,9,13,18** (August hold-outs) |
| August published | **14** rows · `source_file=schedule-2026-08.html` · ids 001–019 with gaps (007/008/009/013/018 unused) |
| March Home-card dates in DB | `2026-03-25/27/31` exist as published rows, **`show_on_home=false`** |
| July Home-card dates in DB | `2026-07-15/16/20/22` exist as published rows, **`show_on_home=false`** |

Docs (not this SELECT): G-22e test `schedule-2026-09-001` is **unpublished**, date `2026-09-12`, title `【G-22eテスト】新規追加テストイベント`, venue test. Protected by unpublish/republish guards. Wix #8 is also `2026-09-12` (`宮崎幸子trio`) — **date overlap is OK**; they are different events. Do **not** UPDATE `001` into the Wix gig.

`computeNextLegacyIdFromRows` uses **max suffix including unpublished**. Authenticated SELECT that sees `001` would allocate `002` next. A published-only view (0 September rows) would allocate `001` and **UNIQUE-fail**. Packet must not rely on CMS CREATE auto-id.

Optimistic lock: this import is **INSERT-only**. Do **not** global `sort_order` bump (August Step 0). A bump would fire `schedules_set_updated_at` on all existing rows and invalidate every lock.

---

## 3. Operator DB write plan (not executed)

**Recommended import:** one operator SQL transaction on staging Kit, G-20r3 August pattern. **Reject** 17× CMS CREATE clicks. **Reject** publishing `001`. **Reject** UPDATE of `001`.

Proposed approval id (register in packet phase): `gosaki-2026-09-batch-insert-non-dry-run`

### Precondition (fail-closed, authenticated SQL Editor)

1. Project ref is `kmjqppxjdnwwrtaeqjta`. Stop if production ref.
2. `schedule-2026-09-001` exists, `published=false`, title still the G-22e test — **leave untouched**.
3. No row with `legacy_id IN (schedule-2026-09-002 … 018)`.
4. No published `gosaki-piano` row with `month='2026-09'` or September `date`.
5. `max(sort_order)` among `site_slug=gosaki-piano` still **79** (or packet adjusts 80–96 if max moved).
6. Exact 17-row payload matches extractor JSON + remap table.
7. Explicit one-shot approval text (G-7f1 form). Vague “OK” is insufficient.

### Transaction

```txt
BEGIN;
-- re-run precondition SELECTs inside the transaction
-- INSERT exactly 17 rows (002–018, sort_order 80–96, published true, show_on_home false)
-- STOP / ROLLBACK on any unique violation, row-count ≠ 17, or 001 appearing in the INSERT list
COMMIT;
```

Do not INSERT `001`. Do not UPDATE existing 74. Do not write `schedule_months`. Do not use `service_role`. Cursor does not run this SQL.

### Success criteria (post-COMMIT SELECT)

- published September count **17**
- `legacy_id` set exactly `002`–`018` (no `001` in the new published set)
- `001` still unpublished test
- hub/month generation **after later package regen**: `/schedule/2026-09/` + legacy stub `/2026-09/` appear via G-20t2 discovery (published rows only)
- Home still March until a **separate** Home source change (expected)

### Rollback

```txt
DELETE FROM public.schedules
WHERE site_slug = 'gosaki-piano'
  AND legacy_id IN (
    'schedule-2026-09-002', …, 'schedule-2026-09-018'
  );
```

Expect **17** deleted. **Never** include `001` in rollback DELETE. If outcome is ambiguous: stop, do not retry, do not cleanup, ask human.

Package regen / FTP are **not** part of the SQL rollback.

---

## 4. Home `THIS WEEK` implementation path (why March is frozen)

Calendar today in this phase: **2026-08-19**.

| Surface | Cards | Label |
| --- | --- | --- |
| Live Wix Home | 7月15 / 16 / 20 / 22 (4) | THIS WEEK'S LIVE SCHEDULE |
| Fixture `fixtures/gosaki-piano/index.html` | **3月25 / 27 / 31** (3) | same heading in HTML |
| ciao-preview | same March island | same |

### Path (Gosaki)

1. Convert copies Wix crawl `index.html` into `src/pages/index.astro` (repeater `#comp-m8y53dj5` intact).
2. `applyPostGenerate` → `applyGosakiHomeYouTubeEmbed` inserts YouTube **after** `#comp-m8y53dj5`. It does **not** replace cards.
3. CSS in `gosaki-piano-overrides.mjs` styles `#comp-m8y5bex0` / `#comp-m8y53dj5` as “THIS WEEK'S LIVE SCHEDULE”.
4. Month pages read `gosaki-schedules.json` from `loadGosakiScheduleDataForBuild()` (`gosaki-schedule-data-pages.mjs`). **Home does not.**
5. `home-schedule-sync.mjs` / `sync-home-schedule.mjs` / `refresh-public-cms-views.mjs` target `section.home-schedule` and `show_on_home` on `schedules.json` (Sariswing Phase 3-C). **Not wired into Gosaki convert / `build:gosaki:*`.**
6. `show_on_home` published count = **0**. March/July gigs exist in DB but flags are false; Home would still show crawl HTML even if flags were true.
7. Kit leftover: `applyFallbackHomeSelection` hardcodes `today = "2026-03-01"`. Must **not** be reused for Gosaki.

**Root cause:** Home schedule is a **frozen Wix crawl HTML island** from the G-7d fixture (`index.html` crawled when Wix Home showed March). Recrawl would copy **July** (also stale vs 2026-08-19). Supabase Schedule is not the Home SoT today.

---

## 5. Home remediation options

| | A recrawl Wix Home | B upcoming N from published | C `show_on_home=true` only | D hide section at launch |
| --- | --- | --- | --- | --- |
| Launch work | recrawl + convert | convert/postGenerate + bake-date filter | editor flags **or** seed UPDATE + Home bind | hide `#comp-m8y5bex0` + `#comp-m8y53dj5` (keep YouTube slot) |
| Accident risk | ships July as “THIS WEEK” | wrong N / wrong heading / stale bake date | 0 flags today → empty or accidental UPDATE | empty Home block (honest) |
| Kit reuse | none | high (bind Home to Schedule CMS) | high (editor contract already in schema) | low (launch patch) |
| Client ops | still manual Wix-style freeze | bake/publish cycle | editor must pick cards | no Home gigs until later |
| Stale risk | **immediate** (Wix is July) | low if bake date is real | low if editor maintains | none (hidden) |
| Schedule CMS | decoupled | aligned | aligned if UI exists | decoupled until later |

**Option A is not a launch fix.** User constraint: Wix Home is already July-stale.

**Option E (heading-only):** keep March/July cards but rename label — **forbidden** (still past gigs as current).

### `RECOMMENDED_HOME_SOLUTION`

**Option D** for Gosaki public cutover: do not ship March or July as “THIS WEEK”. Smallest fail-closed source change. Does not invent THIS WEEK semantics.

**Follow-on (not this launch recommendation):** Option B after `PRODUCT_DECISION_REQUIRED` — upcoming N from published `gosaki-schedules.json`, **real bake date** (never `2026-03-01`), heading must not say THIS WEEK until product confirms calendar-week. Option C needs editor UI + non-zero flags; not shortest.

Kit-generalizable B is desirable within a few days **after** the heading/N decision. Do not delay cutover by implementing B as “this week” without that decision.

---

## 6. `PRODUCT_DECISION_REQUIRED` — “THIS WEEK”

Evidence:

- Public copy: “THIS WEEK'S LIVE SCHEDULE” (`#comp-m8y5bex0` + overrides).
- Live Wix Home on 2026-08-19 shows **mid-July**, not calendar week of Aug 19. Wix production does **not** currently mean “this calendar week”.
- Fixture/ciao show **March** (crawl time).
- Schema has `show_on_home` / `home_order` but **zero** published flags; no Gosaki Home bind.
- Kit sync fallback is upcoming-3 from a **hardcoded** 2026-03-01 — Sariswing leftover, not a Gosaki product contract.

Not proven: calendar week vs upcoming N vs editor pick. **Do not lock a spec from this.**

```txt
PRODUCT_DECISION_REQUIRED
```

Locked without decision:

> Past March/July schedule must not publish as “THIS WEEK”.

---

## 7. Dependency: September INSERT vs Home

```txt
September 17 published INSERT
  → G-20t2 discovers 2026-09
  → convert/package emits /schedule/2026-09/ + /2026-09/ stub + hub link
  → BLOCKER 1 clear after package (source not required for discovery)

Home continues to read crawl HTML
  → BLOCKER 2 unchanged
```

They are **independent**.

- SQL alone does **not** fix Home.
- Home Option D does **not** require September rows.
- Home Option B **without** September would still replace March with remaining **August** upcoming (e.g. 08-20, 08-23, 08-24 as of 2026-08-19) — that would stop the March lie but is still a source change, and heading remains `PRODUCT_DECISION_REQUIRED`.
- One magic pipeline (“INSERT then Home reads published”) only exists **after** Home is bound to Schedule CMS (B or C).

---

## 8. What each later phase needs

### DB write required

- Staging INSERT of 17 rows (`002`–`018`) under explicit approval.
- Rollback DELETE of those 17 only, if needed, separate approval.

Not required for this planning. Not required for Home Option D.

### Source implementation required

- **BLOCKER 1 public HTML:** package regen **after** INSERT (convert already discovers months from published rows).
- **BLOCKER 2:** Home Option D (or later B/C). Convert/postGenerate. Not SQL.

Not in this phase: FTP, DNS, SSL, Secret, Edge, `/admin`, `.env`.

---

## 9. Success criteria (when remediations are done)

**BLOCKER 1**

- Staging published September = 17 mapped Wix events
- `001` unpublished test remains
- production-shaped package contains `/schedule/2026-09/` and legacy `/2026-09/`
- NULL fields still NULL

**BLOCKER 2**

- Public Home must not present March or July cards as “THIS WEEK”
- If section remains visible: cards must match the product decision (not invented)

**Cutover**

- Both blockers cleared before production HTML upload / DNS
- `READY_FOR_REDIRECT_IMPLEMENTATION` still false until then

---

## 10. Rollback

| Layer | Rollback |
| --- | --- |
| SQL INSERT | DELETE `002`–`018` only; never `001`; never production |
| Home Option D | revert hide hook; March island would return — do not re-ship as THIS WEEK |
| Package | do not upload; keep previous preview tree |

Ambiguous SQL: stop, no retry, no cleanup, ask human.

---

## 11. `PUBLIC_CUTOVER_BLOCKERS_AFTER_PLAN`

Planning-time (historical): both true.

**Follow-on (2026-08-19):** operator INSERT **SUCCESS** + Home Option D hide **PASS**. Those two content blockers are **CLOSED**. See `gosaki-2026-09-batch-insert-db-write-packet.md` and `gosaki-home-stale-this-week-hide-for-initial-cutover.md`.

`/live-photo` remains `CLIENT_DECISION_REQUIRED` (not a public-cutover content blocker of this pair).

---

## 12. Next

**Primary:** `gosaki-2026-09-batch-insert-db-write-packet`
— preflight SQL file, authenticated SELECT of `001`, approval id, fail-closed transaction. **No execute** until operator one-shot approval.

**Parallel after product confirm:** Home Option D implementation (`READY_FOR_HOME_IMPLEMENTATION` stays false until that confirm).

Do not start redirects / DNS snapshot / production package as Primary.
