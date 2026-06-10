# Site-config Driven Admin Scaffold Generator

**Phase:** G-5s — admin scaffold dry-run generator  
**Status:** dry-run only — not connected to runtime

---

## 1. Purpose

G-5s adds a **site-config driven admin scaffold generator** that reads:

- Site config
- CMS template registry
- Schema adapter registry
- Admin UI components registry
- Preview manifest

…and produces a **dry-run package** describing which Admin sections, components, permissions, storage mappings, publish policy, and preview plan a site needs.

**Question answered:** *What Admin scaffolding does this site require?*

**Not performed:** Runtime admin file generation, Supabase Auth, DB query/update, Storage upload, GitHub dispatch, FTP deploy, Astro build/deploy.

---

## 2. Scope

**In scope:**

- Dry-run package under `output/admin-scaffold-packages/{siteSlug}/`
- Admin sections list
- Required components per section (with registry lookup)
- Module permissions
- Storage mappings (from schema adapter)
- Publish policy
- Preview plan (from preview manifest)
- Safety checklist + human report

**Out of scope:**

- Writing to `src/pages/admin/`
- Runtime admin generation
- Supabase Auth connection
- DB create / update
- Storage upload
- GitHub dispatch / FTP deploy
- Production admin

---

## 3. Inputs

| Input | Default path |
| --- | --- |
| Site config | `--site-config` (required) |
| Template registry | `config/templates/cms-template-registry.json` |
| Schema adapters | `config/schema-adapters/cms-schema-adapters.json` |
| Admin components registry | `config/admin/admin-ui-components-registry.json` |
| Preview manifest | `templates/admin-cms/preview/preview-manifest.json` |

Site config fields used: `siteSlug`, `siteName`, `siteType`, `templateId`, `schemaAdapterId`, `deploy.production.enabled`.

---

## 4. Outputs

Default: `output/admin-scaffold-packages/{siteSlug}/`

| File | Description |
| --- | --- |
| `admin-scaffold-generation-package.json` | Package manifest |
| `ADMIN_SCAFFOLD_GENERATION_REPORT.md` | Human-readable report |
| `admin-sections.generated.json` | Nav sections |
| `admin-components.required.json` | Components per section + missing list |
| `admin-permissions.generated.json` | Role / module permissions |
| `admin-storage-mappings.generated.json` | Media storage mappings |
| `admin-publish-policy.generated.json` | Staging / production publish policy |
| `admin-preview-plan.generated.json` | Preview prototype plan |
| `admin-safety-checklist.generated.md` | Generated safety checklist |
| `recommended-next-commands.md` | Read-only inspect commands |

**`output/` is gitignored — do not commit.**

---

## 5. Example command

```bash
node tools/static-to-astro/scripts/generate-admin-scaffold-dry-run.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json \
  --out-dir tools/static-to-astro/output/admin-scaffold-packages/gosaki
```

Optional overrides:

```bash
node tools/static-to-astro/scripts/generate-admin-scaffold-dry-run.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json \
  --template-registry tools/static-to-astro/config/templates/cms-template-registry.json \
  --schema-adapters tools/static-to-astro/config/schema-adapters/cms-schema-adapters.json \
  --admin-components-registry tools/static-to-astro/config/admin/admin-ui-components-registry.json \
  --preview-manifest tools/static-to-astro/templates/admin-cms/preview/preview-manifest.json
```

---

## 6. Safety

| Flag | Value |
| --- | --- |
| mode | `dry-run` |
| runtimeFilesWritten | **false** |
| adminScaffoldGenerated | **false** |
| productionReady | **false** |
| connectedToRuntime | **false** |
| Supabase Auth | not connected |
| DB update | not performed |
| Storage upload | not performed |
| GitHub dispatch | not performed |
| FTP deploy | not performed |
| Existing Sariswing admin | not modified |

---

## 7. Future integration plan

| Phase | Focus |
| --- | --- |
| **G-5t（完了）** | [Runtime integration plan](./admin-runtime-integration-plan.md) — phase map + approval gates |
| **G-5u（完了）** | [Local-only preview route](./local-only-admin-preview-route.md) |
| **G-5v** | Customer demo package |
| **G-5w** | Explicit opt-in admin scaffold writer |

---

## Related docs

- [admin-runtime-integration-plan.md](./admin-runtime-integration-plan.md) — **G-5t** runtime integration plan (planning only)
- [admin-prototype-preview-harness.md](./admin-prototype-preview-harness.md) — G-5r preview manifest
- [musician-basic-admin-prototype.md](./musician-basic-admin-prototype.md) — G-5p prototype
- [customer-admin-manual-musician-basic.md](./customer-admin-manual-musician-basic.md) — G-5q manual

---

*G-5s: dry-run generator only. output/ not committed.*
