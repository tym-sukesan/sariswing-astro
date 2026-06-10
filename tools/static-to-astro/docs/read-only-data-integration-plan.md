# Read-only Data Integration Plan

## 1. Purpose

G-5z-a defines how CMS Kit will show **CMS data read-only** on the staging runtime shell (`/__admin-staging-shell/musician-basic/`) — **before any Supabase DB query is implemented**.

This phase answers: *which modules, tables, and fields may be read; what must never be written; and what gates apply before G-5z-b scaffold work.*

**G-5z-a is planning only.**

- Staging shell Auth and mock role/allowlist (G-5y) are in place.
- **No Supabase DB query is implemented in G-5z-a.**
- **No `from()` / `select()` is added.**
- **No write operations** (insert / update / delete / upsert / rpc write).
- **No RLS policy creation or changes.**
- **No Storage read or write.**
- **No Publish / GitHub dispatch / FTP.**
- **No `/admin` route connection.**
- **Production data is untouched.**

Related: [private-server-side-allowlist-plan.md](./private-server-side-allowlist-plan.md) (G-5y-e-b), [staging-supabase-auth-connection.md](./staging-supabase-auth-connection.md) (G-5y-d), [cms-schema-adapters.json](../config/schema-adapters/cms-schema-adapters.json) (`musician-basic-supabase-v1`).

---

## 2. Current state

| Phase | Status |
| --- | --- |
| **G-5x** | Staging runtime shell exists |
| **G-5y-d** | Staging Supabase Auth connection exists (env-gated) |
| **G-5y-e-a** | Mock role / allowlist exists (`example.com` only) |
| **G-5y-e-b** | Private / server-side allowlist plan exists |

Current data posture on staging shell:

```txt
/admin route is not connected
productionPublish is always false
DB query/update is not implemented on staging shell
RLS is not configured by this kit on staging shell
Storage is not connected on staging shell
Publish is disabled
modules use static mock data in musician-basic-admin-prototype.astro
```

---

## 3. Read-only integration principles

| Principle | Requirement |
| --- | --- |
| **Read-only first** | No write paths until explicit G-6+ approval |
| **Staging project only** | Supabase URL must be staging-approved project |
| **Anon key only in browser** | Same as G-5y-d Auth; no service role in client |
| **Service role never in browser** | Server/Edge only if ever used — not in G-5z |
| **RLS must be reviewed before real data access** | Mandatory gate before G-5z-c |
| **No writes before RLS review** | Applies to all CMS tables |
| **No Storage writes** | G-5z excludes Storage operations |
| **No Publish dispatch** | `productionPublish` remains false |
| **No production data unless explicitly approved** | Separate production data gate |
| **Mock fallback required** | `PUBLIC_ADMIN_DATA_PROVIDER=mock` default |
| **Empty state required** | UI must handle zero rows |
| **Error state required** | UI must handle query/RLS/config failures |

---

## 4. Module scope

### Initial read-only targets

| Module | In G-5z read-only scope |
| --- | --- |
| **profile** | Yes |
| **schedule** | Yes |
| **discography** | Yes (tracks optional in G-5z-d+) |
| **links** | Yes |
| **news** | Yes |

### Out of scope (G-5z)

```txt
media upload
publish workflow
settings write
admin_users
sitemap generation
storage management
discography_tracks (optional later sub-phase)
schedule_months (derived/grouping — confirm in G-5z-b)
```

### Per-module summary

#### profile

| Item | Plan |
| --- | --- |
| Purpose | Show site/artist profile on staging shell dashboard |
| Source table candidate | `profile` (see `musician-basic-supabase-v1`) |
| Read-only fields | `name`, `bio`, `image_url`, `legacy_id` (+ `updated_at` if column exists) |
| Display destination | `#profile` section in `musician-basic-admin-prototype.astro` |
| RLS expectation | Anon read **published/public** row only; deny if RLS uncertain |
| Mock fallback | Current static `profile` object in prototype |
| Empty state | “No profile row” message; stay on mock if provider disabled |
| Future write phase | G-6+ after RLS + admin_users review |

#### schedule

| Item | Plan |
| --- | --- |
| Purpose | List upcoming/past events read-only |
| Source table candidate | `schedules` |
| Read-only fields | `id`, `legacy_id`, `date`, `title`, `venue`, `description`, `published`, `sort_order`, `home_image_url`, `image_url` |
| Display destination | `#schedule` → `ScheduleAdminUi` |
| RLS expectation | `published = true` rows for anon; drafts hidden |
| Mock fallback | Static `scheduleItems` array in prototype |
| Empty state | “No published schedules” |
| Future write phase | G-6+ |

#### discography

