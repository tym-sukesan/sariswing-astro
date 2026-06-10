# Schema Mapping / RLS Read Policy Review

## 1. Purpose

G-5z-c-prep is the **review phase** before implementing the Supabase read-only data adapter in G-5z-c. It finalizes which tables and fields may be read, documents RLS expectations, and defines the approval gate — **without connecting to any database**.

**G-5z-c-prep is review / planning only.**

- Prepares for G-5z-c Supabase read-only adapter (`from().select()` on approved tables only).
- **No Supabase DB query is implemented in G-5z-c-prep.**
- **No `from()` / `select()` is added.**
- **No write operations.**
- **No RLS policy creation or changes.**
- **No Storage read / write.**
- **No Publish / FTP / GitHub dispatch.**
- **No `/admin` route connection.**
- **Production data is untouched.**

Related: [read-only-data-integration-plan.md](./read-only-data-integration-plan.md) (G-5z-a), [read-only-data-adapter-scaffold.md](./read-only-data-adapter-scaffold.md) (G-5z-b).

---

## 2. Current state

| Phase | Status |
| --- | --- |
| **G-5z-a** | Read-only data integration plan exists |
| **G-5z-b** | Read-only data adapter scaffold / mock provider exists |

Current guarantees on staging shell:

```txt
ReadOnlyDataAdapter has canWrite: false
mock preview is visible in staging shell (/__admin-staging-shell/musician-basic/)
Supabase DB query is not implemented
RLS is not changed by CMS Kit
Storage is not connected on staging shell data path
Publish is disabled
/admin route is not connected
```

Inspect CLI (`inspect-read-only-data-adapter.mjs`) reports `readyForG5zC: true` when scaffold is complete.

---

## 3. Review principles

| Principle | Requirement |
| --- | --- |
| Schema mapping before query | Table/field list approved in this doc before G-5z-c code |
| RLS review before real data access | Policies reviewed on staging project before `select` |
| Read-only only | No insert / update / delete / upsert / rpc write |
| Staging project only | `PUBLIC_SUPABASE_URL` must be staging-approved project |
| Anon key only | Browser uses anon key; RLS must enforce boundaries |
| Service role never in browser | No `SERVICE_ROLE` in `PUBLIC_*` or client bundle |
| Published / staging-safe rows only | Filter drafts and deleted rows where columns exist |
| Mock fallback required | `PUBLIC_ADMIN_DATA_PROVIDER=mock` default |
| No production data unless explicitly approved | Separate production data gate |
| No writes before separate RLS/write review | G-6+ for writes |

---

## 4. Target modules

### In scope (G-5z read-only)

```txt
profile
schedule
discography
links
news
```

### Out of scope

```txt
media upload
storage management (Storage API)
publish workflow
settings write
admin_users
sitemap generation
private notes
payment / subscription data
discography_tracks (optional later sub-phase)
schedule_months (grouping table — confirm if needed in G-5z-c)
```

---

## 5. Schema adapter source

Mapping sources (file read / docs only — **no DB connection in G-5z-c-prep**):

| Source | Path | Role |
| --- | --- | --- |
| Schema adapter registry | [cms-schema-adapters.json](../config/schema-adapters/cms-schema-adapters.json) | `musician-basic-supabase-v1` table/column metadata |
| Site config example | [gosaki.site-config.example.json](../config/sites/gosaki.site-config.example.json) | Per-site `schemaAdapterId`, CMS table hints |
| Read-only plan | [read-only-data-integration-plan.json](../config/admin/read-only-data-integration-plan.json) | Target modules, phase gates |
| Mock read models | `src/lib/admin/staging-data/read-only-data-adapter.types.ts` | UI read model field names |

**Adapter ID for musician-basic (gosaki-proven):** `musician-basic-supabase-v1`

Per-site staging projects may differ; **confirm live schema on staging Supabase dashboard** before G-5z-c implementation.

---

## 6. Proposed table mapping review

