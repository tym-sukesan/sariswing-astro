# G-22g1f — Gosaki Schedule authenticated admin read planning

**Phase:** `G-22g1f-gosaki-schedule-authenticated-admin-read-planning`  
**Status:** **complete** — planning only; **no implementation / DB write**  
**Date:** 2026-07-07  
**Base commit:** `02158da`  
**Prior:** [gosaki-schedule-admin-read-unpublished-visibility.md](./gosaki-schedule-admin-read-unpublished-visibility.md) (G-22g1e)

| Check | Status |
| --- | --- |
| Authenticated admin read plan documented | **yes** |
| Auth gate integration surveyed | **yes** |
| Client refetch module designed | **yes** |
| UI / banner states designed | **yes** |
| QA plan for G-22g1f1/f2 | **yes** |
| Implementation executed | **no** |

---

## Gates

```txt
gosakiScheduleAuthenticatedAdminReadPlanningComplete: true
phase: G-22g1f-gosaki-schedule-authenticated-admin-read-planning
implementationExecuted: false
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
readyForG22g1f1AuthenticatedAdminReadImplementation: true
readyForG22g1f2AuthenticatedAdminReadQa: false
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

Plan a **read-only**, **client-side authenticated refetch** so the Gosaki Schedule operator UI can list and filter **`published=false`** rows (including `schedule-2026-07-008`) after staging admin login — without changing RLS/grants, without `service_role`, and without affecting public site generation.

---

## 2. G-22g1e investigation summary

| Finding | Detail |
| --- | --- |
| SSR read | `loadSchedulesForSiteSlugRead` via **anon key**, no JWT |
| PostgREST role on SSR | **`anon`** → `schedules_public_select` → published only |
| App filter | `publishedFilter: "all"` in binding — **overridden by RLS** |
| Client | `parseRowsDataset()` only — **no refetch** |
| Write path | Browser session → **`authenticated`** + `is_admin()` → Save works |
| G-22g1d symptom | 58 SSR rows, all `published=true`; **008 absent** |
| Recommended fix | **Option B** — SSR bootstrap + login后 client refetch |

---

## 3. Basic policy — authenticated admin read

| Principle | Plan |
| --- | --- |
| SSR anon bootstrap | **Keep** — fast first paint; published rows visible before login completes |
| Login后 refetch | **Add** — browser `getStagingSupabaseClient` with persisted Supabase Auth session |
| RLS expectation | `schedules_admin_all` + `is_admin()` allows admin SELECT of unpublished rows |
| No RLS/grant change | **This slice** — verify in G-22g1f2 QA; rollback = disable refetch |
| No service_role | **Never** in browser or static bundle |
| Public site | Astro build / static read stays anon + published — **unchanged** |
| Read-only | Refetch is SELECT only — **no** Save / INSERT / UPDATE / DELETE |
| Write modules | **Untouched** — separate file from save adapters |

---

## 4. SSR anon bootstrap — maintained

**No change to SSR binding in G-22g1f1:**

```
resolveGosakiScheduleSiteSlugRowPickerBinding()
  → loadSchedulesForSiteSlugRead({ publishedFilter: "all", anonKey })
  → data-selectable-rows in HTML
```

**Rationale:**

- Preserves current behavior for unauthenticated dev / gate loading
- Avoids SSR session forwarding complexity
- Published rows visible immediately after page load
- Unpublished rows appear only after authenticated refetch succeeds

**Fallback:** If refetch fails, operator UI **retains SSR bootstrap rows** (degraded but usable for published events).

---

## 5. Login后 client-side refetch policy

### 5.1 Trigger points

| Event | Action |
| --- | --- |
| `initGosakiStagingScheduleOperatorUi()` | Parse SSR rows → render bootstrap → `refreshStagingAuthSignedIn()` → if signed in, **start refetch** |
| `staging-admin-auth-gate` → `authenticated` | Via shared auth client `onAuthStateChange` — operator UI **subscribes** and refetches on sign-in |
| Sign-out | Revert to SSR bootstrap rows; banner → bootstrap/mock state |
| Manual retry (optional) | Small「再読み込み」link on banner if refetch error — G-22g1f1 optional |

### 5.2 Auth gate survey (existing)

| Component | Role |
| --- | --- |
| `AdminGosakiStagingAuthGate.astro` | Wraps schedule page; `#staging-admin-auth-gate-protected` slot |
| `staging-admin-auth-gate.ts` | `initStagingAdminAuthGate()` on DOMContentLoaded; `onAuthStateChange`; `data-gate-state` |
| `staging-auth-session.ts` | `getStagingAuthSessionDetails()` |
| `supabase-staging-auth-client.ts` | Singleton anon client + **persisted session** |
| Operator UI | Already calls `resolveStagingAuthSignedIn()` / `refreshStagingAuthSignedIn()` for Save gates |