| Item | Plan |
| --- | --- |
| Purpose | List releases read-only |
| Source table candidate | `discography` |
| Read-only fields | `id`, `legacy_id`, `title`, `artist`, `release_date`, `cover_image_url`, `description`, `sort_order`, `published` |
| Display destination | `#discography` → `DiscographyAdminUi` |
| RLS expectation | Published rows only for anon |
| Mock fallback | Static `discographyItems` |
| Empty state | “No published releases” |
| Future write phase | G-6+; `discography_tracks` in later sub-phase |

#### links

| Item | Plan |
| --- | --- |
| Purpose | External links list read-only |
| Source table candidate | `links` |
| Read-only fields | `id`, `legacy_id`, `label`, `url`, `sort_order`, `published` |
| Display destination | `#links` → `LinksAdminUi` |
| RLS expectation | Published links only |
| Mock fallback | Static `linkItems` |
| Empty state | “No published links” |
| Future write phase | G-6+ |

#### news

| Item | Plan |
| --- | --- |
| Purpose | News/posts list read-only |
| Source table candidate | `news` |
| Read-only fields | `id`, `legacy_id`, `title`, `body`, `published_at`, `published` |
| Display destination | `#news` → `NewsAdminUi` |
| RLS expectation | Published posts only |
| Mock fallback | Static `newsItems` |
| Empty state | “No published news” |
| Future write phase | G-6+ |

---

## 5. Proposed table mapping

Aligned with `musician-basic-supabase-v1` (gosaki-proven draft). **Table names may differ per staging project** — confirm in G-5z-b via site config + schema adapter.

| Module | Table candidate | Schema adapter model |
| --- | --- | --- |
| profile | `profile` | `profile` |
| schedule | `schedules` | `schedules` |
| discography | `discography` | `discography` |
| links | `links` | `links` |
| news | `news` | `news` |

**Not in initial G-5z read scope:** `schedule_months`, `discography_tracks`, `admin_users`.

Unknown or missing tables are **not blockers for G-5z-a** — mark as *to be confirmed in G-5z-b* and keep `PUBLIC_ADMIN_DATA_PROVIDER=mock`.

---

## 6. Field mapping draft

Draft only — exact columns confirmed in G-5z-b from [cms-schema-adapters.json](../config/schema-adapters/cms-schema-adapters.json) and site config.

### profile

```txt
name              (maps to display_name in UI read model)
bio
image_url         (hero/profile image URL — not Storage API in G-5z)
legacy_id
updated_at        (if present on table — TBC in G-5z-b)
```

### schedule

```txt
id
legacy_id
title
date
venue             (venue_name in UI)
description
published
home_image_url
image_url
sort_order
updated_at        (TBC)
```

### discography

```txt
id
legacy_id
title
artist
release_date
cover_image_url
description
sort_order
published
updated_at        (TBC)
```

### links

```txt
id
legacy_id
label
url
sort_order
published
updated_at        (TBC)
```

### news

```txt
id
legacy_id
title
body
published_at
published
updated_at        (TBC)
```

---

## 7. Read-only adapter design

**G-5z-a does not create adapter files.** G-5z-b will add scaffold under:

```txt
src/lib/admin/staging-data/read-only-data-config.ts
src/lib/admin/staging-data/read-only-data-adapter.types.ts
src/lib/admin/staging-data/mock-read-only-data-adapter.ts
src/lib/admin/staging-data/supabase-read-only-data-adapter.ts   # G-5z-c only, with approval
```

### Interface draft

```ts
export interface ReadOnlyDataAdapter {
  provider: "mock" | "supabase";
  connectedToRuntime: boolean;
  productionReady: false;
  canWrite: false;
  getProfile(): Promise<ProfileReadModel | null>;
  listSchedules(): Promise<ScheduleReadModel[]>;
  listDiscography(): Promise<DiscographyReadModel[]>;
  listLinks(): Promise<LinkReadModel[]>;
  listNews(): Promise<NewsReadModel[]>;
}
```

### Hard rules

- `canWrite: false` always
- `productionReady: false` until explicit production gate
- **No** `insert`, `update`, `delete`, `upsert` methods
- **No** Storage methods
- **No** Publish / dispatch methods
- Supabase implementation uses **anon key + `select` only** (G-5z-c+, after RLS approval) — **not in G-5z-a**

---

## 8. Environment gate plan

Proposed for G-5z-b+ (optional comment in `.env.example` in G-5z-a):

```env
# G-5z read-only data integration. Disabled by default. Staging project only.
ENABLE_ADMIN_STAGING_DATA_READ=false
PUBLIC_ADMIN_DATA_PROVIDER=mock
```

Supabase read-only (G-5z-c+, explicit approval):

```env
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_DATA_READ=true
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_SUPABASE_URL=...        # staging project only — local, not committed
PUBLIC_SUPABASE_ANON_KEY=...    # anon only — never service role
```

