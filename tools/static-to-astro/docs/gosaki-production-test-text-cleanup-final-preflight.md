# G-20b — Gosaki production pre-release test text cleanup final preflight

**Phase:** `G-20b-gosaki-production-test-text-cleanup-final-preflight`  
**Status:** **complete** — beforeSnapshot verified; cleanup SQL templates ready; **no UPDATE / Save / reflection**  
**Date:** 2026-07-01  
**Base commit:** `7eda613`  
**Prior:** [gosaki-production-release-readiness-inventory.md](./gosaki-production-release-readiness-inventory.md) (G-20a)  
**Approval ID (execution):** `G-20b-gosaki-production-discography-test-text-cleanup`

| Check | Status |
| --- | --- |
| beforeSnapshot (read-only) | **PASS** |
| Test title rows | **2 only** |
| Cleanup method chosen | **operator SQL Editor — 2 strict UPDATEs** |
| Preflight SELECT SQL | **yes** |
| Cleanup UPDATE template | **yes** (not executed) |
| Rollback template | **yes** (not executed) |
| UI Save path | **not recommended** — see §4 |
| Cursor UPDATE / Save | **no** |
| Public reflection | **deferred** — G-20b2 or G-20c after cleanup execution |

---

## Gates

```txt
gosakiProductionTestTextCleanupFinalPreflightComplete: true
phase: G-20b-gosaki-production-test-text-cleanup-final-preflight
approvalId: G-20b-gosaki-production-discography-test-text-cleanup
readyForG20bTestTextCleanupExecution: true
readyForG20bTestTextCleanupExecutionResultDoc: false
readyForG20bPublicReflectionAfterCleanup: false
cursorSqlUpdateExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
g18g2ChainDoNotReSaveViaUi: true
g19b1ChainDoNotReSaveViaUi: true
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Do not execute UPDATE** in this phase. **Do not re-click** G-18g2 / G-19b1 Save UI.

---

## 1. Git state (verified)

| Item | Value |
| --- | --- |
| `HEAD` | `7eda613` |
| `origin/main` | `7eda613` |
| Working tree | clean at preflight start |

---

## 2. beforeSnapshot (read-only — verified)

**Scan:** 2026-07-01 — Supabase REST (anon) + live staging reference

| Check | Result |
| --- | --- |
| Staging host `kmjqppxjdnwwrtaeqjta` | **yes** |
| Production host `vsbvndwuajjhnzpohghh` | **not used** |
| `（テスト）` rows in `discography_tracks` | **2** |
| Total `discography_tracks` rows | **34** |
| `discography-002` track count | **8** |
| `discography-004` track count | **8** |
| Live `/discography/` shows test titles | **yes** (G-19d upload state) |

### Target row A — SKYLARK track 7 (G-18g2 PoC)

| Field | Value |
| --- | --- |
| **id** | `fd58cd6e-2fff-4ff2-96af-3087c469450b` |
| **discography_legacy_id** | `discography-002` |
| **track_number** | 7 |
| **title (before cleanup)** | `Like a Lover（テスト）` |
| **title (after cleanup)** | `Like a Lover` |

### Target row B — Ja-Jaaaaan! track 1 (G-19b1 PoC)

| Field | Value |
| --- | --- |
| **id** | `04e987a9-e251-4b0b-b860-21a61e711f8e` |
| **discography_legacy_id** | `discography-004` |
| **track_number** | 1 |
| **title (before cleanup)** | `Mary Ann（テスト）` |
| **title (after cleanup)** | `Mary Ann` |

**Note:** `public.discography_tracks` has **no** `updated_at` column on staging (REST select failed for `updated_at`). Cleanup verification uses `title` + strict `WHERE` only.

---

## 3. Cleanup method conclusion

### Recommended: **operator Supabase SQL Editor — 2 strict UPDATEs**

| Reason | Detail |
| --- | --- |
| Speed | 2 rows; no new Save slice implementation |
| Safety | `id` + `discography_legacy_id` + `track_number` + current `title` in `WHERE` |
| Scope | `rowsAffected` must be **1** per UPDATE; total **2** |
| Closed chains | Avoids re-opening G-18g2 / G-19b1 UI Save paths |
| Operator control | SQL Editor on staging project; explicit approval phrase |

**Execution venue:** Supabase Dashboard → SQL Editor → `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`).

**Not in this phase:** Cursor does not run UPDATE. Operator runs in **G-20b-execution** with approval ID `G-20b-gosaki-production-discography-test-text-cleanup`.

### Alternative rejected for pre-release: **staging admin UI Save**

| Issue | Detail |
| --- | --- |
| G-18g2 guards | Forward-only: `Like a Lover` → `Like a Lover（テスト）` |
| G-19b1 guards | Forward-only: `Mary Ann` → `Mary Ann（テスト）` |
| Closed chains | G-18g2 / G-19e / G-19b1 docs: **do not re-Save** without new approval |
| Missing slices | No reverse cleanup adapter (`（テスト）` → production title) |
| Ceremony | Would need G-20b-ui1/ui2 implementation + env arms + Preview — slower than SQL |
| Public reflection | Save path still requires regen + upload — same as SQL path |

**Conclusion:** Pre-release cleanup is **SQL-first**. Future routine edits may use UI slices; this one-off revert is not worth new Save adapters.

---

## 4. SQL artifacts

| File | Purpose | Execute in G-20b-preflight? |
| --- | --- | --- |
| `scripts/supabase/gosaki-production-test-text-cleanup-preflight-check.sql` | beforeSnapshot SELECT | operator may run SELECT only |
| `scripts/supabase/gosaki-production-test-text-cleanup-update.sql` | cleanup UPDATE template | **no** — G-20b-execution only |
| `scripts/supabase/gosaki-production-test-text-cleanup-rollback.sql` | restore test titles | **no** — separate approval only |

---

## 5. Rollback policy

| Item | Policy |
| --- | --- |
| **When** | Cleanup executed but operator needs to restore PoC test titles (wrong timing / re-staging QA) |
| **How** | `gosaki-production-test-text-cleanup-rollback.sql` — 2 strict UPDATEs (production → test) |
| **Approval** | **Separate** from cleanup — not bundled |
| **rowsAffected** | **1** per UPDATE; total **2** |
| **This phase** | Template only — **not executed** |

Rollback is **not** needed if cleanup is never executed.

---

## 6. afterVerification procedure (G-20b-execution)

Run **after** operator executes both cleanup UPDATEs (SELECT only for verification):

```sql
-- 1. No test titles remain
select count(*) as test_title_rows
from public.discography_tracks
where title like '%（テスト）%';
-- expect: 0