**Integration plan:** Do **not** modify auth gate core logic in G-22g1f1. Operator UI adds:

1. `subscribeScheduleOperatorAuthRefetch()` — listen to same Supabase client `auth.onAuthStateChange`
2. Or dispatch/consume lightweight custom event from gate (only if subscription duplication is awkward)

**Preferred:** Operator module subscribes directly to `getStagingSupabaseClient` (same singleton as gate) — no gate file change required.

### 5.3 Race on DOMContentLoaded

Both `initStagingAdminAuthGate()` and `initGosakiStagingScheduleOperatorUi()` run on DOMContentLoaded **in parallel**. Auth may still be `loading` when operator init runs.

**Plan:** Operator init always shows SSR bootstrap first; refetch runs **after** `resolveStagingAuthSignedIn() === true` (and on subsequent auth events). Protected slot hidden until authenticated — operator list inside protected area is only visible when logged in anyway.

---

## 6. Client refetch module design

### 6.1 New module (G-22g1f1)

**Proposed path:** `src/lib/admin/staging-data/gosaki-schedule-authenticated-admin-read.ts`

**Export:**

```typescript
export type GosakiScheduleAdminReadMode =
  | "ssr-bootstrap"
  | "admin-authenticated"
  | "loading"
  | "error-fallback-bootstrap";

export type GosakiScheduleAdminClientReadResult = {
  ok: boolean;
  mode: GosakiScheduleAdminReadMode;
  records: ScheduleRecord[];
  source: "supabase" | "unavailable";
  error?: string;
  unpublishedCount: number;
  publishedCount: number;
};

export async function loadGosakiSchedulesAuthenticatedAdminRead(options: {
  siteSlug: string;
  supabaseUrl: string;
  anonKey: string;
  months?: readonly string[];
  canonicalRoutePrefix?: string;
}): Promise<GosakiScheduleAdminClientReadResult>;
```

### 6.2 Client / credential

| Item | Choice |
| --- | --- |
| Client | **`getStagingSupabaseClient(url, anonKey)`** — same singleton as auth gate + Save |
| Session | Auto-attached JWT from localStorage when signed in |
| Role | **`authenticated`** (expected) |
| service_role | **Forbidden** |

### 6.3 Query shape (mirror SSR loader)

Reuse constants and helpers from `staging-schedule-read.ts`:

| Item | Value |
| --- | --- |
| Table | `public.schedules` |
| Select columns | `SCHEDULE_DRY_RUN_SELECT` (existing) |
| Filter | `.eq("site_slug", "gosaki-piano")` |
| publishedFilter | **`all`** — no `.eq("published", …)` at app layer |
| Order | `.order("date")` → `.order("sort_order")` |
| Limit | `READ_LIMIT` (100) |
| Post-filter | `isCanonicalScheduleSourceRoute`, month set (`GOSAKI_STAGING_EXPECTED_MONTHS`) |
| Audit split | `splitSelectableAndAuditRows()` — exclude PoC audit rows from operator list |

### 6.4 Preconditions / guards

