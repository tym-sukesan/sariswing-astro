# Gosaki current Wix → Astro content parity audit

**Phase:** `gosaki-current-wix-to-astro-content-parity-audit`
**Status:** **COMPLETE (read-only · parity FAIL for public cutover)**
**Date:** 2026-08-19
**HEAD:** `14ab858e46252a91503f9bfb12f58498481304bf`
**Prior:** `gosaki-wix-to-astro-url-compatibility-audit`
**Live Wix:** `https://www.gosaki-piano.com/`
**Astro evidence:** ciao-preview `https://gotosaki.ciao.jp/gosaki-piano/` + local ciao-preview `public-dist` + staging Kit SELECT-only (`kmjqppxjdnwwrtaeqjta`)
**Next:** content remediation (2026.09 + Home schedule). **Do not** implement redirects in this phase.

| Check | Status |
| --- | --- |
| Source / convert / `.htaccess` / package / FTP / DNS | **no** |
| DB write | **no** |
| SELECT-only staging | **yes** (anon, staging host gated) |
| Production Supabase `vsbvndwuajjhnzpohghh` | **not queried** |
| commit / push | **no** |

---

## Gates

```txt
gosakiCurrentWixToAstroContentParityAuditComplete: true
CONTENT_PARITY_AUDIT_RESULT: FAIL
WIX_2026_09_EVENT_COUNT: 17
ASTRO_SOT_2026_09_PUBLISHED: 0
2026_09_CLASSIFICATION: CONTENT_MISSING_FROM_SOT
HOME_SCHEDULE_PARITY: FAIL
HOME_STALE_CAUSE: crawl-fixture static island (not Supabase)
LIVE_PHOTO_CLASSIFICATION: CLIENT_DECISION_REQUIRED
REDIRECT_90_RECLASS: ARCHIVED_CONTENT 80 / MISSING_CONTENT 1 / CLIENT_DECISION_REQUIRED 8 / PURE_REDIRECT 1
PUBLIC_CUTOVER_BLOCKER: true
REDIRECT_IMPLEMENTATION_DEFERRED: true
READY_FOR_REDIRECT_IMPLEMENTATION: false
RECOMMENDED_NEXT_PRIMARY: gosaki-2026-09-and-home-schedule-content-remediation-planning
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

Stop here. Redirect / DNS snapshot are **not** next until upcoming public Schedule and Home this-week content are remediated.

---

## 1. 2026.09 Schedule (highest)

### Wix (`https://www.gosaki-piano.com/2026-09`)

HTTP **200**, title `2026.09 | saki-goto`. **17** events (plain-text capture, same pattern as G-20r1b August):

| # | Date | Title | Venue |
| --- | --- | --- | --- |
| 1 | 2026.09.01 (Tue) | Duo | 広尾 barおくむら |
| 2 | 2026.09.04 (Fri) | Duo | 高田馬場 Gate One |
| 3 | 2026.09.05 (Sat) | Jive at FIVE | 我孫子市民プラザ 多目的ホール |
| 4 | 2026.09.06 (Sun) | Good Swing Jazz Band & Orchestra | センター南 都筑公会堂 |
| 5 | 2026.09.07 (Mon) | ごさきりかこTrio | 池袋 Apple Jump |
| 6 | 2026.09.08 (Tue) | Trio PEPINO | 馬車道 Ben Tenuto |
| 7 | 2026.09.11 (Fri) | Set Sail | 池袋 Independence |
| 8 | 2026.09.12 (Sat) | 宮崎幸子trio | 吉祥寺 Strings |
| 9 | 2026.09.16 (Wed) | Duo | 新宿 PolkaDots |
| 10 | 2026.09.19 (Sat) | 新谷健介オノマトペ | 浅草 HUB |
| 11 | 2026.09.23 (Wed) | 宮益屋本店 | 浅草 HUB |
| 12 | 2026.09.24 (Thu) | Duo | 横須賀 ケント倶楽部 |
| 13 | 2026.09.25 (Fri) | Golden PODs | 桜木町 Dolphy |
| 14 | 2026.09.26 (Sat) | 丸山朝光ニューアルバム発売記念 | 用賀 キンのツボ |
| 15 | 2026.09.27 (Sun) | YOKOHAMA SWINGIN REVIEW | 関内 グレースバリ横浜関内 |
| 16 | 2026.09.28 (Mon) | 3 clarinet | 銀座 Swing |
| 17 | 2026.09.30 (Wed) | Duo | 自由が丘 Dana Point |

In Wix **primary nav** on every key page (URL audit). Sitemap listed.

### Astro / Supabase SoT (staging Kit, anon SELECT-only)

| Query | Result |
| --- | --- |
| Host | exact `kmjqppxjdnwwrtaeqjta` (production ref STOP) |
| `schedules` `site_slug=gosaki-piano` `published=true` | **74** rows |
| Months present | **2026-03 … 2026-08 only** (13/10/12/11/14/14) |
| `date`/`month` **2026-09** published | **0** |
| `show_on_home=true` published | **0** |
| `schedule-2026-09-001` visible to anon | **0** (RLS hides unpublished) |

