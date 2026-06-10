# Admin CMS Prototype Preview Harness

**Phase:** G-5r  
**Status:** preview-harness-only — **no build, no deploy, no runtime**

---

## What this is

A **read-only registry** for Admin CMS prototype scaffolds under `templates/admin-cms/prototypes/`.

| File | Role |
| --- | --- |
| [preview-manifest.json](./preview-manifest.json) | Machine-readable list of prototypes + safety flags |
| [preview-index.md](./preview-index.md) | Human-readable index |
| [preview-safety-checklist.md](./preview-safety-checklist.md) | Pre-demo safety checklist |

---

## How to use

### 1. List registered prototypes (CLI)

```bash
node tools/static-to-astro/scripts/inspect-admin-preview-harness.mjs
node tools/static-to-astro/scripts/inspect-admin-preview-harness.mjs --prototype musician-basic-admin-prototype
```

### 2. Read the manifest

`preview-manifest.json` fields:

| Top-level | Meaning |
| --- | --- |
| `mode` | Always `preview-harness-only` in G-5r |
| `connectedToRuntime` | **false** — no live admin |
| `productionReady` | **false** |
| `previewBuildPerformed` | **false** — no Astro preview build in G-5r |
| `prototypes[]` | Registered prototype entries |

Per prototype:

| Field | Meaning |
| --- | --- |
| `previewStatus` | e.g. `scaffold-ready` |
| `customerDemoReady` | **false** until G-5u+ and checklist complete |
| `requiresLocalHarness` | Needs local preview route before customer demo |
| `safety.*` | All must stay **false** until explicit runtime approval |

### 3. Before customer demo

Complete [preview-safety-checklist.md](./preview-safety-checklist.md).

---

## What we do NOT do (G-5r)

- Astro build / preview server
- Deploy to any host
- Connect to Supabase Auth / DB / Storage
- GitHub dispatch / FTP / Edge Functions
- Place prototypes under `src/pages/admin/` on Sariswing

---

## Future phases

| Phase | Focus |
| --- | --- |
| **G-5s** | Site-config driven admin scaffold generator（**完了**） |
| **G-5t** | Runtime integration plan（**完了**） |
| **G-5u** | Local-only preview route（**完了**） |
| **G-5v** | Customer demo package |

See [admin-prototype-preview-harness.md](../../../docs/admin-prototype-preview-harness.md), [local-only-admin-preview-route.md](../../../docs/local-only-admin-preview-route.md), and [admin-runtime-integration-plan.md](../../../docs/admin-runtime-integration-plan.md).

---

*G-5r: preview harness metadata only. Sariswing untouched.*
