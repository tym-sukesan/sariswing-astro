# Gosaki About HTML content admin read-only preview (G-10h3)

**Phase:** `G-10h3-gosaki-about-html-content-admin-readonly-preview`  
**Status:** **complete** — staging admin About route + read-only preview UI; **no Save / no write API**  
**Date:** 2026-06-23  
**Prior:** G-10h2 seed JSON + convert hook (commit `02f75a2`)

| Check | Status |
| --- | --- |
| About admin route | **yes** |
| JSON read + preview | **yes** |
| Save enabled | **no** |
| Write API | **no** |
| JSON write API | **no** |
| FTP / deploy | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-about-html-content-seed-json-and-convert-hook.md](./gosaki-about-html-content-seed-json-and-convert-hook.md) (G-10h2)
- [gosaki-about-html-content-cms-implementation-preflight.md](./gosaki-about-html-content-cms-implementation-preflight.md) (G-10h1)

Admin URL (local dev): `/__admin-staging-shell/musician-basic/admin/about/`

---

## Gates

```txt
gosakiAboutHtmlContentAdminReadonlyPreviewComplete: true
phase: G-10h3
readyForG10h4GosakiAboutHtmlContentStaticJsonWrite: false
gosakiAboutProfileHtmlStaticJsonWriteDryRunComplete: true
readyForG10h4bGosakiAboutProfileHtmlStaticJsonWriteExecution: true
adminAboutPageImplemented: true
adminAboutPageReadOnly: true
staticJsonWriteImplemented: false
writeApiImplemented: false
cursorAdminSaveEnabled: false
cursorJsonWriteExecuted: false
cursorDbWriteExecuted: false
cursorImageFileMutationExecuted: false
cursorFtpUploadExecuted: false
cursorDeployExecuted: false
workflowDispatchExecuted: false
```

---

## 1. Admin shell structure (surveyed)

| Area | Pattern |
| --- | --- |
| Route entry | `src/pages/__admin-staging-shell/musician-basic/admin/{module}/index.astro` |
| Page template | `tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdmin*Page.astro` |
| Operator UI | `templates/admin-cms/gosaki/components/AdminGosakiStaging*OperatorPage.astro` |
| Data binding | `src/lib/admin/staging-data/gosaki-*-admin-binding.ts` |
| Client UI | `src/lib/admin/staging-data/gosaki-staging-*-admin-ui.ts` |
| Paths | `gosaki-staging-admin-paths.ts` |
| Auth | `AdminGosakiStagingAuthGate` wrapper |
| Routing | `astro.config.mjs` `injectRoute` (underscore page dirs) |

---

## 2. About admin route

```txt
/__admin-staging-shell/musician-basic/admin/about/
```

| File | Role |
| --- | --- |
| `src/pages/__admin-staging-shell/musician-basic/admin/about/index.astro` | DEV + `ENABLE_ADMIN_STAGING_SHELL` gate |
| `templates/.../GosakiStagingAdminAboutPage.astro` | Layout + auth gate |
| `templates/.../AdminGosakiStagingAboutOperatorPage.astro` | Operator UI |

---

## 3. Data source

**Config:** `tools/static-to-astro/config/sites/gosaki-piano-about-content.json`

**Loader:** `loadGosakiAboutContentAdminBinding()` in `gosaki-about-content-admin-binding.ts`

**Blocks displayed:**

| id | label |
| --- | --- |
| `about-profile-html` | About profile |
| `about-bands-html` | Bands / Projects |

**Meta shown:** `siteSlug`, `page`, `version`, `previewPath`, block count, per-block `enabled`, html length, line count

---

## 4. UI (read-only)

- Global notice: read-only preview / JSON unchanged
- Config meta card
- Staging About preview link
- HTML safety memo
- **2 block cards** — readonly textarea + in-page preview (`set:html`, no iframe)
- **Save button:** `保存する（未実装）` — **disabled**

**Client guard:** `gosaki-staging-about-content-admin-ui.ts` re-enforces readonly + disabled Save on DOMContentLoaded.

---

## 5. Navigation

`AdminGosakiStagingOperatorHome.astro` — menu link **About HTML** added.

---

## 6. Local dev verification

```bash
cd /Users/toyamayusuke/sariswing-astro

ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
PUBLIC_ENABLE_ADMIN_STAGING_AUTH=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
npm run dev -- --port 4322
```

URL: `http://localhost:4322/__admin-staging-shell/musician-basic/admin/about/`

(Requires staging auth gate when auth env enabled — same as YouTube/Discography.)

---

## 7. Not executed (G-10h3)

- Save enablement
- Write API / JSON write executor
- DB write / Supabase update
- Image file mutation
- FTP / deploy / manual upload
- `src/pages/admin` (production Sariswing admin)

---

## 8. Next phase

| Phase | Scope |
| --- | --- |
| **G-10h4** | Static JSON write slice — profile block first (`G-10h-about-html-content-static-json-write-slice`) |
| **G-10h4b** | Bands block write |
| **G-10h5** | Package + operator re-upload |

---

## 9. Changed files (G-10h3)

| File | Change |
| --- | --- |
| `src/pages/__admin-staging-shell/.../admin/about/index.astro` | **new** route |
| `templates/.../GosakiStagingAdminAboutPage.astro` | **new** |
| `templates/.../AdminGosakiStagingAboutOperatorPage.astro` | **new** |
| `src/lib/admin/staging-data/gosaki-about-content-admin-binding.ts` | **new** |
| `src/lib/admin/staging-data/gosaki-staging-about-content-admin-ui.ts` | **new** |
| `gosaki-staging-admin-paths.ts` | `GOSAKI_STAGING_ADMIN_ABOUT_PATH` |
| `AdminGosakiStagingOperatorHome.astro` | menu link |
| `astro.config.mjs` | injectRoute |
| `scripts/verify-g10h3-*.mjs` | **new** |
| `docs/gosaki-about-html-content-admin-readonly-preview.md` | **new** |
| `docs/ai/*` | updated |
