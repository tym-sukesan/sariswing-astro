# gosaki-schedule-image-ui-and-home-date

Phase: `gosaki-schedule-image-ui-and-home-date`  
Date: 2026-09-28  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

Gosaki delivery: Home Schedule SP date size + Schedule admin image URL on the **existing** `public.schedules.image_url` column. No DB / Secret / Edge deploy / FTP / production package / commit.

```txt
SCHEDULE_IMAGE_UI_RESULT: PASS
SAFE_TO_REVIEW_IN_BROWSER: true
SAFE_TO_PROCEED_TO_PRODUCTION_ROLLOUT: false
LOCAL_PREVIEW: http://127.0.0.1:4321/
PRODUCTION_BUILD: false
FTP: false
COMMIT: false
DB migration required: false
Edge deploy required: true
RLS change required: false
```

## Existing image columns

`public.schedules` already has:

| Column | Role | This phase |
| --- | --- | --- |
| `image_url` | Month-page flyer | **Reused** (admin URL + month cards) |
| `home_image_url` | Musician-basic home card | **Not wired** — Gosaki Home list is date/title/venue only |

No new columns. No migration.

## Read / save support before implementation

| Surface | Before |
| --- | --- |
| Public build SELECT (`GOSAKI_SCHEDULE_SELECT`) | already included `image_url` |
| Public month cards (`GosakiScheduleList`) | did **not** render the image |
| Gosaki Home | no image slot (do not add) |
| Admin live-read SELECT | omitted `image_url` |
| Operational form / Save payload | omitted `image_url` |
| Edge `EDIT_SAFE_FIELDS` / create insert | `image_url` hardcoded `null` on create; not an edit-safe field |

## Changed files (source)

- `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` — Home SP date 26px; month-card image max-width 100%
- `scripts/lib/gosaki-schedule-data-pages.mjs` — month card `<img>` when http(s) `image_url`
- `scripts/lib/gosaki-schedule-dry-run-edge-core.mjs` — allowlist + `normalizeScheduleImageUrl` (empty → null)
- `scripts/edge-functions/gosaki-schedule-save-dry-run/handler.ts` + `supabase/functions/.../handler.ts` (byte-eq)
- `templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleContentPanel.astro` — 画像URL + preview
- `templates/site-extensions/gosaki-piano/gosaki-staging-schedule-operational-edit.ts`
- `templates/site-extensions/gosaki-piano/gosaki-staging-admin-live-read.ts`
- `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts`
- `scripts/lib/gosaki-staging-read-only-admin.mjs` — build snapshot maps `imageUrl`
- `scripts/verify-gosaki-schedule-image-ui-and-home-date.mjs`
- `package.json` — `verify:gosaki-schedule-image-ui`

G-9g4a2 generic single-text-field path still **forbids** `image_url` (separate contract; not changed).

## Admin UI behavior

`/admin/schedule/` event edit/create form:

- Label **画像URL**
- `type="url"` bound to `data-field="image_url"`
- http(s) value shows a small preview (`max-width: min(280px, 100%)`)
- Empty URL = no image / no preview
- No file upload
- Optimistic lock / published / other fields unchanged

Local login gate still hides the panel until auth. Snapshot JSON can carry `imageUrl`; post-login live-read is SoT.

## Save payload field

`image_url` only.

- Edit: included in `SCHEDULE_OPERATIONAL_SAFE_FIELDS` / `G20U45_SCHEDULE_EDIT_SAFE_FIELDS` / Edge `EDIT_SAFE_FIELDS`
- Create / duplicate: copied into create payload; Edge insert uses normalized URL or `null`
- Empty string → `null`
- Non-http(s) rejected (`image_url must be http(s)` / invalid URL)
- `home_image_url` is still an unexpected field

**Live Save will not persist `image_url` until Edge `gosaki-schedule-save-dry-run` is redeployed.** Local source + dry-run contract already accept it.

### Edge deploy (not executed)

From worktree root (linked CLI is production `vsbvnd` — `--project-ref` is mandatory):

```txt
npx supabase functions deploy gosaki-schedule-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta
```

Do not deploy until an explicit later phase. Save arms stay default OFF.

## Public display behavior

- **Month cards:** if `image_url` is absolute http(s), render after the date heading; otherwise unchanged text-only card
- Empty / null: no `<img>` (18 September cards locally: 17 unchanged, 1 fixture image, 0 overflow)
- **Home:** no flyer; date/title/venue/links unchanged
- Next public bake after a saved URL still needs generate + FileZilla (static pages)

Local fixture only (gitignored convert JSON): `schedule-2026-09-002` used an existing kmjq public discography cover URL to prove render. DB was not written.

## Home Schedule date size

| Viewport | Before | After |
| --- | --- | --- |
| SP (390px) | **15px** | **26px** |
| PC (1920px) | **15px** | **15px** unchanged |

Weight **600** and sage `rgb(44, 70, 57)` / `var(--gosaki-green-deep)` kept. Event name / venue / separator / month-page links / CTA unchanged. No Home images.

## Verifier result

| Verifier | Result |
| --- | --- |
| `verify:gosaki-schedule-image-ui` | **27 / 0** |
| `verify:gosaki-final-ux-fixes` | **12 / 0** |
| `verify:gosaki-home-latest-schedule` | **18 / 0** |
| `verify:url-staging` | **809 / 0** |

Local convert preview: `output/gosaki-piano-astro-visual-polish` (gitignored). Official production package **not** regenerated.

## Safety

- DB migration required: **false** (columns exist)
- Edge deploy required: **true** (allowlist change; **not deployed**)
- RLS change required: **false** (row-level `can_write_site` UPDATE already covers the column)
- SQL: none
- `service_role` / FTP `--apply` / production Supabase / commit: none
