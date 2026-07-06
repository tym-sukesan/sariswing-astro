# G-22g1f2 — Gosaki Schedule authenticated admin read read-only QA

**Phase:** `G-22g1f2-gosaki-schedule-authenticated-admin-read-qa`  
**Status:** **complete** — local dry-run QA / record only; **no Save / DB / deploy**  
**Date:** 2026-07-07  
**Base commit:** `35007fc`  
**Prior:** [gosaki-schedule-authenticated-admin-read-implementation.md](./gosaki-schedule-authenticated-admin-read-implementation.md) (G-22g1f1)

| Check | Status |
| --- | --- |
| Dry-run dev QA executed | **yes** (HTTP 200 + SSR bootstrap + module smoke) |
| SSR bootstrap verified | **yes** |
| Live authenticated admin read (browser login) | **deferred** — staging admin creds UNSET locally |
| Filter / keyword simulation for 008 | **PASS** |
| Save / 保存 clicked | **no** |
| DB write | **no** |

---

## Gates

```txt
gosakiScheduleAuthenticatedAdminReadQaComplete: true
phase: G-22g1f2-gosaki-schedule-authenticated-admin-read-qa
qaSsrBootstrapPass: true
qaAuthenticatedAdminReadLivePass: false
qaAuthenticatedAdminReadLiveDeferred: true
qaFilterSimulationPass: true
qaBlockingIssuesFound: false
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
packageRegenExecuted: false
ftpUploadExecuted: false
writeArmedDevServerUsed: false
writeArmedDevServerStopped: true
port4321ListenAfterQa: false
readyForG22g2OperatorProcedureHints: true
readyForAuthenticatedAdminReadClosure: true
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

Verify on a live dry-run dev page that G-22g1f1 **login后 client-side authenticated admin read** wiring is present and that **SSR anon bootstrap** still works — with the goal of confirming `schedule-2026-07-008` (`published=false`) becomes visible after admin login. **No Save, no DB write, no RLS/grant change.**

---

## 2. Dry-run / read-only dev environment

### Pre-start checks

| Check | Result |
| --- | --- |
| `git status -sb` | clean vs `origin/main` @ `35007fc` |
| `HEAD` / `origin/main` | **`35007fc`** |
| port 4321 before start | **LISTEN none** |
| Write-armed env | **no** — all non-dry-run arms false |

### Dev command (started for QA, then stopped)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=false \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED=false \
npm run dev -- --port 4321 --host 127.0.0.1
```

| Item | Value |
| --- | --- |
| Route | `http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/` |
| HTTP status | **200** |
| `data-read-source` | **supabase** |
| `ENABLE_ADMIN_STAGING_WRITE` | **false** |
| `data-g9k-staging-write-enabled` | **false** |
| QA method | HTTP fetch + HTML/JSON analysis + read module smoke |
| Save / 保存 | **not clicked** |
| Dev server after QA | **stopped** — port **4321 LISTEN none** |

---

## 3. Login前 / SSR bootstrap — **PASS (expected)**

| Check | Result |
| --- | --- |
| SSR `data-selectable-rows` count | **58** |
| All SSR rows `published=true` | **yes** (58 / 58) |
| `schedule-2026-07-008` in SSR JSON | **NOT FOUND** — **expected** (anon SSR + RLS `schedules_public_select`) |
| Published rows visible in bootstrap data | **yes** (e.g. `schedule-2026-07-001`) |
| Read source banner (client) | Shows **bootstrap** copy after init — `Supabase bootstrap（公開行のみ）` (G-22g1f1 operator UI) |
| Auth gate present | **yes** — `#staging-admin-auth-gate` |

**Conclusion:** Login前 bootstrap behaves as designed — published-only SSR rows; **008 intentionally absent** until authenticated refetch.

---

## 4. Login後 authenticated admin read — **DEFERRED (live browser)**

### Live browser login QA

| Item | Status |
| --- | --- |
| Staging admin credentials in local env | **UNSET** — `G9J5_STAGING_ADMIN_EMAIL` / `SUPABASE_ADMIN_EMAIL` not in `.env.local` |
| Supabase Auth login in browser | **not executed** (no credentials) |
| Banner `--admin` after login | **not observed live** |
| Live row count / unpublished count | **not observed live** |

**Deferred procedure (operator optional one-time smoke):**

1. Export staging admin email/password (do not commit).
2. Start same dry-run dev command as §2.
3. Open schedule route → log in via auth gate.
4. Confirm banner → **Supabase admin read（authenticated）**.
5. Set filter **非公開のみ** → find `schedule-2026-07-008`.
6. **Do not click Save.**

### Module smoke (unsigned — no login)

