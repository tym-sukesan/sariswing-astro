# Local-only Admin Preview Route

**Phase:** G-5u — local-only preview route  
**Status:** dev/local only — not runtime admin

---

## 1. Purpose

G-5u adds a **local-only preview route** so developers can view the `musician-basic-admin-prototype` in a browser before customer demo (G-5v) or runtime integration (G-5x+).

This is **not** the production admin at `/admin/`. It is scaffold-only with mock data and disabled actions.

---

## 2. Route

| Item | Value |
| --- | --- |
| URL path | `/__admin-preview/musician-basic/` |
| Page file | `src/pages/__admin-preview/musician-basic/index.astro` |
| Wrapper | `tools/static-to-astro/templates/admin-cms/preview/local-preview-wrapper.astro` |
| Prototype | `tools/static-to-astro/templates/admin-cms/prototypes/musician-basic-admin-prototype.astro` |

The page file uses a leading-underscore directory (`__admin-preview/`). Astro excludes those from file-based routing; the public URL is registered in `astro.config.mjs` via `injectRoute` (`cmsKitAdminShellRoutesIntegration`).

**Not used:** `/admin/`, `/admin/news/`, `/admin/schedule/`, or any existing Sariswing admin route.

---

## 3. Enable condition

Both must be true:

```txt
import.meta.env.DEV === true
ENABLE_ADMIN_PREVIEW === "true"
```

Default: `ENABLE_ADMIN_PREVIEW=false` in [`.env.example`](../../../.env.example).

If either condition fails, the route shows an **Admin preview disabled** page (no prototype content).

---

## 4. How to use locally

1. Copy `.env.example` to `.env` if needed (keep `ENABLE_ADMIN_PREVIEW=false` until preview).
2. Start dev server with preview enabled:

```bash
ENABLE_ADMIN_PREVIEW=true npm run dev
```

3. Open in browser:

```txt
http://localhost:4321/__admin-preview/musician-basic/
```

(Port may differ if Astro uses another port.)

---

## 5. Safety

| Item | Status |
| --- | --- |
| Local-only | **Yes** — requires `import.meta.env.DEV` |
| Scaffold-only | **Yes** — sticky banner + prototype notices |
| Mock-data-only | **Yes** — no live DB |
| Connected to runtime | **false** |
| Supabase Auth | not connected |
| DB query / update | not performed |
| Storage upload | not performed |
| GitHub dispatch | not performed |
| FTP deploy | not performed |
| Production disabled | **Yes** |
| noindex | `<meta name="robots" content="noindex,nofollow,noarchive" />` on disabled page; prototype AdminLayout also uses noindex |
| Sitemap | Excluded via `astro.config.mjs` (`__admin-preview` filtered) |
| Production build | Preview content blocked when `DEV` is false |

---

## 6. Do not use for

- Production admin operations
- Real customer data editing
- File upload testing
- Publish or deploy testing
- Auth / session testing
- Database read/write testing
- Customer demo without completing [preview-safety-checklist.md](../templates/admin-cms/preview/preview-safety-checklist.md)

---

## 7. Customer demo (G-5v)

Use this route together with the [Musician Basic Customer Demo Package](./customer-demo-package-musician-basic/README.md):

| Item | Detail |
| --- | --- |
| Demo script | [demo-script.md](./customer-demo-package-musician-basic/demo-script.md) |
| Demo checklist | [demo-checklist.md](./customer-demo-package-musician-basic/demo-checklist.md) |
| Customer explanation | [customer-explanation.md](./customer-demo-package-musician-basic/customer-explanation.md) |
| Safety notes | [demo-safety-notes.md](./customer-demo-package-musician-basic/demo-safety-notes.md) |

Customer demos must clearly state: **scaffold only**, **mock data only**, **no save / upload / publish**.

---

## 8. Future phases

| Phase | Focus |
| --- | --- |
| **G-5v（完了）** | [Customer demo package](./customer-demo-package-musician-basic/README.md) |
| **G-5w-a（完了）** | [Admin scaffold writer plan](./admin-scaffold-writer-plan.md) — writer not implemented; separate from preview route |
| **G-5w-b** | Writer dry-run CLI |
| **G-5w-c** | Apply to sandbox output directory only |
| **G-5x（完了）** | [Staging runtime shell](./staging-runtime-shell-integration.md) — `/__admin-staging-shell/musician-basic/` |
| **G-5y** | Supabase Auth staging integration |

---

## Related

- [customer-demo-package-musician-basic/](./customer-demo-package-musician-basic/README.md) — G-5v demo package
- [admin-prototype-preview-harness.md](./admin-prototype-preview-harness.md) — preview manifest
- [admin-runtime-integration-plan.md](./admin-runtime-integration-plan.md) — G-5u / G-5v phase detail
- [musician-basic-admin-prototype.md](./musician-basic-admin-prototype.md) — G-5p prototype

---

*G-5u: local preview route. G-5v: customer demo package. Sariswing `/admin/` untouched.*
