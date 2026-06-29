# G-18g1-apply-result — Gosaki Discography tracks UPDATE grant apply result

**Phase:** `G-18g1-apply-result-gosaki-discography-tracks-update-grant-apply-result`  
**Status:** **complete** — operator GRANT **success**; grants verified; rows unchanged; **no Save**  
**Date:** 2026-06-29  
**Base commit:** `88fab3c`  
**Prior:** G-18g1-apply-preflight (`gosaki-discography-g18g1-apply-update-grant-preflight.md`)  
**Approval ID:** `G-18g1-discography-tracks-update-grant-apply`

| Check | Status |
| --- | --- |
| GRANT UPDATE applied (operator) | **yes** — once |
| Pre-check (Step 1) | **PASS** |
| Post-check (Step 3) | **PASS** |
| Target row unchanged | **yes** |
| Save / row UPDATE | **no** |
| Cursor SQL execution | **no** |
| Rollback | **not needed** |

---

## Gates

```txt
gosakiDiscographyG18g1ApplyUpdateGrantResultComplete: true
phase: G-18g1-apply-result-gosaki-discography-tracks-update-grant-apply-result
approvalId: G-18g1-discography-tracks-update-grant-apply
authenticatedUpdateGrantPresent: true
anonWriteGrantPresent: false
authenticatedInsertDeleteTruncatePresent: false
grantApplySuccess: true
grantExecutedOnce: true
targetRowUnchanged: true
rollbackNeeded: false
readyForG18g2TracklistSingleTitleSaveDryRunImplementation: true
readyForG18g2TracklistSingleTitleSaveExecution: false
cursorGrantSqlExecuted: false
cursorDbWriteExecuted: false
cursorSaveExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Do not re-run** GRANT apply without documented rollback + re-apply phase.

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: 88fab3c
origin/main: 88fab3c
branch: main...origin/main
```

---

## 2. Manual execution summary (operator)

```txt
Project: static-to-astro-cms-staging
Host ref: kmjqppxjdnwwrtaeqjta.supabase.co
Executor: operator (Supabase SQL Editor)
Cursor executed SQL: no
SQL file: gosaki-discography-tracks-g18g1-apply-update-grant.sql
```

---

## 3. Step 1 — pre-check (operator)

### 3.1 Grants before apply (1a)

| table_name | grantee | privilege_type |
| --- | --- | --- |
| discography_tracks | anon | SELECT |
| discography_tracks | authenticated | SELECT |

**authenticated UPDATE:** **absent** (expected).

### 3.2 Reference — discography (1b)

| table_name | grantee | privilege_type |
| --- | --- | --- |
| discography | authenticated | UPDATE |

### 3.3 RLS (1c)

| relname | rls_enabled |
| --- | --- |
| discography_tracks | **true** |

### 3.4 Policies (1d)

| policyname | cmd | roles |
| --- | --- | --- |
| discography_tracks_admin_all | ALL | {authenticated} |
| discography_tracks_public_select | SELECT | {anon,authenticated} |

### 3.5 Target row baseline (1e)

| Field | Value |
| --- | --- |
| id | `fd58cd6e-2fff-4ff2-96af-3087c469450b` |
| discography_legacy_id | `discography-002` |
| track_number | 7 |
| title | `Like a Lover` |
| test_title_rows | **0** |

---

## 4. Step 2 — GRANT apply (operator)

**Executed once:**

```sql
grant update on table public.discography_tracks to authenticated;
```

**SQL Editor result:**

```txt
Success. No rows returned
```

---

## 5. Step 3 — post-check (operator)

### 5.1 Grants after apply (3a)

| table_name | grantee | privilege_type |
| --- | --- | --- |
| discography_tracks | anon | SELECT |
| discography_tracks | authenticated | SELECT |
| discography_tracks | authenticated | **UPDATE** |

### 5.2 anon write absent (3b)

```txt
anon UPDATE / INSERT / DELETE / TRUNCATE = 0 rows
```

### 5.3 authenticated broad write absent (3c)

```txt
authenticated INSERT / DELETE / TRUNCATE = 0 rows
```

---

## 6. Step 4 — target row unchanged (operator)

### 6.1 `discography-002` track list (8 rows)

| # | title |
| ---: | --- |
| 1 | On a Clear Day |
| 2 | My Blue Heaven |
| 3 | How Deep Is The Ocean |
| 4 | Skylark |
| 5 | Set Sail |
| 6 | What a Wonderful World |
| 7 | Like a Lover |
| 8 | The Water Is Wide |

### 6.2 Target row

| Field | Value |
| --- | --- |
| id | `fd58cd6e-2fff-4ff2-96af-3087c469450b` |
| discography_legacy_id | `discography-002` |
| track_number | 7 |
| title | `Like a Lover` |

### 6.3 Test title absent

```txt
Like a Lover（テスト） = 0 rows
```

---

## 7. Judgment

```txt
G-18g1-apply: success
authenticated UPDATE grant: added
anon write: not added
authenticated INSERT/DELETE/TRUNCATE: not added
data rows: unchanged
rollback: not needed
```

---

## 8. Permission model after grant

```txt
public.discography_tracks:
- anon: SELECT (RLS-constrained)
- authenticated: SELECT + table-level UPDATE grant
- actual UPDATE still constrained by RLS discography_tracks_admin_all + is_admin()
- grant alone did not modify any row
```

**Parallel:** G-15b-grant on `public.discography`; Schedule G-6-e4 on `public.schedules`.

---

## 9. Cursor read-only REST verification (verifier)

Independent read-only SELECT via staging anon key (row data only — grants not visible via REST):

| Check | Expected | Verifier |
| --- | --- | --- |
| track 7 id | `fd58cd6e-...` | REST |
| track 7 title | `Like a Lover` | REST |
| album count | 8 | REST |
| test title rows | 0 | REST |

---

## 10. Rollback

**Rollback needed:** **no**

Doc-only REVOKE if ever required:

```sql
revoke update on table public.discography_tracks from authenticated;
```

**Not executed.**

---

## 11. Next sequence

```txt
G-18g1-apply-result  — done (this doc)
G-18g2               tracklist single-title Save adapter dry-run implementation
G-18g2-preflight     final preflight + rollback SQL for title PoC
G-18g2-execution     operator Save once (discography-002 track 7 via textarea)
G-18h                public tracks reflection (after Save success)
```

**G-18g2 approvalId (planned):** `G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice`

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18g1-gosaki-discography-tracks-apply-update-grant-result.mjs
```
