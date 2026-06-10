# Admin Scaffold Writer Sandbox Apply

**Phase:** G-5w-c — sandbox apply only  
**Status:** `--apply` implemented for `output/admin-writer-sandbox/` only

---

## 1. Purpose

G-5w-c extends `write-admin-scaffold.mjs` with **`--apply`**, which writes generated admin scaffold files into the sandbox output directory only:

```txt
tools/static-to-astro/output/admin-writer-sandbox/{siteSlug}/
```

This is **not** runtime admin. Files are static scaffold placeholders with safety banners. No connection to `src/pages/admin/`, Supabase, DB, Storage, or Publish.

Prerequisites: [G-5s dry-run package](./site-config-driven-admin-scaffold-generator.md), [G-5w-a plan](./admin-scaffold-writer-plan.md), [G-5w-b dry-run CLI](./admin-scaffold-writer-dry-run-cli.md).

---

## 2. Scope

### In scope

| Item | Detail |
| --- | --- |
| `--apply` | Sandbox output directory only |
| `--approval-id` | Required with `--apply` |
| Generated scaffold files | `admin/README.md`, pages, config copies, manifests |
| `generated-files-manifest.json` | Under `admin/manifests/` |
| `rollback-manifest.json` | Delete-sandbox rollback |
| `writer-report.md` | Apply summary |

### Out of scope

| Item | Status |
| --- | --- |
| `src/pages/admin` | **Forbidden** |
| `src/pages/__admin-preview` | **Forbidden** |
| Runtime integration | **No** |
| Supabase Auth / DB / Storage / Publish / FTP | **No** |
| Production deploy | **No** |
| Overwrite existing files | **Forbidden** |
| `--force` / `--overwrite` | **Not supported** |

---

## 3. Command

### Prerequisites

```bash
node tools/static-to-astro/scripts/generate-admin-scaffold-dry-run.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json \
  --out-dir tools/static-to-astro/output/admin-scaffold-packages/gosaki
```

### Apply (empty sandbox target)

```bash
rm -rf tools/static-to-astro/output/admin-writer-sandbox/gosaki

node tools/static-to-astro/scripts/write-admin-scaffold.mjs \
  --package-dir tools/static-to-astro/output/admin-scaffold-packages/gosaki \
  --target-dir tools/static-to-astro/output/admin-writer-sandbox/gosaki \
  --apply \
  --approval-id G-5w-c-sandbox-apply
```

---

## 4. Generated files

```txt
{target-dir}/
  admin/
    README.md
    pages/
      index.astro
      profile.astro
      schedule.astro
      discography.astro
      links.astro
      news.astro
      media.astro
      publish.astro
      settings.astro
    config/
      admin-sections.generated.json
      admin-components.required.json
      admin-permissions.generated.json
      admin-storage-mappings.generated.json
      admin-publish-policy.generated.json
      admin-preview-plan.generated.json
    manifests/
      generated-files-manifest.json
      rollback-manifest.json
      writer-report.md
```

Each `.astro` page includes: scaffold only, not connected to runtime, noindex, production disabled.

---

## 5. Safety checks

| Check | Apply behavior |
| --- | --- |
| Sandbox prefix only | `--apply` rejected outside `output/admin-writer-sandbox/` |
| `--approval-id` | Required; missing → exit 1, no writes |
| `src/pages/admin` | Forbidden → exit 1, no writes |
| `src/pages/__admin-preview` | Forbidden |
| Empty target | Required; existing files → exit 1, no overwrite |
| `overwrittenFiles` | Always `[]` on success |

---

## 6. Rollback

```bash
rm -rf tools/static-to-astro/output/admin-writer-sandbox/{siteSlug}
```

- `rollbackMode`: `delete-generated-sandbox-directory`
- `safeToDeleteTargetDir`: true
- `requiresManualReviewBeforeDelete`: true
- No production rollback needed (production untouched)

---

## 7. Dry-run unchanged

Dry-run (G-5w-b) still writes only to `output/admin-writer-dry-runs/{siteSlug}/` and does not touch `target-dir`.

```bash
node tools/static-to-astro/scripts/write-admin-scaffold.mjs \
  --package-dir tools/static-to-astro/output/admin-scaffold-packages/gosaki \
  --target-dir tools/static-to-astro/output/admin-writer-sandbox/gosaki \
  --mode dry-run
```

---

## 8. Future phases

| Phase | Focus |
| --- | --- |
| **G-5w-d** | Generated scaffold review |
| **G-5x** | Staging runtime shell integration |

---

## Related

- [admin-scaffold-writer-dry-run-cli.md](./admin-scaffold-writer-dry-run-cli.md)
- [admin-scaffold-writer-plan.md](./admin-scaffold-writer-plan.md)

---

*G-5w-c: sandbox apply only. Sariswing `/admin/` untouched.*
