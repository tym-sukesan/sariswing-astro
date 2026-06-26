# G-12b — Gosaki public schedule read verification

**Phase:** `G-12b-gosaki-public-schedule-read-verification`  
**Status:** verification complete  
**Base commit:** `d031e03`  
**Verified at (UTC):** `2026-06-26` (read-only HTTP fetch)  
**Prior:** G-12a backlog resume planning; G-9c2c seed (60 rows); G-11c15 YouTube chain complete

## Summary

Read-only verification of Gosaki staging public schedule pages. All seeded months (2026-03 … 2026-07) serve **`scheduleDataSource=supabase`** with expected event counts. Legacy stub `/2026-07/` returns HTTP 200 with canonical → `/schedule/2026-07/`. `/schedule/2026-08/` returns **404** (no seeded month — expected).

**No DB write / Save / FTP / deploy / workflow_dispatch in this phase.**

---

## 1. Target URLs (staging only)

| Route | URL |
|-------|-----|
| Hub | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/` |
| Month (canonical) | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/` |
| Month (no seed) | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-08/` |
| Legacy stub | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/2026-07/` |

**Not Sariswing production.** Not gosaki-piano.com production.

---

## 2. HTTP results

| URL | HTTP | Notes |
|-----|------|-------|
| `/schedule/` | **200** | Hub lists 5 month links (2026-03 … 2026-07) |
| `/schedule/2026-07/` | **200** | 14 event cards |
| `/schedule/2026-08/` | **404** | No seeded month — expected |
| `/2026-07/` (legacy) | **200** | Stub; canonical → canonical month URL |

### Spot-check (all seeded months)

| Month | HTTP | `scheduleDataSource` | Event cards | Seed expected |
|-------|------|----------------------|-------------|---------------|
| 2026-03 | 200 | supabase | **13** | 13 ✅ |
| 2026-04 | 200 | supabase | **10** | 10 ✅ |
| 2026-05 | 200 | supabase | **12** | 12 ✅ |
| 2026-06 | 200 | supabase | **11** | 11 ✅ |
| 2026-07 | 200 | supabase | **14** | 14 ✅ |

**Total:** 60 events across 5 months (matches G-9c2c seed).

---

## 3. Data source

| Page | Marker | Source |
|------|--------|--------|
| Hub | `CMS_TARGET: SCHEDULE_INDEX scheduleDataSource=supabase` | **Supabase read** at build time |
| Month pages | `CMS_TARGET: SCHEDULE_MONTH_LIST scheduleDataSource=supabase` | **Supabase read** |
| Legacy `/2026-07/` | No CMS_TARGET marker | Legacy stub HTML; **canonical** points to `/schedule/2026-07/` |

Deployed package was built with Supabase env available (`scheduleDataSource=supabase`). Not `static-fallback` on verified routes.

---

## 4. SEO / staging policy

| Check | Hub | `/schedule/2026-07/` | Legacy `/2026-07/` |
|-------|-----|----------------------|---------------------|
| `noindex` | **yes** | **yes** | **yes** |
| canonical staging host | **yes** | **yes** | **yes** (→ `/schedule/2026-07/`) |
| `og:url` staging host | **yes** | **yes** | **yes** |

Example canonical (month):

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/
```

---

## 5. Legacy stub behavior

`/2026-07/` (legacy Wix route pattern):

- HTTP **200** — stub page serves
- **canonical** and **og:url** point to canonical `/schedule/2026-07/`
- No `wixui-repeater__item` hidden-content issue on verified fetch
- Correct treatment: legacy URL remains for bookmarks; SEO canonical is canonical month path

---

## 6. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiPublicScheduleReadVerificationComplete` | **true** |
| `cursorDbWriteExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `ftpUploadExecuted` | **false** |
| `deployExecuted` | **false** |
| `workflowDispatchExecuted` | **false** |
| `supabaseSecretsSetExecuted` | **false** |
| `productionTouched` | **false** |

---

## 7. Verifier

```bash
node tools/static-to-astro/scripts/verify-g12b-gosaki-public-schedule-read-verification.mjs
```

---

## 8. Next (proposed)

| Phase | Scope |
|-------|-------|
| **G-12c** or **G-9h1** | Client preview feedback closure (operator checklist; no DB write) |
| **G-12d** or **G-9h3** | Schedule CMS Phase 1/2 boundary doc |
| **G-6-g3** | Price non-dry-run slice preflight (deferred; explicit approval) |

No re-upload required unless operator wants fresh package after future CMS edits.
