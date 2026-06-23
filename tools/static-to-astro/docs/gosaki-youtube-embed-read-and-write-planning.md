# Gosaki YouTube embed read and write planning (G-10b)

**Phase:** `G-10b-gosaki-youtube-embed-read-and-write-planning`  
**Status:** **planning complete** — read/write path survey + G-10c recommendation; **no implementation, no DB write, no Save**  
**Date:** 2026-06-22  
**Prior:** G-10a completion inventory (commit `b5fd950`); G-9j YouTube admin + JSON inject (G-9k6–G-9k7b Schedule arc closed)

| Check | Status |
| --- | --- |
| Public + admin paths documented | **yes** |
| Write options compared | **yes** |
| G-10c recommendation fixed | **yes** |
| Cursor / AI Save / DB write | **no** |
| Migration / deploy | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-completion-inventory-and-next-module-selection.md](./gosaki-completion-inventory-and-next-module-selection.md) (G-10a)
- [gosaki-youtube-and-discography-practicalization.md](./gosaki-youtube-and-discography-practicalization.md) (G-9j)
- [gosaki-cms-scope-and-schedule-youtube-planning.md](./gosaki-cms-scope-and-schedule-youtube-planning.md) (G-9a — `site_embeds` long-term)

---

## Gates

```txt
gosakiYoutubeEmbedReadAndWritePlanningComplete: true
phase: G-10b
readyForG10cYoutubeEmbedStaticJsonWriteSlice: true
readyForG10eSiteEmbedsSupabaseMigration: false
readyForAnyDbWrite: false
cursorClickedSave: false
```

**Routine dev:** Save disabled on YouTube admin; no write arms.

---

## 1. Current YouTube embed public display path

### 1.1 Data flow (build / convert time)

```txt
tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json   (source of truth today)
  ↓ convert (gosaki-piano fixture only)
applyGosakiHomeYouTubeEmbed() in scripts/lib/gosaki-home-youtube-embed.mjs
  → copies to outDir/src/data/gosaki-youtube-embed.json
  → copies YouTubeEmbedSection.astro → src/components/
  → copies gosaki-youtube-embed.ts → src/lib/
  → injects <YouTubeEmbedSection /> into src/pages/index.astro
     (after Wix block #comp-m8y53dj5 — THIS WEEK'S LIVE SCHEDULE)
  ↓ astro build (SSG)
Static HTML: home page includes .gosaki-youtube-embed section when published items exist
  ↓ manual upload (operator)
Staging preview: /cms-kit-staging/gosaki-piano/
```

**Not runtime Supabase read.** Public home is **static JSON baked at convert/build**, same pattern as Bands JSON (G-8a).

### 1.2 Public component

| Item | Path |
| --- | --- |
| Template | `tools/static-to-astro/templates/site-extensions/gosaki-piano/YouTubeEmbedSection.astro` |
| Resolver | `tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-youtube-embed.ts` |
| Built import | `import embedConfig from "../data/gosaki-youtube-embed.json"` |

**Render rule:** `resolvePublishedGosakiYoutubeItems()` — only `published === true` items with parseable `videoId` (from `videoId` / `sourceUrl` / `embedCode` iframe src).

**Output fields (resolved):**

| Field | Source |
| --- | --- |
| `videoId` | Parsed from embedCode / sourceUrl / videoId |
| `embedUrl` | `https://www.youtube-nocookie.com/embed/{videoId}` |
| `watchUrl` | `https://www.youtube.com/watch?v={videoId}` |
| `iframeTitle` | `GOSAKI_YOUTUBE_DEFAULT_IFRAME_TITLE` (fixed string today) |
| `title` / `caption` | In schema but **not shown** in public Astro template (MVP) |
| `sortOrder` | Ascending multi-item support |

### 1.3 Current config state — **placeholder**

```json
{
  "siteSlug": "gosaki-piano",
  "sectionTitle": "YouTube",
  "items": [
    { "id": "yt-placeholder-01", "published": false, "sortOrder": 10, "embedCode": "" }
  ]
}
```

**Public home:** YouTube section **hidden** (`items.length === 0` after published filter). Wix-origin iframe on crawled HTML may still exist until replaced by rebuild with published config.

### 1.4 Reflecting changes on staging

Operator loop (same family as Schedule):

```txt
1. Update config (today: manual JSON edit; G-10c: staging admin Save)
2. npm run convert / build (gosaki-piano fixture pipeline)
3. npm run manual-upload:package
4. Operator manual upload public-dist/ to /cms-kit-staging/gosaki-piano/
```

**No hot reload.** FTP auto-deploy remains suspended.

---

## 2. Current YouTube admin UI / binding

### 2.1 Routes

| Layer | Path |
| --- | --- |
| Staging shell page | `src/pages/__admin-staging-shell/musician-basic/admin/youtube/index.astro` |
| Gosaki page | `tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminYoutubePage.astro` |
| Operator UI | `tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeOperatorPage.astro` |
| Client script | `src/lib/admin/staging-data/gosaki-staging-youtube-admin-ui.ts` |

**Not** production `/admin`.

### 2.2 Binding — static JSON read (server-side fs)

