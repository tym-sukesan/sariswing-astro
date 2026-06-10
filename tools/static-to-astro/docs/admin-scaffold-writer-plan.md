# Explicit Opt-in Admin Scaffold Writer Plan

**Phase:** G-5w-a (plan) · G-5w-b (dry-run CLI) · G-5w-c (sandbox apply) · G-5w-d (review)  
**Status:** dry-run + sandbox apply + review CLI · runtime admin not written

---

## 1. Purpose

G-5w-a defines the **explicit opt-in admin scaffold writer** — a future tool that would copy or generate runtime admin scaffold files from a G-5s **dry-run package** into an explicitly chosen output directory.

| Item | G-5w-a status |
| --- | --- |
| Writer design | **This document** |
| Writer dry-run CLI (G-5w-b) | **[Implemented](./admin-scaffold-writer-dry-run-cli.md)** — reports only |
| Sandbox apply (G-5w-c) | **[Implemented](./admin-scaffold-writer-sandbox-apply.md)** |
| Generated scaffold review (G-5w-d) | **[Implemented](./generated-admin-scaffold-review.md)** |
| File writes to `src/pages/admin` | **None** |
| `runtimeFilesWritten` | **false** |
| `productionReady` | **false** |
| `connectedToRuntime` | **false** |

**Context:** G-5s produces read-only admin scaffold packages under `output/admin-scaffold-packages/{siteSlug}/`. G-5u/G-5v provide local preview and customer demo materials. G-5w-a locks safety rules **before** any writer code exists.

**Sariswing existing admin is out of scope.** The generic writer must never target or overwrite `src/pages/admin/` on the Sariswing production project.

---

## 2. Current inputs

The writer will eventually consume the following inputs. All paths are relative to the repository root unless noted.

### Dry-run package (G-5s output — not committed)

```txt
tools/static-to-astro/output/admin-scaffold-packages/{siteSlug}/admin-scaffold-generation-package.json
tools/static-to-astro/output/admin-scaffold-packages/{siteSlug}/admin-sections.generated.json
tools/static-to-astro/output/admin-scaffold-packages/{siteSlug}/admin-components.required.json
tools/static-to-astro/output/admin-scaffold-packages/{siteSlug}/admin-permissions.generated.json
tools/static-to-astro/output/admin-scaffold-packages/{siteSlug}/admin-storage-mappings.generated.json
tools/static-to-astro/output/admin-scaffold-packages/{siteSlug}/admin-publish-policy.generated.json
tools/static-to-astro/output/admin-scaffold-packages/{siteSlug}/admin-preview-plan.generated.json
```

### CMS Kit templates and policy

```txt
tools/static-to-astro/templates/admin-cms/
tools/static-to-astro/config/admin/admin-runtime-integration-gates.json
tools/static-to-astro/config/admin/admin-scaffold-writer-policy.json
```

### Input handling rules

| Rule | Detail |
| --- | --- |
| `output/` packages are inputs only | Never commit `output/`; regenerate locally from site config |
| Do not trust package blindly | Writer must re-validate site slug, paths, flags, and forbidden targets |
| Re-read gates JSON | `productionReady`, `connectedToRuntime`, forbidden automation must match policy |
| Template drift check | Compare required components against `templates/admin-cms/` registry |

---

## 3. Writer principles

The writer **must** follow these principles in all future phases:

| Principle | Meaning |
| --- | --- |
| **dry-run by default** | Default mode produces plans and manifests only; zero file writes |
| **`--apply` required for file writes** | No `--apply` → no writes, ever |
| **explicit output directory required** | `--target-dir` is mandatory; no implicit project paths |
| **never overwrite existing files by default** | If target file exists, skip or fail; no silent overwrite |
| **no production target by default** | Production hosts, deploy dirs, and live admin routes are blocked |
| **staging / new project only** | First real applies go to sandbox or new staging project only |
| **one site at a time** | Single `--package-dir` / `siteSlug` per invocation |
| **one operation per phase** | G-5w-b = dry-run CLI; G-5w-c = sandbox apply only; no combined steps |
| **generated files manifest required** | Every apply emits `generated-files-manifest.json` |
| **rollback manifest required** | Every apply emits `rollback-manifest.json` |
| **approval evidence required** | `--approval-id` must map to a documented gate before `--apply` |
| **Sariswing existing admin is excluded** | Writer never targets Sariswing `src/pages/admin/` or related runtime files |

