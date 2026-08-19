# Gosaki Wix → Astro legacy redirect remediation planning

**Phase:** `gosaki-wix-legacy-redirect-remediation-planning`
**Status:** **COMPLETE (planning / read-only · no implementation)**
**Date:** 2026-08-19
**HEAD:** `fb6c567e2bf24a3f1b512edb12c02410a0d35f4f` (= `origin/main`, working tree clean)
**Prior:** URL compatibility audit + content parity audit + 2026-09 INSERT CLOSED + Home Option D hide committed
**Live Wix:** `https://www.gosaki-piano.com/`
**Preview:** `https://gotosaki.ciao.jp/gosaki-piano/` (`deployBase=/gosaki-piano/`)
**Production intended:** `https://www.gosaki-piano.com/` (`deployBase=/`)

| Check | Status |
| --- | --- |
| Source / convert / `.htaccess` create | **no** |
| FTP / package generate / DNS / SSL | **no** |
| DB write / SQL | **no** |
| commit / push | **no** |
| Read-only Wix / Lolipop docs | **yes** |

---

## Gates

```txt
REDIRECT_PLANNING_RESULT: COMPLETE
OLD_WIX_URL_TOTAL: 111
KEEP_AS_STATIC_ROUTE: 13
REDIRECT_301: 81
REDIRECT_302: 0
CLIENT_DECISION_REQUIRED: 8
404_ACCEPTABLE: 9
NO_ACTION: 0 (as URL class; DirectorySlash on KEEP is implicit)
MISSING_CONTENT_/2026-09: SUPERSEDED (published 17; KEEP_AS_STATIC_ROUTE after package regen)
READY_FOR_REDIRECT_IMPLEMENTATION: false
PUBLIC_CUTOVER_BLOCKER_FROM_REDIRECT_GAPS: false
RECOMMENDED_IMPLEMENTATION: Option C hybrid
RECOMMENDED_NEXT_PRIMARY: gosaki-ciao-jp-preview-package-regen-after-content-blockers
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

Do **not** copy the old “90 REDIRECT_REQUIRED” number forward. `/2026-09` is no longer MISSING_CONTENT.

---

## 1. What changed since the audits

| Item | URL audit (14ab858e) | Content parity | **Now (fb6c567e)** |
| --- | --- | --- | --- |
| Inventory | 111 Wix canonicals | same | **same 111** (no recrawl of sitemap) |
| ciao 301→200 | 12 (KEEP 6 + legacy 03–08) | same | live preview package **still those 12** (stale bake) |
| `/2026-09` | REDIRECT_REQUIRED / MISSING | 0 published rows | **17 published**; `/schedule/2026-09/` + legacy `/2026-09/` **generatable from HEAD**. Live ciao still **404** until package regen |
| Home THIS WEEK | n/a | March island BLOCKER | Option D hide **in source**. Live preview still old until regen |
| 90 redirect candidates | preserve-all | 80 archive / 1 missing / 8 client / 1 `/home` | missing **closed**; 80 archive **not** hub-dump; `/home` locked 301 |

Published SoT months (staging Kit, last confirmed build-read): **2026-03 … 2026-09** only. Archives 2019–2025 and 2026-01/02 are **not** generated.

---

## 2. Proposed action counts (this planning)

| PROPOSED_ACTION | Count | Meaning |
| --- | --- | --- |
| **KEEP_AS_STATIC_ROUTE** | **13** | 6 primary pages + 6 legacy stubs `2026-03`…`08` + **`/2026-09` after regen** |
| **REDIRECT_301** | **81** | `/home` (1) + archive month URLs (80). **Not** all implementable before cutover |
| **REDIRECT_302** | **0** | Permanent moves only |
| **CLIENT_DECISION_REQUIRED** | **8** | `/live-photo`, `/band`, `/band-1`, `/event-list`, 4× `/event-details/*` |
| **404_ACCEPTABLE** | **9** | `複製-*` (4), `/aitemu*` (4), `/blank` |
| **NO_ACTION** | **0** | Unused as a URL class. KEEP already covers “no extra rule” |

`.html` stays **out of legacy scope** (Wix 400; no inbound evidence). SNS / `wixsite.com` are outbound, not redirect targets.

---

## 3. Trailing slash / DirectorySlash (not a defect)

| Host | Canonical slash | Other slash form |
| --- | --- | --- |
| Wix www | **no-slash** | slash → **301** → no-slash |
| Astro on Lolipop (ciao proven) | **trailing slash** | no-slash → **301** → slash **when the directory exists** |

Criterion: old Wix canonical **eventually** reaches the Astro equivalent. Opposite slash policy is expected.

**Loop / double-hop rules (locked):**

- Do **not** redirect `/home` to `/home/` (DirectorySlash would loop).
- `/home` 301 target must be **`/`** (production) or **`/gosaki-piano/`** (preview only), **with** the Astro trailing slash already on the destination.
- Legacy stubs `/2026-0N/` are **200** “moved” HTML, not 301 to `/schedule/2026-0N/`. One hop (DirectorySlash) then a click. Optional later Apache 301 stub→canonical is SEO polish, **not** required for cutover, and must not bounce back.
- After DNS cutover, Wix’s slash→no-slash **disappears**. Incoming `/about` and `/about/` both work via DirectorySlash + KEEP page. No extra rule.

---

## 4. `/2026-09` (re-evaluated)

| Field | Value |
| --- | --- |
| OLD_WIX_PATH | `/2026-09` (nav + sitemap; Wix **200**, 17 events) |
| ASTRO_EQUIVALENT | `/schedule/2026-09/` (canonical) + legacy `/2026-09/` |
| CURRENT_ASTRO_STATUS | **HEAD:** generatable (published 17). **Live ciao:** still **404** (package not regenerated after INSERT) |
| PROPOSED_ACTION | **KEEP_AS_STATIC_ROUTE** |
| TARGET_IF_REDIRECT | **none required** once the stub is in the bake |
| IMPLEMENTATION_LAYER | existing `applyLegacyMonthStubs` + G-20t2 month discovery (`optionalMonthOverride: null`) |
| CUTOVER | **DO_BEFORE_CUTOVER** = **package regen + upload**, not a new 301 |

Do **not** add Apache `/2026-09` → `/schedule/` as a substitute for baking the month. Hub dump would hide the 17 events.

Optional later: 301 `/2026-09/` stub → `/schedule/2026-09/` (same pattern as 03–08). POST_LAUNCH SEO polish.

---

## 5. `/home`

Live Wix `/home` **200**, **not** in sitemap. Body is the Home “THIS WEEK'S LIVE SCHEDULE” block (July cards on Wix). Content parity: duplicate of `/`.

| Field | Value |
| --- | --- |
| PROPOSED_ACTION | **REDIRECT_301** |
| TARGET_IF_REDIRECT | **`/`** (production `https://www.gosaki-piano.com/`) |
| IMPLEMENTATION_LAYER | **Apache `.htaccess`** (not a static `/home/` stub) |
| Preview | **must not** reuse the production rule as-is (`RewriteBase` / prefix `/gosaki-piano/`) |
| CUTOVER | **DO_BEFORE_CUTOVER** (recommended). **Not** a `PUBLIC_CUTOVER_BLOCKER` (not in nav; canonical already `/`) |

Do not use 302. Do not 301 `/home` → `/home/`.

---

## 6. Archived Schedule 80 — do **not** hub-dump

All **80** former `REDIRECT_REQUIRED` archives are **month listing URLs**, not Wix Events **event-detail** URLs. Event-details are the separate 4 CLIENT rows.

| Subtype | Count | Examples | Can a static `/YYYY-MM/` folder catch it? |
| --- | --- | --- | --- |
| Padded `/YYYY-MM` | 21 | `/2026-01`, `/2025-12`, `/2019-12` | Yes, **if** that month were generated |
| Unpadded `/YYYY-M` | 39 | `/2022-3`, `/2019-5` | **No** — Apache required |
| JP `/YYYY年N月` | 15 | `/2020年8月` … `/2022年1月` | **No** — UTF-8 Apache required. **No latin twin** in the inventory |
| Variant suffix | 4 | `/2023-7-2`, `/2023-6-2`, `/2019-2-1`, `/2019-1-1` | **No** |
| Practice slug | 1 | `/2022-5-練習` | **No** (alias of `/2022-5` → month `2022-05`) |

**79 unique months**, **1 alias pair** (`/2022-5` + `/2022-5-練習` → `2022-05`).

**Locked mapping (semantic):**

```txt
old Wix month URL  →  /schedule/YYYY-MM/
```

**Not** `/schedule/` hub. Hub-dump is the fallback of last resort, not the plan.

**Locked non-goals for cutover:**

- Do **not** import 80 Wix archive months into `public.schedules` as a launch gate.
- Do **not** turn on `optionalMonthOverride` for 79 empty months just to catch 301s (empty month page = soft-404).
- Do **not** 301 archive URLs today into `/schedule/YYYY-MM/` that **404**. That is worse than leaving 404.

**Implementation timing:** **POST_LAUNCH**. Until a month exists in published SoT (or an operator later accepts hub fallback), **404 is acceptable** for these 80.

JP / unpadded / variant **cannot** be rescued by more Astro stubs alone. They need Apache **after** a real landing page exists.

### Archive path list (80) → month target

**Padded (21)** → `/schedule/{YYYY-MM}/`
`/2019-10` `/2019-11` `/2019-12` `/2022-10` `/2022-11` `/2022-12` `/2023-10` `/2023-11` `/2023-12` `/2024-10` `/2024-11` `/2024-12` `/2025-03` `/2025-05` `/2025-06` `/2025-08` `/2025-10` `/2025-11` `/2025-12` `/2026-01` `/2026-02`

**Unpadded (39)** → padded month canonical
`/2019-3` `/2019-4` `/2019-5` `/2019-6` `/2019-7` `/2019-8` `/2020-1` `/2020-2` `/2020-3` `/2020-4` `/2022-2` `/2022-3` `/2022-4` `/2022-5` `/2022-6` `/2022-7` `/2022-8` `/2022-9` `/2023-1` `/2023-2` `/2023-3` `/2023-4` `/2023-5` `/2023-8` `/2023-9` `/2024-1` `/2024-2` `/2024-3` `/2024-4` `/2024-5` `/2024-6` `/2024-7` `/2024-8` `/2024-9` `/2025-1` `/2025-2` `/2025-4` `/2025-7` `/2025-9`

**JP (15)** → `/schedule/2020-07` … `2020-12`, `/schedule/2021-05` … `2021-12`, `/schedule/2022-01/`
Paths: `/2020年7月` `/2020年8月` `/2020年9月` `/2020年10月` `/2020年11月` `/2020年12月` `/2021年5月` `/2021年6月` `/2021年7月` `/2021年8月` `/2021年9月` `/2021年10月` `/2021年11月` `/2021年12月` `/2022年1月`

**Variant (4)** → `/schedule/2023-07/` `/schedule/2023-06/` `/schedule/2019-02/` `/schedule/2019-01/`
`/2023-7-2` `/2023-6-2` `/2019-2-1` `/2019-1-1`

**Practice (1)** → `/schedule/2022-05/`
`/2022-5-練習`

---

## 7. CLIENT_DECISION_REQUIRED (8) — options, not locked targets

None of these are in current primary nav. **Gosaki public cutover does not require a client answer** on them. Wrong 301 is worse than 404.

| OLD_WIX_PATH | Wix (2026-08-19) | Astro | A migrate | B 301 (candidate only) | C 404/410 | Must before cutover? |
| --- | --- | --- | --- | --- | --- | --- |
| `/live-photo` | Real galleries 2018-12 / 2020-01 | no route | possible (assets not in wix-local) | `/` would drop the photos | honest if client drops gallery | **no** |
| `/band` | Thin “Music” leftover | About has Bands/Projects (different page) | no | `/about/` is **not** proven equivalent | reasonable | **no** |
| `/band-1` | Wix template dummy “My Hip Event, MM/DD/YY” | none | no | `/about/` still not equivalent | **recommended suggestion** (not locked) | **no** |
| `/event-list` | Wix Events app “開催予定のイベント” | none | rebuild Events | `/schedule/` is a different product | possible | **no** |
| `/event-details/gotosakiburajirutorio-1` | **2025-04-05** 草加 Sugar Hill | no `/schedule/2025-04/` | no | semantic `/schedule/2025-04/` **404 today** | possible | **no** |
| `/event-details/gotosakiburajirutorio` | Wix Events Brazil trio (pair) | none | no | same as above; **do not lock** | possible | **no** |
| `/event-details/gaokiyukeiduo` | **2019-01-07**, tickets closed | no `/schedule/2019-01/` | no | month 301 would 404 | **410/404 stronger** than hub | **no** |
| `/event-details/matsukiriswing-three` | **2019-01-03** 浅草 HUB, tickets closed | no `/schedule/2019-01/` | no | same | **410/404 stronger** than hub | **no** |

Do **not** 301 Events to `/schedule/` as the default. That is hub-dump of a different app.

---

## 8. 404_ACCEPTABLE (9) — do not 301

`/複製-2020年12月` `/複製-2021年1月` `/複製-2021年2月` `/複製-2021年3月`
`/aitemu` `/aitemu/this-is-a-title-01` `/aitemu/this-is-a-title-02` `/aitemu/this-is-a-title-03`
`/blank`

301 → Home or Schedule would mint **soft-404s**. Keep **404**. Optional **410** POST_LAUNCH if Search Console shows junk indexed. **Not this phase.**

---

## 9. KEEP_AS_STATIC_ROUTE (13) — mapping

| OLD_WIX_PATH | CURRENT_WIX | ASTRO_EQUIVALENT | CURRENT_ASTRO | PROPOSED | TARGET | LAYER | REASON |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 200 | `/` | ciao 301→200 | KEEP | — | DirectorySlash | Home |
| `/about` | 200 | `/about/` | ciao 301→200 | KEEP | — | DirectorySlash | |
| `/contact` | 200 | `/contact/` | ciao 301→200 | KEEP | — | DirectorySlash | |
| `/discography` | 200 | `/discography/` | ciao 301→200 | KEEP | — | DirectorySlash | |
| `/link` | 200 | `/link/` | ciao 301→200 | KEEP | — | DirectorySlash | |
| `/schedule` | 200 | `/schedule/` | ciao 301→200 | KEEP | — | DirectorySlash | Hub (not in Wix sitemap; live 200) |
| `/2026-03` … `/2026-08` | 200 | `/schedule/2026-0N/` | ciao 301→200 stub | KEEP | — | legacy stub | 6 URLs |
| `/2026-09` | 200 | `/schedule/2026-09/` | HEAD generatable; live ciao 404 | KEEP | — | stub after regen | see §4 |

---

## 10. Implementation comparison (not executed)

`.htaccess` ≠ `.ftpaccess`.
`.htaccess` = Apache web behavior (redirects). Economy uses **Apache**. Official manual: [アドレスの転送](https://lolipop.jp/manual/hp/htaccess-04/) (`Redirect permanent`, FTP upload, **permission 604**, trailing newline; bad syntax → **500**).
`.ftpaccess` = **FTP IP allowlist**. Panel can **overwrite/delete** operator-uploaded `.ftpaccess`. **Never edit/delete** (G-7f1). Redirects do **not** belong there.

| | A Apache `.htaccess` 301 | B Astro/static legacy stub | C Hybrid |
| --- | --- | --- | --- |
| Lolipop Economy | **Yes** (Apache) | Yes (already used) | **Yes** |
| FTP-only intro | Yes (manual FileZilla; auto FTP still **suspended**) | Via public-dist upload | Yes |
| `deployBase=/` | Rules at **www docroot** | Stubs at `/YYYY-MM/` | Production default |
| Preview `/gosaki-piano/` | Production `Redirect /home /` would **miss** or hit **wrong vhost**. Need **separate** `RewriteBase /gosaki-piano/` | Stubs work under deployBase | **Do not copy production htaccess onto ciao** |
| True 301 for crawlers | **Yes** | Stub is **200** + canonical/noindex | Use A when SEO 301 is required; B when DirectorySlash+folder is enough |
| Rollback | Rename/remove `.htaccess` (500 risk if leftover junk) | Rebuild package without stub | Prefer small `/home` rule first |
| Package | **Do not** bake one htaccess for both profiles | Already in public-dist | Profile-specific htaccess **outside** shared dist **or** two artifacts |
| Root / `.ftpaccess` danger | Putting `Redirect /` at FTP login root is catastrophic. Place **only** in the www docroot. Never touch `.ftpaccess` | Low | Same as A |
| Manual FTP workflow | Extra file next to `index.html` at **production** root after package upload | Current G-7g package | **Recommended** |

**Recommended: Option C**

1. **KEEP + DirectorySlash + existing stubs** for current published months (03–09 after regen).
2. **Apache 301** for `/home` (first redirect slice).
3. **Apache 301** for JP / unpadded / variant **later**, only toward a **real** `/schedule/YYYY-MM/`.
4. **Do not** replace stubs with 301 until operator wants SEO consolidation.

Syntax preference for implementation phase (not written now): `RewriteRule` with exact path + `[R=301,L]`, not a site-wide `Redirect /`.

---

## 11. Preview vs production

| Concern | ciao-preview | production www |
| --- | --- | --- |
| Can verify DirectorySlash | **Yes** (already 12 PASS) | Expected same Apache |
| Can verify KEEP pages | **Yes** | After production upload |
| Can verify `/2026-09` stub | **After preview regen** | After production regen |
| Can verify `/home` 301 | Only with a **preview-scoped** htaccess (`/gosaki-piano/home` → `/gosaki-piano/`) | Final: `/home` → `https://www.gosaki-piano.com/` |
| Can verify archive 301s | Not until landing pages exist | Same |
| INDEX / GSC | Preview is **noindex** | **Production only** |
| DNS / apex / www | N/A | **Production only** |

**Do not** apply production redirect files to `gotosaki.ciao.jp/gosaki-piano/`.

---

## 12. Cutover buckets

### PUBLIC_CUTOVER_BLOCKER

**None from this redirect inventory.**

Content blockers (Sept missing, Home March THIS WEEK) are **CLOSED** in source. Remaining cutover work is **bake + upload**, not “every old URL must 301”.

Live ciao 404 on `/2026-09` is a **stale package**, not a missing-redirect design.

### DO_BEFORE_CUTOVER

1. Regen + upload packages so **`/schedule/2026-09/`** and **`/2026-09/`** exist (preview then production).
2. Keep Lolipop **DirectorySlash**.
3. **Recommended:** production `.htaccess` **`/home` → `/` 301** (separate safety packet; not this phase).
4. Do **not** add `.html` rules. Do **not** redirect SNS / wixsite.
5. Do **not** 301 the 80 archives into missing months.
6. Do **not** 301 dummy `複製-*` / `aitemu` / `blank`.

### CLIENT_DECISION

The 8 URLs in §7. Not launch-blocking.

### POST_LAUNCH

- Archive 80 Apache map (after import **or** explicit hub-fallback approval).
- Optional stub→canonical 301 for `/2026-0N/`.
- Optional 410 for dummy leftovers.
- Client 8 after answers.

### NO_ACTION

- KEEP 13 once `/2026-09` is baked.
- DirectorySlash polarity vs Wix.
- `.html`.
- `.ftpaccess`.

**URLs that must not 404 on DNS day** (user-facing current site): `/` about discography contact link `/schedule` `/2026-03`…`/2026-09`.
**URLs that may 404 on DNS day:** 80 archives, 8 client pages, 9 dummies, `/home` (until Apache slice). `/home` 404 is mildly ugly; still not a publication blocker.

---

## 13. Operator / client questions

**Operator (can lock `/home` without client):**

1. Confirm `/home` → `/` **301** on production before DNS? (Planning default: **yes, recommended**.)
2. Preview-scoped `/gosaki-piano/home` test rule — want it, or production-only?
3. First redirect **slice = `/home` only** (recommended) vs wait and ship a bigger map?

**Client (not required before cutover):**

4. `/live-photo`: migrate / 301 to `/` / drop (404)?
5. `/band` `/band-1`: 301 to `/about/` / 404?
6. Wix Events (list + 4 details): keep as Events / 301 to a **specific month** / 404 or 410?
7. Historical month URLs: import later / leave 404 / later 301 to month / last-resort hub?

---

## 14. This phase did not

Source change · `.htaccess` file · FTP · package generate · DB · DNS/SSL · Secret/Edge · commit/push.

---

## 15. Next

**Primary:** `gosaki-ciao-jp-preview-package-regen-after-content-blockers`
so live preview matches HEAD (September 17 + Home hide + `/2026-09/` stub).

Redirect **implementation** stays **false** until a dedicated `/home` (or larger) Apache safety packet. `readyForAnyFutureFtpApply: false`.