`src/lib/admin/staging-data/gosaki-youtube-embed-admin-binding.ts`:

- Reads `tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json` via `fs.readFileSync` at **SSR request time**
- **Not** Supabase; **not** mock — live file content
- Exposes `items[]` with `resolved` preview (same resolver as public)
- `publishedCount`, `configFound`, error `message`

### 2.3 Admin UI capabilities (G-9j)

| Feature | Status |
| --- | --- |
| Add form + embed-code textarea | UI only |
| Add-form iframe preview (client) | **Works** (`parseYoutubeVideoId` + nocookie iframe) |
| List registered items + preview | **Works** (from JSON) |
| Local ↑↓ reorder (DOM only) | **Works** — not persisted |
| Edit fields on list items | **readonly** |
| 追加 / 更新 / 削除 / 並び順を保存 | **disabled** (`data-gosaki-yt-action-disabled`) |
| Save / dry-run / approval gate | **Not implemented** |

### 2.4 Schedule G-9k pattern — transferability

| G-9k element | YouTube applicability |
| --- | --- |
| Staging shell only | **Yes** |
| approvalId + env arm | **Yes** (new ID — not G-9k schedule ID) |
| Dry-run before Save | **Yes** — validate embedCode → videoId, show diff |
| `changedFields` / `payload keys` only | **Yes** — per item or per field slice |
| Optimistic lock (`updated_at`) | **No** — use JSON file mtime or item `revision` field instead |
| Supabase UPDATE | **No** — G-10c targets **JSON file write** |
| `site_slug` guard | **Yes** — `config.siteSlug === 'gosaki-piano'` |
| 1 Save = 1 field policy | **Adapt** — **1 Save = 1 embed item** (or 1 field slice for first PoC) |

---

## 3. Current data source summary

| Layer | Source | Mutable today |
| --- | --- | --- |
| Kit config (canonical) | `config/sites/gosaki-piano-youtube-embed.json` | Manual editor only |
| Convert output | `src/data/gosaki-youtube-embed.json` in generated Astro project | Regenerated each convert |
| Public display | Built static HTML from Astro component | Via rebuild + upload |
| Admin read | Same Kit config file (SSR) | Read-only in UI |
| Supabase `site_embeds` | **Does not exist** on staging | N/A |

---

## 4. Write option comparison

| Criterion | **A. static JSON write MVP** | **B. Supabase `site_embeds`** | **C. separate `site_config` table** | **D. read-only + manual JSON** |
| --- | --- | --- | --- | --- |
| Gosaki完成までの速さ | **Fastest** — infra exists | Slow (migration + RLS + read path) | Slow | Fast but no CMS win |
| 安全性 | Medium — file allowlist + dry-run | Medium-high — RLS + approval | Medium-high | Highest |
| 一般化しやすさ | Medium — file per site → later DB | **Best** — Kit-native | Good | Poor |
| DB migration | **None** | **Required** | **Required** | None |
| Staging admin 相性 | **Excellent** — binding already reads JSON | Good after read binding swap | Good | N/A |
| rebuild/reupload 相性 | **Same as today** | Need build-time Supabase read | Same | Same |
| 他サイト展開 | JSON per site slug; pattern reusable | **Best** long-term | Good | Manual only |

### 4.1 Option A — static JSON write MVP (recommended G-10c)

- Write target: `tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json` only
- Guards: path allowlist, `siteSlug` check, atomic write, pretty-printed JSON, no `service_role`
- First slice: update **one existing item** (`yt-placeholder-01`) — `embedCode` + `published` (+ optional `sortOrder`)
- Public verify: convert → build → `verifyHomeYouTubeEmbedHtml` → manual upload (G-10d)

### 4.2 Option B — Supabase `site_embeds` (G-10e)

Per G-9a schema: `site_slug`, `provider`, `source_url`, `embed_url`, `published`, `sort_order`, `updated_at`.

- Requires migration + RLS + staging write approval stack
- Public: build-time Supabase read with static JSON fallback
- Admin: replace fs binding with Supabase read/write
- **Defer** until JSON MVP proves operator loop

### 4.3 Option C — `site_config` / embeds hybrid

- Overlap with B; no advantage over `site_embeds` for YouTube-only MVP
- **Not recommended** for G-10c

### 4.4 Option D — manual JSON only

- Zero implementation risk
- **Fails** Gosaki CMS goal (client cannot self-serve)
- **Not recommended** except emergency

---

## 5. Recommended G-10c approach

**G-10c: static JSON write slice — update one embed item (dry-run + gated Save)**

| Item | Decision |
| --- | --- |
| **Write target** | Option **A** — Kit JSON file only |
| **First slice scope** | **1 item UPDATE** on `yt-placeholder-01`: `embedCode` + `published` (optional: `videoId` derived, not stored separately in v1) |
| **Not in G-10c** | INSERT new item, DELETE, reorder persist, Supabase, deploy |
| **Pattern** | Mirror G-9k safety **spirit** (approvalId, dry-run, operator Save once) — **not** reuse G-9k schedule approval ID |

### 5.1 Proposed phase sequence