Docs (prior publication check): `schedule-2026-09-001` is G-22e **test** (`published=false`, 2026-09-12 テストイベント). That is **not** the 17 Wix public gigs.

Fixture crawl has **no** `2026-09.html`. Ciao hub HTML: `scheduleDataSource=supabase` · links **2026.08 … 2026.03** · **no 2026.09**.

### Why `/schedule/2026-09/` and `/2026-09` and hub 09 are absent

G-20t2: months + legacy stubs are **auto-discovered from published schedule rows** (`optionalMonthOverride: null`). Zero published September rows → no month page, no legacy stub, no hub link.

A production package **now** (`deployBase=/`) would bake the **same** 03–08 set. Not a ciao-preview-only bug.

### Classification

```txt
2026_09_CLASSIFICATION: CONTENT_MISSING_FROM_SOT
```

| Label | Applies? |
| --- | --- |
| CONTENT_PRESENT_NOT_GENERATED | **no** — not in published SoT |
| CONTENT_MISSING_FROM_SOT | **yes** — 17 live Wix events vs 0 published rows |
| UNPUBLISHED_CONTENT | **only** the G-22 test row `schedule-2026-09-001` (must **not** be published as a stand-in) |
| EXPECTED_BEHAVIOR | generator skip is expected **given** empty published month; the **content gap** is not acceptable for cutover |
| OTHER | — |

```txt
PUBLIC_CUTOVER_BLOCKER: upcoming public Schedule (Wix /2026-09, 17 events) is absent from Astro SoT and all generated routes
```

---

## 2. Home Schedule parity

| Surface | “THIS WEEK'S LIVE SCHEDULE” cards |
| --- | --- |
| Live Wix Home | **7月15日 / 16日 / 20日 / 22日** (4 cards) |
| ciao-preview Home + local `public-dist/index.html` | **3月25日 / 27日 / 31日** (3 cards: 浅草HUB / 用賀キンのツボ / 馬車道 Ben Tenuto) |
| Fixture `fixtures/gosaki-piano/index.html` | **same March cards** |

### Source of truth

Home this-week block is **still the Wix crawl HTML** (repeater `comp-m8y53dj5`). It is **not** driven by Supabase.

- `schedules.show_on_home` published count = **0**
- `home-schedule-sync.mjs` targets `section.home-schedule` (Sariswing-shaped). Gosaki Wix export does **not** use that markup. Convert/build does **not** replace the Home repeater from CMS.

### Why ciao is older

G-7d live crawl snapshot (March-era Home) is the fixture. Wix Home was later edited to July. Ciao-preview regen **reuses the same fixture**, so March remains. Not a DNS/FTP issue.

### Production package now

**Same March Home.** No recrawl and no Home CMS bind → same island.

### Verdict

```txt
HOME_SCHEDULE_PARITY: FAIL
HOME_STALE_CAUSE: static crawl fixture leftover (not Supabase; not intended live CMS)
```

Wix Home itself is also not “this week” vs calendar 2026-08-19 (it shows mid-July). The **cutover risk** is shipping **March** as “this week” on www — worse than current Wix July.

```txt
PUBLIC_CUTOVER_BLOCKER: Home “THIS WEEK'S LIVE SCHEDULE” would publish stale March 2026 events
```

---

## 3. `/live-photo`

| Item | Finding |
| --- | --- |
| Wix HTTP | **200**, title `Live photo \| saki-goto` |
| Primary nav | **no** (URL audit) |
| Sitemap | **yes** (`pages-sitemap.xml`) |
| Content | Real galleries: **「2018 , December〜」** and **「2020 , January〜」**, UI `1/11`, `press to zoom` |
| Images | Wix CDN `26e086_*.jpg` (gallery) + SNS icons. **Not** in `assets/gosaki-piano/wix-local/` |
| Repo / Astro route | **none**. No migration/deprecation record |
| ciao-preview | **404** |

```txt
LIVE_PHOTO_CLASSIFICATION: CLIENT_DECISION_REQUIRED
```

Not `404_ACCEPTABLE` (real photos). Not `ALREADY_SUPPORTED`. Not `REDIRECT` (no target decided). `MIGRATE` is an option **after** client says keep the gallery.

---

## 4. 90 REDIRECT_REQUIRED reclass

Do **not** 301 until missing/decision items are handled. Do **not** invent redirect targets.

| Class | Count | Meaning |
| --- | --- | --- |
| **ARCHIVED_CONTENT** | **80** | Historical Wix month pages (2019–2025, 2026-01/02, JP slugs, variants). Not in current published SoT (03–08). Archive vs hub-only is a later product choice |
| **MISSING_CONTENT** | **1** | `/2026-09` — 17 live events, 0 published rows |
| **CLIENT_DECISION_REQUIRED** | **8** | `/live-photo`, `/band`, `/band-1`, `/event-list`, 4× `/event-details/*` |
| **PURE_REDIRECT** | **1** | `/home` — Wix duplicate of `/` (canonical already origin). Content lives on KEEP Home |