| Module | Candidate table | Confidence | Source | Confirm before G-5z-c | RLS expectation | Fallback if unavailable |
| --- | --- | --- | --- | --- | --- | --- |
| **profile** | `profile` | confirmed | `musician-basic-supabase-v1` | Singleton row exists | Anon/authenticated read of public profile row only | Mock profile fixture |
| **schedule** | `schedules` | confirmed | schema adapter + gosaki site config | `published` column behavior | `published = true` for anon | Mock schedules |
| **discography** | `discography` | confirmed | schema adapter | Cover URL columns only (no Storage API) | `published = true` for anon | Mock discography |
| **links** | `links` | confirmed | schema adapter | Table exists on staging project | `published = true` for anon | Mock links |
| **news** | `news` | likely | schema adapter | Table may be empty on some sites | `published = true` for anon | Mock news |
| profile (alt) | `site_profile` / `artist_profile` | draft | other templates | Not used for musician-basic v1 | TBD | Use `profile` or mock |
| schedule (grouping) | `schedule_months` | confirmed | schema adapter | Not in initial G-5z-c read scope | Read via schedules only | Skip in G-5z-c |
| tracks | `discography_tracks` | confirmed | schema adapter | Deferred past G-5z-c initial | Parent discography published | Skip initially |

**Note:** `unknown` mappings are not blockers for G-5z-c-prep but must be resolved to `confirmed` on the **staging project** before running queries.

---

## 7. Field mapping review

Read model fields (G-5z-b) map to schema adapter columns (G-5z-c-prep draft).

### profile

| Read model field | Source column (adapter) | Required | Safety | Fallback | Display |
| --- | --- | --- | --- | --- | --- |
| `displayName` | `name` | optional | public-safe | `"—"` | Profile preview / `#profile` |
| `bio` | `bio` | optional | public-safe | empty string | Profile preview |
| `heroImageUrl` | `image_url` | optional | public-safe (URL string) | empty | Profile preview |
| `updatedAt` | `updated_at` | optional | public-safe | omit if column missing | Status only |

Internal: `id`, `legacy_id` — optional for read model; do not expose internal IDs in public UI unless needed for keys.

### schedule

| Read model field | Source column | Required | Safety | Fallback | Display |
| --- | --- | --- | --- | --- | --- |
| `id` | `id` or `legacy_id` | yes | public-safe | skip row | Schedule list |
| `title` | `title` | optional | public-safe | `"Untitled"` | Schedule list |
| `date` | `date` | yes | public-safe | — | Schedule list |
| `time` | — (not in adapter) | optional | — | omit | Schedule list |
| `venueName` | `venue` | optional | public-safe | — | Schedule list |
| `description` | `description` | optional | public-safe | — | Detail preview |
| `published` | `published` | yes (filter) | filter field | exclude if false | Filter only |
| `homeImageUrl` | `home_image_url` | optional | public-safe URL | — | Thumbnail |
| `sortOrder` | `sort_order` | optional | public-safe | default sort by date | Ordering |
| `updatedAt` | `updated_at` | optional | TBC on live DB | omit | Status |

**Exclude from select:** `show_on_home`, `home_order` unless explicitly approved for admin preview (staging-safe).

### discography

| Read model field | Source column | Required | Safety | Fallback | Display |
| --- | --- | --- | --- | --- | --- |
| `id` | `id` / `legacy_id` | yes | public-safe | — | List key |
| `title` | `title` | yes | public-safe | — | List |
| `releaseDate` | `release_date` | optional | public-safe | — | List |
| `coverImageUrl` | `cover_image_url` | optional | public-safe URL | — | Thumbnail |
| `links` | — (not in adapter) | optional | — | omit or empty array | G-5z-d+ |
| `published` | `published` | yes (filter) | filter | exclude | Filter |
| `sortOrder` | `sort_order` | optional | public-safe | — | Ordering |
| `updatedAt` | `updated_at` | optional | TBC | omit | Status |

### links

| Read model field | Source column | Required | Safety | Fallback | Display |
| --- | --- | --- | --- | --- | --- |
| `id` | `id` / `legacy_id` | yes | public-safe | — | List |
| `label` | `label` | yes | public-safe | — | List |
| `url` | `url` | yes | public-safe | — | List |
| `sortOrder` | `sort_order` | optional | public-safe | — | Ordering |
| `published` | `published` | yes (filter) | filter | exclude | Filter |
| `updatedAt` | `updated_at` | optional | TBC | omit | Status |

### news

| Read model field | Source column | Required | Safety | Fallback | Display |
| --- | --- | --- | --- | --- | --- |
| `id` | `id` / `legacy_id` | yes | public-safe | — | List |
| `title` | `title` | yes | public-safe | — | List |
| `body` | `body` | optional | public-safe | truncate in UI | Preview |
| `url` | — (not in adapter) | optional | — | omit | G-5z-d+ |
| `published` | `published` | yes (filter) | filter | exclude | Filter |
| `publishedAt` | `published_at` | optional | public-safe | — | List |
| `updatedAt` | `updated_at` | optional | TBC | omit | Status |

---

## 8. Published / staging-safe filter policy

### Global principles