---

## 4. Allowed targets

### Permitted in early phases (G-5w-b / G-5w-c)

| Target | Use case |
| --- | --- |
| `tools/static-to-astro/output/admin-writer-sandbox/{siteSlug}/` | **Primary** — isolated sandbox under `output/` (not committed) |
| `sandbox/generated-admin/{siteSlug}/` | Optional repo-local sandbox if explicitly created empty |
| **New staging project only** | Separate Astro repo or branch for a customer staging site |
| **Explicitly provided empty directory** | Maintainer-created empty dir with documented path |

### Future candidates (plan only — not enabled in G-5w-a)

| Target | Condition |
| --- | --- |
| `src/pages/__admin-preview-generated/` | Only after G-5w-d review + separate approval; never Sariswing prod |
| `src/components/generated-admin/` | Generated components namespace; opt-in per project |
| `src/lib/generated-admin/` | Generated lib namespace; opt-in per project |

**Note:** `src/pages/admin/` is **not** an allowed target for the generic writer on Sariswing. It may be considered only on a **new customer staging project** after G-5w-d, never by default.

---

## 5. Disallowed targets

The writer **must refuse** these targets:

```txt
src/pages/admin/
existing Sariswing admin files
production project admin route
any existing non-empty directory without --allow-existing-empty-check
root project overwrite
public-dist
dist
server deploy directory
FTP target
```

### Hard rule

**Sariswing existing admin must never be overwritten by the generic writer.**

This includes but is not limited to:

- `src/pages/admin/**`
- Sariswing-specific admin components, layouts, and lib modules tied to live runtime
- Any path classified as `site-specific` or `risky` in [admin-cms-code-inventory.md](./admin-cms-code-inventory.md)

The writer should maintain a **denylist** (see [admin-scaffold-writer-policy.json](../config/admin/admin-scaffold-writer-policy.json)) and fail closed when `--target-dir` resolves inside a denied path.

---

## 6. Proposed writer CLI design

**Script:** `tools/static-to-astro/scripts/write-admin-scaffold.mjs`  
**G-5w-b:** dry-run mode implemented. See [admin-scaffold-writer-dry-run-cli.md](./admin-scaffold-writer-dry-run-cli.md).

### Dry-run (default — G-5w-b)

```bash
node tools/static-to-astro/scripts/write-admin-scaffold.mjs \
  --package-dir tools/static-to-astro/output/admin-scaffold-packages/gosaki \
  --target-dir tools/static-to-astro/output/admin-writer-sandbox/gosaki \
  --mode dry-run
```

### Apply (sandbox only — future G-5w-c)

```bash
node tools/static-to-astro/scripts/write-admin-scaffold.mjs \
  --package-dir tools/static-to-astro/output/admin-scaffold-packages/gosaki \
  --target-dir tools/static-to-astro/output/admin-writer-sandbox/gosaki \
  --mode apply-to-sandbox \
  --apply \
  --approval-id G-5w-c-local-sandbox
```

### CLI rules

| Flag / rule | Requirement |
| --- | --- |
| `--apply` | **Required** for any file write; absent → plan/manifest only |
| `--target-dir` | **Required**; must pass policy validation |
| `--package-dir` | **Required**; must contain G-5s package |
| `--approval-id` | **Required** with `--apply` |
| `--mode` | One of: `plan-only`, `dry-run`, `apply-to-sandbox`, `apply-to-staging-project` |
| `--force` | **Not planned** for initial implementation — no force overwrite |
| Production target | **Blocked** by policy |
| `src/pages/admin` | **Blocked** on Sariswing; explicit deny |

---

## 7. Writer modes

### `plan-only`

| Aspect | Detail |
| --- | --- |
| Allowed | Read package; emit writer plan report; no filesystem writes except optional report under `output/` |
| Forbidden | `--apply`; any target file creation |
| Approvals | None |
| Outputs | `writer-plan-report.md` (optional, under `output/`) |
| Rollback | N/A |

### `dry-run`

