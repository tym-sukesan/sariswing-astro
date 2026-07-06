# G-22g1f1 — Gosaki Schedule authenticated admin read implementation

**Phase:** `G-22g1f1-gosaki-schedule-authenticated-admin-read-implementation`  
**Status:** **complete** — implementation only; **no Save / DB write**  
**Date:** 2026-07-07  
**Base commit:** `3de4b78`  
**Prior:** [gosaki-schedule-authenticated-admin-read-plan.md](./gosaki-schedule-authenticated-admin-read-plan.md) (G-22g1f)

| Check | Status |
| --- | --- |
| Authenticated admin read module added | **yes** |
| Operator UI refetch wiring | **yes** |
| Read source banner modes | **yes** |
| SSR bootstrap fallback preserved | **yes** |
| Save / DB write executed | **no** |

---

## Gates

```txt
gosakiScheduleAuthenticatedAdminReadImplementationComplete: true
phase: G-22g1f1-gosaki-schedule-authenticated-admin-read-implementation
implementationOnly: true
rlsGrantChangeExecuted: false
serviceRoleUsed: false
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
writeArmedDevServerUsed: false
readyForG22g1f2AuthenticatedAdminReadQa: true
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

Implement **read-only**, **client-side authenticated refetch** so the Gosaki Schedule operator UI can list and filter **`published=false`** rows (including `schedule-2026-07-008`) after staging admin login — per G-22g1f planning, without RLS/grant changes, without `service_role`, and without affecting public site generation.

---

## 2. Implementation only

This phase adds code and wiring only. **No Save click**, **no DB write**, **no SQL mutation**, **no package regen**, **no FTP/upload**.

---

## 3. SSR anon bootstrap — maintained

- `resolveGosakiScheduleSiteSlugRowPickerBinding()` unchanged — SSR still emits `data-selectable-rows` via anon key (published rows only under RLS).
- Operator UI snapshots SSR rows into `ssrBootstrapRows` at init.
- Logout or refetch failure reverts `selectableRows` to `ssrBootstrapRows`.

---

## 4. Login后 client-side authenticated refetch — added

| Component | Change |
| --- | --- |
| `gosaki-schedule-authenticated-admin-read.ts` | **New** — SELECT-only fetch via `getStagingSupabaseClient` + signed-in session |
| `gosaki-staging-schedule-operator-ui.ts` | Refetch on init (if signed in) + `onAuthStateChange` subscription |
| `admin.css` | Banner variants `--admin`, `--loading`, `--warn` |

**Flow:**

1. Init: parse SSR bootstrap → show bootstrap banner.
2. If signed in: `loadGosakiSchedulesAuthenticatedAdminRead()` → replace `selectableRows`.
3. Sign-in event: refetch. Sign-out: revert to bootstrap.
4. Error: fallback to bootstrap + warn banner + optional retry button.

---

## 5. Read-only SELECT only

- Module uses `.from("schedules").select(...)` only.
- No `.insert`, `.update`, `.delete`, `.upsert`, `.rpc`.
- No write functions exported.
- Save modules / approval ID registry **unchanged**.

---

## 6. RLS / grant / service_role — not touched

- No RLS policy changes.
- No GRANT / REVOKE.
- No `service_role` in browser bundle.
- Relies on existing `schedules_admin_all` + `is_admin()` when JWT present.

---

## 7. Read source banner states

| Mode | CSS class | When |
| --- | --- | --- |
| SSR bootstrap | `--live` | Initial / logged out / before refetch |
| Admin authenticated | `--admin` | Refetch success |
| Loading | `--loading` | During refetch |
| Error fallback | `--warn` | Refetch failed — bootstrap rows shown |
| Mock / unavailable | `--mock` | No Supabase SSR data |

`data-admin-read-mode` set on `#gosaki-schedule-operator`.

---

## 8. QA target — G-22g1f2

| Field | Value |
| --- | --- |
| `legacy_id` | `schedule-2026-07-008` |
| `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` |
| `published` | `false` |

**G-22g1f2 checks:** after login, row present; visible under「非公開のみ」filter; Save not clicked; port 4321 stopped after QA.

---

## 9. Safety confirmation (this phase)

| Item | Status |
| --- | --- |
| Implementation | **yes** (read-only) |
| Save | **no** |
| DB write / SQL mutation | **no** |
| GRANT / REVOKE / RLS change | **no** |
| Package regen / FTP | **no** |
| Write-armed dev server | **not started** |

---

## 10. Files changed

| File | Action |
| --- | --- |
| `src/lib/admin/staging-data/gosaki-schedule-authenticated-admin-read.ts` | **new** |
| `src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts` | refetch wiring + banner |
| `tools/static-to-astro/templates/admin-cms/styles/admin.css` | banner CSS |
| `tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-implementation.md` | **new** |
| `tools/static-to-astro/scripts/verify-g22g1f1-gosaki-schedule-authenticated-admin-read-implementation.mjs` | **new** |

**Not changed:** save modules, write adapter, approval IDs, SSR row picker binding, auth gate core, RLS SQL.

---

## 11. Next phase

| Phase | Scope |
| --- | --- |
| **G-22g1f2** | Read-only QA — login bootstrap vs admin read; 008 under 非公開 filter |
| **G-22g2** | Operator procedure hints (parallel / after f2) |

---

## 12. References

- G-22g1f plan: `gosaki-schedule-authenticated-admin-read-plan.md`
- G-22g1e investigation: `gosaki-schedule-admin-read-unpublished-visibility.md`
- Auth client: `src/lib/admin/staging-auth/supabase-staging-auth-client.ts`
- Operator UI: `src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts`