### Focus

| Old URL | Content on Wix | On Astro | Reclass |
| --- | --- | --- | --- |
| Schedule months (archive) | Full month pages | Only 2026-03…08 via Supabase | ARCHIVED_CONTENT |
| `/2026-09` | 17 upcoming events | none | MISSING_CONTENT |
| Event list/details | Wix Events app (sample detail **2025-04-05**, チケット販売なし) | no `/event-*` routes | CLIENT_DECISION_REQUIRED |
| `/band` `/band-1` | Thin/old Wix band pages (not in nav) | About **Bands / Projects** (5 JSON bands) exists | CLIENT_DECISION_REQUIRED (do not assume = About) |
| `/home` | Same site chrome as `/` | `/` KEEP | PURE_REDIRECT |
| `/live-photo` | Two dated galleries | none | CLIENT_DECISION_REQUIRED |

---

## 5. Site-wide (nav ≠ unused)

| Area | Wix | Astro / ciao | Parity note |
| --- | --- | --- | --- |
| Home | July this-week + KV | March this-week + localized KV + **YouTube** inject | Home schedule **FAIL**; YouTube is extra CMS (not missing) |
| About | Wix about | Converted + **Bands / Projects** (5) | Page present; `/band` still separate Wix URL |
| Schedule hub | Wix `/schedule` (catch-all page) | Generated hub 03–08 | Missing **09** |
| Month pages | `/YYYY-MM` many years | Canonical `/schedule/YYYY-MM/` 03–08 + stubs | Upcoming 09 missing; archives not in CMS |
| Discography | Wix page | Converted KEEP | Page present (not field-audited here) |
| Contact | Wix / HubSpot history | KEEP + HubSpot path | Page present |
| Link | Wix | KEEP | Page present |
| YouTube | not the Home SoT for this-week | `youtube-nocookie` `I-eY9YMq9GI` on Home | Added via `site_embeds`; not a Wix loss |
| Live photo | galleries 2018 / 2020 | 404 | missing + client decision |
| Band public pages | `/band` `/band-1` HTTP 200 | no routes; About has bands | client decision |

Hidden public HTTP 200 still counts: `/home`, `/schedule`, `/live-photo`, Events, Band, archives.

---

## 6. Public cutover buckets

| Item | Bucket |
| --- | --- |
| Wix `/2026-09` 17 events absent from published SoT / all Astro routes | **PUBLIC_CUTOVER_BLOCKER** |
| Home this-week March vs live Wix July (would ship March on www) | **PUBLIC_CUTOVER_BLOCKER** |
| Seed/publish real 2026.09 (not G-22 test) + rebuild month/hub/stub | **DO_BEFORE_CUTOVER** |
| Bind or recrawl Home this-week (or hide the heading until live) | **DO_BEFORE_CUTOVER** |
| `/live-photo` keep/migrate vs drop | **CLIENT_DECISION** |
| `/band` `/band-1` vs About bands | **CLIENT_DECISION** |
| Wix Events `/event-list` + 4 details | **CLIENT_DECISION** |
| 80 archive month URLs (301 to hub vs keep 404 vs import) | **CLIENT_DECISION** (redirect **after** content) |
| `/home` → `/` | **REDIRECT_ONLY** (after content blockers) |
| YouTube inject / About bands extra | **NO_ACTION** (not a Wix loss) |
| G-22 unpublished `schedule-2026-09-001` | **NO_ACTION** / do **not** publish as 09 stand-in |
| DNS snapshot / Apache map | **POST_LAUNCH** relative to this audit — **deferred** until blockers |

---

## 7. Content work before any redirect

1. **2026.09:** import/publish the **17** Wix events into staging `schedules` (`published=true`, `site_slug=gosaki-piano`), then regenerate so `/schedule/2026-09/` + stub + hub appear. Do not use `schedule-2026-09-001` test row.
2. **Home this-week:** recrawl Home, or CMS-bind `show_on_home`, or remove/replace the frozen repeater. Confirm production bake would not emit March as “this week”.
3. Then client decisions on live-photo / band / Events / archives.
4. Redirect implementation **after** 1–2.

```txt
READY_FOR_REDIRECT_IMPLEMENTATION: false
```

---

## 8. This phase did not

Source change · DB write · FTP · redirect / `.htaccess` · package generate · DNS/SSL · Secret/Edge · commit/push.

SELECT-only staging schedules. Live Wix/ciao GET. Docs only.

---

## 9. Evidence pointers

- URL inventory: `gosaki-wix-to-astro-url-compatibility-audit.md`
- Month discovery: `scripts/lib/schedule-month-discovery.mjs` (`optionalMonthOverride: null`)
- Home sync unused for Wix repeater: `scripts/lib/home-schedule-sync.mjs`
- Staging published months: this audit SELECT (74 rows, 03–08)
- G-22 unpublished Sept test: `gosaki-production-publication-data-live-readonly-check.md` / G-22e docs