Combined with existing Auth gates when both Auth and data are live:

```env
ENABLE_ADMIN_STAGING_AUTH=true
PUBLIC_ADMIN_AUTH_PROVIDER=supabase
```

**Default:** `ENABLE_ADMIN_STAGING_DATA_READ=false`, `PUBLIC_ADMIN_DATA_PROVIDER=mock`.

---

## 9. RLS requirements

```txt
RLS is required before real data access.
Read-only policies must be reviewed before G-5z-b/G-5z-c.
Anon key access must be limited to published/staging-safe rows.
No write policies are needed in G-5z.
No service role in browser.
If RLS is uncertain, use mock provider only.
```

### Draft read-only policy (example — schedules)

```sql
-- DRAFT ONLY. DO NOT RUN IN G-5z-a.
-- Review with staging project owner before G-5z-c.
create policy "anon_read_published_schedules"
  on public.schedules
  for select
  to anon
  using (published = true);
```

Similar drafts for `profile`, `discography`, `links`, `news` — **all DRAFT ONLY. DO NOT RUN IN G-5z-a.**

RLS review deliverable: G-5z-e read-only QA / RLS review report.

---

## 10. Data visibility boundary

### OK to display (read-only, staging-safe)

- Public profile fields
- **Published** schedules
- **Published** discography
- **Published** links
- **Published** news

### Do not display in G-5z

- Unpublished drafts (`published = false`)
- Private notes / internal comments
- Soft-deleted rows (if any)
- Customer personal data
- Emails from CMS tables
- Payment / subscription data
- `admin_users` rows
- Storage bucket listings via API

**Policy:** G-5z shows public-equivalent or staging-approved published data only. Draft/private admin data waits for write/admin phases.

---

## 11. Error / empty / loading states

Staging shell modules should support:

| State | When | UI behavior |
| --- | --- | --- |
| **loading** | Adapter fetch in progress | Skeleton or spinner; actions disabled |
| **empty** | Zero rows returned | Module-specific empty message |
| **error** | Network / Supabase / unknown error | Safe message; no secret leakage |
| **mock fallback** | Data provider mock or gates off | Current static prototype data |
| **auth signed-out** | No session (optional for public read) | Banner; data may still show if RLS allows anon |
| **role denied** | Mock allowlist denied (informational) | Role banner; RLS still governs data |
| **data provider disabled** | `ENABLE_ADMIN_STAGING_DATA_READ=false` | Mock data + status panel |
| **config missing** | URL/key missing when supabase selected | Mock fallback + config alert |
| **RLS denied** | Empty result or policy error | “Data unavailable” — do not expose policy details |

Status panel should show: `Data mode: mock | supabase-read-only | disabled`.

---

## 12. No-write guarantee

Forbidden in G-5z (all sub-phases until explicit write approval):

```txt
insert
update
delete
upsert
rpc write
storage upload
storage delete
publish dispatch
workflow_dispatch
ftp deploy
```

**UI policy:** Save, delete, publish, and upload controls remain **disabled** on staging shell through G-5z. Read-only badges on module headers.

Adapter type enforces `canWrite: false`. G-5z-b CI/grep checks for `insert`/`update`/`delete` in `staging-data/` src.

---

## 13. Relationship to Auth / Role

```txt
Auth identifies a signed-in staging user (G-5y-d).
Role display is mock/informational (G-5y-e-a).
Real role enforcement is not trusted until server-side allowlist or admin_users (G-5y-e-b / G-6).
Read-only data access must not depend solely on browser role.
RLS remains the real database boundary for anon/authenticated reads.
```

Sequence for G-5z-c:

1. User may be signed in (optional for public published data).
2. Data adapter uses anon client + RLS.
3. Browser role badge is **informational** only.
4. Denied mock allowlist does **not** replace RLS — both must be understood separately.

---

## 14. G-5z phase breakdown

| Phase | Focus |
| --- | --- |
| **G-5z-a（完了）** | Read-only data integration plan |
| **G-5z-b（完了）** | [Read-only data adapter scaffold](./read-only-data-adapter-scaffold.md) — mock only |
| **G-5z-c-prep（完了）** | [Schema mapping / RLS read policy review](./schema-mapping-rls-read-policy-review.md) |
| **G-5z-c（完了）** | [Supabase read-only adapter](./supabase-read-only-data-adapter.md) — approval `G-5z-c-staging-read-only-data-connect` |
| **G-5z-d（完了）** | [Staging read-only module display QA](./staging-read-only-module-display-qa.md) |
| **G-5z-e（完了）** | [Read-only QA / RLS review report](./read-only-qa-rls-review-report.md) |
| **G-6-a** | Write operation safety plan |
| **G-5z-d** | Staging shell read-only module display wiring |
| **G-5z-e** | Read-only QA / RLS review report |

