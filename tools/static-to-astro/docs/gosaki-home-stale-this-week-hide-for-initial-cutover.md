# Gosaki Home stale THIS WEEK hide for initial cutover (Option D)

**Phase:** `gosaki-home-stale-this-week-hide-for-initial-cutover`
**Status:** **COMPLETE / PASS (source + local verify · no package 本生成 · no commit)**
**Date:** 2026-08-19
**HEAD baseline:** `14ab858e46252a91503f9bfb12f58498481304bf`
**Prior:** `gosaki-2026-09-batch-insert-db-write-packet` (operator SQL **SUCCESS** on staging)
**Product:** `INITIAL_PUBLIC_CUTOVER_HOME_SCHEDULE = Option D`

| Check | Status |
| --- | --- |
| DB write / forward SQL re-run / rollback | **no** |
| FTP / package 本生成 / DNS / SSL / Secret / Edge | **no** |
| commit / push | **no** |
| Home source hide | **yes** (Gosaki-only convert hook) |
| Schedule hub / month generators | **unchanged** |

---

## Gates

```txt
HOME_REMEDIATION_RESULT: PASS
DB_WRITE_RECORDED: SUCCESS (operator one-shot · CLOSED)
INITIAL_PUBLIC_CUTOVER_HOME_SCHEDULE: Option D
PUBLIC_CUTOVER_BLOCKER_SEPTEMBER_MISSING: CLOSED
PUBLIC_CUTOVER_BLOCKER_HOME_STALE_THIS_WEEK: CLOSED
PUBLIC_CUTOVER_BLOCKERS remaining: none from these two content items
SQL_REEXECUTE_FORBIDDEN: true
ROLLBACK_EXECUTED: false
CURSOR_DB_WRITE_EXECUTED: false
PACKAGE_GENERATE_EXECUTED: false
READY_FOR_COMMIT_PUSH: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-content-blockers-closed-commit-push
```

---

## Operator DB write (recorded · not re-run)

Staging `kmjqppxjdnwwrtaeqjta` · `gosaki-piano` · operator ran the packet **once**. Cursor did not execute SQL.

```txt
published_total = 91
published_september = 17
published_pre_september = 74
ids_002_018 = 17
test_001_unpublished = 1
sort_80_96 = 17
existing74_max_updated_at = 2026-07-21 15:02:48.475629+00
all_ok = true
```

Do **not** re-run forward SQL. Do **not** run rollback. `001` remains unpublished G-22e test.

---

## Home change (Option D)

Convert postGenerate (Gosaki adapter only), **before** YouTube inject:

1. Remove `#comp-m8y5bex0` (THIS WEEK heading)
2. Remove `#comp-m8y5l5fs` (horizontal rule)
3. Remove `#comp-m8y53dj5` (March repeater cards)
4. Insert `<!--GOSAKI_HOME_SCHEDULE_SLOT-->` for a later published upcoming-N section
5. Mark leftover `#comp-m8y3dzb6` with `gosaki-home-this-week-hidden` and collapse Wix mesh via site-specific CSS

YouTube placement: after the schedule slot (fallback: leftover repeater, then section). Never append after footer.

Same hide on staging / ciao-preview / production (all profiles share this convert hook). Kit core `site-generator-hooks.mjs` / `astro-generator.mjs` do not import the hide module.

---

## Verify

`npm run verify:gosaki-home-stale-this-week-hide` (from `tools/static-to-astro`) — **69 passed, 0 failed**

- Synthetic + fixture Home: no THIS WEEK / March cards; no empty heading; header / KV / footer / YouTube kept
- html-baseline YouTube-without-hide still exact
- September build-read: published 91 / September 17 / `002`–`018` / `001` unpublished
- `/schedule/2026-09/` + legacy `/2026-09/` generatable via existing data-pages + stubs
- staging / ciao-preview / production `--dry-run` PASS
- Admin still injects on postGenerate; no new `wixstatic` on Home hide path

Package 本生成 was **not** run. Live preview still has the previous package until a later regen + operator upload.

---

## PUBLIC_CUTOVER_BLOCKERS remaining

These two content blockers are **CLOSED**:

1. September missing from published SoT
2. Home stale THIS WEEK (March crawl)

Not this phase: URL redirects, DNS/SSL, production package, FTP auto-apply, upcoming-N Home bind (`PRODUCT_DECISION_REQUIRED` for THIS WEEK vs upcoming-N).

---

## Next

**Primary:** `gosaki-content-blockers-closed-commit-push`
Then ciao-preview / staging package regen so live preview reflects September months + hidden Home. Still no FTP auto-apply.