| Aspect | Detail |
| --- | --- |
| Allowed | Simulate file list; write `generated-files-manifest.json` with `status: "planned"` to `output/` or target staging area **without** creating admin files |
| Forbidden | Creating `.astro` / component files in target; `--apply` without sandbox gate |
| Approvals | G-5w-b dry-run CLI approval (maintainer review) |
| Outputs | `generated-files-manifest.json` (planned entries only), console summary |
| Rollback | N/A |

### `apply-to-sandbox`

| Aspect | Detail |
| --- | --- |
| Allowed | Write files **only** under `tools/static-to-astro/output/admin-writer-sandbox/{siteSlug}/` or other policy-allowed sandbox |
| Forbidden | `src/pages/admin`; production paths; overwrite of existing non-generated files |
| Approvals | G-5w-c sandbox apply approval; `--approval-id` required |
| Outputs | Generated admin tree, `generated-files-manifest.json`, `rollback-manifest.json`, `writer-report.md` |
| Rollback | Delete sandbox directory per rollback manifest |

### `apply-to-staging-project`

| Aspect | Detail |
| --- | --- |
| Allowed | Write to **new** customer staging project empty tree (future G-5w-d+) |
| Forbidden | Sariswing prod; non-empty dirs without explicit checklist; runtime Auth/DB connection |
| Approvals | G-5w-d staging project apply approval; customer/maintainer evidence |
| Outputs | Same manifests as sandbox; plus staging URL documentation |
| Rollback | Git revert on staging branch; delete generated paths per manifest |

---

## 8. File generation plan

**No files are created in G-5w-a.** The following is the **planned output tree** for future writer applies:

```txt
{targetDir}/
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
    components/
      ... (from templates/admin-cms/ + package component list)
    config/
      admin-sections.generated.json
      admin-permissions.generated.json
      admin-storage-mappings.generated.json
      admin-publish-policy.generated.json
    manifests/
      generated-files-manifest.json
      rollback-manifest.json
      writer-report.md
```

| Note | Detail |
| --- | --- |
| Runtime integration | Deferred to G-5x+ |
| Auth / DB / Storage hooks | Scaffold placeholders only; disabled actions |
| Source mapping | Each file traces to package entry or template path in manifest |

---

## 9. Generated files manifest design

**File:** `{targetDir}/admin/manifests/generated-files-manifest.json`

### Schema (draft)

```json
{
  "version": "0.1.0",
  "mode": "apply-to-sandbox",
  "phase": "G-5w-c",
  "siteSlug": "gosaki",
  "targetDir": "tools/static-to-astro/output/admin-writer-sandbox/gosaki",
  "generatedAt": "2026-06-05T12:00:00.000Z",
  "sourcePackageDir": "tools/static-to-astro/output/admin-scaffold-packages/gosaki",
  "approvalId": "G-5w-c-local-sandbox",
  "files": [
    {
      "path": "admin/pages/index.astro",
      "status": "planned",
      "existsBeforeWrite": false,
      "willOverwrite": false,
      "source": "admin-scaffold-package",
      "templateRef": "templates/admin-cms/..."
    }
  ],
  "safety": {
    "overwroteExistingFiles": false,
    "runtimeConnected": false,
    "productionTouched": false,
    "connectedToRuntime": false,
    "productionReady": false
  }
}
```

### Field rules

| Field | Rule |
| --- | --- |
| `status` | `planned` (dry-run) \| `created` \| `skipped` \| `failed` |
| `willOverwrite` | Must be `false` in G-5w-b/c; if `true`, apply must abort |
| `existsBeforeWrite` | Recorded at apply time for audit |
| `safety.overwroteExistingFiles` | Must remain `false` until a future phase explicitly allows overwrite with separate gate |

---

## 10. Rollback manifest design

**File:** `{targetDir}/admin/manifests/rollback-manifest.json`

### Schema (draft)

```json
{
  "version": "0.1.0",
  "phase": "G-5w-c",
  "siteSlug": "gosaki",
  "targetDir": "tools/static-to-astro/output/admin-writer-sandbox/gosaki",
  "appliedAt": "2026-06-05T12:00:00.000Z",
  "approvalId": "G-5w-c-local-sandbox",
  "filesCreated": [
    "admin/pages/index.astro",
    "admin/README.md"
  ],
  "filesSkipped": [],
  "overwrittenFiles": [],
  "rollback": {
    "strategy": "delete-generated-directory",
    "instructions": [
      "Confirm no manual edits were made inside the sandbox directory.",
      "Delete: tools/static-to-astro/output/admin-writer-sandbox/gosaki/",
      "Or: git clean -fd path (only if sandbox is gitignored and maintainer approves)"
    ],
    "gitCommitBeforeApplyRequired": true,
    "gitCommitBeforeApplyNote": "Maintainer must commit or stash unrelated work before --apply"
  }
}
```

