# G-19b1-execution-readiness — Gosaki Discography tracklist generic single-title Save execution readiness

**Phase:** `G-19b1-execution-readiness-gosaki-discography-tracklist-generic-single-title-save`  
**Status:** **complete** — operator manual Save runbook ready; **Cursor did not Save / DB write**  
**Date:** 2026-07-01  
**Base commit:** `0112906`  
**Prior:** G-19b1-preflight (`gosaki-discography-g19b1-tracklist-single-title-save-final-preflight.md`)  
**Approval ID (execution):** `G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice`

| Check | Status |
| --- | --- |
| Final preflight complete | **yes** — commit `0112906` |
| Final preflight verifier | **yes** — 73/73 (after baseline fix) |
| beforeSnapshot still valid | **yes** — read-only REST re-checked |
| Save UI wired | **yes** — `runG19b1TracklistTitleSave` |
| Operator runbook | **yes** |
| afterVerification runbook | **yes** |
| Cursor Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyG19b1TracklistGenericSingleTitleSaveExecutionReadinessComplete: true
phase: G-19b1-execution-readiness-gosaki-discography-tracklist-generic-single-title-save
approvalId: G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice
readyForG19b1ExecutionOperatorSaveOnce: true
readyForG19b1ExecutionResultDoc: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorArmedDevStarted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
g18g2SaveChainClosed: true
discography002Track7DoNotReSave: true
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Cursor must NOT click Save.** **戸山さん（operator）が手動で Save を 1 回だけ**実行する。

---

## 1. Git state (verified)

```txt
git status --short: (empty at readiness start)
HEAD: 0112906
origin/main: 0112906
branch: main...origin/main
```

---

## 2. Operation target (unchanged)

| Item | Value |
| --- | --- |
| table | `public.discography_tracks` |
| album | `discography-004` / Ja-Jaaaaan! |
| row id | `04e987a9-e251-4b0b-b860-21a61e711f8e` |
| track_number | 1 |
| before `title` | `Mary Ann` |
| after `title` | `Mary Ann（テスト）` |
| approvalId | `G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice` |

---

## 3. beforeSnapshot re-check (read-only — execution readiness phase)

Re-verified via staging REST (Cursor read-only; no mutation):

| Check | Expected | Status |
| --- | --- | --- |
| Host | `kmjqppxjdnwwrtaeqjta` | **PASS** |
| Not production | not `vsbvndwuajjhnzpohghh` | **PASS** |
| Target row | `04e987a9-...` / `discography-004` / 1 / `Mary Ann` | **PASS** |
| `discography-004` count | 8 | **PASS** |
| `Mary Ann（テスト）` rows | 0 | **PASS** |
| `discography-002` track 7 | `Like a Lover（テスト）` | **PASS** |

Optional: operator may re-run `gosaki-discography-g19b1-tracklist-title-save-preflight-check.sql` in Supabase SQL Editor before Save.

---

## 4. Save execution dev env stack

Use existing `.env` / `.env.local` for `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` (staging host only — do not change or print secrets).

**Recommended full stack (operator starts dev):**

```bash
cd /path/to/sariswing-astro
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED=true \
PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED=false \
npm run dev
```

### Required ON

| Env | Value |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` |
| `PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED` | `true` |
| `ENABLE_ADMIN_STAGING_SHELL` | `true` |
| `ENABLE_ADMIN_STAGING_DATA_READ` | `true` |
| `ENABLE_ADMIN_STAGING_AUTH` | `true` |
| `PUBLIC_ADMIN_AUTH_PROVIDER` | `supabase` |

### Required OFF

| Env | Value |
| --- | --- |
| `PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED` | `false` or unset |
| Other discography non-dry-run arms (G-15b / G-15d / G-16a / G-17c) | unset / false |
| `service_role` | never |

**Cursor must NOT start this armed dev stack in the execution-readiness phase.**

---

## 5. Operator approval phrase (before Save)

```txt
承認します。この操作を1回だけ実行してください。
approvalId: G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice
```

---

## 6. Operator manual Save procedure (戸山さん — 1回のみ)

**Local URL:**

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/
```

