# G-19b1-preflight — Gosaki Discography tracklist generic single-title Save final preflight

**Phase:** `G-19b1-preflight-gosaki-discography-tracklist-generic-single-title-save-final-preflight`  
**Status:** **complete** — final preflight + rollback runbook ready; **no Save / DB write**  
**Date:** 2026-07-01  
**Base commit:** `450a8a4`  
**Prior:** G-19b1-result (`gosaki-discography-g19b1-tracklist-single-title-save-implementation.md` + local dry-run QA)  
**Approval ID (execution):** `G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice`

| Check | Status |
| --- | --- |
| beforeSnapshot documented | **yes** — read-only REST verified |
| Success / failure criteria | **yes** |
| Preflight SELECT SQL | **yes** (read-only) |
| Rollback SQL template | **yes** (not executed) |
| Execution runbook | **yes** |
| Save UI wired | **yes** — `runG19b1TracklistTitleSave` |
| Cursor Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyG19b1TracklistGenericSingleTitleSaveFinalPreflightComplete: true
phase: G-19b1-preflight-gosaki-discography-tracklist-generic-single-title-save-final-preflight
approvalId: G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice
envArm: PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED
readyForG19b1TracklistGenericSingleTitleSaveExecution: false
readyForG19b1ExecutionOperatorSaveOnce: true
readyForG19cTracklistPublicReflectionAfterG19b1: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
g18g2SaveChainClosed: true
discography002Track7DoNotReSave: true
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Do not click Save** in this phase. **Cursor must NOT click Save.** **戸山さん（operator）が手動で Save を 1 回だけ**実行するのは **G-19b1-execution** フェーズのみ。

**Do not execute rollback SQL** without separate explicit approval.

**Closed chains — do not re-Save:**
- `discography-002` / track 7 `title` = `Like a Lover（テスト）` (G-18g2 + G-18h-upload)
- Scalar chains: `discography-001` artist, `discography-002` purchase_url, `discography-003` artist, `discography-004` label

---

## 1. Git state (verified)

```txt
git status --short: (empty at preflight start)
HEAD: 450a8a4
origin/main: 450a8a4
branch: main...origin/main
```

---

## 2. Operation target

| Item | Value |
| --- | --- |
| **table** | `public.discography_tracks` |
| **operation** | Single-row `title` UPDATE |
| **UI path** | Track List textarea → parse → diff guards → Preview → Save once |
| **album** | `discography-004` / Ja-Jaaaaan! |
| **target row id** | `04e987a9-e251-4b0b-b860-21a61e711f8e` |
| **track_number** | 1 |
| **before `title`** | `Mary Ann` |
| **after `title`** | `Mary Ann（テスト）` |
| **approvalId** | `G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice` |
| **adapter** | `executeG19b1TracklistTitleSave` |
| **rowsAffected** | must be `1` |

**Staging project / host (not production):**

```txt
Project: static-to-astro-cms-staging
Host ref: kmjqppxjdnwwrtaeqjta.supabase.co
Production STOP ref: vsbvndwuajjhnzpohghh
```

**Out of scope (separate phases):**
- G-19c public tracks HTML reflection / FTP upload
- INSERT / DELETE / reorder on tracklist
- `discography` parent row mutation
- `service_role`
- G-18g2 re-Save on `discography-002`

---

## 3. What will change / what will not

### Will change (1 row only)

| Field | Before | After |
| --- | --- | --- |
| `discography_tracks.title` | `Mary Ann` | `Mary Ann（テスト）` |
| Row `id` | `04e987a9-e251-4b0b-b860-21a61e711f8e` | same |

### Will NOT change

| Item | Reason |
| --- | --- |
| `discography-004` tracks 2–8 titles | guards: `changed.length === 1`, track 1 only |
| `discography-004` track count | guards: `beforeCount === afterCount === 8` |
| `discography-001` / `002` / `003` track rows | different album scope |
| `discography-002` track 7 | G-18g2 closed — must stay `Like a Lover（テスト）` |
| `discography` parent rows | not in write payload |
| `schedule_*` / other tables | not touched |
| Public staging HTML | G-19c deferred — no package regen in execution |

---

## 4. Success conditions

```txt
Save UI shows success (operator-recorded)
executeG19b1TracklistTitleSave returns actualWrite: true
rowsAffected === 1
target row title = Mary Ann（テスト）
discography-004 still has exactly 8 tracks
other 7 track titles on discography-004 unchanged
Mary Ann count on album = 0 (only track 1 changed)
no unexpected rows with Mary Ann（テスト） elsewhere
guardErrors none at Save time
discography-002 track 7 still Like a Lover（テスト）
```