### Rollback principles

| Rule | Detail |
| --- | --- |
| Early writer must not overwrite existing files | `overwrittenFiles` should **always be empty** in G-5w-b/c |
| Rollback is simple | Delete the generated sandbox directory |
| Git safety | Human verifies `git status` clean (or intentional) before `--apply` |
| No delete of pre-existing files | Rollback never removes non-generated project files |

---

## 11. Approval gates

Aligned with [admin-runtime-integration-gates.json](../config/admin/admin-runtime-integration-gates.json) and extended for writer sub-phases.

### G-5w-a: plan approval

| Item | Value |
| --- | --- |
| Reviewer | maintainer |
| Required evidence | This plan reviewed; policy JSON reviewed; Sariswing exclusion acknowledged |
| Required command | Doc review only (no CLI) |
| Allowed target | N/A |
| Forbidden target | Any file write |
| Rollback | N/A |

### G-5w-b: dry-run CLI approval

| Item | Value |
| --- | --- |
| Reviewer | maintainer |
| Required evidence | `write-admin-scaffold.mjs --mode dry-run` output reviewed; manifest `status: planned` only |
| Required command | `node tools/static-to-astro/scripts/write-admin-scaffold.mjs --mode dry-run ...` (no `--apply`) |
| Allowed target | `output/` reports only |
| Forbidden target | `src/pages/admin`; Sariswing admin; production |
| Rollback | N/A |

### G-5w-c: sandbox apply approval

| Item | Value |
| --- | --- |
| Reviewer | maintainer |
| Required evidence | Dry-run manifest reviewed; `git status` checked; `--approval-id G-5w-c-*` recorded |
| Required command | `... --mode apply-to-sandbox --apply --approval-id G-5w-c-local-sandbox` |
| Allowed target | `tools/static-to-astro/output/admin-writer-sandbox/{siteSlug}/` only |
| Forbidden target | `src/pages/admin`; Sariswing; production; non-empty non-sandbox dirs |
| Rollback | Delete sandbox dir per rollback manifest |

### G-5w-d: staging project apply approval

| Item | Value |
| --- | --- |
| Reviewer | maintainer + customer (if customer repo) |
| Required evidence | G-5w-c sandbox reviewed; staging project empty; noindex plan for G-5x |
| Required command | `... --mode apply-to-staging-project --apply --approval-id G-5w-d-staging-*` |
| Allowed target | New customer staging project paths only (documented in apply record) |
| Forbidden target | Sariswing production; FTP/dist; overwrite existing admin |
| Rollback | Git revert on staging branch; remove generated paths |

---

## 12. Safety checks before apply

Before any future `--apply`, the writer (or maintainer checklist) must confirm:

| # | Check |
| --- | --- |
| 1 | `targetDir` is provided |
| 2 | `targetDir` is not project root |
| 3 | `targetDir` is not `src/pages/admin` |
| 4 | `targetDir` is not existing Sariswing admin path |
| 5 | `targetDir` is empty or contains only prior generated sandbox files |
| 6 | `packageDir` exists and contains `admin-scaffold-generation-package.json` |
| 7 | Package asserts `productionReady: false` |
| 8 | Package asserts `connectedToRuntime: false` |
| 9 | `generated-files-manifest.json` can be written |
| 10 | `rollback-manifest.json` can be written |
| 11 | `--approval-id` provided and matches active gate |
| 12 | Human verified `git status` before apply |
| 13 | No secrets in generated file content (scan / review) |
| 14 | Target not in `disallowedTargets` policy list |
| 15 | `--force` not used (flag should not exist in v1) |

**Fail closed:** If any check fails, abort with non-zero exit and no writes.

---

## 13. Forbidden automation list

The writer and any CI wrapping it **must never** automate:

```txt
- production publish
- production DB write
- production Storage overwrite
- GitHub Actions dispatch
- FTP deploy
- Edge Function call
- Supabase Auth mutation
- RLS policy mutation
- DNS/domain change
- overwrite existing admin files
- write to src/pages/admin (Sariswing)
- delete existing files
- disable staging noindex
- expose secrets
```

