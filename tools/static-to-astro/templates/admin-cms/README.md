# Admin CMS template

This directory contains two related but separate Admin CMS assets.

## G-5l — UI shell scaffold (CMS Kit)

**Status:** scaffold only — **not connected to runtime**

Low-risk reusable Admin UI components for future CMS Kit sites:

```txt
components/          # AdminLayout, AdminNav, AdminPageHeader, … (10 files)
styles/admin.css     # Shared shell styles (G-5l)
examples/            # dashboard-example.astro (composition demo)
```

- **No Auth**, Supabase, Storage, or Publish workflow
- **Not** placed under `src/pages/admin/`
- **Does not** import from Sariswing `src/`
- `productionReady: false`, `connectedToRuntime: false`

See [docs/admin-ui-shell-scaffold.md](../../docs/admin-ui-shell-scaffold.md).

## Phase 3-S — Runtime prototype (`src/`)

Copied into generated Astro projects when `convert-static-to-astro.mjs --with-admin-cms` is used.

### Contents

- Admin UI (`src/pages/admin/`, `src/components/admin/`, `src/styles/admin.css`)
- Admin API routes (`src/pages/api/admin/**`) — requires `@astrojs/node` adapter
- Server libs (`src/lib/admin-*.ts`, `supabase-admin-read.ts`, `home-featured-limit.ts`)
- Data-driven public CMS components (`ScheduleList`, `HomeSchedule`, `DiscographyList`)
- Page overrides for home, discography, and schedule month routes (gosaki profile)
- Placeholder `src/data/*.json` (replace via `export-supabase-json.mjs`)

The G-5l scaffold in `components/` is **independent** from this `src/` prototype. Do not conflate the two.

## Secrets

Do **not** put real keys in this directory. Use `.env.local` at tool root (gitignored).

## Hosting

Static FTP hosting cannot run `/api/admin/*`. See Phase 3-R docs.
