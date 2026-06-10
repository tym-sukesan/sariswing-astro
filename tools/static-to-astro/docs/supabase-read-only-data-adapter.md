# Supabase Read-only Data Adapter

## 1. Purpose

G-5z-c adds a **staging-shell-only** Supabase read-only data adapter. It is the first phase that permits `from().select()` against approved tables and fields only. Default remains mock/disabled.

Related: [read-only-data-adapter-scaffold.md](./read-only-data-adapter-scaffold.md) (G-5z-b), [schema-mapping-rls-read-policy-review.md](./schema-mapping-rls-read-policy-review.md) (G-5z-c-prep).

## 2. Approval

Approval ID:

```txt
G-5z-c-staging-read-only-data-connect
```

Enabled only after G-5z-c-prep §13 preflight checklist is complete.

## 3. Scope

**In scope:**

- staging shell only (`/__admin-staging-shell/musician-basic/`)
- env-gated Supabase read-only adapter
- approved fields only (no `select *`)
- published / staging-safe filters where available
- module-level fallback (empty / error / RLS denied)
- mock fallback
- `canWrite: false`

**Out of scope:**

- DB write (insert / update / delete / upsert)
- `select *`
- rpc
- RLS policy creation or changes
- Storage read/write
- Publish / GitHub dispatch / FTP
- production data connection
- `/admin` route connection

## 4. Enable condition

```env
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_DATA_READ=true
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
```

All gates must pass **and** `import.meta.env.DEV === true`. Do not commit real values.

## 5. Mock fallback

```env
ENABLE_ADMIN_STAGING_DATA_READ=false
```

or:

```env
PUBLIC_ADMIN_DATA_PROVIDER=mock
```

When mock fallback is active:

- no Supabase client for data reads
- no `from()` / `select()` executed
- G-5z-b mock preview is shown
- status panel shows `provider: mock`

## 6. Table / field mapping

| Module | Table | Approved select fields | Filters |
| --- | --- | --- | --- |
| profile | `profile` | `id`, `legacy_id`, `name`, `bio`, `image_url` | limit 1 |
| schedule | `schedules` | `id`, `legacy_id`, `date`, `title`, `venue`, `description`, `home_image_url`, `published`, `sort_order` | `published = true`, limit 20, order `date` |
| discography | `discography` | `id`, `legacy_id`, `title`, `artist`, `release_date`, `cover_image_url`, `description`, `sort_order`, `published` | `published = true`, limit 20, order `sort_order` |
| links | `links` | `id`, `legacy_id`, `label`, `url`, `sort_order`, `published` | `published = true`, limit 20, order `sort_order` |
| news | `news` (likely) | `id`, `legacy_id`, `title`, `body`, `published_at`, `published` | `published = true`, limit 20, order `published_at` |

Read models map DB columns to UI fields (e.g. `name` → `displayName`, `venue` → `venueName`, `image_url` → `heroImageUrl`).

Implementation: `src/lib/admin/staging-data/supabase-read-only-data-adapter.ts`

## 7. Query safety

- no `select *`
- approved fields only
- limit rows on every query
- published / staging-safe filters where schema supports them
- no writes
- no rpc
- no storage
- no service role key in browser or `.env.example`

## 8. Error handling

Each module is loaded independently:

- `ok` — data returned
- `empty` — no rows
- `error` — query failed (safe message only)
- `rls-denied` — access denied
- `config-missing` — URL/key missing; mock fallback

The staging shell does not crash on module errors. SQL details and secrets are not shown.

## 9. Safety

- no service role in browser
- no `/admin` connection
- no DB insert / update / delete
- no RLS changes
- no Storage read/write
- no GitHub dispatch
- no FTP deploy
- no production data touched
- `canWrite: false`
- `productionReady: false`

## 10. Next phase

- **G-5z-d（完了）:** [staging-read-only-module-display-qa.md](./staging-read-only-module-display-qa.md)
- **G-5z-e（完了）:** [read-only-qa-rls-review-report.md](./read-only-qa-rls-review-report.md) — `readOnlyPhaseComplete: true`
- **G-6-a:** write operation safety plan (writes still forbidden)