This list extends [admin-runtime-integration-gates.json](../config/admin/admin-runtime-integration-gates.json) `forbiddenAutomation` for writer-specific scope.

---

## 14. Writer phase map

| Phase | Focus | File writes |
| --- | --- | --- |
| **G-5w-a（完了）** | Writer safety plan (this doc) + policy JSON | **None** |
| **G-5w-b（完了）** | [Writer dry-run CLI](./admin-scaffold-writer-dry-run-cli.md) — plan/manifest to `output/admin-writer-dry-runs/` | **None** to target-dir |
| **G-5w-c（完了）** | [Sandbox apply](./admin-scaffold-writer-sandbox-apply.md) | Sandbox under `output/admin-writer-sandbox/` only |
| **G-5w-d（完了）** | [Generated scaffold review](./generated-admin-scaffold-review.md) | Review only |
| **G-5x（完了）** | [Staging runtime shell](./staging-runtime-shell-integration.md) | After `readyForG5x: true` |

**Dependency chain:** G-5s dry-run package → G-5w-b dry-run CLI → G-5w-c sandbox apply → G-5w-d review → G-5x runtime shell.

---

## 15. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Existing admin overwrite | Denylist `src/pages/admin`; fail if target non-empty; no `--force` in v1 |
| Accidentally exposing preview route | Keep preview at `__admin-preview/`; generated paths separate; noindex on staging |
| Confusing prototype with runtime admin | Scaffold banners; `productionReady: false` in UI; customer demo docs |
| Generated files drifting from templates | Manifest `templateRef`; registry inspect CLI before apply |
| Missing components | G-5s `admin-components.required.json` validation in writer |
| Accidental production target | Policy `disallowedTargets`; environment check; no production default |
| Secrets leakage | No env values in generated files; review step; grep for key patterns |
| Rollback not prepared | Mandatory rollback manifest; git commit before apply; sandbox delete procedure |
| Trusting uncommitted `output/` package | Regenerate package from site config; verify checksum/slug in writer |

---

## 16. Acceptance criteria for future writer

Before merging G-5w-b CLI implementation:

| Criterion | Required |
| --- | --- |
| Dry-run output reviewed by maintainer | Yes |
| Target path validation tested | Yes |
| No overwrite by default | Yes |
| `generated-files-manifest.json` emitted | Yes |
| `rollback-manifest.json` emitted on apply | Yes |
| Docs updated (plan + README + roadmap) | Yes |
| Explicit `--approval-id` on `--apply` | Yes |
| Tests for forbidden targets (`src/pages/admin`, root, dist) | Yes |
| Sariswing admin paths excluded | Yes |
| Default mode is dry-run without `--apply` | Yes |

Before G-5w-c sandbox apply:

| Criterion | Required |
| --- | --- |
| G-5w-b dry-run manifest reviewed | Yes |
| Sandbox path under `output/admin-writer-sandbox/` | Yes |
| `overwrittenFiles` empty in rollback manifest | Yes |

---

## 17. Final safety statement

```txt
G-5w-a is a planning phase only.
No writer CLI is implemented.
No files are generated.
No runtime files are written.
No existing admin is modified.
No auth is connected.
No database is queried or updated.
No storage upload is performed.
No GitHub dispatch is performed.
No FTP deploy is performed.
No production environment is touched.
```

---

## Related

- [admin-scaffold-writer-dry-run-cli.md](./admin-scaffold-writer-dry-run-cli.md) — G-5w-b dry-run CLI
- [staging-runtime-shell-integration.md](./staging-runtime-shell-integration.md) — G-5x staging shell route
- [site-config-driven-admin-scaffold-generator.md](./site-config-driven-admin-scaffold-generator.md) — G-5s dry-run package
- [admin-runtime-integration-plan.md](./admin-runtime-integration-plan.md) — G-5t phase map
- [local-only-admin-preview-route.md](./local-only-admin-preview-route.md) — G-5u preview (separate from writer output)
- [admin-scaffold-writer-policy.json](../config/admin/admin-scaffold-writer-policy.json) — machine-readable policy

---

*G-5w-a: planning only. Sariswing `src/pages/admin/` excluded.*
