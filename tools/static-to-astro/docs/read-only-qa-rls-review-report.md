# Read-only QA / RLS Review Report

## 1. Purpose

G-5z-e closes the **read-only data integration phase** (G-5z-a through G-5z-d) with an integrated QA and RLS review report. It consolidates design, implementation, display QA, and safety guarantees — without adding new database features.

**This phase does not:**

- add new Supabase DB queries or expand approved fields
- perform write operations (insert / update / delete / upsert)
- create or change RLS policies
- connect Storage read/write
- enable Publish dispatch
- connect `/admin` route
- touch production data

Related docs:

- [read-only-data-integration-plan.md](./read-only-data-integration-plan.md) (G-5z-a)
- [read-only-data-adapter-scaffold.md](./read-only-data-adapter-scaffold.md) (G-5z-b)
- [supabase-read-only-data-adapter.md](./supabase-read-only-data-adapter.md) (G-5z-c)
- [staging-read-only-module-display-qa.md](./staging-read-only-module-display-qa.md) (G-5z-d)
- [schema-mapping-rls-read-policy-review.md](./schema-mapping-rls-read-policy-review.md) (G-5z-c-prep)

## 2. Phase summary

| Phase | Purpose | Key files / docs | Safety status | Remaining risks |
| --- | --- | --- | --- | --- |
| **G-5z-a** | Read-only data integration plan | `read-only-data-integration-plan.md`, `config/admin/read-only-data-integration-plan.json` | Planning only; no DB query | Plan must be followed before G-5z-c |
| **G-5z-b** | Mock read-only adapter scaffold | `mock-read-only-data-adapter.ts`, fixtures, status panel, inspect CLI | Mock only; `canWrite: false` | Fixtures are fictional; not live data |
| **G-5z-c** | Supabase read-only adapter | `supabase-read-only-data-adapter.ts`, approval `G-5z-c-staging-read-only-data-connect` | Env-gated; approved fields; anon key only | RLS must match staging project |
| **G-5z-d** | Staging shell display QA | `staging-read-only-module-display-qa.md`, QA CLI | Display QA only; no new queries | Browser QA is manual per project |
| **G-5z-e** | Read-only QA / RLS review report | This document; completion report CLI | Report only; no code/query changes | Per-customer RLS sign-off still required |

## 3. Current implementation status

| Item | Status |
| --- | --- |
| Staging shell route only | `/__admin-staging-shell/musician-basic/` (not `/admin/`) |
| `ReadOnlyDataAdapter` | exists (`read-only-data-adapter.types.ts`) |
| Mock provider | exists (`mock-read-only-data-adapter.ts`) |
| Supabase read-only provider | exists (`supabase-read-only-data-adapter.ts`) |
| `canWrite` | always `false` |
| Approved fields only | yes; no `select *` |
| Mock fallback | `ENABLE_ADMIN_STAGING_DATA_READ=false` or `PUBLIC_ADMIN_DATA_PROVIDER=mock` |
| Module-level error/fallback | `staging-read-only-data-loader.ts` |
| `/admin` route | not connected |
| Storage | not connected |
| Publish | disabled |
| `productionReady` | always `false` |

## 4. Module status matrix

| module | table | field mapping status | mock status | Supabase read status | empty state | error state | RLS denied state | fallback behavior | remaining notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| profile | `profile` | confirmed (`name`→displayName, `image_url`→hero) | mock fixture | `select` approved cols, limit 1 | no row message | safe module error | safe denied message | mock when data read off | single row expected |
| schedule | `schedules` | confirmed (`venue`→venueName) | mock list | `published=true`, limit 20, order `date` | empty list message | module error only | module denied only | mock fallback env | |
| discography | `discography` | confirmed | mock list | `published=true`, limit 20, order `sort_order` | empty list message | module error only | module denied only | mock fallback env | |
| links | `links` | confirmed | mock list (example.com) | `published=true`, limit 20, order `sort_order` | empty list message | module error only | module denied only | mock fallback env | long URLs wrap in UI |
| news | `news` (likely) | likely — staging confirmation needed | mock list | `published=true`, limit 20, order `published_at` | empty list message | **table missing / field mismatch** | RLS denied | **module-local only**; shell stays up | **see focus below** |