**Steps:**

1. Confirm staging project in browser devtools / status panel host = `kmjqppxjdnwwrtaeqjta` (not production).
2. Start dev with §4 env stack (operator — not Cursor).
3. Sign in to staging admin auth (`authenticated` session required).
4. In「登録作品一覧」, click **選択** on `discography-004` / Ja-Jaaaaan!.
5. In Track List textarea, change **line 1 only**:
   - `Mary Ann` → `Mary Ann（テスト）`
   - Do not add/delete/reorder lines (must stay 8 lines).
6. Click **変更を確認** (Preview).
7. In dry-run result panel, confirm **all** of:
   - Title: `Track List Save adapter（G-19b1 generic dry-run）`
   - `approvalId`: `G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice`
   - `ok: true`, `dryRun: true`, `actualWrite: false`, `wouldWrite: true`
   - `saveReadiness: ready_to_save`
   - `saveAllowed: false` in panel is OK — button gate uses `ready_to_save` + armed env
   - `targetTrackRowId`: `04e987a9-e251-4b0b-b860-21a61e711f8e`
   - `before`: `Mary Ann`, `after`: `Mary Ann（テスト）`
   - `beforeCount: 8`, `afterCount: 8`
   - `changed`: 1 row (track 1 only); `added` / `deleted` / `reordered`: なし
   - `guardErrors`: なし
   - Save button label: **更新する（G-19b1 tracklist title）** — enabled
8. Click **更新する（G-19b1 tracklist title）** **once**.
9. Confirm browser dialog: track 1 title update on discography-004 only → OK.
10. **Record** (for G-19b1-execution-result doc):
    - Success alert text (if shown)
    - `#gosaki-disc-save-result` panel contents (if shown on failure)
    - `actualWrite`, `rowsAffected`, `approvalId`, `beforeTitle`, `afterTitle`, `rollbackHint`
11. **Do not** click Save again.
12. Stop armed dev. Restart routine dev:

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
ENABLE_ADMIN_STAGING_WRITE=false \
PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED=false \
npm run dev
```

---

## 7. afterVerification (operator — immediately after Save)

Run in Supabase SQL Editor (staging) or REST read:

```sql
-- 1) Target row
select id, discography_legacy_id, track_number, title
from public.discography_tracks
where id = '04e987a9-e251-4b0b-b860-21a61e711f8e';
-- expect: title = Mary Ann（テスト）

-- 2) Album count
select count(*) as discography_004_track_count
from public.discography_tracks
where discography_legacy_id = 'discography-004';
-- expect: 8

-- 3) Full album — track 1 only changed
select track_number, title
from public.discography_tracks
where discography_legacy_id = 'discography-004'
order by sort_order asc, track_number asc;
-- expect: track 1 = Mary Ann（テスト）; tracks 2–8 unchanged

-- 4) Test title uniqueness
select count(*) as test_title_rows
from public.discography_tracks
where title = 'Mary Ann（テスト）';
-- expect: 1

-- 5) G-18g2 closed chain spot-check
select title from public.discography_tracks
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect: Like a Lover（テスト）
```

**Success:** all expectations match → `rollbackNeeded: false` → proceed to G-19b1-execution-result doc.

**Failure:** `rowsAffected = 0` or unexpected titles → **STOP**, do not re-Save; record incident; rollback only with separate approval (`gosaki-discography-g19b1-tracklist-title-save-rollback.sql`).

---

## 8. Out of scope (this execution)

```txt
G-19c public HTML reflection — deferred
package regen — no
FTP / upload — no
discography-002 track 7 re-Save — no
INSERT / DELETE / reorder — no
```

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g19b1-gosaki-discography-tracklist-single-title-save-final-preflight.mjs
node tools/static-to-astro/scripts/verify-g19b1-gosaki-discography-tracklist-single-title-save-execution-readiness.mjs
```
