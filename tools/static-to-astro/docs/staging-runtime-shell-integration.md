# Staging Runtime Shell Integration

**Phase:** G-5x — staging runtime shell route  
**Status:** shell-only · dev/local gate · not production admin

---

## 1. Purpose

G-5x adds a **staging runtime shell** route so developers can visually inspect the CMS Kit Admin UI shell after [G-5w-d generated scaffold review](./generated-admin-scaffold-review.md) passes (`readyForG5x: true`).

This is **not** production admin at `/admin/`. It is a shell integration candidate with mock/static data and all actions disabled.

---

## 2. Route

| Item | Value |
| --- | --- |
| URL path | `/__admin-staging-shell/musician-basic/` |
| Page file | `src/pages/__admin-staging-shell/musician-basic/index.astro` |
| Wrapper | `tools/static-to-astro/templates/admin-cms/preview/staging-shell-wrapper.astro` |
| Prototype | `tools/static-to-astro/templates/admin-cms/prototypes/musician-basic-admin-prototype.astro` |

Page files live under `src/pages/__admin-*` (leading underscore). Astro excludes those paths from file-based routing, so `astro.config.mjs` registers the public URL via `injectRoute` (`cmsKitAdminShellRoutesIntegration`).

**Not used:** `/admin/`, existing Sariswing admin routes.

---

## 3. Enable condition

Both must be true:

```txt
import.meta.env.DEV === true
ENABLE_ADMIN_STAGING_SHELL === "true"
```

Default: `ENABLE_ADMIN_STAGING_SHELL=false` in [`.env.example`](../../../.env.example).

If either condition fails, the route shows **Admin staging shell disabled** (noindex, production disabled message).

---

## 4. Scope

### In scope

| Item | Detail |
| --- | --- |
| Shell-only route | Dedicated `__admin-staging-shell` path |
| Mock/static data | Prototype mock data only |
| Disabled actions | Save, upload, publish, dispatch — all disabled |
| noindex | Required on enabled and disabled pages |
| Sitemap exclusion | `__admin-staging-shell` filtered in `astro.config.mjs` |
| Status banner | Staging runtime shell / shell-only / actions disabled |

### Out of scope

| Item | Status |
| --- | --- |
| `/admin` | **Not connected** |
| Supabase Auth | not connected |
| DB query / update | not performed |
| Storage upload | not performed |
| GitHub dispatch | not performed |
| FTP deploy | not performed |
| Production deploy | not performed |

---

## 5. Safety

| Item | Status |
| --- | --- |
| Existing Sariswing admin modified | **No** |
| Connected to `/admin` | **No** |
| Connected to runtime data | **No** |
| Supabase Auth | not connected |
| DB | not connected |
| Storage | not connected |
| Publish | not connected |
| FTP | not connected |
| Production disabled | **Yes** |
| Actions disabled | **Yes** (G-5x) |
| noindex | **Yes** |

---

## 6. Relationship to previous phases

| Phase | Route | Purpose |
| --- | --- | --- |
| **G-5u** | `/__admin-preview/musician-basic/` | Local-only preview (`ENABLE_ADMIN_PREVIEW`) — customer demo / dev preview |
| **G-5w-c** | `output/admin-writer-sandbox/` | Generated file sandbox (not in `src/pages`) |
| **G-5w-d** | review CLI | `readyForG5x` gate before this phase |
| **G-5x** | `/__admin-staging-shell/musician-basic/` | Staging runtime shell candidate — shell QA before Auth (G-5y) |

G-5x does **not** copy sandbox output into `src/pages`. It reuses the prototype with `stagingShellMode`.

---

## 7. How to use locally

```bash
ENABLE_ADMIN_STAGING_SHELL=true npm run dev
```

Open:

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/
```

Compare with G-5u local preview (separate flag):

```bash
ENABLE_ADMIN_PREVIEW=true npm run dev
# http://localhost:4321/__admin-preview/musician-basic/
```

---

## 8. Disabled actions (G-5x)

All interactive admin actions remain scaffold-only:

- login (readonly auth UI)
- save / create / update / delete / restore / duplicate
- upload / publish / dispatch / deploy

Buttons use `disabled={true}` and do not perform runtime operations.

**G-5y-b:** Staging shell also shows `AdminAuthAdapterStatusPanel` — Auth adapter mock only, Supabase Auth not connected.

**G-5y-c:** Staging shell includes [login UI shell](./staging-login-ui-shell.md) — email/password fields, forgot-password UI, route guard planned notice. Real auth disabled.

---

## 9. Next phase

| Phase | Focus |
| --- | --- |
| **G-5y-a（完了）** | [Supabase Auth staging integration plan](./supabase-auth-staging-integration-plan.md) — plan only, no Auth connection |
| **G-5y-b（完了）** | [Auth adapter scaffold](./admin-auth-adapter-scaffold.md) — mock provider, dry-run CLI |
| **G-5y-c（完了）** | [Staging login UI shell](./staging-login-ui-shell.md) — disabled real auth |
| **G-5y-d** | Staging Supabase Auth connection (explicit approval) |
| Prerequisite | Complete shell QA on this route first |
| Still | staging-only, no production admin, no `/admin/` |

---

## Related

- [generated-admin-scaffold-review.md](./generated-admin-scaffold-review.md) — G-5w-d review gate
- [local-only-admin-preview-route.md](./local-only-admin-preview-route.md) — G-5u preview (different route)
- [admin-runtime-integration-plan.md](./admin-runtime-integration-plan.md) — G-5x / G-5y phase map
- [supabase-auth-staging-integration-plan.md](./supabase-auth-staging-integration-plan.md) — G-5y-a Auth plan (no connection yet)
- [admin-auth-adapter-scaffold.md](./admin-auth-adapter-scaffold.md) — G-5y-b Auth adapter mock status on this route
- [staging-login-ui-shell.md](./staging-login-ui-shell.md) — G-5y-c login UI shell on this route

---

*G-5x: staging runtime shell only. Sariswing `/admin/` untouched.*
