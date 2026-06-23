# Gosaki About HTML content CMS planning (G-10h)

**Phase:** `G-10h-gosaki-about-html-content-cms-planning`  
**Status:** **complete** — read-only investigation + CMS architecture planning; no implementation  
**Date:** 2026-06-23  
**Prior:** G-10e1 YouTube arc closed (commit `d83ae32`); G-10f Discography planning (commit `ed50a9b`) — **deferred** per operator priority shift

| Check | Status |
| --- | --- |
| Read-only investigation | **yes** |
| Implementation | **no** |
| Image file mutation | **no** |
| JSON write / Save | **no** |
| FTP / deploy | **no** |
| `src/pages/admin` changed | **no** |

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/`

Prior docs:

- [gosaki-about-band-profiles-section.md](./gosaki-about-band-profiles-section.md) (G-8a)
- [gosaki-youtube-embed-static-json-write-slice-implementation.md](./gosaki-youtube-embed-static-json-write-slice-implementation.md) (G-10c)
- [gosaki-discography-album-images-planning.md](./gosaki-discography-album-images-planning.md) (G-10f — deferred)

---

## Gates

```txt
gosakiAboutHtmlContentCmsPlanningComplete: true
phase: G-10h
readyForG10h1GosakiAboutHtmlContentCmsImplementationPreflight: true
gosakiDiscographyAlbumImagesDeferred: true
cursorImplementationExecuted: false
cursorImageFileMutationExecuted: false
cursorJsonWriteExecuted: false
cursorFtpUploadExecuted: false
workflowDispatchExecuted: false
```

---

## 1. Sariswing About CMS (reference — read-only)

### 1.1 Storage

| Item | Sariswing |
| --- | --- |
| **Store** | Supabase `public.site_pages` (`slug`, `title`, `html_content`, timestamps) |
| **Revisions** | `public.site_page_revisions` (auto backup before save; max 50 generations) |
| **Fallback** | `src/data/about-main.html` (bundled static HTML when DB empty / build offline) |

**Not static JSON** on Sariswing production path.

### 1.2 Admin UI

| Item | Detail |
| --- | --- |
| Route | `/admin/about/` (`src/pages/admin/about/index.astro`) |
| Editor | **Single `<textarea>`** — full About `<main>` inner HTML |
| Preview | `#aboutPreview` — `innerHTML = textarea` (client-side, same CSS as public) |
| Save | Button → `saveSitePage()` via Edge Function `admin-site-page` |
| Revisions | List + view dialog + restore |
| Warnings | HTML breakage notice; copy-before-edit hint |

### 1.3 Public rendering

```astro
// src/pages/about/index.astro
const { data: aboutPage } = await fetchSitePageBySlug("about");
const mainHtml = resolveSitePageHtml(aboutPage, aboutMainFallback);
<main set:html={mainHtml} />
```

- **Build-time** Supabase read (anon client)
- `set:html` — **no client-side sanitize** on public render
- Separate `Header` / `Footer` Astro components (not inside CMS HTML)

### 1.4 Save safety (Sariswing)

| Layer | Behavior |
| --- | --- |
| Auth | Supabase Auth + `requireAdminUser` on Edge Function |
| Server write | `service_role` **only inside Edge Function** (not in browser) |
| Validation | `html_content` required string; max **1,000,000** chars; trim check |
| Sanitize | **No HTML allowlist sanitizer** — trusted admin-only content |
| Deploy loop | Save → DB only; operator triggers rebuild/deploy from admin home |

### 1.5 Gosaki-reusable vs must-not-copy

| Reuse for Gosaki Kit | Do **not** copy to Gosaki staging MVP |
| --- | --- |
| Textarea + live preview UX | Production `/admin/` routes |
| Single-page HTML editing mental model | Supabase `site_pages` + Edge Function |
| Revision / backup concept (file-based later) | `service_role` in client |
| `resolveSitePageHtml(record, fallback)` pattern | Sariswing production Supabase project |
| Warning copy about HTML breakage | Immediate production deploy on save |

**Gosaki analogue:** static JSON file + staging-shell API route + convert-time injection (YouTube G-10c pattern).

---

## 2. Gosaki About page — current structure

### 2.1 Source-of-truth map

| Layer | Path | Role |
| --- | --- | --- |
| **Fixture** | `fixtures/gosaki-piano/about.html` | Wix crawl export — bio + portrait |
| **Convert** | `astro-generator.mjs` → `src/pages/about/index.astro` | Generic Wix → Astro passthrough |
| **Band profiles hook** | `gosaki-about-band-profiles.mjs` (G-8a) | Appends `<BandProfilesSection />` before `</BaseLayout>` |
| **Band data** | `config/sites/gosaki-piano-band-profiles.json` | 5 bands; text + `image` paths |
| **Band component** | `templates/site-extensions/gosaki-piano/BandProfilesSection.astro` | Rendered Astro section + scoped CSS |
| **Admin** | **No About admin page yet** — staging shell has Schedule / YouTube / Discography only |

