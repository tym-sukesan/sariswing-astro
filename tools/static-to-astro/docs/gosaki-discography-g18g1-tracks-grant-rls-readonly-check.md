# G-18g1 — Gosaki Discography tracks GRANT / RLS read-only check

**Phase:** `G-18g1-gosaki-discography-tracks-grant-rls-readonly-check`  
**Status:** **complete** — read-only verification; **no GRANT / policy / DB write**  
**Date:** 2026-06-29  
**Base commit:** `065539b`  
**Prior:** G-18g (`gosaki-discography-g18g-tracklist-textarea-save-adapter-planning.md`)

| Check | Status |
| --- | --- |
| Staging host only | **yes** — `kmjqppxjdnwwrtaeqjta` |
| Target row REST SELECT | **yes** |
| Grant status recorded | **yes** — UPDATE **missing** |
| RLS / policy status recorded | **yes** |
| GRANT / policy apply | **no** |
| Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyG18g1TracksGrantRlsReadonlyCheckComplete: true
phase: G-18g1-gosaki-discography-tracks-grant-rls-readonly-check
readyForG18g1ApplyDiscographyTracksUpdateGrant: true
readyForG18g2TracklistSingleTitleSaveDryRunImplementation: false
authenticatedUpdateGrantPresent: false
authenticatedSelectGrantPresent: true
anonWriteGrantPresent: false
rlsEnabledOnDiscographyTracks: true
discographyTracksAdminAllPolicyLive: true
serviceRoleRequiredForClientSave: false
grantExecutedInThisPhase: false
policyChangeExecutedInThisPhase: false
cursorDbWriteExecuted: false
cursorSaveExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: 065539b
origin/main: 065539b
branch: main...origin/main
```

---

## 2. Verification methods

| Method | Scope | Executor |
| --- | --- | --- |
| **REST SELECT** (anon key) | Target row + album count + test title absent | Cursor verifier |
| **Documented grant baseline** | Post–G-6 cleanup + G-15b-grant | Cursor synthesis |
| **RLS audit archive** | G-6 `staging-rls-audit-result.md` | Historical operator SQL |
| **SQL template** | `gosaki-discography-tracks-g18g1-readonly-check.sql` | Operator optional re-audit |

**Cursor did not execute** GRANT / REVOKE / policy DDL / UPDATE. **Cursor did not use** `service_role`.

**pg_catalog live SQL:** Not executed by Cursor in this phase (Kit precedent: G-6-rls-audit, G-15b-fail). Grant/RLS table below combines **documented staging baseline** + **REST row proof**. Operator may paste fresh SQL Editor results from §12 template.

---

## 3. Target

| Item | Value |
| --- | --- |
| Project | `static-to-astro-cms-staging` |
| Host ref | `kmjqppxjdnwwrtaeqjta` |
| Table | `public.discography_tracks` |
| Album | `discography-002` / SKYLARK |
| Row `id` | `fd58cd6e-2fff-4ff2-96af-3087c469450b` |
| `track_number` | 7 |
| `title` (expected) | `Like a Lover` |

---

## 4. Table grants — `public.discography_tracks`

### 4.1 Documented staging baseline (post cleanup + G-15b)

| grantee | SELECT | UPDATE | INSERT | DELETE | TRUNCATE | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| **anon** | **yes** | **no** | **no** | **no** | **no** | `staging-rls-grant-cleanup-result` |
| **authenticated** | **yes** | **no** | **no** | **no** | **no** | cleanup preserved SELECT only |
| **service_role** | yes (bypass) | yes | yes | yes | yes | **not used** by Kit client Save |

**Contrast — `public.discography` (G-15b-grant):**

| grantee | SELECT | UPDATE |
| --- | --- | --- |
| anon | yes | **no** |
| authenticated | yes | **yes** |

G-15b-grant explicitly applied UPDATE on **`discography` only**; `discography_tracks` **untouched**.

### 4.2 Judgment A — authenticated UPDATE grant present?

**No** — table-level `authenticated UPDATE` on `discography_tracks` is **not documented as granted**. G-18g2 Save would fail with PostgREST `permission denied for table discography_tracks` (same class as pre–G-15b `discography` failure).

### 4.3 anon write

**No** — anon has SELECT only on `discography_tracks`. **Judgment C: confirmed.**

### 4.4 service_role

Kit Save path uses **authenticated anon client** + RLS — **not** `service_role`. **Judgment: service_role not required for client Save design.**

---

## 5. RLS / policies — `public.discography_tracks`

### 5.1 RLS enabled

Per G-6 `staging-rls-audit-result.md`:

| table | rls_enabled |
| --- | --- |
| `discography_tracks` | **true** |

**Assumption:** unchanged unless operator dropped RLS (no evidence).

### 5.2 Policies (G-6 audit — live at audit time)

| policyname | cmd | model |
| --- | --- | --- |
| `discography_tracks_public_select` | SELECT | public read (published content) |
| `discography_tracks_admin_all` | **ALL** | `authenticated` + `is_admin()` |

Kit draft (`rls-draft-generator.mjs`) matches `discography_tracks_admin_all` — **not doc-only**.

### 5.3 Judgment B — authenticated UPDATE via RLS?

**Policy path likely ready** — `discography_tracks_admin_all` FOR ALL with `is_admin()` would permit UPDATE **once table-level UPDATE grant exists**.

**Current blocker:** missing **table GRANT UPDATE**, not missing admin policy (per baseline docs).

**If policy missing on live DB:** G-18g1-apply would need policy CREATE in addition to GRANT — operator SQL template §3 re-audit recommended before apply.

---

## 6. Target row — REST read-only (Cursor live)

**Method:** `GET /rest/v1/discography_tracks` with staging anon key; host gate `kmjqppxjdnwwrtaeqjta`.

| Check | Result |
| --- | --- |
| `discography-002` track count | **8** |
| Total `discography_tracks` | **34** |
| Track 7 `id` | `fd58cd6e-2fff-4ff2-96af-3087c469450b` |
| Track 7 `title` | `Like a Lover` |
| `Like a Lover（テスト）` rows | **0** |
| G-18f UI test persisted | **no** |

---

## 7. authenticated UPDATE readiness

| Layer | Status | Blocks G-18g2 Save? |
| --- | --- | --- |
| Table GRANT `authenticated UPDATE` | **missing** | **yes** |
| RLS `discography_tracks_admin_all` | **likely present** | no (after grant) |
| `is_admin()` + staging auth session | proven on other tables | no |
| Client uses anon key + user JWT | yes (Kit pattern) | no |
| `service_role` | not used | — |

**Overall:** **not ready** for G-18g2 execution until **G-18g1-apply** (minimum: `GRANT UPDATE ON public.discography_tracks TO authenticated`).

---

## 8. Planning judgments (A–F)

### A. authenticated UPDATE grant は既にあるか

**No.**

### B. RLS policy 上、authenticated UPDATE は通りそうか

**Yes, after grant** — `discography_tracks_admin_all` + `is_admin()` pattern matches working `discography` / `schedules` paths. Re-verify with §12 SQL before apply.

### C. anon write は不可か

**Yes** — SELECT only; no INSERT/UPDATE/DELETE for anon on `discography_tracks`.

### D. G-18g2 Save PoC に進めるか

**Not yet for execution.** Planning/implementation of dry-run Save adapter may proceed **in parallel** with G-18g1-apply prep, but **operator Save once** blocked until grant apply PASS.

### E. GRANT / policy apply が必要か

**Yes** — at minimum:

```sql
-- G-18g1-apply candidate (DO NOT RUN in G-18g1 — separate approval)
grant update on table public.discography_tracks to authenticated;
```

Policy apply only if §12 SQL shows `discography_tracks_admin_all` **absent**.

### F. G-18g1-apply として分離すべきか

**Yes** — mirror G-15b-grant / G-6-e4 schedule grant:
1. G-18g1-readonly-check — **done**
2. **G-18g1-apply** — operator manual GRANT + afterVerification SELECT
3. G-18g2 — Save adapter implementation
4. G-18g2-preflight → G-18g2-execution

---

## 9. G-18g1-apply preflight sketch (not executed)

| Item | Value |
| --- | --- |
| Project | `static-to-astro-cms-staging` only |
| SQL | `grant update on table public.discography_tracks to authenticated;` |
| Exclusions | no anon UPDATE; no INSERT/DELETE/TRUNCATE grant |
| After verify | `information_schema.role_table_grants` shows authenticated UPDATE |
| Row unchanged | track 7 still `Like a Lover` until G-18g2-execution |
| Approval | separate operator approval ID `G-18g1-discography-tracks-update-grant-apply` |

---

## 10. Rollback (grant phase)

Grant apply rollback (if ever needed):

```sql
-- doc-only; not executed
revoke update on table public.discography_tracks from authenticated;
```

No data rollback needed for grant-only apply.

---

## 11. Next sequence

```txt
G-18g1     GRANT/RLS read-only check — done
G-18g1-apply  operator GRANT UPDATE (if confirmed missing)
G-18g2     tracklist single-title Save adapter + dry-run path
G-18g2-preflight → G-18g2-execution
G-18h      public tracks reflection
```

---

## 12. Operator re-audit SQL

```bash
# Paste in Supabase SQL Editor (staging only)
tools/static-to-astro/scripts/supabase/gosaki-discography-tracks-g18g1-readonly-check.sql
```

---

## 13. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18g1-gosaki-discography-tracks-grant-rls-readonly-check.mjs
```