```txt
published = true where column exists
deleted_at is null where column exists
is_deleted = false where column exists
limit rows (e.g. 50 per module initial cap)
order by sort_order / date / updated_at where safe
exclude private/internal fields from select list
no select *
```

### Per-module filters (draft — implement in G-5z-c after live schema check)

| Module | Filter draft |
| --- | --- |
| **profile** | Single row: `legacy_id = 'profile-main'` or first row; staging-safe public fields only |
| **schedule** | `published = true`; optional `date >= today() - interval '1 year'`; `order by date asc`; `limit 50` |
| **discography** | `published = true`; `order by sort_order asc nulls last`; `limit 50` |
| **links** | `published = true`; `order by sort_order asc`; `limit 50` |
| **news** | `published = true`; `order by published_at desc nulls last`; `limit 50` |

Exact filters are **draft only** in G-5z-c-prep; confirm against live staging schema in G-5z-c preflight.

---

## 9. RLS read policy requirements

```txt
RLS must allow only intended read-only access.
Anon key must not bypass RLS (RLS enabled on table).
No service role in browser.
Read policies must be reviewed on staging project before G-5z-c.
If RLS is uncertain, stay in mock mode (PUBLIC_ADMIN_DATA_PROVIDER=mock).
No write policies are needed in G-5z.
```

### Draft policies (examples — **DO NOT RUN**)

```sql
-- DRAFT ONLY. DO NOT RUN IN G-5z-c-prep.
-- Example shape only. Review with staging project owner before G-5z-c.

create policy "anon_read_published_schedules"
  on public.schedules
  for select
  to anon
  using (published = true);

create policy "anon_read_published_discography"
  on public.discography
  for select
  to anon
  using (published = true);

create policy "anon_read_published_links"
  on public.links
  for select
  to anon
  using (published = true);

create policy "anon_read_published_news"
  on public.news
  for select
  to anon
  using (published = true);

-- profile: restrict to intended public row(s) — confirm strategy on staging
create policy "anon_read_public_profile"
  on public.profile
  for select
  to anon
  using (true);  -- TIGHTEN before G-5z-c — e.g. legacy_id = 'profile-main'
```

**G-5z-c-prep does not create or alter any RLS policy.**

---

## 10. Sensitive data exclusion

Do **not** display or select on staging shell:

```txt
emails
payment data
subscription data
private notes
internal admin comments
deleted rows / soft-deleted rows
draft rows (published = false) for anon reads
customer personal data beyond public CMS fields
service tokens
workflow IDs
FTP credentials
admin_users columns
raw JWT / session tokens in UI
```

---

## 11. Supabase read-only adapter boundary for G-5z-c

### G-5z-c allowed (with approval `G-5z-c-staging-read-only-data-connect`)

```txt
env-gated Supabase read-only adapter
from().select() on approved tables only
select approved fields only (explicit column list)
published / staging-safe filters in query
row limits
error / empty / loading states
mock fallback on failure or disabled env
staging project URL + anon key only (local env, not committed)
```

### G-5z-c forbidden

```txt
insert / update / delete / upsert
rpc write
storage read / write (unless separate approval)
RLS policy changes from CMS Kit code
admin_users table access
/admin route connection
production Supabase project / production data
publish / GitHub / FTP dispatch
select * without field review
service role in browser
```

---

## 12. Approval gate for G-5z-c

**Approval ID:** `G-5z-c-staging-read-only-data-connect`

| Requirement | Evidence |
| --- | --- |
| G-5z-b `readyForG5zC: true` | `inspect-read-only-data-adapter.mjs` report |
| Staging Supabase project confirmed | Operator sign-off; not production |
| Production project excluded | URL review; no production host in env |
| Target tables confirmed | This doc §6 + staging dashboard |
| Target fields confirmed | This doc §7 + adapter columns |
| Published / staging-safe filters confirmed | §8 |
| RLS read policies reviewed | §9 + staging dashboard policies tab |
| Env gate confirmed | `ENABLE_ADMIN_STAGING_DATA_READ`, `PUBLIC_ADMIN_DATA_PROVIDER` |
| Mock fallback confirmed | Disable flags revert to mock |
| No-write guarantee confirmed | `canWrite: false`; grep clean |
| Rollback by env disable confirmed | §14 |

---

## 13. Preflight checklist for G-5z-c

Use immediately before G-5z-c implementation:

```txt
[ ] staging project selected (not production)
[ ] PUBLIC_SUPABASE_URL points to staging project only
[ ] anon key only — no service role in env or code
[ ] target tables confirmed on staging (profile, schedules, discography, links, news)
[ ] target fields confirmed per §7
[ ] published filters confirmed per §8
[ ] RLS SELECT policies reviewed on staging (not created by CMS Kit in prep)
[ ] no sensitive fields in select list
[ ] row limits agreed
[ ] env values prepared locally (.env gitignored)
[ ] mock fallback verified (ENABLE_ADMIN_STAGING_DATA_READ=false)
[ ] inspect-read-only-data-adapter readyForG5zC true
[ ] no write methods planned in adapter
[ ] approval id G-5z-c-staging-read-only-data-connect recorded
[ ] src/pages/admin untouched
[ ] /admin route not connected
```

---

## 14. Rollback / disable plan

After G-5z-c implementation, disable without DB migration:

```env
ENABLE_ADMIN_STAGING_DATA_READ=false
PUBLIC_ADMIN_DATA_PROVIDER=mock
```

Additional steps:

- Remove local staging `PUBLIC_SUPABASE_*` from dev env if desired
- Staging shell returns to mock fixtures via mock adapter
- No DB rollback needed (read-only only)
- No RLS rollback from CMS Kit (G-5z-c must not change RLS)
- No production rollback (production data never touched)

---

## 15. Error handling requirements

G-5z-c adapter must handle:

| Condition | Safe UI behavior |
| --- | --- |
| Config missing | Mock fallback + “Supabase data config missing” |
| Staging data disabled | Mock provider |
| RLS denied | Empty or error state; no SQL/policy details |
| Table missing | Module empty state; mock fallback option |
| Field missing | Map omit; do not crash entire shell |
| Network error | Retry message; mock fallback |
| Empty data | Module empty state |
| Unexpected shape | Log internally if needed; user-safe message |
| Mock fallback available | Always when env gate off or query fails |

**Never expose** secrets, RLS policy text, or raw PostgREST errors to users.

---

## 16. Query safety checklist

Apply during G-5z-c code review:

```txt
[ ] select explicit approved fields only
[ ] no select *
[ ] limit rows per module
[ ] published = true filter where column exists
[ ] no private / internal fields
[ ] no insert / update / delete / upsert
[ ] no rpc calls
[ ] no storage API
[ ] no service role
[ ] canWrite remains false on adapter
[ ] productionReady remains false
[ ] grep: no forbidden patterns in staging-data src
```

---

## 17. Forbidden operations

```txt
- select * without review
- DB insert / update / delete / upsert
- DB rpc write
- Storage upload / delete
- Storage read without separate approval
- RLS policy mutation from CMS Kit
- admin_users table creation or query
- service role in browser
- production data connection
- /admin route connection
- GitHub dispatch
- FTP deploy
- production publish
- from() / select() in G-5z-c-prep (review only)
```

---

## 18. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Wrong table mapping | Schema adapter + manual staging dashboard review |
| RLS denied unexpectedly | Mock fallback; clear empty/error state |
| RLS too permissive | Policy review before G-5z-c; tighten draft policies |
| Draft/private data exposed | `published = true` filter; field allowlist |
| Query grows into write path | `canWrite: false`; grep for write methods |
| Production data touched | Staging project approval gate; URL checklist |
| `select *` over-fetch | Explicit column lists in adapter |
| Column rename on staging DB | Preflight column check; adapter version note |

---

## 19. G-5z-c acceptance criteria

Proceed to **G-5z-c** when:

```txt
- schema mapping reviewed (this doc)
- RLS read policy requirements reviewed (§9)
- approval gate documented (§12)
- preflight checklist exists (§13)
- rollback plan exists (§14)
- no DB query implemented in G-5z-c-prep
- no RLS changed in G-5z-c-prep
- no production data touched
- G-5z-b scaffold complete (readyForG5zC true)
```

---

## 20. Final safety statement

**G-5z-c-prep is a review phase only.**

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

---

## 21. G-5z-c implementation (complete)

**G-5z-c（完了）:** [supabase-read-only-data-adapter.md](./supabase-read-only-data-adapter.md)

- Approval ID: `G-5z-c-staging-read-only-data-connect`
- Staging shell only; env-gated `from().select()` on approved fields
- `canWrite: false`; mock fallback preserved
- RLS not modified by CMS Kit
- **G-5z-d（完了）:** [staging-read-only-module-display-qa.md](./staging-read-only-module-display-qa.md)
- Next: **G-5z-e** read-only QA / RLS review report

Config reference: [schema-mapping-rls-read-policy-review.json](../config/admin/schema-mapping-rls-read-policy-review.json).
