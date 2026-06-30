# G-18g2-preflight — Gosaki Discography tracklist single-title Save final preflight

**Phase:** `G-18g2-preflight-gosaki-discography-tracklist-single-title-save-final-preflight`  
**Status:** **complete** — final preflight + rollback runbook ready; **no Save / DB write**  
**Date:** 2026-06-29  
**Base commit:** `9236faf`  
**Prior:** G-18g2-result (`gosaki-discography-g18g2-tracklist-single-title-save-dry-run-local-ui-result.md`)  
**Approval ID (execution):** `G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice`

| Check | Status |
| --- | --- |
| beforeSnapshot documented | **yes** |
| Success / failure criteria | **yes** |
| Preflight SELECT SQL | **yes** (read-only) |
| Rollback SQL template | **yes** (not executed) |
| Execution runbook | **yes** |
| Actual write guards verified | **yes** (code inspection) |
| Cursor Save / DB write | **no** |
| G-18h public reflection | **deferred** |

---

## Gates

```txt
gosakiDiscographyG18g2TracklistSingleTitleSaveFinalPreflightComplete: true
phase: G-18g2-preflight-gosaki-discography-tracklist-single-title-save-final-preflight
approvalId: G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice
readyForG18g2TracklistSingleTitleSaveExecution: false
readyForG18g2ExecutionSaveUiWiring: true
readyForG18hTracklistPublicReflection: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Do not click Save** in this phase. **Do not execute rollback SQL** without separate explicit approval.

**Closed chains — do not re-Save:**
- `discography-002` / `purchase_url` (G-15c-f)
- `discography-001` / `artist`, `discography-003` / `artist`, `discography-004` / `label`

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: 9236faf
origin/main: 9236faf
branch: main...origin/main
```

---

## 2. What will be executed (G-18g2-execution)

| Item | Value |
| --- | --- |
| **operation** | Single-row `title` UPDATE on `public.discography_tracks` |
| **UI path** | Track List textarea → parse → diff guards → Save once |
| **album** | `discography-002` / SKYLARK |
| **target row id** | `fd58cd6e-2fff-4ff2-96af-3087c469450b` |
| **track_number** | 7 |
| **before `title`** | `Like a Lover` |
| **after `title`** | `Like a Lover（テスト）` |
| **approvalId** | `G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice` |
| **adapter** | `executeG18g2TracklistTitleSave` |
| **rowsAffected** | must be `1` |

**Out of scope (separate phases):**
- G-18h public tracks HTML reflection / FTP upload
- INSERT / DELETE / reorder on tracklist
- `discography` parent row mutation
- `service_role`

---

## 3. Success conditions

```txt
Save UI shows success (operator-recorded)
executeG18g2TracklistTitleSave returns actualWrite: true
rowsAffected === 1
target row title = Like a Lover（テスト）
discography-002 still has exactly 8 tracks
other 7 track titles unchanged
Like a Lover count on album = 0 (only track 7 changed)
no unexpected rows with test title elsewhere
guardErrors none at Save time
```

**Post-Save SELECT (operator / verifier):**

```sql
select id, discography_legacy_id, track_number, title
from public.discography_tracks
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect: title = Like a Lover（テスト）

select count(*) from public.discography_tracks
where discography_legacy_id = 'discography-002';
-- expect: 8
```

---

## 4. Failure conditions

| Failure | Interpretation |
| --- | --- |
| `rowsAffected = 0` | WHERE guard mismatch — title already changed or stale row |
| `rowsAffected > 1` | **STOP** — unexpected multi-row update |
| `permission denied for table discography_tracks` | GRANT / auth issue — re-check G-18g1 grant |
| RLS policy violation | `is_admin()` / session issue |
| `saveEnabled: false` | env arm or `PUBLIC_ADMIN_WRITE_DRY_RUN=true` still on |
| Preview `guardErrors` non-empty | diff not PoC-scoped — do not Save |
| Save button only shows alert | Save UI not wired — see §10 gap |

**Worst case:** wrong row updated despite guards — **STOP**, do not retry, record incident, use rollback template only with **separate approval**.

---

## 5. Rollback policy

**Rollback needed after failed Save attempt:** only if partial / ambiguous write (unlikely with WHERE guard).

**Rollback template:** `gosaki-discography-g18g2-tracklist-title-save-rollback.sql`

```sql
update public.discography_tracks
set title = 'Like a Lover'
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b'
  and discography_legacy_id = 'discography-002'
  and track_number = 7
  and title = 'Like a Lover（テスト）';
```

**Rollback is a separate approval** — not part of G-18g2 Save execution approval. **Not executed in this preflight phase.**

---

## 6. beforeSnapshot — read-only SELECT

**Method:** Supabase SQL Editor or REST `GET /rest/v1/discography_tracks` — staging only; anon key + operator JWT for UI Save; **no `service_role`**.

**Preflight SQL file:** `gosaki-discography-g18g2-tracklist-title-save-preflight-check.sql`