```txt
G-10b  read/write planning                    — complete (this doc)
G-10c  static JSON write slice                — dry-run UI + gated Save to JSON (1 item)
G-10d  public reflection verification         — convert/build + home embed verify + re-upload plan
G-10e  site_embeds Supabase generalization    — migration + build-time read + admin swap (separate approval)
```

**Parallel (operator, no code):** G-9h1 client preview feedback — confirm YouTube placement + desired URL.

---

## 6. G-10c safety gates (planned)

```txt
approvalId: G-10c-gosaki-youtube-embed-static-json-write-non-dry-run (register in implementation)
env arm: PUBLIC_ADMIN_GOSAKI_YOUTUBE_EMBED_STATIC_JSON_WRITE_ARMED=true (implementation)
compile gate: G10C_YOUTUBE_EMBED_SAVE_ENABLED=false (default; G-9k pattern)

Save / write rules:
- Save requires dedicated approvalId + env arm + staging auth session
- 1 Save = 1 embed item update (first slice: single item only)
- dry-run first: parse embedCode → videoId; show before/after JSON diff for allowed keys only
- changedFields / payload keys only — e.g. ["embedCode", "published"] on first slice
- rowsAffected equivalent: exactly 1 item matched by id in config.items
- site_slug: config.siteSlug must be "gosaki-piano"
- write path allowlist: only tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json
- atomic write: temp file + rename (implementation detail)
- no INSERT / DELETE in first slice
- production / sari-site: blocked
- service_role: forbidden
- DB migration: forbidden in G-10c
- deploy / FTP / workflow_dispatch: separate phase (G-10d operator manual only)
- routine dev: Save disabled; dry-run default OK
```

**Do not reuse:** `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` approval ID.

---

## 7. Musician CMS Kit generalization notes

| Element | G-10c (JSON) | G-10e (Kit target) |
| --- | --- | --- |
| Config shape | `items[]` + `siteSlug` + resolver | `site_embeds` row per embed |
| URL normalize | `parseYoutubeVideoId` + nocookie embed | Same function — shared module already exists |
| Admin list UX | G-9j Instagram-style | Reusable for Instagram migration |
| Write governance | approvalId + dry-run + 1-item Save | Same gates + `updated_at` optimistic lock |
| Public read | Convert-time JSON copy | Build-time Supabase + JSON fallback |
| Per-site isolation | `siteSlug` in JSON / future `site_slug` column | RLS on `site_slug` |
| Deploy | Manual upload package (G-7g pattern) | Unchanged until cutover phase |

**Extract to Kit (later):** `parseYoutubeVideoId`, `buildYoutubeNocookieEmbedUrl`, embed admin list component, write guard framework (generalize from G-9k + G-10c file writer).

---

## 8. Risk classification

### Low risk (G-10b / G-10d)

- This planning doc + verifier
- G-9h1 client YouTube URL collection
- `verifyHomeYouTubeEmbedHtml` on built HTML
- Read-only admin preview improvements (no Save)

### Medium risk (G-10c / G-10d)

- **Static JSON file write** from staging admin (wrong path, partial write — mitigated by allowlist + atomic write)
- Convert + build + **manual** re-upload (operator scope — no FTP auto)
- Enabling edit fields on admin UI (still gated off until Save arm)

### High risk (G-10e+ — separate approval)

- `site_embeds` migration + RLS on staging
- Supabase INSERT/DELETE for embed items
- Production cutover / FTP auto-apply
- Connecting staging Save directly to live site without rebuild discipline

---

## 9. G-10c implementation checklist (for next phase — not executed in G-10b)

1. Register approval ID `G-10c-gosaki-youtube-embed-static-json-write-non-dry-run`
2. Add `gosaki-youtube-embed-write-config.ts` + guards (path allowlist, siteSlug, item id)
3. Add dry-run module: before/after item snapshot, `changedFields`, videoId parse validation
4. Wire admin UI: enable edit on one item; 「変更を確認」+ gated 「保存」; keep add/delete disabled
5. Server/API or Astro action for JSON write (staging shell only) — **no Supabase**
6. Verifier + implementation doc
7. G-10d: operator sets real embed URL, Save once, convert, build, verify home, manual upload

---

## 10. File reference (actual paths)

| Role | Path |
| --- | --- |
| Kit JSON config | `tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json` |
| Public template | `tools/static-to-astro/templates/site-extensions/gosaki-piano/YouTubeEmbedSection.astro` |
| Resolver TS | `tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-youtube-embed.ts` |
| Convert hook | `tools/static-to-astro/scripts/lib/gosaki-home-youtube-embed.mjs` |
| Convert integration | `tools/static-to-astro/scripts/lib/astro-generator.mjs` (`applyGosakiHomeYouTubeEmbed`) |
| Admin binding | `src/lib/admin/staging-data/gosaki-youtube-embed-admin-binding.ts` |
| Admin UI script | `src/lib/admin/staging-data/gosaki-staging-youtube-admin-ui.ts` |
| Admin operator page | `tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeOperatorPage.astro` |
| Staging route | `src/pages/__admin-staging-shell/musician-basic/admin/youtube/index.astro` |
