# G-22g1e — Gosaki Schedule admin read / unpublished row visibility investigation

**Phase:** `G-22g1e-gosaki-schedule-admin-read-unpublished-visibility`  
**Status:** **complete** — read-only investigation / planning only; **no implementation / DB write**  
**Date:** 2026-07-07  
**Base commit:** `6018696`  
**Prior:** [gosaki-schedule-p0-ux-qa.md](./gosaki-schedule-p0-ux-qa.md) (G-22g1d)

| Check | Status |
| --- | --- |
| Read path traced | **yes** |
| Root cause hypothesis documented | **yes** (anon SSR + RLS) |
| Solution options compared | **yes** (A–E) |
| Recommended path | **yes** (authenticated client refetch — Option B) |
| RLS / grant change executed | **no** |

---

## Gates

```txt
gosakiScheduleAdminReadUnpublishedVisibilityInvestigationComplete: true
phase: G-22g1e-gosaki-schedule-admin-read-unpublished-visibility
qaBlockingIssuesFound: false
implementationExecuted: false
rlsGrantChangeExecuted: false
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
writeArmedDevServerUsed: false
readyForG22g1fAuthenticatedAdminReadPlanning: true
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

G-22g1d found that `schedule-2026-07-008` (unpublished after G-22f5) does not appear in the Gosaki Schedule operator UI SSR dataset. This phase traces the **admin read path**, documents **RLS / policy / grants**, compares fix options, and recommends a **low-risk path** that avoids immediate RLS/grant changes and never exposes `service_role` to the browser.

---

## 2. G-22g1d finding — unpublished row visibility gap

| Observation (G-22g1d) | Detail |
| --- | --- |
| SSR `data-selectable-rows` | **58 rows**, all `published=true` |
| `schedule-2026-07-008` | **absent** from SSR JSON |
| UI filter「非公開のみ」| Cannot surface rows never loaded |
| G-22g1a/b/c regression | **No** — list UX works when row is in dataset |

**Operator impact:** After unpublish, operators cannot find the row in the top operator UI to re-edit, re-publish-plan, or confirm protected state — even though G-22f Save succeeded and the row still exists in DB.

---

## 3. `schedule-2026-07-008` current state (from G-22f chain — not re-queried this phase)

| Field | Value |
| --- | --- |
| `legacy_id` | `schedule-2026-07-008` |
| `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` |
| `site_slug` | `gosaki-piano` |
| `published` | **`false`** (G-22f5 unpublish UPDATE) |
| Physical DELETE | **no** — row still exists |
| Re-Save unpublish slice | **forbidden** (G-22f7 closed) |

**Also unpublished (protected test rows):** `schedule-2026-03-014`, `schedule-2026-09-001` — same anon SSR absence expected.

Read-only SQL to verify live state: `tools/static-to-astro/scripts/supabase/gosaki-schedules-g22g1e-unpublished-visibility-readonly-check.sql` (operator manual; **not executed by Cursor**).

---

## 4. Current admin read path — investigation result

### 4.1 Page entry

```
/__admin-staging-shell/musician-basic/admin/schedule/
  → GosakiStagingAdminSchedulePage.astro
       → AdminGosakiStagingAuthGate (client login gate — UI only for SSR data)
       → AdminGosakiStagingScheduleOperatorPage.astro (binding={rowPickerBinding})
