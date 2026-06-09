# Admin CMS template

This directory contains two related but separate Admin CMS assets.

## G-5l — UI shell scaffold (CMS Kit)

**Status:** scaffold only — **not connected to runtime**

Low-risk reusable Admin UI components for future CMS Kit sites:

```txt
components/          # G-5l shell + G-5m-a CRUD + G-5m-b Auth + G-5n Media UI
modules/             # G-5m-a News / Schedule / Profile / Links + G-5p Discography UI
prototypes/          # G-5p musician-basic admin prototype
preview/             # G-5r preview manifest + safety checklist
auth/                # G-5m-b auth-model + permissions examples
media/               # G-5n media-upload-policy + asset-types examples
publish/             # G-5o publish-workflow-policy + environments examples
styles/admin.css     # Shared shell + CRUD + Auth + Media + Publish styles
examples/            # dashboard, crud, auth, media, publish examples
```

- **No Auth**, Supabase, Storage, or Publish workflow
- **Not** placed under `src/pages/admin/`
- **Does not** import from Sariswing `src/`
- `productionReady: false`, `connectedToRuntime: false`

See [admin-ui-shell-scaffold.md](../../docs/admin-ui-shell-scaffold.md), [admin-crud-ui-scaffold.md](../../docs/admin-crud-ui-scaffold.md), [admin-auth-abstraction-scaffold.md](../../docs/admin-auth-abstraction-scaffold.md), [admin-media-upload-abstraction.md](../../docs/admin-media-upload-abstraction.md), [admin-publish-workflow-abstraction.md](../../docs/admin-publish-workflow-abstraction.md), [musician-basic-admin-prototype.md](../../docs/musician-basic-admin-prototype.md), and [admin-prototype-preview-harness.md](../../docs/admin-prototype-preview-harness.md).

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
