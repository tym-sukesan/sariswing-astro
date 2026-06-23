# Gosaki YouTube embed static JSON Save API response fix (G-10c1)

**Phase:** `G-10c1-gosaki-youtube-embed-static-json-save-api-response-fix`  
**Status:** **fix complete** — injectRoute + import path + client non-JSON handling; **no Save re-execution by Cursor**  
**Date:** 2026-06-22 (updated 2026-06-23 — FailedToLoadModuleSSR follow-up)

---

## Incident (operator manual Save attempt 1)

During G-10c final preflight, dry-run **succeeded** but Save failed:

```txt
network_error: Unexpected token '<', "<!doctype "... is not valid JSON
```

Dry-run context:

- item: `yt-placeholder-01`
- changedFields: `embedCode`, `published`
- videoId: `Ke4F8JAQz-I`
- published: `false` → `true`

**JSON config file was not modified** (operator Save did not reach executor).

---

## Root cause

`src/pages/__admin-*` routes are **excluded from Astro file-based routing** (leading underscore). Staging shell pages are registered via `injectRoute` in `astro.config.mjs` — but the G-10c Save API was **not** injected.

Fetch URL was correct:

```txt
/__admin-staging-shell/musician-basic/api/youtube-embed-static-json-write.json
```

Server returned **404 HTML** (`<!doctype html>…`). Client called `response.json()` unconditionally → parse error surfaced as `network_error`.

---

## Incident (operator API check after G-10c1 — attempt 2)

After dev restart with Save env, `curl -i` GET to the Save API returned:

```txt
HTTP/1.1 500 Internal Server Error
Content-Type: text/html
<title>FailedToLoadModuleSSR</title>
```

Dev server log:

```txt
Could not import `../../../../../lib/admin/staging-write/gosaki-youtube-embed-static-json-write-executor`.
```

**JSON config file still unchanged.**

---

## Root cause (attempt 2 — FailedToLoadModuleSSR)

API endpoint file lives at:

```txt
src/pages/__admin-staging-shell/musician-basic/api/youtube-embed-static-json-write.json.ts
```

Imports used **one too many** `../` segments (`../../../../../lib/...` → repo root `lib/`, not `src/lib/`).

Correct relative path from `api/` → `src/lib/` is **`../../../../lib/admin/...`** (4 levels up to `src/`).

---

## Fix (summary)

### 1. `injectRoute` for Save API (dev only)

`astro.config.mjs` → `cmsKitAdminShellRoutesIntegration` when `command === "dev"`:

```txt
pattern: /__admin-staging-shell/musician-basic/api/youtube-embed-static-json-write.json
entrypoint: src/pages/__admin-staging-shell/musician-basic/api/youtube-embed-static-json-write.json.ts
```

### 2. API always JSON

- `Content-Type: application/json; charset=utf-8`
- `GET` / non-POST → JSON 405
- All error paths include `errorCode` + `errorMessage`

### 3. Client safe parsing

`gosaki-youtube-embed-static-json-write-api.ts`:

- `parseG10cSaveApiJsonResponse` — checks content-type, detects HTML, parses safely
- Operator message on non-JSON: `保存APIからJSON以外の応答が返りました。API route / fetch path を確認してください。`
- Short snippet only (no full HTML dump)

### 4. API import path (FailedToLoadModuleSSR)

`youtube-embed-static-json-write.json.ts` imports:

```txt
../../../../lib/admin/staging-write/...
```

(not `../../../../../lib/...`)

### 5. GET curl verification

```bash
curl -i http://localhost:4322/__admin-staging-shell/musician-basic/api/youtube-embed-static-json-write.json
```

Expected (verified after fix):

```txt
HTTP/1.1 405 Method Not Allowed
Content-Type: application/json; charset=utf-8

{"ok":false,"error":"method_not_allowed","errorCode":"method_not_allowed",...}
```

---

## Gates

```txt
gosakiYoutubeEmbedStaticJsonSaveApiResponseFixComplete: true
gosakiYoutubeEmbedStaticJsonSaveApiSsrLoadFixComplete: true
readyForG10cManualSaveRetry: false
readyForG10dPublicReflectionVerification: true
cursorClickedSave: false
cursorExecutedJsonWrite: false
```

---

## Next

Operator: **restart `astro dev`** (injectRoute is dev-only), re-arm env, dry-run → Save once.

**G-10c2 (2026-06-23):** Operator manual Save **succeeded** — `itemsAffected: 1`; `yt-placeholder-01` published with `Ke4F8JAQz-I`. See [gosaki-youtube-embed-static-json-write-save-success-finalization.md](./gosaki-youtube-embed-static-json-write-save-success-finalization.md). **Do not re-click G-10c Save.**

---

## Build note

Save API `injectRoute` runs only when `command === "dev"`. `npm run build` (static) does not register the endpoint — consistent with staging Save being dev-only.

---

## Files changed

| File | Change |
| --- | --- |
| `astro.config.mjs` | injectRoute for Save API |
| `gosaki-youtube-embed-static-json-write-api.ts` | **new** — path + parse helpers |
| `gosaki-youtube-embed-static-json-write-client-save.ts` | safe response handling |
| `youtube-embed-static-json-write.json.ts` | JSON headers + GET/ALL handlers; **import path fix** |