| Check | Expected |
| --- | --- |
| target row exists | `fd58cd6e-...` / `discography-002` / 7 / `Like a Lover` |
| album count | 8 |
| test title rows | 0 |
| authenticated UPDATE grant | present on `discography_tracks` |
| anon write | 0 |
| authenticated INSERT/DELETE/TRUNCATE | 0 |
| RLS | enabled |
| policies | `discography_tracks_admin_all`, `discography_tracks_public_select` |

**Ordered title fingerprint (before Save):**

```txt
On a Clear Day|My Blue Heaven|How Deep Is The Ocean|Skylark|Set Sail|What a Wonderful World|Like a Lover|The Water Is Wide
```

---

## 7. Actual write guards (code verification — `9236faf`)

Verified in `gosaki-discography-g18g2-tracklist-title-save-config.ts`, `gosaki-discography-g18g2-tracklist-title-guards.ts`, `gosaki-discography-g18g2-tracklist-title-save.ts`:

| Guard | Enforced |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN=false` | **yes** — `dryRun` blocks `saveEnabled` |
| `PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED=true` | **yes** |
| `ENABLE_ADMIN_STAGING_SHELL=true` | **yes** |
| `ENABLE_ADMIN_STAGING_DATA_READ=true` | **yes** |
| `ENABLE_ADMIN_STAGING_WRITE=true` | **yes** (required by config — add to dev stack) |
| staging host allowlist `kmjqppxjdnwwrtaeqjta` | **yes** |
| `approvalId` registry match | **yes** — `DISCOGRAPHY_TRACKS_WRITE_APPROVAL_IDS` |
| `albumLegacyId === discography-002` | **yes** |
| `beforeCount/afterCount === 8` | **yes** |
| `changed.length === 1`, track 7 only | **yes** |
| `added/deleted/reordered === 0` | **yes** |
| ordered fingerprint before baseline | **yes** |
| WHERE `id` + `discography_legacy_id` + `track_number` + `title` (before) | **yes** |
| `rowsAffected === 1` | **yes** — post-update check |
| `service_role` | **not used** |
| optimistic lock `updated_at` | **deferred** (G-18g planning) |

---

## 8. Non-dry-run dev env stack (G-18g2-execution — not started here)

From repo root. **Do not start dev in this preflight phase.**

Use existing `.env` / `.env.local` for `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` (do not print or change).

**Operator-provided base stack:**

```bash
cd /path/to/sariswing-astro
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED=true \
npm run dev
```

**Also required by implementation (`saveEnabled` gate):**

```bash
ENABLE_ADMIN_STAGING_WRITE=true
```

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
PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED=true \
npm run dev
```

### Required env summary

| Env | Execution value |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED` | `true` |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` |

### Explicitly OFF

```txt
Other discography scalar Save arms (G-15b / G-15d / G-16a / G-17c) — unset/false
service_role — never
```

---

## 9. Execution runbook (operator — G-18g2-execution only)

**URL:**

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/
```

**Procedure:**

1. Run preflight SELECT (`gosaki-discography-g18g2-tracklist-title-save-preflight-check.sql`) — all expectations pass.
2. Start dev with armed non-dry-run stack (§8).
3. Sign in to staging auth (operator JWT / `authenticated`).
4. Select `discography-002` / SKYLARK.
5. Edit textarea line 7: `Like a Lover` → `Like a Lover（テスト）`.
6. Click「変更を確認」→ confirm Preview:
   - `approvalId`: `G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice`
   - `ok: true`, `wouldWrite: true`
   - `saveReadiness: ready_to_save` (armed dev)
   - `whereGuard` shows before title `Like a Lover`
   - `guardErrors`: none
7. Click「更新する」**once** (after Save UI wiring — see §10).
8. Record Save outcome JSON / UI message.
9. Run post-Save SELECT (§3).
10. **Do not** re-click Save. Restart routine dev with `PUBLIC_ADMIN_WRITE_DRY_RUN=true`.

### Operator approval phrase (required once per Save session)

```txt
承認します。この操作を1回だけ実行してください。
approvalId: G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice
```

---

## 10. Known gap — Save UI wiring (`9236faf`)

At `9236faf`, `runSave()` for `discography-002` **only shows an alert** and does **not** call `executeG18g2TracklistTitleSave`.

```txt
readyForG18g2ExecutionSaveUiWiring: true
readyForG18g2TracklistSingleTitleSaveExecution: false (until Save button wired)
```

**G-18g2-execution** first slice: wire Save button → `executeG18g2TracklistTitleSave` with dry-run binding, then operator Save once.

---

## 11. Results to record after Save (G-18g2-execution doc)

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
```

---

## 12. G-18h public reflection

**Deferred.** After successful G-18g2 Save, separate phase G-18h will regenerate public discography HTML so track 7 reflects on staging preview. **No package regen / FTP in G-18g2-execution.**

---

## 13. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18g2-gosaki-discography-tracklist-single-title-save-final-preflight.mjs
```
