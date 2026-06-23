# Gosaki About HTML content CMS implementation preflight (G-10h1)

**Phase:** `G-10h1-gosaki-about-html-content-cms-implementation-preflight`  
**Status:** **complete** — seed JSON schema, anchors, convert hook, admin route, write guards fixed; **no implementation**  
**Date:** 2026-06-23  
**Prior:** G-10h planning (commit `51c36ed`)

| Check | Status |
| --- | --- |
| Preflight / design fixed | **yes** |
| Config JSON file created | **no** (G-10h2) |
| Convert hook implemented | **no** (G-10h2) |
| Admin About page implemented | **no** (G-10h3) |
| Static JSON write implemented | **no** (G-10h4) |
| Image file mutation | **no** |
| JSON write / FTP / deploy | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-about-html-content-cms-planning.md](./gosaki-about-html-content-cms-planning.md) (G-10h)
- [gosaki-about-band-profiles-section.md](./gosaki-about-band-profiles-section.md) (G-8a)
- [gosaki-youtube-embed-static-json-write-slice-implementation.md](./gosaki-youtube-embed-static-json-write-slice-implementation.md) (G-10c)

Staging About URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/`

---

## Gates

```txt
gosakiAboutHtmlContentCmsImplementationPreflightComplete: true
phase: G-10h1
readyForG10h2GosakiAboutHtmlContentCmsImplementation: false
gosakiAboutHtmlContentSeedJsonAndConvertHookComplete: true
readyForG10h3GosakiAboutHtmlContentAdminUi: true
configJsonFileCreated: false
convertHookImplemented: false
adminAboutPageImplemented: false
staticJsonWriteImplemented: false
cursorImplementationExecuted: false
cursorConfigJsonCreated: false
cursorImageFileMutationExecuted: false
cursorJsonWriteExecuted: false
cursorFtpUploadExecuted: false
workflowDispatchExecuted: false
```

---

## 1. Seed JSON structure (fixed — file not created in G-10h1)

### 1.1 Path

```txt
tools/static-to-astro/config/sites/gosaki-piano-about-content.json
```

Copied at convert to: `output/.../src/data/gosaki-about-content.json` (implementation phase).

### 1.2 Schema (version 1)

```json
{
  "$comment": "G-10h — Gosaki About HTML blocks (staging static JSON CMS).",
  "siteSlug": "gosaki-piano",
  "page": "about",
  "version": 1,
  "previewPath": "about/",
  "blocks": [
    {
      "id": "about-profile-html",
      "label": "About profile（見出し・経歴・ポートレート）",
      "enabled": true,
      "html": ""
    },
    {
      "id": "about-bands-html",
      "label": "Bands / Projects",
      "enabled": true,
      "html": ""
    }
  ]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `siteSlug` | yes | Must be `gosaki-piano` |
| `page` | yes | Must be `about` |
| `version` | yes | `1` for v1 slice |
| `previewPath` | yes | `about/` — admin preview link |
| `blocks` | yes | Fixed length **2** in v1 |
| `blocks[].id` | yes | Allowlist only (see §6) |
| `blocks[].label` | yes | Admin UI display only; **not** written by Save v1 |
| `blocks[].enabled` | yes | `false` → hook skips block; fallback applies |
| `blocks[].html` | yes | Inner HTML fragment; may be `""` at seed |

**Not in v1 schema:** `sortOrder` (block order fixed), page-level `published` (use per-block `enabled`), `updatedAt` (file mtime / git only until write slice adds audit).

### 1.3 Max length

| Scope | Limit | Rationale |
| --- | --- | --- |
| Per-block `html` | **100,000** chars | Sariswing page max 1M; profile ~4k today; bands ~20k with markup headroom |
| Total all blocks | **200,000** chars | Guard against runaway paste |
| Write payload | **1 block / 1 Save** | `blocksAffected: 1` (G-10c pattern) |

### 1.4 Initial seed extraction sources (G-10h2 — not executed here)

| Block id | Seed source | Method |
| --- | --- | --- |
| `about-profile-html` | `fixtures/gosaki-piano/about.html` | Cheerio: inner HTML of `[data-mesh-id="comp-lol1i5l0inlineContent-gridContainer"]` (~3,816 chars) |
| `about-bands-html` | Generated `BandProfilesSection` markup **or** hand-built `<section class="band-profiles">…` | Prefer one-time render of current component + inline styles from `BandProfilesSection.astro`; include `<img src="/images/bands/{id}.jpg">` paths |

**G-10h1:** seed HTML **not** committed — extraction script/doc only in implementation phase.

### 1.5 Missing / empty fallback (convert hook)

| Condition | Profile block | Bands block |
| --- | --- | --- |
| Config file missing | Wix fixture passthrough (unchanged) | G-8a `<BandProfilesSection />` (unchanged) |
| Block missing in JSON | Same as missing file for that block | Same |
| `enabled: false` | Skip replace — Wix fixture inner | Skip replace — keep `BandProfilesSection` |
| `html: ""` (empty trim) | Skip replace — Wix fixture inner | Skip replace — keep `BandProfilesSection` |
| `html` non-empty | Replace grid container inner | Replace `<BandProfilesSection />` with raw HTML |

---

## 2. About profile block — extraction scope (confirmed)

### 2.1 Anchor (fixed)

```txt
Selector: [data-mesh-id="comp-lol1i5l0inlineContent-gridContainer"]
Scope: inner HTML only (children of grid container)
```

Fixture verification (read-only): **3 direct children:**

| # | Element id | Content |
| --- | --- | --- |
| 1 | `WRchTxt16` | **About** heading (`<h4>`) |
| 2 | `comp-jrqh3smr` | Biography paragraphs |
| 3 | `comp-jrtenw0n` | Portrait `<img>` (Wix CDN `250428_1002.jpg`) |

### 2.2 Inclusion decisions

| Item | Include in `about-profile-html`? | Reason |
| --- | --- | --- |
| About heading | **yes** | Operator edits title text with section |
| Biography body | **yes** | Primary CMS target |
| Portrait image | **yes** | `<img>` in HTML; operator can switch to `/images/about/...` later |
| Section wrapper `#comp-lol1i5l0` | **no** | Preserves Wix bg layers / section chrome |
| `BaseLayout` / nav / footer | **no** | Outside about page inner |
| Parent mesh outside grid | **no** | Minimizes layout break |

**Conclusion:** `#comp-lol1i5l0` grid container **inner** is the correct `about-profile-html` scope.

---

## 3. Bands / Projects block — replacement policy (fixed)

### 3.1 Primary mode

When `about-bands-html` is **enabled** and **non-empty**:

1. Convert hook **removes** `<BandProfilesSection />` import + component line from `about/index.astro`.
2. Inserts JSON `html` fragment **in the same position** (before `</BaseLayout>`).
3. Scoped CSS from `BandProfilesSection.astro` must be **embedded in HTML block** (`<style>`) or moved to `gosaki-piano-overrides.mjs` in implementation — preflight defers to G-10h2 (recommend inline `<style>` in seed HTML for parity).

### 3.2 Fallback

| State | Public behavior |
| --- | --- |
| Empty / disabled `about-bands-html` | **Keep G-8a** `BandProfilesSection` + `gosaki-piano-band-profiles.json` |
| Config missing | **Keep G-8a** |

**Do not** run BandProfiles + HTML bands simultaneously (duplicate section risk).

### 3.3 Relationship to `gosaki-piano-band-profiles.json`

| Phase | Role |
| --- | --- |
| v1 CMS | `band-profiles.json` = **seed / fallback only** when bands HTML empty |
| Admin Save | Writes `about-bands-html` only — **does not** mutate band-profiles.json |
| Future item CRUD | Optional; out of G-10h scope |

### 3.4 Images in bands HTML

**Yes:** `<img src="/images/bands/gosakirika-trio.jpg" alt="ごさきりかこTrio">` in HTML block.  
Convert/build applies deployBase via existing static asset paths (no Wix CDN for band photos).

---

## 4. Convert hook policy (fixed — not implemented)

### 4.1 Module

```txt
tools/static-to-astro/scripts/lib/gosaki-about-content.mjs   (new file — G-10h2)
```

**Not** merged into `gosaki-piano-overrides.mjs` (CSS overrides only).  
**Orchestration** in `astro-generator.mjs` only.

### 4.2 Stage order (gosaki-piano fixture only)

```txt
1. Generic page generation (about.html → about/index.astro)
2. applyGosakiAboutBandProfiles()          — G-8a inject BandProfilesSection
3. applyGosakiAboutContent()               — G-10h2 NEW (after G-8a)
4. applyGosakiHomeYouTubeEmbed()           — home only (unchanged)
```

Rationale: bands fallback depends on G-8a running first; hook then optionally replaces component.

### 4.3 Page scope

- `isGosakiPianoFixture(siteDir)` guard
- Target file: `outDir/src/pages/about/index.astro` only
- No other routes

### 4.4 Profile replace algorithm

1. Load `gosaki-piano-about-content.json` from toolRoot (if missing → no-op).
2. Find block `about-profile-html`; if not enabled or empty html → skip.
3. Parse about page body (inside `<BaseLayout>`) with cheerio.
4. Select `[data-mesh-id="comp-lol1i5l0inlineContent-gridContainer"]`.
5. Replace `.html()` with JSON block html (trusted operator content).
6. Write back `about/index.astro` preserving `<BaseLayout>` wrapper + frontmatter.

### 4.5 Bands replace algorithm

1. Find block `about-bands-html`; if not enabled or empty → **leave** `<BandProfilesSection />`.
2. Remove `import BandProfilesSection ...` line if present.
3. Replace `<BandProfilesSection />` with JSON html (trimmed).

### 4.6 HTML corruption / failure behavior

| Failure | Behavior |
| --- | --- |
| Selector not found | **Abort convert** with explicit error (fail-fast — do not publish broken about) |
| Invalid JSON | **Abort convert** |
| Block html breaks Astro parse | Build step fails (`--verify-build` catches) |
| Empty block | Silent skip — fallback |

### 4.7 Verifier conditions (G-10h2+)

- Config present → `about/index.html` contains profile html snippet / bands class `band-profiles`
- Profile replace → grid container contains seeded heading text
- Bands replace → no `<BandProfilesSection` in built about when bands html set
- Bands fallback → `band-profiles` present when bands html empty
- Missing config → identical to pre-G-10h2 convert output

---

## 5. Admin route policy (fixed — not implemented)

### 5.1 Route

```txt
/__admin-staging-shell/musician-basic/admin/about/
```

Add to `gosaki-staging-admin-paths.ts`:

```txt
GOSAKI_STAGING_ADMIN_ABOUT_PATH = "/__admin-staging-shell/musician-basic/admin/about/"
```

Templates (G-10h3):

```txt
templates/admin-cms/gosaki/pages/GosakiStagingAdminAboutPage.astro
templates/admin-cms/gosaki/components/AdminGosakiStagingAboutOperatorPage.astro
```

**Not** `src/pages/admin/about/` (production Sariswing path — forbidden).

### 5.2 UI layout

| Element | Policy |
| --- | --- |
| Editor | **2 cards** — one per block id (not browser tabs — matches Discography list pattern) |
| Each card | `label` + large `<textarea>` + char/line stats |
| Preview | Per-block `#aboutPreview-{blockId}` — `innerHTML = textarea` (Sariswing pattern) |
| Global preview | Optional link to staging `previewPath` |
| Warnings | Sariswing-style HTML breakage notice at top |
| Save | **Disabled by default**; dry-run gate (G-10c pattern) |
| Dry-run display | `changedFields`, `blocksAffected`, `beforeSnippet`, `afterSnippet`, guard errors, arm stack |

**v1 write slice:** Save **one block at a time** (dropdown or per-card Save button with block id in payload).

### 5.3 Operator home menu

Add **About管理** link alongside Schedule / YouTube / Discography (G-10h3).

---

## 6. Static JSON write safety guards (fixed — G-10h4)

### 6.1 Approval ID

```txt
G-10h-about-html-content-static-json-write-slice
```

### 6.2 Env arm stack (mirror G-10c)

| Variable | Required value |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `static-json` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `about-html-content` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-10h-about-html-content-static-json-write-slice` |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_HTML_CONTENT_STATIC_JSON_WRITE_ARMED` | `true` |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` (Save execution only) |
| `G10H_ABOUT_HTML_CONTENT_SAVE_ENABLED` | `true` (page config bridge) |
| `ENABLE_ADMIN_STAGING_SHELL` | `true` |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` |
| `DEV` | `true` |

### 6.3 Allowlists

| Gate | Allowlist |
| --- | --- |
| Config path | `tools/static-to-astro/config/sites/gosaki-piano-about-content.json` only |
| `siteSlug` | `gosaki-piano` |
| `blockId` | `about-profile-html` **or** `about-bands-html` (one per Save) |
| Writable fields | `html` only (per block) |
| `changedFields` | `["html"]` only |
| `blocksAffected` | must be `1` |

### 6.4 Write mechanics

- Read full JSON → validate → merge **single block** `html` + `enabled` unchanged unless in payload
- **Atomic write:** temp file + rename (same as G-10c executor)
- Dry-run first; Save re-runs dry-run server-side
- Auth: staging shell session required
- **No** Supabase / **no** `service_role` in browser

### 6.5 API route (implementation)

```txt
src/pages/__admin-staging-shell/musician-basic/api/about-html-content-static-json-write.json.ts
```

Modules under `src/lib/admin/staging-write/gosaki-about-html-content-static-json-write-*.ts` (mirror G-10c file split).

---

## 7. HTML safety policy (About blocks)

Trusted **operator-only** content (same trust model as Sariswing About). Server-side dry-run guards:

| Pattern | Policy |
| --- | --- |
| `<script` | **Reject** (hard guard) |
| `<iframe` | **Reject** in About blocks (HubSpot is Contact-only — G-10g) |
| `on*` event attributes (`onclick`, etc.) | **Reject** |
| `javascript:` URLs | **Reject** |
| `style="..."` inline | **Allow** — Wix-exported profile html depends on inline styles |
| `<style>` block | **Allow** in `about-bands-html` only (scoped band CSS); **warn** in profile block |
| `<img src>` | **Allow** — relative `/images/...` preferred |
| `<a href>` | **Allow** — `http:`, `https:`, `mailto:`; reject `javascript:` |
| HTML comments | Allow |

**No DOMPurify on public render** — content is operator-authored; guards at Save time only.

**Contact / HubSpot (G-10g):** separate JSON + separate allowlist (`iframe` + HubSpot domains only) — **not** mixed into About write guards.

---

## 8. Image placement policy (confirmed)

| Item | Policy |
| --- | --- |
| Band photos directory | `public/images/bands/` |
| Naming | `{band-id}.jpg` — ids from legacy `gosaki-piano-band-profiles.json` (`gosakirika-trio`, `onomatope`, …) |
| Profile portrait (optional future) | `public/images/about/profile.jpg` — not required for v1 |
| HTML `src` | `/images/bands/gosakirika-trio.jpg` (leading slash; deployBase at site level) |
| Operator supply | Drop files into generated astro `public/images/bands/` before convert/build |
| Package inclusion | Files present at `npm run build` → copied to `public-dist/images/bands/` |
| Missing file | `<img>` may 404 — prefer operator QA; bands HTML may use placeholder markup explicitly |
| G-8a fallback | Component still shows `Photo` div when file missing and bands HTML empty |

---

## 9. Not executed (G-10h1)

- `gosaki-about-content.mjs` implementation
- `gosaki-piano-about-content.json` creation
- Admin About page / API route
- Static JSON write modules
- Image add / delete / move
- JSON write / Save click
- FTP / deploy / `workflow_dispatch`
- `src/pages/admin` changes

---

## 10. Next phases

| Phase | Scope |
| --- | --- |
| **G-10h2** | Create config + seed extraction + `gosaki-about-content.mjs` + convert verify |
| **G-10h3** | Staging admin About UI (textarea + preview + dry-run, Save disabled) |
| **G-10h4** | Static JSON write slice — **profile block first** (`about-profile-html` only) |
| **G-10h4b** | Bands block write slice + optional band JPG drop |
| **G-10h5** | Package verify + operator re-upload |
| Deferred | G-10f Discography, G-10g HubSpot contact embed |
