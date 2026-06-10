# Staging Read-only Module Display QA

## 1. Purpose

G-5z-d performs **display QA** for the staging shell read-only data section at `/__admin-staging-shell/musician-basic/`. It validates that G-5z-c’s Supabase read-only adapter and G-5z-b mock adapter render correctly in the browser — without adding new database features.

**This phase does not:**

- add new DB queries or expand approved fields
- perform write operations (insert / update / delete / upsert)
- change RLS policies
- connect Storage read/write
- enable Publish dispatch
- connect `/admin` route
- touch production data

Related: [supabase-read-only-data-adapter.md](./supabase-read-only-data-adapter.md) (G-5z-c), [read-only-data-adapter-scaffold.md](./read-only-data-adapter-scaffold.md) (G-5z-b).

## 2. Current state

| Item | Status |
| --- | --- |
| G-5z-b | mock read-only data adapter exists |
| G-5z-c | Supabase read-only adapter exists (approval `G-5z-c-staging-read-only-data-connect`) |
| Staging shell | read-only previews displayed on `/__admin-staging-shell/musician-basic/` |
| `canWrite` | always `false` |
| Mock fallback | available via env |
| `/admin` route | not connected |
| Storage | not connected |
| Publish | disabled |
| `productionReady` | always `false` |

## 3. QA matrix

| module | mock mode | supabase mode | empty state | error state | rls denied | fallback | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| profile | mock fixture name/bio shown | staging `profile` row mapped to displayName/bio | “Empty state — no profile row” | safe module error; shell stays up | safe denied message | mock when data read disabled | limit 1 |
| schedule | mock published schedules list | published rows, date order | empty list message | module error only | module denied only | mock fallback env | limit 20 |
| discography | mock albums list | published rows | empty list message | module error only | module denied only | mock fallback env | limit 20 |
| links | mock links with example.com URLs | published links | empty list message | module error only | module denied only | mock fallback env | long URLs should wrap |
| news | mock news items | staging `news` if table exists | empty list message | **table missing / field mismatch** → module error | RLS denied → module error | other modules unaffected | **focus QA** — likely table on some staging projects |

### News focus (G-5z-c-prep: likely table)

Confirm independently on staging project:

| Scenario | Expected UI |
| --- | --- |
| news table missing | news module `error`; safe message; other modules still render |
| news RLS denied | news module `rls-denied`; no secrets in message |
| news empty (no published rows) | news module `empty` |
| news field mismatch | news module `error`; shell does not crash |

## 4. Mock mode QA

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=false \
PUBLIC_ADMIN_DATA_PROVIDER=mock \
npm run dev
```

URL: `http://localhost:4321/__admin-staging-shell/musician-basic/`

### Checklist

- [ ] Provider: `mock`
- [ ] `canWrite: false`
- [ ] Runtime connected: `false`
- [ ] Production ready: `false`
- [ ] Mock profile displayed
- [ ] Mock schedules displayed
- [ ] Mock discography displayed
- [ ] Mock links displayed
- [ ] Mock news displayed
- [ ] Module status badges visible (`ok` / `empty` expected for fixtures)
- [ ] No save / delete / publish / upload actions in read-only section
- [ ] `/admin` not connected (status panel + route is `__admin-staging-shell`)
- [ ] Staging safety banner visible

## 5. Supabase read-only mode QA

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_SUPABASE_URL="<staging project url>" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

**Safety:**

- use **staging project only** — never production
- do not commit real URL/key
- do not deploy

URL: `http://localhost:4321/__admin-staging-shell/musician-basic/`

### Checklist

- [ ] Provider: `supabase`
- [ ] `canWrite: false`
- [ ] Runtime connected: `true`
- [ ] Production ready: `false`
- [ ] Approved fields only (no UI for editing)
- [ ] Module-level preview per module
- [ ] Module-level fallback on failure (news especially)
- [ ] Screen does not crash when one module fails
- [ ] Storage: not connected
- [ ] Publish: disabled
- [ ] `/admin` not connected

### Config-missing fallback

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
npm run dev
```

(without URL/key)

- [ ] “Supabase data config missing” alert
- [ ] Mock fallback active
- [ ] No write attempted

## 6. Module-level state QA

| State | Expected display |
| --- | --- |
| `ok` | data rows / profile fields shown; green status badge |
| `empty` | italic empty message; grey badge |
| `error` | amber safe error text; red badge; no stack trace |
| `rls-denied` | access denied summary; red badge |
| `fallback` | mock provider or config-missing banner; unaffected modules still load |

### Messages must NOT expose

- Supabase URL
- anon key or service role
- SQL details beyond safe summary
- customer private data
- stack traces

## 7. No-write QA

Verify in UI and code:

- [ ] `canWrite: false` in status panel
- [ ] No enabled save button in read-only section
- [ ] No enabled delete button in read-only section
- [ ] No enabled publish button in read-only section
- [ ] No enabled upload button in read-only section
- [ ] No `insert` / `update` / `delete` / `upsert` / `rpc` in `src/lib/admin/staging-data`
- [ ] No `storage.` read/write in staging-data
- [ ] No `workflow_dispatch` / FTP in staging-data path
- [ ] No service role in browser or committed env example

## 8. Visual / UX QA

- [ ] Status panels readable (contrast, spacing)
- [ ] Module cards not overcrowded
- [ ] Empty / error states visually distinct
- [ ] Safety text understandable (EN; staging-not-production)
- [ ] Staging shell warning remains visible elsewhere on page
- [ ] No production-like wording (“live”, “customer site”, etc.) in read-only panel
- [ ] Mobile layout: meta grid and previews do not overflow badly
- [ ] Long URLs in links preview wrap (`word-break`) without breaking layout

## 9. Accessibility / basic HTML QA

- [ ] Heading hierarchy: `h2` panel → `h3` previews → `h4` modules
- [ ] `role="status"` on panel; `role="alert"` on config-missing
- [ ] Module status badges have `aria-label`
- [ ] Disabled scaffold buttons elsewhere remain `disabled` / non-submitting
- [ ] Links in mock mode use `example.com` only
- [ ] No unexpected form submission from read-only section

## 10. QA report output

Machine-readable report (no live DB):

```bash
node tools/static-to-astro/scripts/qa-staging-read-only-display.mjs \
  --out-dir tools/static-to-astro/output/staging-read-only-display-qa/gosaki
```

Output (not committed):

```txt
tools/static-to-astro/output/staging-read-only-display-qa/gosaki/
  STAGING_READ_ONLY_DISPLAY_QA_REPORT.md
  staging-read-only-display-qa.json
```

Combined with adapter inspect:

```bash
node tools/static-to-astro/scripts/inspect-read-only-data-adapter.mjs \
  --out-dir tools/static-to-astro/output/read-only-data-adapter-dry-runs/gosaki
```

## 11. Sign-off template

```txt
Date:
Tester:
Route: /__admin-staging-shell/musician-basic/
Mock mode QA: pass / fail
Supabase read-only QA: pass / fail / skipped (no staging project)
News table missing case: pass / fail / n/a
News RLS denied case: pass / fail / n/a
No-write QA: pass / fail
Visual QA: pass / fail
Blockers for G-5z-e:
```

## 12. Next phase

- **G-5z-e:** read-only QA / RLS review report
- writes remain forbidden until **G-6**