Parallel track (optional): **G-5y-e-c** server-side allowlist dry-run — does not block G-5z-b mock scaffold.

---

## 15. Approval gates

| Gate | Allowed | Forbidden | Evidence | Rollback |
| --- | --- | --- | --- | --- |
| **read-only data plan approval** | This doc | DB query | Plan reviewed | N/A |
| **schema/table mapping approval** | Draft mapping in docs | Live query | Schema adapter + site config match | Use mock |
| **RLS read policy approval** | Draft SQL in docs | `CREATE POLICY` in G-5z-a | G-5z-e review report | `PUBLIC_ADMIN_DATA_PROVIDER=mock` |
| **staging Supabase project approval** | Staging URL in local env | Production URL in client | G-5y-d-prep checklist | Remove env values |
| **read-only adapter scaffold approval** | Types + mock adapter (G-5z-b) | `from()`/`select()` | Dry-run report | Delete scaffold |
| **Supabase read-only connection approval** | `select` via anon (G-5z-c) | Writes | RLS sign-off + grep clean | Disable data read flag |
| **staging shell display approval** | Wire modules (G-5z-d) | Enable save buttons | Visual QA on shell route | Mock provider |
| **production data access approval** | — | Any production project data | Separate gate | Never default |

---

## 16. Rollback / disable plan

Disable read-only Supabase data without DB migration:

```env
ENABLE_ADMIN_STAGING_DATA_READ=false
PUBLIC_ADMIN_DATA_PROVIDER=mock
```

Additional steps:

- Remove local staging `PUBLIC_SUPABASE_*` values (optional — Auth may stay on for testing)
- Staging shell reverts to static mock data in prototype
- No DB rollback needed (read-only only)
- No production rollback (production data never touched in G-5z)

---

## 17. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Reading production data by mistake | Staging project approval; grep for production URLs; separate env files |
| RLS too permissive | RLS review before G-5z-c; default mock if uncertain |
| Exposing draft/private data | Filter `published = true`; field allowlist in adapter |
| Write method accidentally introduced | `canWrite: false`; no write methods; grep in CI |
| Confusing staging shell with production admin | Route `__admin-staging-shell`; banners; `/admin` not connected |
| Role spoofing | Do not trust browser role for data; RLS enforces access |
| Service role in browser | Never in `PUBLIC_*`; code review + grep |
| Storage URL leakage | Read URL columns only; no Storage API in G-5z |

---

## 18. Forbidden operations

```txt
- DB insert / update / delete
- DB rpc write
- Storage upload / delete
- Storage read API (G-5z-a; URL fields from table OK in later read-only display)
- RLS policy mutation
- admin_users table creation
- service role in browser
- production data connection
- /admin route connection
- GitHub dispatch
- FTP deploy
- production publish
- from() / select() in G-5z-a (planning only)
```

---

## 19. G-5z-b acceptance criteria

Proceed to **G-5z-b** when:

```txt
- G-5z-a plan reviewed
- module list agreed (profile, schedule, discography, links, news)
- table/field mapping drafted against schema adapter
- env gates agreed (ENABLE_ADMIN_STAGING_DATA_READ, PUBLIC_ADMIN_DATA_PROVIDER)
- no-write guarantee documented
- RLS requirement documented
- mock fallback documented
- production data forbidden
- /admin remains disconnected
```

G-5z-b deliverables: types + mock adapter + dry-run CLI report — **no Supabase query**.

**G-5z-b（完了）:** [read-only-data-adapter-scaffold.md](./read-only-data-adapter-scaffold.md).

**G-5z-c-prep（完了）:** [schema-mapping-rls-read-policy-review.md](./schema-mapping-rls-read-policy-review.md).

**G-5z-c（完了）:** [supabase-read-only-data-adapter.md](./supabase-read-only-data-adapter.md).

**G-5z-d（完了）:** [staging-read-only-module-display-qa.md](./staging-read-only-module-display-qa.md).

**G-5z-e（完了）:** [read-only-qa-rls-review-report.md](./read-only-qa-rls-review-report.md). `readOnlyPhaseComplete: true`. Next: **G-6-a**.

---

## 20. Final safety statement

**G-5z-a is a planning phase only.**

```txt
No Supabase DB query is implemented.
No from() / select() is added.
No database is queried or updated.
No RLS policy is created or changed.
No storage read/write is implemented.
No GitHub dispatch is performed.
No FTP deploy is performed.
No /admin route is connected.
No production data is touched.
```

Config reference: [read-only-data-integration-plan.json](../config/admin/read-only-data-integration-plan.json).
