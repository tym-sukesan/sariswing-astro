# Admin CMS template (Phase 3-S)

Copied into generated Astro projects when `convert-static-to-astro.mjs --with-admin-cms` is used.

## Contents

- Admin UI (`src/pages/admin/`, `src/components/admin/`, `src/styles/admin.css`)
- Admin API routes (`src/pages/api/admin/**`) — requires `@astrojs/node` adapter
- Server libs (`src/lib/admin-*.ts`, `supabase-admin-read.ts`, `home-featured-limit.ts`)
- Data-driven public CMS components (`ScheduleList`, `HomeSchedule`, `DiscographyList`)
- Page overrides for home, discography, and schedule month routes (gosaki profile)
- Placeholder `src/data/*.json` (replace via `export-supabase-json.mjs`)

## Secrets

Do **not** put real keys in this directory. Use `.env.local` at tool root (gitignored).

## Hosting

Static FTP hosting cannot run `/api/admin/*`. See Phase 3-R docs.
