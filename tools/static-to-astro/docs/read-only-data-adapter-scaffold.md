# Read-only Data Adapter Scaffold

## 1. Purpose

G-5z-b adds a **mock-only** ReadOnlyDataAdapter scaffold for the CMS Kit staging shell. It prepares types, fixtures, and UI status/preview **before** any Supabase `from()` / `select()` in G-5z-c.

Related: [read-only-data-integration-plan.md](./read-only-data-integration-plan.md) (G-5z-a).

## 2. Scope

**In scope:**

- Read-only adapter types
- Mock adapter + fictional fixtures
- Data provider status helper
- Staging shell status panel + mock previews
- Inspect / dry-run CLI

**Out of scope:**

- Supabase DB query
- `from()` / `select()`
- DB write (insert / update / delete / upsert)
- RLS changes
- Storage read / write
- Publish dispatch / FTP
- Production data
- `/admin` route

## 3. Files

| Path | Role |
| --- | --- |
| `src/lib/admin/staging-data/read-only-data-adapter.types.ts` | Read models + `ReadOnlyDataAdapter` |
| `src/lib/admin/staging-data/mock-read-only-data.fixtures.ts` | Fictional fixtures (`example.com` URLs only) |
| `src/lib/admin/staging-data/mock-read-only-data-adapter.ts` | Mock provider |
| `src/lib/admin/staging-data/read-only-data-config.ts` | Env gate (G-5z-b stays mock) |
| `src/lib/admin/staging-data/read-only-data-status.ts` | Status for UI |
| `templates/admin-cms/data/components/AdminReadOnlyDataStatusPanel.astro` | Status + preview panel |
| `templates/admin-cms/data/components/AdminStagingReadOnlyDataSection.astro` | Section wrapper |
| `scripts/inspect-read-only-data-adapter.mjs` | Dry-run CLI |

## 4. Adapter contract

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

- **`canWrite: false`** — enforced in type and mock implementation
- **`productionReady: false`** — always in G-5z-b
- No write, Storage, or Publish methods

## 5. Mock provider

- `provider: "mock"`
- `connectedToRuntime: false`
- Fixtures use **Mock Artist**, **Mock Live Schedule**, **Mock Album**, etc.
- URLs: `https://example.com/` only
- **No real customer names, emails, or URLs in committed files**

## 6. Staging shell display

Route: `/__admin-staging-shell/musician-basic/`

`AdminReadOnlyDataStatusPanel` shows:

- Provider: mock
- Target modules: profile / schedule / discography / links / news
- `canWrite: false`
- Supabase DB query: not implemented
- RLS / Storage / Publish: not connected
- Mock previews per module
- UI state scaffold (mock / empty / error / loading / disabled / RLS denied placeholders)

## 7. Inspect CLI

```bash
node tools/static-to-astro/scripts/inspect-read-only-data-adapter.mjs \
  --out-dir tools/static-to-astro/output/read-only-data-adapter-dry-runs/gosaki
```

Output (not committed):

```txt
tools/static-to-astro/output/read-only-data-adapter-dry-runs/gosaki/
  READ_ONLY_DATA_ADAPTER_REPORT.md
  read-only-data-adapter-report.json
```

## 8. Safety

- No Supabase DB query
- No `from()` / `select()`
- No DB write
- No RLS changes
- No Storage read / write
- No GitHub dispatch
- No FTP deploy
- No production data touched
- No `/admin` connection
- `canWrite: false`
- `productionReady: false`

## 9. Next phase

- **G-5z-c-prep（完了）:** [Schema mapping / RLS read policy review](./schema-mapping-rls-read-policy-review.md) — review only
- **G-5z-c（完了）:** [Supabase read-only data adapter](./supabase-read-only-data-adapter.md) — approval ID: `G-5z-c-staging-read-only-data-connect`
- **G-5z-d（完了）:** [Staging read-only module display QA](./staging-read-only-module-display-qa.md)
- **G-5z-e:** read-only QA / RLS review report

## 10. Local preview

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=false \
PUBLIC_ADMIN_DATA_PROVIDER=mock \
npm run dev
```

Open: `http://localhost:4321/__admin-staging-shell/musician-basic/`