### News focus (G-5z-c-prep: likely table)

- news table may need **staging project confirmation** before relying on live data
- news should **fail module-locally** if table missing, RLS denied, or field mismatch
- **screen must not crash** when news fails
- **mock fallback remains available** via env (`PUBLIC_ADMIN_DATA_PROVIDER=mock` or `ENABLE_ADMIN_STAGING_DATA_READ=false`)

## 5. Approved table / field summary

No `select *`. Approved fields only. Field expansion requires separate approval.

| module | table | selected fields | filters | limit | order | fallback |
| --- | --- | --- | --- | --- | --- | --- |
| profile | `profile` | `id`, `legacy_id`, `name`, `bio`, `image_url` | — | 1 | — | mock / config-missing |
| schedule | `schedules` | `id`, `legacy_id`, `date`, `title`, `venue`, `description`, `home_image_url`, `published`, `sort_order` | `published = true` | 20 | `date` asc | mock env |
| discography | `discography` | `id`, `legacy_id`, `title`, `artist`, `release_date`, `cover_image_url`, `description`, `sort_order`, `published` | `published = true` | 20 | `sort_order` asc | mock env |
| links | `links` | `id`, `legacy_id`, `label`, `url`, `sort_order`, `published` | `published = true` | 20 | `sort_order` asc | mock env |
| news | `news` | `id`, `legacy_id`, `title`, `body`, `published_at`, `published` | `published = true` | 20 | `published_at` desc | mock env; module error if unavailable |

Implementation: `src/lib/admin/staging-data/supabase-read-only-data-adapter.ts`

## 6. RLS read policy review

**Principles:**

- RLS must be reviewed before relying on real staging data
- Anon key must **not** bypass RLS (no service role in browser)
- Read-only policies should expose only intended public/staging-safe rows
- Write policies are **not** part of G-5z
- If RLS is uncertain, use **mock mode**

### RLS review checklist

```txt
[ ] RLS enabled on target tables
[ ] anon select policy exists only where intended
[ ] published/staging-safe filters are enforced (adapter + RLS align)
[ ] private/draft/deleted rows are not exposed
[ ] no write policy needed for G-5z read-only phase
[ ] service role is not used in browser
[ ] staging project confirmed (not production)
[ ] production project excluded from CMS Kit dev gates
```

### Draft policy shape (reference only)

```sql
-- DRAFT ONLY. DO NOT RUN IN G-5z-e.
-- Example shape for published read on schedules. Review with staging project owner.
-- create policy "anon_read_published_schedules"
--   on public.schedules for select
--   to anon
--   using (published = true);
```

G-5z-e does **not** create or alter any RLS policy.

## 7. No-write guarantee

Read-only phase guarantees (re-verified in G-5z-e):

| Check | Status |
| --- | --- |
| `canWrite: false` in adapter contract and UI | confirmed |
| No `create*` / `update*` / `delete*` / `save*` / `publish*` methods | confirmed |
| No `insert` / `update` / `delete` / `upsert` / `rpc` in `staging-data` | grep clean |
| No `storage.` read/write in staging-data path | confirmed |
| No publish `workflow_dispatch` in staging-data | confirmed |
| No FTP deploy in staging-data | confirmed |
| No `/admin` connection | confirmed |
| `select *` not used | confirmed |
| Write methods not implemented | confirmed |
| Service role not used in browser / committed env example | confirmed |
| Storage not connected | confirmed |
| Publish not connected | confirmed |

## 8. Auth / role / data boundary

| Layer | Responsibility |
| --- | --- |
| **Auth** | Staging shell may sign in via Supabase Auth (G-5y-d); production Auth untouched |
| **Role** | Mock allowlist role display exists (G-5y-e-a); browser role is **informational** until server-side enforcement / RLS |
| **Data** | Read-only adapter reads approved fields only; **RLS is the real database boundary**; no write operations exist |
| **Publish** | `productionPublish` / production-ready flags remain `false` |