| Guard | Behavior |
| --- | --- |
| Not signed in | Skip refetch; stay on SSR bootstrap |
| Missing url/anonKey | Skip; banner mock/unavailable |
| `assertStaticToAstroCmsStagingSupabaseProject(url)` | Fail fast — no prod ref |
| Supabase error | Return `error-fallback-bootstrap`; keep SSR rows |
| Empty result | Treat as error/fallback (admin should see ≥ published count) |

### 6.5 Separation from write path

| Module | Purpose |
| --- | --- |
| `gosaki-schedule-authenticated-admin-read.ts` | **SELECT only** — new |
| `gosaki-schedule-*-save.ts` | **Unchanged** |
| `staging-schedule-read.ts` | SSR/server anon read — **unchanged** in f1 (optional shared internal helper in later refactor) |

**No env arm** required for read refetch.

---

## 7. UI state design

### 7.1 Row source states

| State | `selectableRows` source | When |
| --- | --- | --- |
| SSR bootstrap | `parseRowsDataset()` | Initial / logged out / refetch failed |
| Admin authenticated | Client refetch result | Login success + refetch OK |
| Loading | Keep previous rows + loading indicator | During refetch |

**Operator module state (new):**

```typescript
let adminReadMode: GosakiScheduleAdminReadMode = "ssr-bootstrap";
let ssrBootstrapRows: ScheduleRecord[] = []; // snapshot at init
```

On successful refetch: replace `selectableRows`, set `adminReadMode = "admin-authenticated"`, re-run `renderScheduleList()`, `renderOperatorReadSourceBanner()`.

On sign-out: `selectableRows = [...ssrBootstrapRows]`, `adminReadMode = "ssr-bootstrap"`.

### 7.2 Read source banner design

**Element:** `#gosaki-schedule-operator-read-source-banner` (existing)

| Mode | Class | Message (planned) |
| --- | --- | --- |
| SSR bootstrap (live) | `--live` | データソース: Supabase bootstrap（公開行のみ）— ログイン後に全件読み込み |
| Admin authenticated | `--admin` (new CSS) | データソース: Supabase admin read（authenticated）— 非公開行を含む |
| Loading | `--loading` (new) | 管理データを読み込み中… |
| Mock / unavailable | `--mock` | (existing amber alert) |
| Error fallback | `--warn` (new) | admin read 失敗 — 公開行 bootstrap を表示中 |

**Dataset on `#gosaki-schedule-operator` (optional G-22g1f1):**

- `data-read-source` — keep SSR value (`supabase`)
- `data-admin-read-mode` — `ssr-bootstrap` | `admin-authenticated` | `loading` | `error`

### 7.3 Unpublished / protected row display

| Row type | Display plan |
| --- | --- |
| Normal unpublished | `published` badge **非公開** (existing draft styling) |
| `schedule-2026-07-008` | QA target — visible under「非公開のみ」filter |
| Protected test rows (`schedule-2026-03-014`, `schedule-2026-09-001`) | Optional subtle「protected test」hint in summary (reuse `G22F_PROTECTED_*` constants — **label only**, no write) |
| PoC audit rows | Still excluded via `splitSelectableAndAuditRows` |

**Filter behavior (unchanged logic, new data):**

- Default「公開のみ」— hides unpublished even when loaded
-「すべて」— shows published + unpublished
-「非公開のみ」— **must show 008** after refetch

### 7.4 Selected summary / filters

After refetch: preserve filter UI state; if selected row no longer in list, clear selection with notice.

---

## 8. Safety design

| Rule | Plan |
| --- | --- |
| Read-only | SELECT query only |
| RLS / grant | **No change** in G-22g1f1 |
| service_role | **Not used** |
| Env arms | **None** |
| Write modules | **No edits** in planning; minimal separation in f1 |
| Failure | Fallback to SSR bootstrap rows |
| Public build | No import of admin read module in public pages |
| Staging project gate | `assertStaticToAstroCmsStagingSupabaseProject` |

---

## 9. QA plan

### G-22g1f1 — implementation only