### 2.2 Page composition (generated)

```txt
<BaseLayout>   ← SEO, canonical, deployBase
  [Wix section #comp-lol1i5l0]
    #WRchTxt16        → "About" heading
    #comp-jrqh3smr    → profile biography (rich text)
    #comp-jrtenw0n    → portrait <img> (Wix CDN 250428_1002.jpg)
  <BandProfilesSection />   ← injected after Wix block
</BaseLayout>
```

Wix header/footer/nav remain in global layout patterns (same as other gosaki pages).

### 2.3 CMS-friendly anchor candidates

| Anchor | Selector / slot | Content | Replace impact |
| --- | --- | --- | --- |
| **Profile block** | `#comp-lol1i5l0` → `...-gridContainer` inner | Heading + bio + portrait | Low — isolated section |
| **Portrait only** | `#comp-jrtenw0n img` | Single image | Medium — partial edit |
| **Bands section** | `<BandProfilesSection />` slot | 5 band cards | Medium — replace component with HTML fragment |
| **Full inner body** | Between `<BaseLayout>` open and `</BaseLayout>` | Wix + bands | High — loses component guardrails |

**Recommended anchors for v1:** profile block + bands block (two slots).

### 2.4 Portrait image (Wix bio — not Bands)

- `#comp-jrtenw0n` uses real Wix CDN `<img>` (`250428_1002.jpg`) — **not** a placeholder.
- External CDN dependency (same class of issue as discography jackets).

---

## 3. Bands / Projects PHOTO placeholder

### 3.1 Occurrence

**Not in Wix fixture.** Placeholder is from **G-8a `BandProfilesSection.astro`**:

```astro
band.hasImage ? <img ...> : <div class="band-profile__placeholder">Photo</div>
```

`hasImage` = `fs.existsSync(public/images/bands/{file})` at **build time**.

### 3.2 Current state (staging package)

| Band | JSON `image` | File on disk | Public display |
| --- | --- | --- | --- |
| ごさきりかこTrio | `/images/bands/gosakirika-trio.jpg` | **missing** | **Photo** placeholder |
| 新谷健介オノマトペ | `/images/bands/onomatope.jpg` | missing | Photo placeholder |
| ケアレスホーネッツ | `/images/bands/careless-hornets.jpg` | missing | Photo placeholder |
| 紀々音 | `/images/bands/kikioto.jpg` | missing | Photo placeholder |
| カリビアンファンクション | `/images/bands/caribbean-function.jpg` | missing | Photo placeholder |

Package check: `public-dist/about/index.html` contains `band-profile__placeholder` + label `Photo` (5×).

### 3.3 Mechanism

- **Not** CSS background — **`<div>` placeholder** with dashed border
- **Not** `NO PHOTO.png` Wix asset (that is on home schedule repeater only)

---

## 4. CMS granularity comparison (A–E)

| Opt | Approach | Speed | Safety | Kit reuse | Edit UX | HTML risk | Images | Embeds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **A** | Whole About inner HTML in one JSON field | Med | Low | Med | Simple textarea | **High** | `<img>` in HTML | OK |
| **B** | Wix profile section only | Fast | **High** | Med | 1 textarea | Med | portrait in HTML | N/A |
| **C** | **2 blocks**: profile HTML + bands HTML | **Fast** | **High** | **High** | 2 textareas | Med | bands via `<img>` in bands block | bands block only |
| **D** | Band item CRUD (current JSON schema) | Slow | Med | Med | Per-field forms | Low | per-item `image` field | Poor |
| **E** | Fixed HTML swap only, no admin Save | Fastest | High | Low | None | Low | manual file drop | N/A |

---

## 5. Recommended approach

### 5.1 Operator hypothesis — **valid**

> About 主要 HTML を static JSON 化し、textarea + preview で編集。Bands / Projects は HTML 内編集から始める。

Code investigation supports this:

1. Sariswing proves textarea + preview works for musician About content.
2. Gosaki already has YouTube **static JSON write** guards (G-10c) — same staging-shell pattern.
3. `BandProfilesSection` can be **superseded by HTML block** without per-item CRUD for v1.
4. Two-block split (profile + bands) limits blast radius vs single monolithic field.

### 5.2 Proposed config (v1)

Path: `config/sites/gosaki-piano-about-content.json`

```json
{
  "siteSlug": "gosaki-piano",
  "page": "about",
  "previewPath": "about/",
  "blocks": [
    {
      "id": "about-profile-html",
      "label": "About profile（経歴・ポートレート）",
      "anchor": "comp-lol1i5l0",
      "html": "..."
    },
    {
      "id": "about-bands-html",
      "label": "Bands / Projects",
      "anchor": "band-profiles-slot",
      "html": "..."
    }
  ]
}
```