## 9. QA results summary

From G-5z-d ([staging-read-only-module-display-qa.md](./staging-read-only-module-display-qa.md)):

| QA area | Status |
| --- | --- |
| Mock mode QA | documented + CLI checks |
| Supabase read-only mode QA | documented (staging project manual) |
| Module-level fallback QA | documented; news focus |
| No-write QA | documented + forbidden pattern scan |
| Visual / UX QA | documented |
| a11y / basic HTML QA | documented |
| `readyForG5zE` | `true` (inspect + display QA CLI) |

## 10. Blockers / warnings / recommendations

### Blockers (for G-6 **implementation** — not for read-only phase completion)

- Production write operations are **not approved**
- RLS **write** policies are not designed
- `admin_users` / server-side allowlist not fully implemented for production admin
- `/admin` route is not connected to CMS Kit staging shell
- Service role must never ship to browser

### Warnings

- Browser-side role display is informational only
- `news` table mapping may require per-staging-project confirmation
- RLS must be reviewed per customer / staging project
- Production data remains **forbidden** for CMS Kit dev gates
- Staging Supabase URL/key must not be committed

### Recommendations

- Proceed to **G-6-a: write operation safety plan** — not direct write implementation
- RLS write policy review (**G-6-b**) must precede any write adapter
- Keep `productionPublish` disabled until explicit approval
- Keep `/admin` disconnected until staging readiness is complete
- Consider **customer demo / QA package** before enabling writes

## 11. Completion criteria for read-only phase

| Criterion | Met |
| --- | --- |
| Read-only plan exists (G-5z-a) | yes |
| Mock adapter exists (G-5z-b) | yes |
| Supabase read-only adapter exists (G-5z-c) | yes |
| Module display QA exists (G-5z-d) | yes |
| RLS review checklist exists (G-5z-e) | yes |
| No-write guarantee confirmed | yes |
| Mock fallback available | yes |
| Production data untouched | yes |
| `/admin` disconnected | yes |

**Judgment:**

```txt
readOnlyPhaseComplete: true
readyForG6Planning: true
readyForG6Implementation: false
```

Do **not** jump directly to G-6 write implementation. Next step is **G-6 planning**.

## 12. Next phase recommendation

Recommended sequence:

```txt
G-6-a（完了）: write operation safety plan
G-6-b: RLS write policy review plan
G-6-c: disabled write action scaffold
G-6-d: staging update-only proof of concept
```

Alternative (productization):

```txt
G-5z-f（完了）: Customer demo / QA package before write operations
```

See: [customer-demo-package-before-writes/README.md](./customer-demo-package-before-writes/README.md)

**G-6-a（完了）:** [write-operation-safety-plan.md](./write-operation-safety-plan.md) — planning only; `readyForG6B: true`.

**Important:** Proceed to **G-6-b** before any write implementation.

## 13. Final safety statement

**G-5z-e is a review/report phase only.**

```txt
No new Supabase DB query is added.
No approved fields are expanded.
No database is written.
No RLS policy is created or changed.
No storage read/write is implemented.
No GitHub dispatch is performed.
No FTP deploy is performed.
No /admin route is connected.
No production data is touched.
```

## 14. Machine-readable report

```bash
node tools/static-to-astro/scripts/report-read-only-phase-completion.mjs \
  --out-dir tools/static-to-astro/output/read-only-phase-completion/gosaki
```

Output (not committed): `read-only-phase-completion.json`, `READ_ONLY_PHASE_COMPLETION_REPORT.md`

## 15. Customer demo package (G-5z-f)

**G-5z-f（完了）:** [customer-demo-package-before-writes/README.md](./customer-demo-package-before-writes/README.md)

```bash
node tools/static-to-astro/scripts/report-customer-demo-readiness.mjs \
  --out-dir tools/static-to-astro/output/customer-demo-readiness/gosaki
```