| Item | Scope |
| --- | --- |
| New read module | `gosaki-schedule-authenticated-admin-read.ts` |
| Operator UI wiring | refetch + banner + auth subscription |
| CSS | banner `--admin`, `--loading`, `--warn` |
| Verifier | `verify-g22g1f1-gosaki-schedule-authenticated-admin-read-implementation.mjs` |
| **No** Save click · **no** DB write · **no** RLS change |

### G-22g1f2 — dry-run / read-only QA

**Dev env:**

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

**Route:** `http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/`

| # | Check | Expected |
| --- | --- | --- |
| 1 | Before login (if observable) / SSR HTML | bootstrap rows; published only in JSON |
| 2 | After login | banner → **admin authenticated read** |
| 3 | Row count | unpublished count **> 0** |
| 4 | `schedule-2026-07-008` | present in client dataset |
| 5 | Filter「非公開のみ」| **008 visible** |
| 6 | Filter「公開のみ」| 008 hidden; published rows visible |
| 7 | Filter「すべて」| published + unpublished |
| 8 | Protected rows 014 / 001 | visible under appropriate filters (informational) |
| 9 | Save | **not clicked** |
| 10 | Dev server stop | port **4321 LISTEN none** |

**QA target row:**

| Field | Value |
| --- | --- |
| `legacy_id` | `schedule-2026-07-008` |
| `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` |
| `published` | `false` |

---

## 10. Risk classification

| Category | Items |
| --- | --- |
| **Low** | This planning doc; banner copy; operator procedure hints (G-22g2) |
| **Medium** | G-22g1f1 client authenticated read implementation; G-22g1f2 QA |
| **High** | RLS / GRANT / REVOKE change; service_role in browser; Edge Function with service_role; public reflection / FTP; physical DELETE |

**Explicitly out of scope:** RLS/grant changes, service_role, Save, package, FTP.

---

## 11. G-22g1f1 implementation checklist (for next phase)

| # | Task |
| --- | --- |
| 1 | Add `gosaki-schedule-authenticated-admin-read.ts` |
| 2 | Wire `initGosakiStagingScheduleOperatorUi` refetch after auth |
| 3 | Subscribe `onAuthStateChange` for login/logout |
| 4 | Update `renderOperatorReadSourceBanner()` for 4 modes |
| 5 | Snapshot SSR bootstrap rows for logout fallback |
| 6 | Add CSS banner variants |
| 7 | Verifier + doc result (G-22g1f2) |

**Files expected to touch (G-22g1f1 only):**

- `src/lib/admin/staging-data/gosaki-schedule-authenticated-admin-read.ts` (new)
- `src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts`
- `tools/static-to-astro/templates/admin-cms/styles/admin.css`
- `tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-implementation.md`
- `tools/static-to-astro/scripts/verify-g22g1f1-...mjs`

**Files NOT to touch:**

- Save modules, RLS SQL, `staging-schedule-site-slug-row-picker-binding.ts` (SSR stays anon)
- Public site / FTP / package scripts

---

## 12. Safety confirmation (this phase)

| Item | Status |
| --- | --- |
| Implementation | **no** |
| Save | **no** |
| DB write / SQL mutation | **no** |
| GRANT / REVOKE | **no** |
| Package regen / FTP | **no** |
| Write-armed dev server | **not started** |

---

## 13. Next phases

| Phase | Scope |
| --- | --- |
| **G-22g1f1** | Implementation only — client authenticated read + UI wiring |
| **G-22g1f2** | Read-only QA — 008 visible under 非公開 filter |
| **G-22g2** | Operator procedure hints (parallel / after f2) |
| **Schedule P0 summary** | After f2 |
| **physical DELETE planning** | **Deferred** |

---

## 14. References

- G-22g1e investigation: `gosaki-schedule-admin-read-unpublished-visibility.md`
- SSR loader: `src/lib/admin/staging-write/staging-schedule-read.ts`
- Row picker binding: `src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-binding.ts`
- Operator UI: `src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts`
- Auth gate: `src/lib/admin/staging-auth/staging-admin-auth-gate.ts`
- Auth client: `src/lib/admin/staging-auth/supabase-staging-auth-client.ts`
