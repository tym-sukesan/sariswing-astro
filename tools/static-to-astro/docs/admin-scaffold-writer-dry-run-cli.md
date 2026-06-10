# Admin Scaffold Writer Dry-run CLI

**Phase:** G-5w-b — writer dry-run CLI  
**Status:** dry-run only (no target-dir writes) · sandbox `--apply` is [G-5w-c](./admin-scaffold-writer-sandbox-apply.md)

---

## 1. Purpose

G-5w-b adds `write-admin-scaffold.mjs`, which reads a G-5s **admin scaffold dry-run package** and produces:

- Target directory safety checks (policy-based)
- Planned files manifest
- Rollback manifest draft
- Dry-run report
- Recommended next commands

The CLI **plans** what a future writer would generate. It does **not** write any runtime admin scaffold files to `target-dir`.

Related plan: [admin-scaffold-writer-plan.md](./admin-scaffold-writer-plan.md) (G-5w-a).

---

## 2. Scope

### In scope

| Item | Detail |
| --- | --- |
| package-dir loading | G-5s package JSON + checklist |
| target-dir safety check | Policy from `admin-scaffold-writer-policy.json` |
| planned files manifest | `planned-files-manifest.json` |
| rollback draft | `rollback-manifest.draft.json` |
| dry-run report | `ADMIN_SCAFFOLD_WRITER_DRY_RUN_REPORT.md` |
| recommended commands | `recommended-next-commands.md` |

### Out of scope (G-5w-b dry-run mode)

| Item | Status |
| --- | --- |
| `--apply` | Use [sandbox apply](./admin-scaffold-writer-sandbox-apply.md) (G-5w-c) instead |
| Actual file writes to target-dir (dry-run) | **No** |
| Runtime integration | **No** |
| Supabase Auth | not connected |
| DB query / update | not performed |
| Storage upload | not performed |
| Publish dispatch | not performed |
| FTP deploy | not performed |
| Production deploy | not performed |

---

## 3. Command

### Prerequisites — generate G-5s package (local, not committed)

```bash
node tools/static-to-astro/scripts/generate-admin-scaffold-dry-run.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json \
  --out-dir tools/static-to-astro/output/admin-scaffold-packages/gosaki
```

### Dry-run

```bash
node tools/static-to-astro/scripts/write-admin-scaffold.mjs \
  --package-dir tools/static-to-astro/output/admin-scaffold-packages/gosaki \
  --target-dir tools/static-to-astro/output/admin-writer-sandbox/gosaki \
  --mode dry-run
```

### Options

| Flag | Default | Description |
| --- | --- | --- |
| `--package-dir` | _(required)_ | G-5s package directory |
| `--target-dir` | _(required)_ | Planned writer output (validated, not written) |
| `--mode` | `dry-run` | `dry-run` or `plan-only` |
| `--policy` | `config/admin/admin-scaffold-writer-policy.json` | Writer policy |
| `--site-slug` | from package | Override site slug |
| `--report-dir` | `output/admin-writer-dry-runs/{siteSlug}/` | Report output |

---

## 4. Outputs

Reports are written to `--report-dir` only (default: `tools/static-to-astro/output/admin-writer-dry-runs/{siteSlug}/`).

| File | Description |
| --- | --- |
| `planned-files-manifest.json` | Planned admin tree; `willWrite: false` |
| `rollback-manifest.draft.json` | Future rollback plan; `overwrittenFiles: []` |
| `ADMIN_SCAFFOLD_WRITER_DRY_RUN_REPORT.md` | Full dry-run report |
| `recommended-next-commands.md` | Re-run + review commands; future G-5w-c note |

**Not written:** any file under `--target-dir`.

---

## 5. Target safety checks

The CLI validates `--target-dir` against [admin-scaffold-writer-policy.json](../config/admin/admin-scaffold-writer-policy.json).

### Forbidden targets (non-zero exit)

| Target | Reason |
| --- | --- |
| `src/pages/admin` | Sariswing existing admin — must never be overwritten |
| `src/pages/__admin-preview` | Existing G-5u local preview route |
| Project root | Too broad |
| `dist` / `public-dist` | Deploy/build output |
| Production admin routes | Policy blocked |

### Allowed targets (dry-run OK)

| Target | Example |
| --- | --- |
| Sandbox under output | `tools/static-to-astro/output/admin-writer-sandbox/gosaki/` |
| Optional sandbox | `sandbox/generated-admin/gosaki/` |

If target fails checks, reports are still written when possible, then CLI exits with code 1.

---

## 6. `--apply` behavior

`--apply` is **not part of dry-run mode**. It is implemented in [G-5w-c sandbox apply](./admin-scaffold-writer-sandbox-apply.md).

- Dry-run (this doc): no `--apply`, no target-dir writes
- Sandbox apply: `--apply` + `--approval-id` required; sandbox prefix only

`--force` and `--overwrite` are rejected in all modes.

---

## 7. Planned files (minimum)

The manifest includes at least:

```txt
admin/README.md
admin/pages/index.astro
admin/pages/profile.astro
admin/pages/schedule.astro
admin/pages/discography.astro
admin/pages/links.astro
admin/pages/news.astro
admin/pages/media.astro
admin/pages/publish.astro
admin/pages/settings.astro
admin/config/admin-sections.generated.json
admin/config/admin-permissions.generated.json
admin/config/admin-storage-mappings.generated.json
admin/config/admin-publish-policy.generated.json
admin/manifests/generated-files-manifest.json
admin/manifests/rollback-manifest.json
admin/manifests/writer-report.md
```

All entries have `willWrite: false`, `willOverwrite: false`, `reason: "dry-run only"`.

---

## 8. Safety flags (expected)

| Flag | Dry-run value |
| --- | --- |
| `applyImplemented` | **false** |
| `runtimeFilesWritten` | **false** |
| `overwroteExistingFiles` | **false** |
| `srcPagesAdminTouched` | **false** (when target valid) |
| `sariswingAdminTouched` | **false** (when target valid) |
| `productionTouched` | **false** |

---

## 9. Future phases

| Phase | Focus |
| --- | --- |
| **G-5w-c（完了）** | [Sandbox apply](./admin-scaffold-writer-sandbox-apply.md) |
| **G-5w-d（完了）** | [Generated scaffold review](./generated-admin-scaffold-review.md) |
| **G-5x** | Staging runtime shell integration (after review pass) |

---

## Related

- [admin-scaffold-writer-plan.md](./admin-scaffold-writer-plan.md) — G-5w-a writer plan
- [site-config-driven-admin-scaffold-generator.md](./site-config-driven-admin-scaffold-generator.md) — G-5s package generator
- [admin-runtime-integration-plan.md](./admin-runtime-integration-plan.md) — phase map

---

*G-5w-b: dry-run CLI only. No runtime admin files written. Sariswing `/admin/` untouched.*
