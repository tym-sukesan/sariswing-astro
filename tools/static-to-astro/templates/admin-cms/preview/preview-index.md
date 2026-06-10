# Admin CMS Prototype Preview Index

**Phase:** G-5r — prototype preview harness  
**Mode:** preview-harness-only — not connected to runtime

---

## Purpose

This directory lists Admin CMS **prototype scaffolds** that can be reviewed safely before runtime integration or customer demos.

- Register prototypes from `templates/admin-cms/prototypes/`
- Record safety flags and demo readiness in `preview-manifest.json`
- Provide a path to future local preview / Astro sandbox / customer demo (G-5u+)
- Help decide which prototype is ready to show customers

**Not performed in G-5r:** Astro build, deploy, runtime routes, Supabase, DB, Storage upload, Publish dispatch, FTP.

---

## Registered prototypes

| Prototype | Template | Site type | Status | Customer demo ready |
| --- | --- | --- | --- | --- |
| [musician-basic-admin-prototype](../prototypes/musician-basic-admin-prototype.astro) | `musician-basic` | musician | scaffold-ready | **false** |

**Local preview (G-5u):** `/__admin-preview/musician-basic/` — requires `ENABLE_ADMIN_PREVIEW=true` and dev mode.

Source of truth: [preview-manifest.json](./preview-manifest.json)

---

## Musician Basic Admin Prototype

| Field | Value |
| --- | --- |
| **prototypeId** | `musician-basic-admin-prototype` |
| **Description** | Static Admin prototype combining G-5l〜G-5o scaffolds for musician-basic |
| **Prototype file** | [musician-basic-admin-prototype.astro](../prototypes/musician-basic-admin-prototype.astro) |
| **Props example** | [musician-basic-props.example.json](../prototypes/musician-basic-props.example.json) |
| **Sections example** | [musician-basic-admin-sections.example.json](../prototypes/musician-basic-admin-sections.example.json) |
| **previewStatus** | `scaffold-ready` |
| **customerDemoReady** | **false** |
| **requiresLocalHarness** | **true** |

## Local-only preview route (G-5u)

| Item | Value |
| --- | --- |
| Route | `/__admin-preview/musician-basic/` |
| Gate | `ENABLE_ADMIN_PREVIEW=true` **and** `import.meta.env.DEV` |
| Status | `localPreviewStatus: created` |
| Doc | [local-only-admin-preview-route.md](../../../docs/local-only-admin-preview-route.md) |

**Not** `/admin/`. Default `ENABLE_ADMIN_PREVIEW=false`. Do not use on production.

Inspect:

```bash
node tools/static-to-astro/scripts/inspect-admin-preview-harness.mjs
node tools/static-to-astro/scripts/inspect-admin-preview-harness.mjs --prototype musician-basic-admin-prototype
```

---

## Related docs

| Doc | Purpose |
| --- | --- |
| [musician-basic-admin-prototype.md](../../../docs/musician-basic-admin-prototype.md) | Developer prototype (G-5p) |
| [customer-admin-manual-musician-basic.md](../../../docs/customer-admin-manual-musician-basic.md) | Customer admin manual (G-5q) |
| [customer-admin-quick-checklist-musician-basic.md](../../../docs/customer-admin-quick-checklist-musician-basic.md) | Quick checklist (G-5q) |
| [admin-prototype-preview-harness.md](../../../docs/admin-prototype-preview-harness.md) | Preview harness overview (G-5r) |
| [preview-safety-checklist.md](./preview-safety-checklist.md) | Before customer demo |

---

## Safety status

| Flag | Value |
| --- | --- |
| `connectedToRuntime` | **false** |
| `productionReady` | **false** |
| `previewBuildPerformed` | **false** |
| `deployPerformed` | **false** |
| Supabase Auth | not connected |
| DB query / update | not performed |
| Storage upload | not performed |
| GitHub dispatch | not performed |
| FTP deploy | not performed |
| Production touched | **false** |

---

## Before customer demo

Complete [preview-safety-checklist.md](./preview-safety-checklist.md) before showing any prototype to a customer.

Minimum requirements (not yet met for `musician-basic-admin-prototype`):

- Local-only preview route (G-5u)
- Scaffold-only banner visible
- Mock data clearly labeled
- Production publish disabled and explained
- Customer understands: **no save, no production effect**
- Design QA on target devices

---

*G-5r: preview index only. Sariswing admin untouched.*
