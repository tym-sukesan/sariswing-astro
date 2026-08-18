# Gosaki production publication data live read-only check

**Phase:** `gosaki-production-publication-data-live-readonly-check`
**Status:** **COMPLETE (SELECT-only · PASS)**
**Date:** 2026-08-18
**HEAD baseline:** `dcb9e012cd825b7c748ec30f51a4e489f941ef5d`
**Prior:** `gosaki-production-package-preflight-at-current-head`

| Check | Status |
| --- | --- |
| Target | staging Kit `kmjqppxjdnwwrtaeqjta` only |
| Production `vsbvndwuajjhnzpohghh` | **not queried** |
| `supabase/.temp/linked-project.json` | **not used** |
| `service_role` | **not used** |
| INSERT / UPDATE / DELETE / UPSERT / RPC write | **none** |
| `.env.local` written | **no** |
| Secrets printed | **no** |
| Package / FTP / Edge / DNS | **no** |
| Slice B Save / restore | **not re-run** |
| Commit / push | **no** |

---

## Gates

```txt
GOSAKI_PRODUCTION_PUBLICATION_DATA_LIVE_READONLY_CHECK_COMPLETE: true
PUBLICATION_DATA_LIVE_CHECK: PASS
schedule_2026_07_010_restored: true
published_schedule_marker_count: 0
unpublished_test_rows_safe: true
deleted_tbd_absent: true
discography_marker_count: 0
PUBLICATION_DATA_CLEANUP_REQUIRED: false
PACKAGE_GENERATION_READY: READY_FOR_PREVIEW_PROFILE
PREVIEW_PACKAGE_READY: BLOCKED_BY_CONFIG
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-ciao-jp-preview-profile-implementation
```

**Do not** generate packages in this phase. **Do not** cleanup. **Do not** re-query production.

---

## Verdict

```txt
PUBLICATION_DATA_LIVE_CHECK: PASS
```

All PASS conditions met:

| Condition | Result |
| --- | --- |
| `schedule-2026-07-010` G-13c2 restore fields | **match** |
| published Schedule development markers | **0** |
| G-22 test/copy rows not in published bake set | **true** |
| `schedule-2026-11-001` absent | **true** |
| published Discography development markers | **0** |
| About DB build-read | **off** (no live About query) |
| YouTube publication-visible markers | **0** (1 published `site_embeds` row, clean) |

---

## Read path (actual)

| Item | Value |
| --- | --- |
| Client | `supabase-js` `createClient` |
| Key | existing `PUBLIC_SUPABASE_ANON_KEY` via `loadGosakiStagingAdminPublicEnv` + `validateGosakiStagingAdminPublicEnv` |
| Host gate | exact `kmjqppxjdnwwrtaeqjta.supabase.co` (`evaluateStagingOnlySupabaseTarget` · production substring STOP) |
| CLI | **not used** (linked project points at production `vsbvndwuajjhnzpohghh`) |
| Authenticated SELECT | **skipped** — staging admin email/password keys not present in merged env |
| Query count | **6** |
| Script | `tools/static-to-astro/scripts/gosaki-production-publication-data-live-readonly-check.mjs` |

Queries (all `.select` only):

1. `schedules` Event B by `id` + `legacy_id` + `site_slug`
2. `schedules` `site_slug=gosaki-piano` `published=true` (74 rows)
3. `schedules` sentinel `legacy_id IN (schedule-2026-09-001, schedule-2026-03-014, schedule-2026-11-001)`
4. `discography` published + `site_slug`
5. `discography_tracks` for those releases
6. `site_embeds` via `loadSiteEmbedsDataForBuild` (production bake YouTube path)

Anon RLS `schedules_public_select` is the **same filter as production convert bake** (`published=true`). Unpublished confirmation therefore uses: not present in the published bake set. Authenticated `published=false` proof was not available without expanding credentials.

---

## 1. `schedule-2026-07-010`

Live (anon SELECT, staging):

| Field | Live | G-13c2 expected | Match |
| --- | --- | --- | --- |
| `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` | same | yes |
| `legacy_id` | `schedule-2026-07-010` | same | yes |
| `site_slug` | `gosaki-piano` | same | yes |
| `published` | `true` | `true` | yes |
| `show_on_home` | `false` | `false` | yes |
| `title` | `<>` | `<>` | yes |
| `venue` | `null` | `null` | yes |
| `open_time` | `null` | `null` | yes |
| `start_time` | `null` | `null` | yes |
| `price` | `null` | `null` | yes |
| `description` | `出演：` | `出演：` | yes |
| `date` | `2026-07-19` | (seed) | yes |
| `date_status` | `confirmed` | n/a | — |
| `updated_at` | `2026-07-09T05:38:52.999274+00:00` | later than G-13c2 Save | **fields still match** |

```txt
schedule_2026_07_010_restored: true
```

`title=<>` is Wix leftover, not a PoC marker.

---

## 2. Published Schedule scan

```txt
published_count: 74
published_schedule_marker_count: 0
```

Scanned fields: `title`, `venue`, `open_time`, `start_time`, `price`, `description`.

Patterns: `CMS Kit staging`, `PoC`, `テスト`, `Slice B`, `temporary marker`, `G-{digit}`, other `G-`.

**False positives:** none (zero hits). Real titles such as `<Trio>` / `<>` did not match.

---

## 3. Unpublished sentinel rows

Anon SELECT by `legacy_id` for `schedule-2026-09-001` and `schedule-2026-03-014`: **0 rows** (RLS hides unpublished).

Neither `legacy_id` appears in the 74 published bake rows.

```txt
unpublished_test_rows_safe: true
```

Test copy in those rows (G-22e `【G-22eテスト】…`, G-22d `（コピー）`) is **not** a PUBLIC CUTOVER blocker while they stay out of `published=true`. Authenticated `published=false` cell proof was skipped (no admin creds). If they are later published, they **will** bake.

---

## 4. Deleted TBD row

`schedule-2026-11-001`: **0 rows** (anon sentinel query + published set).

```txt
deleted_tbd_absent: true
```

---

## 5. Discography

```txt
published_releases: 4
published_tracks: 34
discography_marker_count: 0
```

Release fields: `title`, `artist`, `label`, `description`. Track field: `title`.
Slice B Save/restore **not** re-run.

---

## 6. About / YouTube

| Surface | Production bake SoT | Live query | Markers |
| --- | --- | --- | --- |
| About | JSON (`registry.sitePageFields=false`, `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` unset) | **none** | n/a |
| YouTube | `siteEmbeds=true` → live `site_embeds` when rows exist; else JSON | **1** published youtube row (`embedDataSource=supabase`) | **0** |
| YouTube JSON file | fallback / comparison | local file only | **0** (`1` item) |

No extra About table query.

---

## Cleanup

```txt
PUBLICATION_DATA_CLEANUP_REQUIRED: false
```

No cleanup preflight. No DB write.

---

## Next Primary

```txt
gosaki-ciao-jp-preview-profile-implementation
```

Preview generate remains `BLOCKED_BY_CONFIG` until a ciao.jp `/gosaki-piano/` profile exists. Do **not** reuse production `deployBase=/` HTML on `gotosaki.ciao.jp`.