```

SSR at build/request time (Astro frontmatter):

```typescript
const rowPickerBinding = await resolveGosakiScheduleSiteSlugRowPickerBinding();
```

**File:** `tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminSchedulePage.astro`

### 4.2 Binding → loader chain

| Step | Module | Notes |
| --- | --- | --- |
| 1 | `resolveGosakiScheduleSiteSlugRowPickerBinding()` | `staging-schedule-site-slug-row-picker-binding.ts` |
| 2 | `getReadOnlyDataConfig()` | env: `ENABLE_ADMIN_STAGING_DATA_READ`, `PUBLIC_ADMIN_DATA_PROVIDER=supabase` |
| 3 | `loadSchedulesForSiteSlugRead({ publishedFilter: "all", ... })` | **Application filter = all** |
| 4 | `getStagingSupabaseClient(url, anonKey)` | **anon key only** |
| 5 | `.from("schedules").select(...).eq("site_slug", ...)` | PostgREST SELECT |
| 6 | SSR embed | `data-selectable-rows={JSON.stringify(binding.selectableRows)}` |
| 7 | Client init | `parseRowsDataset()` → `selectableRows` — **no client refetch** |

**Key files:**

- `src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-binding.ts`
- `src/lib/admin/staging-write/staging-schedule-read.ts`
- `src/lib/admin/staging-data/read-only-data-config.ts`
- `src/lib/admin/staging-auth/supabase-staging-auth-client.ts`
- `src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts`

### 4.3 SSR vs client

| Aspect | Current behavior |
| --- | --- |
| **When** | Astro SSR (server render) |
| **Credential** | `PUBLIC_SUPABASE_ANON_KEY` from env |
| **Auth session** | **Not attached** on server — no browser JWT |
| **PostgREST role** | **`anon`** |
| **Client refetch after login** | **None** for operator list |
| **Write path (contrast)** | Browser `getStagingSupabaseClient` + persisted Supabase Auth session → **`authenticated`** → Save UPDATE/INSERT works via `schedules_admin_all` + `is_admin()` |

### 4.4 Application-level filters (not the primary cause)

| Filter | Effect |
| --- | --- |
| `publishedFilter: "all"` in row picker binding | Does **not** add `.eq("published", true)` — correct for admin intent |
| `isCanonicalScheduleSourceRoute` | Drops non `/schedule/YYYY-MM/` routes — published rows pass; **not** why 008 missing |
| `splitSelectableAndAuditRows` | PoC audit marker rows only — 008 not audit |
| UI `rowMatchesFilters` | Client filter **after** SSR load — cannot show rows absent from JSON |

### 4.5 Contrast: single-row read

`loadScheduleRowForSiteSlugRead()` — same anon client, same RLS. Used by G-13c target resolve on **server** paths; unpublished row would also fail via anon.

---

## 5. RLS / policy / grants — documented state

From staging audits (G-6-e4, G-22d3b, G-22f6, `schedule-write-adapter-planning.md`) — **not modified this phase**.

### 5.1 Policies on `public.schedules`

| Policy | Roles | Cmd | Qual / check |
| --- | --- | --- | --- |
| `schedules_public_select` | `anon`, `authenticated` | SELECT | `published = true` |
| `schedules_admin_all` | `authenticated` | ALL | `is_admin()` / `with_check is_admin()` |

**RLS evaluation (permissive OR):**

- **`anon` SELECT:** only `schedules_public_select` → **published rows only**
- **`authenticated` + `is_admin()` SELECT:** `schedules_public_select` OR `schedules_admin_all` → **all rows** (admin policy wins for unpublished)
- **`authenticated` non-admin:** published only (public policy)

### 5.2 Table grants (staging, documented)

| Grantee | Privileges (schedules) |
| --- | --- |
| `anon` | SELECT only |
| `authenticated` | SELECT, INSERT, UPDATE (INSERT added G-22d3b3) |

### 5.3 Auth model

- Staging admin: Supabase Auth + `public.admin_users` + `is_admin()`
- Login UI: `AdminGosakiStagingAuthGate` — **client-side** session in browser localStorage
- SSR read: **does not** use that session

### 5.4 Why G-22f Save worked but admin list does not show unpublished

| Operation | Role | Result |
| --- | --- | --- |
| G-22f5 unpublish Save | `authenticated` + `is_admin()` | UPDATE **succeeded** |
| G-22g1d operator list SSR | `anon` (no JWT) | unpublished rows **invisible** |

---

## 6. Admin operational requirements (unpublished rows)

| Requirement | Notes |
| --- | --- |
| List `published=true` events | Works today (SSR anon) |
| List `published=false` events | **Broken** — not in SSR dataset |
| Re-edit unpublished row | Needs row in `selectableRows` or direct row fetch |
| Re-publish planning | Same |
| Unpublish target confirmation | Worked when row was still published at selection time |
| Physical DELETE candidate review | Deferred feature; needs admin visibility |
| Protected rows (`014`, `001`, `008`) | Must remain findable for ops audit |
| Public site | Must **not** expose `published=false` — keep `schedules_public_select` for anon/build |

---

## 7. Solution options A–E

| Option | Summary | Risk | Effort | CMS Kit fit |
| --- | --- | --- | --- | --- |
| **A** | All admin reads via authenticated Supabase session | **Med** | Med | **Good** — matches write path |
| **B** | SSR published-only bootstrap + **client refetch** after auth gate with session JWT (`publishedFilter: all`) | **Low–Med** | Med | **Best** — progressive enhancement |
| **C** | Admin Edge Function + `service_role` server-side | **High** | High | OK if role never in browser; ops burden |
| **D** | Keep SSR public read + separate admin-only fetch API/route | **Med** | Med–High | OK; duplicates B with extra endpoint |
| **E** | Change RLS / grants (e.g. anon admin SELECT, new policy) | **High** | Low–Med | **Poor** — widens anon blast radius |

### Option A detail

Switch `loadSchedulesForSiteSlugRead` to require JWT (`authenticated`). **SSR problem:** Astro server has no session unless cookies forwarded — likely **client-only** read anyway.

### Option B detail (recommended)

1. SSR: keep current anon read (fast paint, published rows).
2. After `AdminGosakiStagingAuthGate` → `authenticated`, client calls new helper e.g. `loadSchedulesForSiteSlugAdminClientRead()` using **same** `getStagingSupabaseClient` singleton (session attached).
3. Replace `selectableRows` + re-render list; update read-source banner to「Supabase admin read (authenticated)」.
4. `publishedFilter` UI continues to work client-side.

**No RLS change** if `schedules_admin_all` already permits admin SELECT (documented yes).

### Option C detail

Edge Function validates JWT + `is_admin()`, queries with service_role. Secure but **high risk** if misconfigured; more moving parts than B.

### Option D detail

Similar to B but via Astro API route or dedicated fetch module — extra surface; use only if client direct PostgREST is undesirable.

### Option E detail

**Not recommended now:** relaxing anon SELECT or new broad policy conflicts with public-site safety model and user preference to avoid grant/RLS churn.

---

## 8. Recommended policy

Align with operator preference:

1. **Do not change RLS / grants** in the first fix slice.
2. **Do not expose `service_role`** in frontend or static bundle.
3. **Accurately document** current path: SSR = anon; write = authenticated session.
4. **Implement Option B** in a phased slice:
   - **G-22g1f** — planning (API shape, auth gate hook, read-source banner, fallback behavior)
   - **G-22g1f1** — implementation (client authenticated refetch only)
   - **G-22g1f2** — read-only QA (`schedule-2026-07-008` visible when logged in + filter 非公開のみ)
5. Keep public/static build on anon `published=true` path unchanged.

---

## 9. High-risk / low-risk classification

| Category | Items |
| --- | --- |
| **High** | RLS / GRANT / REVOKE change; `service_role` in browser; public reflection / FTP; physical DELETE implementation |
| **Medium** | Authenticated client read refetch; Edge Function admin API; SSR session forwarding |
| **Low** | This investigation doc; read-source banner copy; operator procedure hints (G-22g2); G-22g1 list/preview UX (done) |

---

## 10. Safety confirmation

| Item | Status |
| --- | --- |
| Save clicked | **no** |
| DB write / SQL mutation | **no** |
| GRANT / REVOKE / policy change | **no** |
| Rollback SQL executed | **no** |
| Package regen / FTP | **no** |
| Write-armed dev server | **not started** |
| Live Supabase SQL | template only — operator optional |

---

## 11. Next phase proposals

| Phase | Scope |
| --- | --- |
| **G-22g1f** | Authenticated admin read **planning** — Option B contract, files, auth gate hook, verifier plan |
| **G-22g1f1** | **Implementation only** — client refetch; no RLS change |
| **G-22g1f2** | Read-only QA — 008 / 014 / 001 visible when authenticated + 非公開 filter |
| **G-22g2** | Operator procedure hints (parallel/low risk) |
| **Schedule P0 summary** | Close G-22g chain after 1f2 |
| **physical DELETE planning** | **Deferred** |

---

## 12. References

- Read loader: `src/lib/admin/staging-write/staging-schedule-read.ts`
- Row picker binding: `src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-binding.ts`
- Operator UI init: `src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts` (`parseRowsDataset`)
- Auth client: `src/lib/admin/staging-auth/supabase-staging-auth-client.ts`
- RLS audit SQL: `tools/static-to-astro/scripts/supabase/gosaki-schedules-g22d3b-insert-permission-readonly-audit.sql`
- G-22g1e check SQL: `tools/static-to-astro/scripts/supabase/gosaki-schedules-g22g1e-unpublished-visibility-readonly-check.sql`
- G-22g1d QA: `gosaki-schedule-p0-ux-qa.md`
- G-22f result: `gosaki-schedule-unpublish-update-result.md`
