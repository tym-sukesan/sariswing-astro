# Admin Prototype Preview Harness

**Phase:** G-5r — prototype preview harness  
**Status:** preview-harness-only — not connected to runtime

---

## 1. Purpose

G-5r adds a **read-only preview harness** for Admin CMS prototype scaffolds created in G-5p. It lets the team:

- List prototypes under `templates/admin-cms/prototypes/`
- Record safety flags and demo readiness in a manifest
- Prepare for future local preview / Astro sandbox / customer demo (G-5u+)
- Judge whether a prototype is ready to show customers (`customerDemoReady`)

**Not performed:** Astro build, deploy, runtime routes, Supabase, DB, Storage, Publish, FTP.

---

## 2. Scope

**In scope:**

- `preview-manifest.json`
- `preview-index.md`
- `preview-safety-checklist.md`
- Preview harness README
- Read-only `inspect-admin-preview-harness.mjs`
- Registration of `musician-basic-admin-prototype`

**Out of scope:**

- Runtime admin
- Astro preview route
- Supabase Auth
- DB query / DB update
- Storage upload
- GitHub dispatch
- FTP deploy
- Production admin

---

## 3. Manifest

**Path:** `templates/admin-cms/preview/preview-manifest.json`

| Top-level field | G-5r value |
| --- | --- |
| `mode` | `preview-harness-only` |
| `connectedToRuntime` | **false** |
| `productionReady` | **false** |
| `previewBuildPerformed` | **false** |
| `deployPerformed` | **false** |

Each `prototypes[]` entry includes paths to the Astro file, props/sections JSON, customer manual, and per-prototype `safety` flags.

---

## 4. Registered prototype

### musician-basic-admin-prototype

| Field | Value |
| --- | --- |
| `templateId` | `musician-basic` |
| `siteType` | `musician` |
| `previewStatus` | `scaffold-ready` |
| `customerDemoReady` | **false** |
| `requiresLocalHarness` | **true** |
| Prototype | [musician-basic-admin-prototype.astro](../templates/admin-cms/prototypes/musician-basic-admin-prototype.astro) |

Related: [musician-basic-admin-prototype.md](./musician-basic-admin-prototype.md) (G-5p), [customer-admin-manual-musician-basic.md](./customer-admin-manual-musician-basic.md) (G-5q).

---

## 5. Safety checklist

**Path:** [preview-safety-checklist.md](../templates/admin-cms/preview/preview-safety-checklist.md)

Use before any customer-facing demo. Covers:

- Scaffold-only display
- Runtime / Auth / DB / Storage / Publish remain off
- Staging vs production explanation
- Mock data labeling
- Customer communication

---

## 6. Inspect CLI

```bash
node tools/static-to-astro/scripts/inspect-admin-preview-harness.mjs
node tools/static-to-astro/scripts/inspect-admin-preview-harness.mjs --prototype musician-basic-admin-prototype
```

Read-only. Prints `prototypeId`, `templateId`, `siteType`, `previewStatus`, `customerDemoReady`, harness and per-prototype safety flags.

---

## 7. Customer demo readiness

**Current:** `customerDemoReady: false` for all registered prototypes.

Before setting `customerDemoReady: true` (future phase, with explicit approval):

| Requirement | Status (G-5r) |
| --- | --- |
| Local-only preview route | Not implemented (G-5u) |
| Mock data clearly labeled | Manual + checklist only |
| Scaffold-only banner | In prototype Astro; demo route pending |
| Production disabled | Documented; no runtime |
| No-save / no-deploy explained | Manual + checklist |
| Design QA | Pending local preview |

---

## 8. Future integration plan

| Phase | Focus |
| --- | --- |
| **G-5s** | Site-config driven admin scaffold generator |
| **G-5t** | Runtime integration plan |
| **G-5u** | Local-only preview route |
| **G-5v** | Customer demo package |

---

## 9. Safety

| Item | Status |
| --- | --- |
| Existing Sariswing admin modified | **false** |
| Connected to runtime | **false** |
| Supabase Auth | not connected |
| Supabase query | not performed |
| DB update | not performed |
| Storage upload | not performed |
| Publish dispatch | not performed |
| FTP deploy | not performed |
| `productionReady` | **false** |
| `connectedToRuntime` | **false** |
| `previewBuildPerformed` | **false** |

---

## Files

| Path | Role |
| --- | --- |
| [preview-manifest.json](../templates/admin-cms/preview/preview-manifest.json) | Manifest |
| [preview-index.md](../templates/admin-cms/preview/preview-index.md) | Human index |
| [preview-safety-checklist.md](../templates/admin-cms/preview/preview-safety-checklist.md) | Pre-demo checklist |
| [preview/README.md](../templates/admin-cms/preview/README.md) | Harness README |

---

*G-5r: preview harness metadata + read-only inspect. Sariswing untouched.*