-- 2. Target rows restored
select id, discography_legacy_id, track_number, title
from public.discography_tracks
where id in (
  'fd58cd6e-2fff-4ff2-96af-3087c469450b',
  '04e987a9-e251-4b0b-b860-21a61e711f8e'
);
-- expect: Like a Lover / Mary Ann

-- 3. Album counts unchanged
select discography_legacy_id, count(*) as track_count
from public.discography_tracks
where discography_legacy_id in ('discography-002', 'discography-004')
group by discography_legacy_id
order by discography_legacy_id;
-- expect: 8 / 8

-- 4. Total rows unchanged
select count(*) as total from public.discography_tracks;
-- expect: 34
```

**Public reflection (separate phase after DB cleanup):**

1. `build-gosaki-staging-admin-package.mjs` — local regen
2. Verify local `discography/index.html` — no `（テスト）`
3. Operator manual upload `discography/index.html` only (CSS unchanged — G-19c pattern)
4. HTTP GET `…/discography/` — `Like a Lover` / `Mary Ann` present; test titles absent

---

## 7. Operator execution runbook (G-20b-execution — not now)

1. Confirm project `static-to-astro-cms-staging` / host `kmjqppxjdnwwrtaeqjta`
2. Run `gosaki-production-test-text-cleanup-preflight-check.sql` (SELECT) — must match beforeSnapshot
3. Operator approval: `承認します。この操作を1回だけ実行してください。`
4. Uncomment and run UPDATE A, confirm `rowsAffected: 1`
5. Uncomment and run UPDATE B, confirm `rowsAffected: 1`
6. Run afterVerification SELECTs (§6)
7. Record result doc — **G-20b-execution-result** (future phase)
8. **Do not** regen / FTP in same session without separate reflection approval

---

## 8. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| SQL UPDATE / INSERT / DELETE | **no** |
| Save / UI write | **no** |
| rollback SQL | **no** |
| package regen | **no** |
| FTP / upload | **no** |
| production / Sariswing | **no** |
| commit / push | **no** |

---

## 9. Next phases

| Phase | Scope |
| --- | --- |
| **G-20b-execution** | Operator runs 2 UPDATEs once + afterVerification + result doc |
| **G-20b-reflection** | Local regen + upload `discography/index.html` + HTTP verify |
| **G-20c** | Production cutover preflight (after staging DB + public clean) |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20b-gosaki-production-test-text-cleanup-final-preflight.mjs
```