- Seed `html` from current fixture + rendered band section markup (implementation phase).
- `about-bands-html` includes full `<section class="band-profiles">…</section>` with inline or class-based styles compatible with existing G-8a CSS (or migrate styles into block once).

### 5.3 Admin (staging shell only)

| Item | Plan |
| --- | --- |
| Route | `/__admin-staging-shell/musician-basic/admin/about/` (**new** — template under `admin-cms/gosaki/`, not `src/pages/admin`) |
| UI | Per-block `<textarea>` + preview panel (Sariswing-inspired) |
| Save | G-10c pattern: dry-run default, approval ID, allowlist `block.id`, `changedFields: ["html"]` only |
| API | `about-content-static-json-write.json.ts` under staging shell |

### 5.4 Public reflection

| Step | Mechanism |
| --- | --- |
| Convert | New `gosaki-about-content.mjs` hook after band-profiles inject |
| Profile | Replace `#comp-lol1i5l0` inner grid HTML with JSON `about-profile-html` |
| Bands | Replace `<BandProfilesSection />` with raw HTML fragment **or** `AboutContentBlock.astro` with `set:html` |
| Build | Static output in `public-dist/about/index.html` |
| Deploy | Operator manual-upload (existing G-7g loop) |

**Do not** connect Gosaki About Save to Supabase in v1.

### 5.5 Relationship to G-8a `BandProfilesSection`

| Phase | Bands handling |
| --- | --- |
| **G-10h2 implementation** | Seed `about-bands-html` from current component output; hook prefers JSON HTML |
| **Transition** | Keep `gosaki-piano-band-profiles.json` as seed source only; admin edits HTML block |
| **Later** | Optional item CRUD if operator requests — not v1 |

### 5.6 Discography (G-10f) status

**Deferred** — operator priority is About CMS. G-10f doc remains valid when resumed.

---

## 6. Image handling (Bands PHOTO fix)

### 6.1 Recommended v1 approach

| Question | Answer |
| --- | --- |
| HTML `<img src="...">` in block? | **Yes** — same as Sariswing About |
| Directory | **`public/images/bands/`** (existing G-8a convention — do not introduce `about/` for band photos) |
| Naming | `{band-id}.jpg` per JSON id: `gosakirika-trio.jpg`, `onomatope.jpg`, etc. |
| Path in HTML | `/images/bands/gosakirika-trio.jpg` — convert applies `withBase()` / deployBase at emit |
| Package | Images under `public-dist/images/bands/` when present at build |
| Operator workflow | Drop JPGs → edit HTML if needed → Save JSON (later) → convert → manual-upload |

### 6.2 Quick win without full CMS

Operator can add JPGs to `public/images/bands/` and rebuild **today** — `BandProfilesSection` will render `<img>` without CMS. CMS adds editable HTML wrapper around that.

### 6.3 Future image upload CMS

Defer to post-v1: static JSON `coverImage`/`image` fields or Storage upload slice — mirror YouTube / future discography pattern. No Supabase Storage for gosaki About v1.

---

## 7. HubSpot embed outlook (planning only)

| Topic | Recommendation |
| --- | --- |
| Same static JSON write pattern? | **Yes** — separate config, not inside About blocks |
| Suggested file | `config/sites/gosaki-piano-contact-embed.json` (or reuse youtube-style `embedCode` field) |
| Target page | **Contact** (`contact.html` / `#comp-kei80gar` area) — **not** About |
| Admin route | `/__admin-staging-shell/.../admin/contact/` or extend contact section on operator home |
| Sanitize | **Stricter than About prose HTML** — allowlist `iframe` + HubSpot domains; block arbitrary `<script>` except approved embed snippet pattern |
| About CMS relation | Shared **write infrastructure** (dry-run, approval ID, JSON executor); **different** allowlist and target hook |

HubSpot implementation = **G-10g** (unchanged from prior next-phase list).

---

## 8. Proposed implementation phases (post-G-10h)

| Phase | Goal |
| --- | --- |
| **G-10h1** | Implementation preflight — seed JSON, anchor map, approval IDs, rollback |
| **G-10h2** | Config + convert hook + optional band images drop (operator assets) |
| **G-10h3** | Staging admin About page + dry-run UI |
| **G-10h4** | Static JSON write slice (one block first, then second) |
| **G-10h5** | Package verify + operator re-upload |

---

## 9. Not executed (G-10h planning)

- Implementation / convert hook / admin page
- Image add / delete / move / overwrite
- JSON write / Save / DB / Supabase
- FTP / deploy / `workflow_dispatch`
- `src/pages/admin` changes
- Sariswing production / production Supabase access

---

## 10. Safety notes

- Gosaki staging About CMS must stay under `/__admin-staging-shell/` — **not** `/admin` production UI.
- HTML blocks: trusted operator content; document breakage risk like Sariswing.
- No `service_role` in browser; file write only via gated server route (G-10c model).
- `readyForAnyFutureFtpApply: false` unchanged.