---

## 5. Failure conditions

| Failure | Interpretation |
| --- | --- |
| `rowsAffected = 0` | WHERE guard mismatch — title already changed or stale row |
| `rowsAffected > 1` | **STOP** — unexpected multi-row update |
| `permission denied for table discography_tracks` | GRANT / auth issue — re-check G-18g1 grant |
| RLS policy violation | `is_admin()` / session issue |
| `saveEnabled: false` | env arm off, G-18g2 arm conflict, or `PUBLIC_ADMIN_WRITE_DRY_RUN=true` still on |
| Preview `guardErrors` non-empty | diff not G-19b1-scoped — do not Save |
| `saveReadiness` not `ready_to_save` | arm / auth / dry-run gate — do not Save |
| added / deleted / reordered in diff | guards reject — do not Save |

**Worst case:** wrong row updated despite guards — **STOP**, do not retry, record incident, use rollback template only with **separate approval**.

---

## 6. beforeSnapshot — read-only verification

**Method:** Supabase SQL Editor, REST `GET /rest/v1/discography_tracks`, or verifier live check — staging only; anon key read; **no `service_role`**.

**Preflight SQL file:** `gosaki-discography-g19b1-tracklist-title-save-preflight-check.sql`

**Verified via read-only REST (G-19b1-preflight phase — Cursor):**

| Check | Result |
| --- | --- |
| Host | `kmjqppxjdnwwrtaeqjta` — **staging** (not `vsbvndwuajjhnzpohghh`) |
| Target row exists | `04e987a9-e251-4b0b-b860-21a61e711f8e` |
| `discography_legacy_id` | `discography-004` |
| `track_number` | `1` |
| `title` (before) | `Mary Ann` |
| `discography-004` track count | `8` |
| `Mary Ann（テスト）` rows | `0` |
| `discography-002` track 7 | `Like a Lover（テスト）` — **unchanged** |
| Total `discography_tracks` rows | `34` |

**Ordered title fingerprint (before Save):**

```txt
Mary Ann|Nearer My God To Thee|Shreveport Stomp|A Fool Such As I|Si Tu Vois Ma Mere|St. Phillip Street Break Down|Girl Of My Dream|Bourbon Street Parade
```

**discography-004 tracks (before Save):**

| track_number | title |
| --- | --- |
| 1 | Mary Ann |
| 2 | Nearer My God To Thee |
| 3 | Shreveport Stomp |
| 4 | A Fool Such As I |
| 5 | Si Tu Vois Ma Mere |
| 6 | St. Phillip Street Break Down |
| 7 | Girl Of My Dream |
| 8 | Bourbon Street Parade |

---

## 7. afterVerification SELECT (G-19b1-execution only — NOT in this phase)

Run after operator Save once:

```sql
select id, discography_legacy_id, track_number, title
from public.discography_tracks
where id = '04e987a9-e251-4b0b-b860-21a61e711f8e';
-- expect: title = Mary Ann（テスト）

select count(*) from public.discography_tracks
where discography_legacy_id = 'discography-004';
-- expect: 8

select track_number, title
from public.discography_tracks
where discography_legacy_id = 'discography-004'
order by sort_order asc, track_number asc;
-- expect: track 1 = Mary Ann（テスト）; tracks 2–8 unchanged

select count(*) from public.discography_tracks
where title = 'Mary Ann（テスト）';
-- expect: 1

select title from public.discography_tracks
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect: Like a Lover（テスト） (G-18g2 chain unchanged)
```

---

## 8. Rollback policy

**Rollback needed after failed Save attempt:** only if partial / ambiguous write (unlikely with WHERE guard).

**Rollback template:** `gosaki-discography-g19b1-tracklist-title-save-rollback.sql`

```sql
update public.discography_tracks
set title = 'Mary Ann'
where id = '04e987a9-e251-4b0b-b860-21a61e711f8e'
  and discography_legacy_id = 'discography-004'
  and track_number = 1
  and title = 'Mary Ann（テスト）';
```

**Rollback is a separate approval** — not part of G-19b1 Save execution approval. **Not executed in this preflight phase.**

---

## 9. Actual write guards (code verification — `450a8a4`)

Verified in `gosaki-discography-g19b1-tracklist-generic-single-title-save-config.ts`, `gosaki-discography-g19b1-tracklist-generic-title-guards.ts`, `gosaki-discography-g19b1-tracklist-generic-single-title-save.ts`:

| Guard | Enforced |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN=false` | **yes** |
| `PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED=true` | **yes** |
| G-18g2 arm **off** (single-arm) | **yes** — `G19B1_G18G2_SINGLE_ARM_CONFLICT_REASON` |
| `ENABLE_ADMIN_STAGING_SHELL=true` | **yes** |
| `ENABLE_ADMIN_STAGING_DATA_READ=true` | **yes** |
| `ENABLE_ADMIN_STAGING_WRITE=true` | **yes** |
| staging host allowlist `kmjqppxjdnwwrtaeqjta` | **yes** |
| `approvalId` registry match | **yes** |
| `albumLegacyId === discography-004` | **yes** |
| `beforeCount/afterCount === 8` | **yes** |
| `changed.length === 1`, track 1 only | **yes** |
| `added/deleted/reordered === 0` | **yes** |
| ordered fingerprint before baseline | **yes** |
| WHERE `id` + `discography_legacy_id` + `track_number` + `title` (before) | **yes** |
| `rowsAffected === 1` | **yes** |
| `service_role` | **not used** |

---

## 10. Non-dry-run dev env stack (G-19b1-execution — not started here)

From repo root. **Do not start armed dev in this preflight phase.**

Use existing `.env` / `.env.local` for `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` (do not print or change).

**Recommended full execution stack:**

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

### Required env summary

| Env | Execution value |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED` | `true` |
| `PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED` | `false` or unset |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` |

### Explicitly OFF

```txt
G-18g2 tracklist Save arm — must be off (single-arm rule)
Other discography scalar Save arms (G-15b / G-15d / G-16a / G-17c) — unset/false
service_role — never
```

---

## 11. Execution runbook (operator — G-19b1-execution only)

**URL:**

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/
```

**Procedure:**

1. Run preflight SELECT (`gosaki-discography-g19b1-tracklist-title-save-preflight-check.sql`) — all expectations pass.
2. Start dev with armed non-dry-run stack (§10). **G-18g2 arm must be OFF.**
3. Sign in to staging auth (operator JWT / `authenticated`).
4. Select `discography-004` / Ja-Jaaaaan!.
5. Edit textarea line 1: `Mary Ann` → `Mary Ann（テスト）`.
6. Click「変更を確認」→ confirm Preview:
   - `approvalId`: `G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice`
   - `ok: true`, `wouldWrite: true`, `actualWrite: false`
   - `saveReadiness: ready_to_save` (armed dev + signed in)
   - `targetTrackRowId`: `04e987a9-e251-4b0b-b860-21a61e711f8e`
   - `whereGuard` shows before title `Mary Ann`
   - `changed`: 1; `added/deleted/reordered`: none
   - `guardErrors`: none
7. **戸山さんが**「更新する（G-19b1 tracklist title）」を **1 回だけ**クリック。**Cursor は Save をクリックしない。**
8. Confirm dialog: track 1 title update on discography-004 only.
9. Record Save outcome JSON / UI message.
10. Run afterVerification SELECT (§7).
11. **Do not** re-click Save. Restart routine dev with `PUBLIC_ADMIN_WRITE_DRY_RUN=true` and G-19b1 arm off.

### Operator approval phrase (required once per Save session)

```txt
承認します。この操作を1回だけ実行してください。
approvalId: G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice
```

---

## 12. Save UI status (`450a8a4`)

At `450a8a4`, `runSave()` for `discography-004` calls `runG19b1TracklistTitleSave` → `executeG19b1TracklistTitleSave` when gates pass.

```txt
readyForG19b1ExecutionOperatorSaveOnce: true
Save UI wiring gap: none (unlike G-18g2 at preflight time)
```

---

## 13. Results to record after Save (G-19b1-execution doc)

```txt
beforeSnapshot (id, track_number, title)
afterSnapshot (title)
rowsAffected
actualWrite
approvalId
changedFields: ["title"]
guardErrors: none
rollbackNeeded: false | true
post-SELECT outputs
UI Save message
dev env stack used (names only — no secrets)
discography-002 track 7 unchanged verification
```

---

## 14. G-19c public reflection

**Deferred.** After successful G-19b1 Save, separate phase G-19c will regenerate public discography HTML so track 1 on Ja-Jaaaaan! reflects on staging preview. **No package regen / FTP in G-19b1-execution.**

---

## 15. Verifier

```bash
node tools/static-to-astro/scripts/verify-g19b1-gosaki-discography-tracklist-single-title-save-final-preflight.mjs
```