| Check | Result |
| --- | --- |
| `loadGosakiSchedulesAuthenticatedAdminRead()` without session | **mode: `ssr-bootstrap`** — skips refetch (expected) |
| Same auth client as Save path | **yes** — `getStagingSupabaseClient` singleton |

### Design confidence (non-live)

| Evidence | Notes |
| --- | --- |
| G-22f5 Save used same auth client + `is_admin()` | authenticated write to 008 succeeded |
| G-22g1f1 SELECT uses same client with JWT | RLS `schedules_admin_all` should expose unpublished |
| G-22g1e root cause addressed | client refetch after login |

**Conclusion:** Implementation wiring is in place; **live authenticated read QA deferred** pending operator credentials (same class as G-11c6d JWT admin smoke deferral). **Not a code regression blocker.**

---

## 5. `schedule-2026-07-008` visibility — **simulation PASS / live DEFERRED**

### Expected row (from G-22f5 unpublish chain — not re-Saved)

| Field | Expected value |
| --- | --- |
| `legacy_id` | `schedule-2026-07-008` |
| `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` |
| `date` | `2026-07-17` |
| `title` | `<>` |
| `published` | **`false`** |
| `updated_at` | `2026-07-06T13:58:41.425402+00:00` |

### Filter / keyword simulation (G-22g1a haystack logic + G-22f5 row shape)

| Check | Result |
| --- | --- |
|「非公開のみ」filter (`published === false`) | **PASS** — 008 row included when in dataset |
| Keyword `schedule-2026-07-008` | **PASS** — matches via `legacy_id` |
| Live list after login | **DEFERRED** — requires §4 operator login |

### Login前 bootstrap

| Check | Result |
| --- | --- |
| 008 visible before login | **no** — **expected** |

---

## 6. Selected summary — **simulation PASS / live DEFERRED**

Operator summary template (`gosaki-staging-schedule-operator-ui.ts`) renders:

| Field | Expected for 008 | Simulation |
| --- | --- | --- |
| `legacy_id` | `schedule-2026-07-008` | **PASS** (field present in row model) |
| `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` | **PASS** |
| `published` | `false` / badge **非公開** | **PASS** (`formatPublishedStatus`) |
| `updated_at` | `2026-07-06T13:58:41.425402+00:00` | **PASS** |

**Select / 編集する:** not clicked live (Save forbidden). Live selection QA deferred with §4 login.

---

## 7. Fallback / safety — **PASS**

| Check | Result |
| --- | --- |
| `revertToSsrBootstrapRows()` on sign-out | **implemented** (operator UI source) |
| Refetch error → bootstrap + `--warn` banner | **implemented** |
| Unsigned module → `ssr-bootstrap` mode | **PASS** (smoke) |
| Save modules unchanged | **PASS** (verifier git diff) |
| approvalId registry unchanged | **PASS** |
| RLS / GRANT / service_role | **unchanged** |
| Banner CSS served | **PASS** — `--admin`, `--loading`, `--warn` in page CSS |

---

## 8. Issues / residual items

| Issue | Severity | Notes |
| --- | --- | --- |
| Live browser login QA deferred | **low** | No `G9J5_STAGING_ADMIN_EMAIL` / `SUPABASE_ADMIN_EMAIL` in local `.env.local` |
| 008 live visibility not browser-confirmed | **low** | Filter/summary simulation PASS; G-22f5 row exists with `published=false` |
| Manual operator login smoke | **optional** | One-time confirmation when credentials available |

**No blocking regressions found.**

---

## 9. Safety confirmation (this phase)

| Item | Status |
| --- | --- |
| Save | **no** |
| DB write / SQL mutation / rollback | **no** |
| GRANT / REVOKE / RLS change | **no** |
| Package regen / FTP | **no** |
| Write-armed dev server | **not used** |
| Dev server stopped | **yes** — port **4321 LISTEN none** |

---

## 10. Next phases

| Phase | Scope |
| --- | --- |
| **G-22g2** | Operator procedure hints |
| **Authenticated admin read closure** | Optional operator manual login smoke |
| **Schedule P0 UX summary** | After G-22g2 / optional live login |

---

## 11. References

- G-22g1f plan: `gosaki-schedule-authenticated-admin-read-plan.md`
- G-22g1f1 implementation: `gosaki-schedule-authenticated-admin-read-implementation.md`
- G-22g1e investigation: `gosaki-schedule-admin-read-unpublished-visibility.md`
- G-22f5 unpublish result: `gosaki-schedule-unpublish-update-result.md`
- Read module: `src/lib/admin/staging-data/gosaki-schedule-authenticated-admin-read.ts`
- Operator UI: `src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts`
